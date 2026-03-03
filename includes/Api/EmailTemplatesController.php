<?php

declare( strict_types=1 );

namespace Resa\Api;

use Resa\Models\EmailTemplate;
use Resa\Services\Email\EmailService;

/**
 * REST controller for email templates.
 *
 * Admin-only endpoints for managing editable email templates
 * (subject, body, active status), sending test mails, and previewing.
 */
class EmailTemplatesController extends RestController {

	/**
	 * @inheritDoc
	 */
	public function registerRoutes(): void {
		// List all templates.
		register_rest_route(
			self::NAMESPACE,
			'/admin/email-templates',
			[
				[
					'methods'             => 'GET',
					'callback'            => [ $this, 'index' ],
					'permission_callback' => [ $this, 'adminAccess' ],
				],
			]
		);

		// Get single template.
		register_rest_route(
			self::NAMESPACE,
			'/admin/email-templates/(?P<id>[a-z0-9-]+)',
			[
				[
					'methods'             => 'GET',
					'callback'            => [ $this, 'show' ],
					'permission_callback' => [ $this, 'adminAccess' ],
				],
				[
					'methods'             => 'PUT',
					'callback'            => [ $this, 'update' ],
					'permission_callback' => [ $this, 'adminAccess' ],
				],
			]
		);

		// Reset template to defaults.
		register_rest_route(
			self::NAMESPACE,
			'/admin/email-templates/(?P<id>[a-z0-9-]+)/reset',
			[
				[
					'methods'             => 'POST',
					'callback'            => [ $this, 'reset' ],
					'permission_callback' => [ $this, 'adminAccess' ],
				],
			]
		);

		// Send test email.
		register_rest_route(
			self::NAMESPACE,
			'/admin/email-templates/(?P<id>[a-z0-9-]+)/test',
			[
				[
					'methods'             => 'POST',
					'callback'            => [ $this, 'test' ],
					'permission_callback' => [ $this, 'adminAccess' ],
				],
			]
		);

		// Preview with example data.
		register_rest_route(
			self::NAMESPACE,
			'/admin/email-templates/(?P<id>[a-z0-9-]+)/preview',
			[
				[
					'methods'             => 'POST',
					'callback'            => [ $this, 'preview' ],
					'permission_callback' => [ $this, 'adminAccess' ],
				],
			]
		);
	}

	/**
	 * GET /admin/email-templates — List all templates.
	 */
	public function index(): \WP_REST_Response {
		$templates = EmailTemplate::getAll();

		$result = array_map( [ $this, 'formatTemplate' ], $templates );

		return $this->success( $result );
	}

	/**
	 * GET /admin/email-templates/{id} — Get a single template.
	 */
	public function show( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id       = sanitize_text_field( $request->get_param( 'id' ) );
		$template = EmailTemplate::get( $id );

		if ( $template === null ) {
			return $this->notFound( __( 'Vorlage nicht gefunden.', 'resa' ) );
		}

		return $this->success( $this->formatTemplate( $template ) );
	}

	/**
	 * PUT /admin/email-templates/{id} — Update a template.
	 */
	public function update( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id = sanitize_text_field( $request->get_param( 'id' ) );

		$template = EmailTemplate::get( $id );
		if ( $template === null ) {
			return $this->notFound( __( 'Vorlage nicht gefunden.', 'resa' ) );
		}

		$data = [];

		$subject = $request->get_param( 'subject' );
		if ( is_string( $subject ) ) {
			$data['subject'] = $subject;
		}

		$body = $request->get_param( 'body' );
		if ( is_string( $body ) ) {
			$data['body'] = $body;
		}

		$isActive = $request->get_param( 'is_active' );
		if ( $isActive !== null ) {
			$data['is_active'] = (bool) $isActive;
		}

		if ( empty( $data ) ) {
			return $this->validationError( [ 'data' => __( 'Keine Daten zum Speichern.', 'resa' ) ] );
		}

		$saved = EmailTemplate::save( $id, $data );

		if ( ! $saved ) {
			return $this->error( 'resa_save_failed', __( 'Vorlage konnte nicht gespeichert werden.', 'resa' ), 500 );
		}

		$updated = EmailTemplate::get( $id );

		return $this->success( $this->formatTemplate( $updated ) );
	}

