<?php

declare( strict_types=1 );

namespace Resa\Services\Email;

/**
 * Custom SMTP transport via PHPMailer.
 *
 * Uses WordPress-bundled PHPMailer with custom SMTP settings.
 * Supports TLS/SSL encryption and authentication.
 */
final class SmtpTransport implements TransportInterface {

	/**
	 * SMTP configuration.
	 *
	 * @var array<string,mixed>
	 */
	private array $config;

	/**
	 * Constructor.
	 *
	 * @param array<string,mixed> $config SMTP config: host, port, user, password, encryption.
	 */
	public function __construct( array $config = [] ) {
		$this->config = $config;
	}

	/**
	 * Send an email via custom SMTP.
	 *
	 * Hooks into phpmailer_init to configure SMTP settings,
	 * then delegates to wp_mail().
	 *
	 * @param string              $to      Recipient email.
	 * @param string              $subject Subject line.
	 * @param string              $html    HTML body.
	 * @param array<string,mixed> $options Options: from_name, from_email, reply_to, attachments.
	 * @return bool True on success.
	 *
	 * @throws \RuntimeException When SMTP is not configured or sending fails.
	 */
	public function send( string $to, string $subject, string $html, array $options = [] ): bool {
		if ( ! $this->isAvailable() ) {
			throw new \RuntimeException( __( 'SMTP ist nicht konfiguriert.', 'resa' ) );
		}

		$config = $this->config;

		// Hook into PHPMailer to configure SMTP before sending.
		$configurator = function ( &$phpmailer ) use ( $config ): void {
			// phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase -- PHPMailer property names.
			$phpmailer->isSMTP();
			$phpmailer->Host       = $config['host'];
			$phpmailer->Port       = (int) $config['port'];
			$phpmailer->SMTPAuth   = true;
			$phpmailer->Username   = $config['user'];
			$phpmailer->Password   = $config['password'];
			$phpmailer->SMTPSecure = $config['encryption'] ?? 'tls';
		};

		add_action( 'phpmailer_init', $configurator );

		try {
			$headers = [ 'Content-Type: text/html; charset=UTF-8' ];

			$fromName  = $options['from_name'] ?? '';
			$fromEmail = $options['from_email'] ?? '';

			if ( $fromName !== '' && $fromEmail !== '' ) {
				$headers[] = sprintf( 'From: %s <%s>', $fromName, $fromEmail );
			}

			$replyTo = $options['reply_to'] ?? '';
			if ( $replyTo !== '' ) {
				$headers[] = sprintf( 'Reply-To: %s', $replyTo );
			}

			$attachments = $options['attachments'] ?? [];

			$result = wp_mail( $to, $subject, $html, $headers, $attachments );

			if ( ! $result ) {
				throw new \RuntimeException( __( 'SMTP-Versand fehlgeschlagen.', 'resa' ) );
			}

			return true;
		} finally {
			remove_action( 'phpmailer_init', $configurator );
		}
	}

	/**
	 * Check whether SMTP is configured with required fields.
	 *
	 * @return bool True if host, port, user and password are set.
	 */
	public function isAvailable(): bool {
		return ! empty( $this->config['host'] )
			&& ! empty( $this->config['port'] )
			&& ! empty( $this->config['user'] )
			&& ! empty( $this->config['password'] );
	}

	/**
	 * Transport name.
	 *
	 * @return string
	 */
	public function getName(): string {
		return 'smtp';
	}
}
