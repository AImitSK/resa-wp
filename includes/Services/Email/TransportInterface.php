<?php

declare( strict_types=1 );

namespace Resa\Services\Email;

/**
 * Contract for email transport implementations.
 *
 * Three implementations:
 *  - SmtpTransport  (Custom SMTP via PHPMailer)
 *  - BrevoTransport (Brevo API — DSGVO-compliant, Premium)
 *  - WpMailTransport (WordPress wp_mail fallback, Free)
 */
interface TransportInterface {

	/**
	 * Send an email.
	 *
	 * @param string              $to          Recipient email address.
	 * @param string              $subject     Email subject.
	 * @param string              $html        HTML body content.
	 * @param array<string,mixed> $options     Transport options: from_name, from_email, reply_to, attachments.
	 * @return bool True on success.
	 *
	 * @throws \RuntimeException When sending fails.
	 */
	public function send( string $to, string $subject, string $html, array $options = [] ): bool;

	/**
	 * Check whether this transport is configured and available.
	 *
	 * @return bool True if the transport can send emails.
	 */
	public function isAvailable(): bool;

	/**
	 * Return a human-readable transport name.
	 *
	 * @return string E.g. "smtp", "brevo", "wp_mail".
	 */
	public function getName(): string;
}