	/**
	 * POST /admin/email-templates/{id}/reset — Reset to defaults.
	 */
	public function reset( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id = sanitize_text_field( $request->get_param( 'id' ) );

		$template = EmailTemplate::get( $id );
		if ( $template === null ) {
			return $this->notFound( __( 'Vorlage nicht gefunden.', 'resa' ) );
		}

		EmailTemplate::reset( $id );

		$defaults = EmailTemplate::get( $id );

		return $this->success( $this->formatTemplate( $defaults ) );
	}

	/**
	 * POST /admin/email-templates/{id}/test — Send a test email.
	 */
	public function test( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id = sanitize_text_field( $request->get_param( 'id' ) );

		$template = EmailTemplate::get( $id );
		if ( $template === null ) {
			return $this->notFound( __( 'Vorlage nicht gefunden.', 'resa' ) );
		}

		$recipient = $request->get_param( 'recipient' );
		if ( ! is_string( $recipient ) || ! is_email( $recipient ) ) {
			return $this->validationError( [ 'recipient' => __( 'Bitte eine gültige E-Mail-Adresse angeben.', 'resa' ) ] );
		}

		$recipient = sanitize_email( $recipient );

		// Render template with example data.
		$subject = EmailService::renderVariables( $template['subject'], EmailTemplate::EXAMPLE_VALUES );
		$body    = EmailService::renderVariables( $template['body'], EmailTemplate::EXAMPLE_VALUES );

		// Strip data-variable spans for email delivery (keep inner text).
		$body = $this->stripVariableSpans( $body );

		$html = EmailService::wrapInLayout( $body );

		$emailService = new EmailService();

		try {
			$sent = $emailService->send(
				0,
				'test-' . $id,
				$recipient,
				$subject,
				$html
			);

			if ( $sent ) {
				return $this->success( [
					/* translators: %s: Recipient email address */
					'message' => sprintf( __( 'Test-Mail wurde an %s gesendet.', 'resa' ), $recipient ),
				] );
			}

			return $this->error(
				'resa_test_failed',
				__( 'Test-Mail konnte nicht gesendet werden.', 'resa' ),
				500
			);
		} catch ( \RuntimeException $e ) {
			return $this->error(
				'resa_test_failed',
				$e->getMessage(),
				500
			);
		}
	}

	/**
	 * POST /admin/email-templates/{id}/preview — HTML preview with example data.
	 */
	public function preview( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id = sanitize_text_field( $request->get_param( 'id' ) );

		$template = EmailTemplate::get( $id );
		if ( $template === null ) {
			return $this->notFound( __( 'Vorlage nicht gefunden.', 'resa' ) );
		}

		// Use provided body/subject or fall back to saved.
		$subject = $request->get_param( 'subject' );
		$body    = $request->get_param( 'body' );

		if ( ! is_string( $subject ) ) {
			$subject = $template['subject'];
		}
		if ( ! is_string( $body ) ) {
			$body = $template['body'];
		}

		$subject = EmailService::renderVariables( $subject, EmailTemplate::EXAMPLE_VALUES );
		$body    = EmailService::renderVariables( $body, EmailTemplate::EXAMPLE_VALUES );
		$body    = $this->stripVariableSpans( $body );
		$html    = EmailService::wrapInLayout( $body );

		return $this->success( [
			'subject' => $subject,
			'html'    => $html,
		] );
	}

	/**
	 * Format a template array for API response.
	 *
	 * @param array<string,mixed> $template Template data.
	 * @return array<string,mixed>
	 */
	private function formatTemplate( array $template ): array {
		return [
			'id'                  => $template['id'],
			'name'                => $template['name'],
			'description'         => $template['description'],
			'subject'             => $template['subject'],
			'body'                => $template['body'],
			'is_active'           => $template['is_active'] ?? true,
			'has_attachment'       => $template['has_attachment'] ?? false,
			'available_variables' => $template['variables'] ?? [],
			'is_modified'         => $template['is_modified'] ?? false,
			'variable_labels'     => EmailTemplate::VARIABLE_LABELS,
			'variable_groups'     => EmailTemplate::VARIABLE_GROUPS,
			'example_values'      => EmailTemplate::EXAMPLE_VALUES,
		];
	}

	/**
	 * Strip data-variable spans, keeping their inner text content.
	 *
	 * Converts `<span data-variable="name">{{name}}</span>` to `{{name}}`.
	 *
	 * @param string $html HTML string.
	 * @return string Cleaned HTML.
	 */
	private function stripVariableSpans( string $html ): string {
		return preg_replace(
			'/<span\s+data-variable="[^"]*">(.*?)<\/span>/i',
			'$1',
			$html
		) ?? $html;
	}
}
