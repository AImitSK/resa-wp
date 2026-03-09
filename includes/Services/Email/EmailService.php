<?php

declare( strict_types=1 );

namespace Resa\Services\Email;

/**
 * Email service — main orchestrator for sending emails.
 *
 * Routes emails to the best available transport:
 *  1. Brevo (Premium, DSGVO-compliant)
 *  2. Custom SMTP (Premium)
 *  3. wp_mail() (Free fallback)
 *
 * Handles template variable replacement, PDF attachments,
 * and logging to resa_email_log.
 */
class EmailService {

	/**
	 * Available transports in priority order.
	 *
	 * @var array<int,TransportInterface>
	 */
	private array $transports;

	/**
	 * Constructor.
	 *
	 * @param array<int,TransportInterface>|null $transports Custom transports (for testing).
	 */
	public function __construct( ?array $transports = null ) {
		$this->transports = $transports ?? $this->buildTransports();
	}

	/**
	 * Send a lead result email.
	 *
	 * @param int                 $leadId   Lead ID.
	 * @param string              $template Template identifier (e.g. 'mietpreis').
	 * @param string              $to       Recipient email.
	 * @param string              $subject  Subject line.
	 * @param string              $html     Rendered HTML body.
	 * @param array<string,mixed> $options  Options: attachments, from_name, from_email, reply_to.
	 * @return bool True on success.
	 */
	public function send( int $leadId, string $template, string $to, string $subject, string $html, array $options = [] ): bool {
		$transport = $this->detectTransport();

		$senderOptions = array_merge( $this->getSenderDefaults(), $options );

		try {
			$transport->send( $to, $subject, $html, $senderOptions );

			EmailLogger::log( $leadId, $template, $to, $subject, 'sent' );

			/**
			 * Fires after an email was sent successfully.
			 *
			 * @param int    $leadId   Lead ID.
			 * @param string $template Template identifier.
			 * @param string $to       Recipient email.
			 */
			do_action( 'resa_email_sent', $leadId, $template, $to );

			return true;
		} catch ( \RuntimeException $e ) {
			EmailLogger::log( $leadId, $template, $to, $subject, 'failed', $e->getMessage() );

			/**
			 * Fires when email sending fails.
			 *
			 * @param int    $leadId  Lead ID.
			 * @param string $error   Error message.
			 */
			do_action( 'resa_email_failed', $leadId, $e->getMessage() );

			return false;
		}
	}

	/**
	 * Replace template variables in a string.
	 *
	 * @param string              $template Template string with {{variable}} placeholders.
	 * @param array<string,string> $vars    Variable name => value pairs.
	 * @return string Rendered string.
	 */
	public static function renderVariables( string $template, array $vars ): string {
		foreach ( $vars as $key => $value ) {
			$template = str_replace( '{{' . $key . '}}', $value, $template );
		}

		return $template;
	}

	/**
	 * Detect the best available transport.
	 *
	 * @return TransportInterface
	 *
	 * @throws \RuntimeException When no transport is available.
	 */
	public function detectTransport(): TransportInterface {
		foreach ( $this->transports as $transport ) {
			if ( $transport->isAvailable() ) {
				return $transport;
			}
		}

		throw new \RuntimeException( 'Kein E-Mail-Transport verfügbar.' );
	}

	/**
	 * Wrap a body HTML string in the responsive email layout.
	 *
	 * Extracts the layout from the existing PHP templates (responsive table layout,
	 * header, footer) and wraps the TipTap-generated body content.
	 *
	 * @param string $bodyHtml Body HTML content.
	 * @return string Complete email HTML.
	 */
	public static function wrapInLayout( string $bodyHtml ): string {
		$siteName    = esc_html( (string) get_bloginfo( 'name' ) );
		$settingsUrl = esc_url( admin_url( 'admin.php?page=resa-settings' ) );

		return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif;">
	<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5;">
		<tr>
			<td style="padding: 40px 20px;">
				<table role="presentation" cellpadding="0" cellspacing="0" width="600" align="center" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
					<!-- Header -->
					<tr>
						<td style="background-color: #0f172a; padding: 24px 40px; text-align: center;">
							<p style="margin: 0; color: #94a3b8; font-size: 14px;">' . $siteName . '</p>
						</td>
					</tr>
					<!-- Body -->
					<tr>
						<td style="padding: 30px 40px; color: #334155; font-size: 15px; line-height: 1.6;">
							' . $bodyHtml . '
						</td>
					</tr>
					<!-- Footer -->
					<tr>
						<td style="background-color: #f8fafc; padding: 25px 40px; border-top: 1px solid #e2e8f0;">
							<p style="margin: 0; color: #64748b; font-size: 13px; text-align: center; line-height: 1.6;">
								' . esc_html__( 'Diese E-Mail wurde automatisch von RESA gesendet.', 'resa' ) . '
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>';
	}

	/**
	 * Get information about all transports (for admin diagnostics).
	 *
	 * @return array<string,array<string,mixed>>
	 */
	public function getTransportInfo(): array {
		$info = [];

		foreach ( $this->transports as $transport ) {
			$info[ $transport->getName() ] = [
				'available' => $transport->isAvailable(),
				'name'      => $transport->getName(),
			];
		}

		return $info;
	}

	/**
	 * Build default transports from WordPress options.
	 *
	 * @return array<int,TransportInterface>
	 */
	private function buildTransports(): array {
		$transports = [];

		// 1. Brevo (highest priority, Premium only).
		$brevoKey = get_option( 'resa_email_brevo_api_key', '' );
		if ( is_string( $brevoKey ) ) {
			$transports[] = new BrevoTransport( $brevoKey );
		}

		// 2. Custom SMTP.
		$smtpHost = get_option( 'resa_email_smtp_host', '' );
		if ( is_string( $smtpHost ) && $smtpHost !== '' ) {
			$transports[] = new SmtpTransport(
				[
					'host'       => $smtpHost,
					'port'       => get_option( 'resa_email_smtp_port', 587 ),
					'user'       => get_option( 'resa_email_smtp_user', '' ),
					'password'   => get_option( 'resa_email_smtp_password', '' ),
					'encryption' => get_option( 'resa_email_smtp_encryption', 'tls' ),
				]
			);
		}

		// 3. wp_mail() fallback (always last).
		$transports[] = new WpMailTransport();

		return $transports;
	}

	/**
	 * Get default sender settings from WordPress options.
	 *
	 * @return array<string,string>
	 */
	private function getSenderDefaults(): array {
		return [
			'from_name'  => (string) get_option( 'resa_email_from_name', get_bloginfo( 'name' ) ),
			'from_email' => (string) get_option( 'resa_email_from_email', get_bloginfo( 'admin_email' ) ),
			'reply_to'   => (string) get_option( 'resa_email_reply_to', '' ),
		];
	}
}
