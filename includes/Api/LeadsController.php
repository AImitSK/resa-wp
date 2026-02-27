<?php

declare( strict_types=1 );

namespace Resa\Api;

use Resa\Core\ErrorMessages;
use Resa\Models\Lead;
use Resa\Services\Email\EmailService;
use Resa\Services\Notifications\LeadNotificationService;
use Resa\Services\Pdf\LeadPdfService;
use Resa\Services\Pdf\PdfGenerator;

/**
 * REST controller for lead capture endpoints.
 *
 * Public endpoints (no auth):
 *  POST /leads/partial  — Phase 1: save quiz answers.
 *  POST /leads/complete — Phase 2: save contact data + DSGVO consent.
 */
final class LeadsController extends RestController {

	/**
	 * Register lead routes.
	 */
	public function registerRoutes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/leads/partial',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'createPartial' ],
				'permission_callback' => [ $this, 'publicAccess' ],
				'args'                => $this->getPartialArgs(),
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/leads/complete',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'completeLead' ],
				'permission_callback' => [ $this, 'publicAccess' ],
				'args'                => $this->getCompleteArgs(),
			]
		);
	}

	/**
	 * Phase 1 — Create a partial lead.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function createPartial( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$sessionId = $this->requiredString( $request, 'sessionId' );
		if ( is_wp_error( $sessionId ) ) {
			return $sessionId;
		}

		$assetType = $this->requiredString( $request, 'assetType' );
		if ( is_wp_error( $assetType ) ) {
			return $assetType;
		}

		$id = Lead::createPartial(
			[
				'session_id'  => $sessionId,
				'asset_type'  => $assetType,
				'location_id' => absint( $request->get_param( 'locationId' ) ?? 0 ),
				'inputs'      => $request->get_param( 'inputs' ) ?? [],
				'result'      => $request->get_param( 'result' ),
				'meta'        => $request->get_param( 'meta' ) ?? [],
				'gclid'       => $request->get_param( 'gclid' ) ?? '',
				'fbclid'      => $request->get_param( 'fbclid' ) ?? '',
			]
		);

		if ( $id === false ) {
			return $this->error(
				ErrorMessages::LEAD_CREATE_FAILED,
				ErrorMessages::get( ErrorMessages::LEAD_CREATE_FAILED ),
				500
			);
		}

		return $this->success(
			[
				'id'        => $id,
				'sessionId' => $sessionId,
				'status'    => 'partial',
			],
			201
		);
	}

	/**
	 * Phase 2 — Complete a lead with contact data.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function completeLead( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		// DEBUG: Log all received parameters.
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( 'RESA DEBUG leads/complete: ' . wp_json_encode( $request->get_params() ) );

		$sessionId = $this->requiredString( $request, 'sessionId' );
		if ( is_wp_error( $sessionId ) ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( 'RESA DEBUG: sessionId error: ' . $sessionId->get_error_message() );
			return $sessionId;
		}

		// Verify partial lead exists.
		$lead = Lead::findBySession( $sessionId );
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( 'RESA DEBUG: findBySession result: ' . ( $lead ? 'found (id=' . $lead->id . ', status=' . $lead->status . ')' : 'null' ) );

		if ( $lead === null ) {
			return $this->notFound( ErrorMessages::get( ErrorMessages::LEAD_NOT_FOUND ) );
		}

		if ( $lead->status !== 'partial' ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( 'RESA DEBUG: Lead already completed, status=' . $lead->status );
			return $this->error(
				ErrorMessages::LEAD_ALREADY_COMPLETED,
				ErrorMessages::get( ErrorMessages::LEAD_ALREADY_COMPLETED )
			);
		}

		// Validate required contact fields.
		$firstName = $this->requiredString( $request, 'firstName' );
		if ( is_wp_error( $firstName ) ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( 'RESA DEBUG: firstName validation failed: ' . $firstName->get_error_message() );
			return $firstName;
		}

		$email = $request->get_param( 'email' );
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( 'RESA DEBUG: email=' . ( is_string( $email ) ? $email : gettype( $email ) ) );
		if ( ! is_email( $email ) ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( 'RESA DEBUG: email validation failed' );
			return $this->validationError( [ 'email' => ErrorMessages::get( ErrorMessages::INVALID_EMAIL ) ] );
		}

		$consent = (bool) $request->get_param( 'consent' );
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( 'RESA DEBUG: consent=' . ( $consent ? 'true' : 'false' ) . ', raw=' . wp_json_encode( $request->get_param( 'consent' ) ) );
		if ( ! $consent ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( 'RESA DEBUG: consent validation failed' );
			return $this->validationError( [ 'consent' => ErrorMessages::get( ErrorMessages::CONSENT_REQUIRED ) ] );
		}

		$success = Lead::complete(
			$sessionId,
			[
				'first_name'   => $firstName,
				'last_name'    => sanitize_text_field( $request->get_param( 'lastName' ) ?? '' ),
				'email'        => sanitize_email( $email ),
				'phone'        => sanitize_text_field( $request->get_param( 'phone' ) ?? '' ),
				'company'      => sanitize_text_field( $request->get_param( 'company' ) ?? '' ),
				'salutation'   => sanitize_text_field( $request->get_param( 'salutation' ) ?? '' ),
				'message'      => sanitize_textarea_field( $request->get_param( 'message' ) ?? '' ),
				'consent_text' => sanitize_textarea_field( $request->get_param( 'consentText' ) ?? '' ),
			]
		);

		if ( ! $success ) {
			return $this->error(
				ErrorMessages::LEAD_COMPLETE_FAILED,
				ErrorMessages::get( ErrorMessages::LEAD_COMPLETE_FAILED ),
				500
			);
		}

		$updatedLead = Lead::findBySession( $sessionId );

		// Notify agent of new lead (non-blocking — errors are logged, not propagated).
		if ( $updatedLead !== null ) {
			$emailService = new EmailService();

			try {
				$notificationService = new LeadNotificationService( $emailService );
				$notificationService->notifyAgent( (int) $updatedLead->id );
			} catch ( \Throwable $e ) {
				// Log error but don't fail the lead completion.
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log( 'RESA: Lead notification failed: ' . $e->getMessage() );
			}

			// Send PDF analysis to lead (non-blocking — errors are logged, not propagated).
			try {
				$pdfService = new LeadPdfService( new PdfGenerator(), $emailService );
				$pdfService->generateAndSend( (int) $updatedLead->id );
			} catch ( \Throwable $e ) {
				// Log error but don't fail the lead completion.
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log( 'RESA: Lead PDF sending failed: ' . $e->getMessage() );
			}
		}

		return $this->success(
			[
				'id'     => (int) ( $updatedLead->id ?? 0 ),
				'status' => 'new',
			]
		);
	}

	/**
	 * Argument definitions for the partial endpoint.
	 *
	 * @return array<string,array<string,mixed>>
	 */
	private function getPartialArgs(): array {
		return [
			'sessionId'  => [
				'required'          => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			],
			'assetType'  => [
				'required'          => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			],
			'locationId' => [
				'required' => false,
				'type'     => 'integer',
				'default'  => 0,
			],
			'inputs'     => [
				'required' => false,
				'type'     => 'object',
				'default'  => [],
			],
			'result'     => [
				'required' => false,
			],
			'meta'       => [
				'required' => false,
				'type'     => 'object',
				'default'  => [],
			],
			'gclid'      => [
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			],
			'fbclid'     => [
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			],
		];
	}

	/**
	 * Argument definitions for the complete endpoint.
	 *
	 * @return array<string,array<string,mixed>>
	 */
	private function getCompleteArgs(): array {
		return [
			'sessionId'   => [
				'required'          => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			],
			'firstName'   => [
				'required'          => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			],
			'email'       => [
				'required'          => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_email',
			],
			'consent'     => [
				'required'          => true,
				'type'              => 'boolean',
				'sanitize_callback' => 'rest_sanitize_boolean',
			],
			'consentText' => [
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_textarea_field',
				'default'           => '',
			],
			'lastName'    => [
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			],
			'phone'       => [
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			],
			'company'     => [
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			],
			'salutation'  => [
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			],
			'message'     => [
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_textarea_field',
			],
		];
	}
}
