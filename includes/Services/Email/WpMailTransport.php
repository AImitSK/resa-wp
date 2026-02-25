<?php

declare( strict_types=1 );

namespace Resa\Services\Email;

/**
 * WordPress wp_mail() fallback transport.
 *
 * Always available but often lands in spam.
 * Used as the Free plan default when no SMTP/Brevo is configured.
 */
final class WpMailTransport implements TransportInterface {

	/**
	 * Send an email via wp_mail().
	 *
	 * @param string              $to      Recipient email.
	 * @param string              $subject Subject line.
	 * @param string              $html    HTML body.
	 * @param array<string,mixed> $options Options: from_name, from_email, reply_to, attachments.
	 * @return bool True on success.
	 *
	 * @throws \RuntimeException When wp_mail() fails.
	 */
	public function send( string $to, string $subject, string $html, array $options = [] ): bool {
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
			throw new \RuntimeException( 'wp_mail() hat die E-Mail nicht akzeptiert.' );
		}

		return true;
	}

	/**
	 * wp_mail is always available in WordPress.
	 *
	 * @return bool True.
	 */
	public function isAvailable(): bool {
		return function_exists( 'wp_mail' );
	}

	/**
	 * Transport name.
	 *
	 * @return string
	 */
	public function getName(): string {
		return 'wp_mail';
	}
}
