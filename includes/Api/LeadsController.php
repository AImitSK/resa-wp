<?php

declare( strict_types=1 );

namespace Resa\Api;

use Resa\Core\ErrorMessages;
use Resa\Core\Plugin;
use Resa\Freemius\FeatureGate;
use Resa\Models\Lead;
use Resa\Services\Email\EmailLogger;
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
 *
 * Admin endpoints (requires manage_options):
 *  GET    /admin/leads       — List with pagination/filters.
 *  GET    /admin/leads/{id}  — Single lead (full data).
 *  PUT    /admin/leads/{id}  — Update status/notes.
 *  DELETE /admin/leads/{id}  — Delete lead.
 *  GET    /admin/leads/stats — Status counts.
 *  GET    /admin/leads/export — CSV export (Pro).
 */
final class LeadsController extends RestController {

	/**
	 * Register lead routes.
	 */
	public function registerRoutes(): void {
		// Public endpoints.
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

		// Admin endpoints.
		register_rest_route(
			self::NAMESPACE,
			'/admin/leads',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'adminIndex' ],
				'permission_callback' => [ $this, 'adminAccess' ],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/admin/leads/stats',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'adminStats' ],
				'permission_callback' => [ $this, 'adminAccess' ],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/admin/leads/export',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'adminExport' ],
				'permission_callback' => [ $this, 'adminAccess' ],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/admin/leads/(?P<id>\d+)/emails',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'adminLeadEmails' ],
				'permission_callback' => [ $this, 'adminAccess' ],
				'args'                => [
					'id' => [
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					],
				],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/admin/leads/(?P<id>\d+)',
			[
				[
					'methods'             => 'GET',
					'callback'            => [ $this, 'adminShow' ],
					'permission_callback' => [ $this, 'adminAccess' ],
					'args'                => [
						'id' => [
							'type'              => 'integer',
							'required'          => true,
							'sanitize_callback' => 'absint',
						],
					],
				],
				[
					'methods'             => 'PUT',
					'callback'            => [ $this, 'adminUpdate' ],
					'permission_callback' => [ $this, 'adminAccess' ],
					'args'                => [
						'id' => [
							'type'              => 'integer',
							'required'          => true,
							'sanitize_callback' => 'absint',
						],
					],
				],
				[
					'methods'             => 'DELETE',
					'callback'            => [ $this, 'adminDelete' ],
					'permission_callback' => [ $this, 'adminAccess' ],
					'args'                => [
						'id' => [
							'type'              => 'integer',
							'required'          => true,
							'sanitize_callback' => 'absint',
						],
					],
				],
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

	// ─── Admin Endpoints ────────────────────────────────────

	/**
	 * GET /admin/leads — List leads with pagination and filters.
	 */
	public function adminIndex( \WP_REST_Request $request ): \WP_REST_Response {
		$filters = [
			'status'      => $request->get_param( 'status' ),
			'asset_type'  => $request->get_param( 'assetType' ),
			'location_id' => $request->get_param( 'locationId' ),
			'search'      => $request->get_param( 'search' ),
			'date_from'   => $request->get_param( 'dateFrom' ),
			'date_to'     => $request->get_param( 'dateTo' ),
			'page'        => $request->get_param( 'page' ) ?? 1,
			'per_page'    => $request->get_param( 'perPage' ) ?? 25,
			'orderby'     => $request->get_param( 'orderby' ) ?? 'created_at',
			'order'       => $request->get_param( 'order' ) ?? 'DESC',
		];

		// Apply lead limit for free plan.
		$plugin = Plugin::getInstance();
		$limit  = PHP_INT_MAX;
		if ( $plugin ) {
			$featureGate = new FeatureGate( $plugin->getModuleRegistry() );
			$limit       = $featureGate->getLeadLimit();
		}

		$result = Lead::getAll( $filters );

		// Format items for response.
		$items = array_map(
			[ self::class, 'formatListItem' ],
			$result['items']
		);

		// Apply limit (for free plan, only show last N leads).
		$total = $result['total'];
		if ( $total > $limit ) {
			$items = array_slice( $items, 0, $limit );
			$total = $limit;
		}

		return $this->success( [
			'items'       => $items,
			'total'       => $total,
			'page'        => $result['page'],
			'perPage'     => $result['per_page'],
			'totalPages'  => (int) ceil( $total / $result['per_page'] ),
		] );
	}

	/**
	 * GET /admin/leads/stats — Lead counts by status.
	 */
	public function adminStats(): \WP_REST_Response {
		$stats = Lead::getStats();

		// Apply lead limit for free plan display.
		$plugin = Plugin::getInstance();
		if ( $plugin ) {
			$featureGate = new FeatureGate( $plugin->getModuleRegistry() );
			$limit       = $featureGate->getLeadLimit();
			if ( $stats['all'] > $limit ) {
				$stats['all'] = $limit;
			}
		}

		return $this->success( $stats );
	}

	/**
	 * GET /admin/leads/{id}/emails — Email log for a lead.
	 */
	public function adminLeadEmails( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id   = (int) $request->get_param( 'id' );
		$lead = Lead::findById( $id );

		if ( ! $lead ) {
			return $this->notFound( __( 'Lead nicht gefunden.', 'resa' ) );
		}

		$logs = EmailLogger::findByLead( $id );

		$items = array_map(
			static function ( object $log ): array {
				return [
					'id'         => (int) $log->id,
					'templateId' => $log->template_id,
					'recipient'  => $log->recipient,
					'subject'    => $log->subject,
					'status'     => $log->status,
					'error'      => $log->error_message ?? null,
					'sentAt'     => $log->sent_at,
				];
			},
			$logs
		);

		return $this->success( $items );
	}

	/**
	 * GET /admin/leads/{id} — Single lead with full data.
	 */
	public function adminShow( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id   = (int) $request->get_param( 'id' );
		$lead = Lead::findById( $id );

		if ( ! $lead ) {
			return $this->notFound( __( 'Lead nicht gefunden.', 'resa' ) );
		}

		return $this->success( self::formatDetail( $lead ) );
	}

	/**
	 * PUT /admin/leads/{id} — Update lead status/notes.
	 */
	public function adminUpdate( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id   = (int) $request->get_param( 'id' );
		$lead = Lead::findById( $id );

		if ( ! $lead ) {
			return $this->notFound( __( 'Lead nicht gefunden.', 'resa' ) );
		}

		$params     = $request->get_json_params();
		$updateData = [];

		// Status.
		if ( array_key_exists( 'status', $params ) ) {
			$allowed_statuses = [ 'new', 'contacted', 'qualified', 'completed', 'lost' ];
			$status           = sanitize_text_field( (string) $params['status'] );
			if ( in_array( $status, $allowed_statuses, true ) ) {
				$updateData['status'] = $status;
			}
		}

		// Notes.
		if ( array_key_exists( 'notes', $params ) ) {
			$updateData['notes'] = $params['notes'];
		}

		// Agent ID.
		if ( array_key_exists( 'agentId', $params ) ) {
			$updateData['agent_id'] = $params['agentId'];
		}

		$success = Lead::update( $id, $updateData );

		if ( ! $success ) {
			return $this->error(
				'resa_update_failed',
				__( 'Lead konnte nicht aktualisiert werden.', 'resa' ),
				500
			);
		}

		$lead = Lead::findById( $id );

		return $this->success( self::formatDetail( $lead ) );
	}

	/**
	 * DELETE /admin/leads/{id} — Delete a lead.
	 */
	public function adminDelete( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id   = (int) $request->get_param( 'id' );
		$lead = Lead::findById( $id );

		if ( ! $lead ) {
			return $this->notFound( __( 'Lead nicht gefunden.', 'resa' ) );
		}

		$success = Lead::delete( $id );

		if ( ! $success ) {
			return $this->error(
				'resa_delete_failed',
				__( 'Lead konnte nicht gelöscht werden.', 'resa' ),
				500
			);
		}

		return $this->success( [ 'deleted' => true ] );
	}

	/**
	 * GET /admin/leads/export — CSV export (Pro feature).
	 */
	public function adminExport( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		// Check feature gate.
		$plugin = Plugin::getInstance();
		if ( $plugin ) {
			$featureGate = new FeatureGate( $plugin->getModuleRegistry() );
			if ( ! $featureGate->canExportLeads() ) {
				return $this->error(
					'resa_feature_restricted',
					__( 'CSV-Export ist nur mit Premium verfügbar.', 'resa' ),
					403
				);
			}
		}

		$filters = [
			'status'      => $request->get_param( 'status' ),
			'asset_type'  => $request->get_param( 'assetType' ),
			'location_id' => $request->get_param( 'locationId' ),
			'search'      => $request->get_param( 'search' ),
			'date_from'   => $request->get_param( 'dateFrom' ),
			'date_to'     => $request->get_param( 'dateTo' ),
			'per_page'    => 10000, // Export all matching.
		];

		$result = Lead::getAll( $filters );

		// Build CSV.
		$csv_lines   = [];
		$csv_lines[] = implode( ';', [
			'ID',
			'Vorname',
			'Nachname',
			'E-Mail',
			'Telefon',
			'Firma',
			'Modul',
			'Standort',
			'Status',
			'Erstellt',
			'Notizen',
		] );

		foreach ( $result['items'] as $lead ) {
			$csv_lines[] = implode( ';', [
				$lead->id,
				'"' . str_replace( '"', '""', $lead->first_name ?? '' ) . '"',
				'"' . str_replace( '"', '""', $lead->last_name ?? '' ) . '"',
				$lead->email ?? '',
				$lead->phone ?? '',
				'"' . str_replace( '"', '""', $lead->company ?? '' ) . '"',
				$lead->asset_type ?? '',
				'"' . str_replace( '"', '""', $lead->location_name ?? '' ) . '"',
				$lead->status ?? '',
				$lead->created_at ?? '',
				'"' . str_replace( '"', '""', $lead->notes ?? '' ) . '"',
			] );
		}

		return $this->success( [
			'csv'      => implode( "\n", $csv_lines ),
			'filename' => 'resa-leads-' . gmdate( 'Y-m-d' ) . '.csv',
			'total'    => $result['total'],
		] );
	}

	// ─── Formatters ─────────────────────────────────────────

	/**
	 * Format a lead for list view.
	 *
	 * @param object|null $lead Lead row.
	 * @return array<string, mixed>
	 */
	private static function formatListItem( ?object $lead ): array {
		if ( ! $lead ) {
			return [];
		}

		return [
			'id'           => (int) $lead->id,
			'sessionId'    => $lead->session_id,
			'firstName'    => $lead->first_name,
			'lastName'     => $lead->last_name,
			'email'        => $lead->email,
			'phone'        => $lead->phone,
			'assetType'    => $lead->asset_type,
			'locationId'   => $lead->location_id ? (int) $lead->location_id : null,
			'locationName' => $lead->location_name ?? null,
			'status'       => $lead->status,
			'createdAt'    => $lead->created_at,
			'result'       => json_decode( $lead->result ?? 'null', true ),
		];
	}

	/**
	 * Format a lead for detail view.
	 *
	 * @param object|null $lead Lead row.
	 * @return array<string, mixed>
	 */
	private static function formatDetail( ?object $lead ): array {
		if ( ! $lead ) {
			return [];
		}

		return [
			'id'           => (int) $lead->id,
			'sessionId'    => $lead->session_id,
			'firstName'    => $lead->first_name,
			'lastName'     => $lead->last_name,
			'email'        => $lead->email,
			'phone'        => $lead->phone,
			'company'      => $lead->company,
			'salutation'   => $lead->salutation,
			'message'      => $lead->message,
			'assetType'    => $lead->asset_type,
			'locationId'   => $lead->location_id ? (int) $lead->location_id : null,
			'status'       => $lead->status,
			'inputs'       => json_decode( $lead->inputs ?? '{}', true ),
			'result'       => json_decode( $lead->result ?? 'null', true ),
			'meta'         => json_decode( $lead->meta ?? '{}', true ),
			'notes'        => $lead->notes,
			'agentId'      => $lead->agent_id ? (int) $lead->agent_id : null,
			'consentGiven' => (bool) $lead->consent_given,
			'consentText'  => $lead->consent_text,
			'consentDate'  => $lead->consent_date,
			'createdAt'    => $lead->created_at,
			'updatedAt'    => $lead->updated_at,
			'completedAt'  => $lead->completed_at,
		];
	}

	// ─── Argument Definitions ───────────────────────────────

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
