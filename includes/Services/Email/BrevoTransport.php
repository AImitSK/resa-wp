<?php

declare( strict_types=1 );

namespace Resa\Services\Email;

/**
 * Brevo (formerly Sendinblue) API transport.
 *
 * Sends emails via Brevo's transactional SMTP API.
 * DSGVO-compliant (DE-based servers), >98% delivery rate.
 * Requires Premium plan and valid API key.
 */
final class BrevoTransport implements TransportInterface {

	/**
	 * Brevo API endpoint for transactional emails.
	 */
	private const API_URL = 'https://api.brevo.com/v3/smtp/email';

	/**
	 * API key.
	 *
	 * @var string
	 */
	private string $apiKey;

	/**
	 * Constructor.
	 *
	 * @param string $apiKey Brevo API key (xkeysib-...).
	 */
	public function __construct( string $apiKey = '' ) {
		$this->apiKey = $apiKey;
	}

	/**
	 * Send an email via Brevo API.
	 *
	 * @param string              $to      Recipient email.
	 * @param string              $subject Subject line.
	 * @param string              $html    HTML body.
	 * @param array<string,mixed> $options Options: from_name, from_email, reply_to, attachments.
	 * @return bool True on success.
	 *
	 * @throws \RuntimeException When API call fails.
	 */
	public function send( string $to, string $subject, string $html, array $options = [] ): bool {
		if ( ! $this->isAvailable() ) {
			throw new \RuntimeException( 'Brevo API-Key ist nicht konfiguriert.' );
		}

		$fromName  = $options['from_name'] ?? get_bloginfo( 'name' );
		$fromEmail = $options['from_email'] ?? get_bloginfo( 'admin_email' );

		$payload = [
			'sender'      => [
				'name'  => $fromName,
				'email' => $fromEmail,
			],
			'to'          => [
				[
					'email' => $to,
				],
			],
			'subject'     => $subject,
			'htmlContent' => $html,
		];

		$replyTo = $options['reply_to'] ?? '';
		if ( $replyTo !== '' ) {
			$payload['replyTo'] = [ 'email' => $replyTo ];
		}

		// Handle file attachments.
		$attachments = $options['attachments'] ?? [];
		if ( count( $attachments ) > 0 ) {
			$payload['attachment'] = $this->prepareAttachments( $attachments );
		}

		$response = wp_remote_post(
			self::API_URL,
			[
				'headers' => [
					'accept'       => 'application/json',
					'content-type' => 'application/json',
					'api-key'      => $this->apiKey,
				],
				'body'    => wp_json_encode( $payload ),
				'timeout' => 30,
			]
		);

		if ( is_wp_error( $response ) ) {
			$errorMsg = $response->get_error_message();
			// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Exception message, not HTML output.
			throw new \RuntimeException( 'Brevo API-Fehler: ' . $errorMsg );
		}

		$statusCode = wp_remote_retrieve_response_code( $response );

		if ( $statusCode < 200 || $statusCode >= 300 ) {
			$body    = wp_remote_retrieve_body( $response );
			$decoded = json_decode( $body, true );
			$message = $decoded['message'] ?? $body;

			throw new \RuntimeException(
				// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Exception message, not HTML output.
				'Brevo API-Fehler (HTTP ' . $statusCode . '): ' . $message
			);
		}

		return true;
	}

	/**
	 * Check whether Brevo API key is configured.
	 *
	 * @return bool True if API key is set.
	 */
	public function isAvailable(): bool {
		return $this->apiKey !== '';
	}

	/**
	 * Transport name.
	 *
	 * @return string
	 */
	public function getName(): string {
		return 'brevo';
	}

	/**
	 * Prepare file attachments for Brevo API format.
	 *
	 * @param array<int,string> $filePaths File paths to attach.
	 * @return array<int,array<string,string>> Brevo attachment format.
	 */
	private function prepareAttachments( array $filePaths ): array {
		$attachments = [];

		foreach ( $filePaths as $filePath ) {
			if ( ! file_exists( $filePath ) ) {
				continue;
			}

			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Reading local attachment file.
			$content = file_get_contents( $filePath );
			if ( $content === false ) {
				continue;
			}

			$attachments[] = [
				'name'    => basename( $filePath ),
				// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Required by Brevo API.
				'content' => base64_encode( $content ),
			];
		}

		return $attachments;
	}
}
