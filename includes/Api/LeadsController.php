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
use Resa\Security\SpamGuard;
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
		$spam = SpamGuard::check( $request );
		if ( is_wp_error( $spam ) ) {
			return $spam;
		}

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
		$spam = SpamGuard::check( $request );
		if ( is_wp_error( $spam ) ) {
			return $spam;
		}

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

		/**
		 * Fires when a lead is completed (Phase 2).
		 *
		 * @param int $leadId The completed lead ID.
		 */
		if ( $updatedLead !== null ) {
			do_action( 'resa_lead_created', (int) $updatedLead->id );
		}

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
	 *
	 * Exports all lead data including decoded inputs (Immobilientyp, Wohnfläche, etc.)
	 * with UTF-8 BOM for correct Umlaut display in Excel.
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
			'per_page'    => 50000,
			'export'      => true,
		];

		$result = Lead::getAll( $filters );

		// Known input keys in display order.
		$input_keys = [
			'property_type',
			'size',
			'rooms',
			'year_built',
			'condition',
			'location_rating',
			'city_name',
			'address',
			'address_lat',
			'address_lng',
			'features',
			'additional_features',
		];

		$input_labels = [
			'property_type'       => 'Immobilientyp',
			'size'                => 'Wohnfläche',
			'rooms'               => 'Zimmer',
			'year_built'          => 'Baujahr',
			'condition'           => 'Zustand',
			'location_rating'     => 'Lage-Bewertung',
			'city_name'           => 'Stadt',
			'address'             => 'Adresse',
			'address_lat'         => 'Breitengrad',
			'address_lng'         => 'Längengrad',
			'features'            => 'Ausstattung',
			'additional_features' => 'Zusatzausstattung',
		];

		$module_names = [
			'rent-calculator'  => 'Mietpreis-Kalkulator',
			'value-calculator' => 'Immobilienwert-Rechner',
			'purchase-costs'   => 'Kaufnebenkosten-Rechner',
			'budget-calculator' => 'Budgetrechner',
			'roi-calculator'   => 'Renditerechner',
			'energy-check'     => 'Energieeffizienz-Check',
			'seller-checklist' => 'Verkäufer-Checkliste',
			'buyer-checklist'  => 'Käufer-Checkliste',
		];

		$status_labels = [
			'new'       => 'Neu',
			'contacted' => 'Kontaktiert',
			'qualified' => 'Qualifiziert',
			'completed' => 'Abgeschlossen',
			'lost'      => 'Verloren',
		];

		// Build header.
		$headers = [ 'ID', 'Anrede', 'Vorname', 'Nachname', 'E-Mail', 'Telefon', 'Firma', 'Nachricht', 'Modul', 'Standort', 'Status' ];
		foreach ( $input_keys as $key ) {
			$headers[] = $input_labels[ $key ];
		}
		$headers[] = 'Weitere Eingaben';
		$headers[] = 'Ergebnis';
		$headers[] = 'Notizen';
		$headers[] = 'Erstellt';

		// Build CSV rows.
		$csv_lines   = [];
		$csv_lines[] = implode( ';', array_map( [ self::class, 'escapeCsvField' ], $headers ) );

		foreach ( $result['items'] as $lead ) {
			$inputs = json_decode( $lead->inputs ?? '{}', true ) ?: [];

			$row = [
				(string) $lead->id,
				$lead->salutation ?? '',
				$lead->first_name ?? '',
				$lead->last_name ?? '',
				$lead->email ?? '',
				$lead->phone ?? '',
				$lead->company ?? '',
				$lead->message ?? '',
				$module_names[ $lead->asset_type ] ?? $lead->asset_type ?? '',
				$lead->location_name ?? '',
				$status_labels[ $lead->status ] ?? $lead->status ?? '',
			];

			// Add known input columns.
			$remaining_inputs = $inputs;
			foreach ( $input_keys as $key ) {
				$value = $inputs[ $key ] ?? '';
				$row[] = self::formatInputForCsv( $key, $value );
				unset( $remaining_inputs[ $key ] );
			}

			// Remove internal input keys from remaining.
			unset( $remaining_inputs['city_id'], $remaining_inputs['city_slug'] );

			// Weitere Eingaben: any remaining input keys as JSON.
			$row[] = ! empty( $remaining_inputs )
				? (string) wp_json_encode( $remaining_inputs, JSON_UNESCAPED_UNICODE )
				: '';

			// Ergebnis as JSON.
			$result_data = json_decode( $lead->result ?? 'null', true );
			$row[]       = $result_data !== null
				? (string) wp_json_encode( $result_data, JSON_UNESCAPED_UNICODE )
				: '';

			// Notizen & Erstellt.
			$row[] = $lead->notes ?? '';
			$row[] = $lead->created_at ?? '';

			$csv_lines[] = implode( ';', array_map( [ self::class, 'escapeCsvField' ], $row ) );
		}

		// UTF-8 BOM + CSV content (BOM ensures correct Umlaut display in Excel).
		$csv = "\xEF\xBB\xBF" . implode( "\n", $csv_lines );

		return $this->success( [
			'csv'      => $csv,
			'filename' => 'resa-leads-' . gmdate( 'Y-m-d' ) . '.csv',
			'total'    => $result['total'],
		] );
	}

	/**
	 * Escape a value for CSV (semicolon-delimited).
	 *
	 * @param string $value Raw value.
	 * @return string Escaped value wrapped in double quotes.
	 */
	private static function escapeCsvField( string $value ): string {
		if ( $value === '' ) {
			return '';
		}
		return '"' . str_replace( '"', '""', $value ) . '"';
	}

	/**
	 * Format an input value for CSV display.
	 *
	 * Mirrors the frontend formatInputValue() logic so that exported data
	 * matches the Lead detail view (translated labels, units, etc.).
	 *
	 * @param string $key   Input key.
	 * @param mixed  $value Input value.
	 * @return string Formatted string.
	 */
	private static function formatInputForCsv( string $key, mixed $value ): string {
		if ( $value === '' || $value === null ) {
			return '';
		}

		$feature_labels = [
			'garage'         => 'Garage',
			'parking'        => 'Stellplatz',
			'balcony'        => 'Balkon',
			'terrace'        => 'Terrasse',
			'garden'         => 'Garten',
			'elevator'       => 'Aufzug',
			'cellar'         => 'Keller',
			'fitted_kitchen' => 'Einbauküche',
			'guest_wc'       => 'Gäste-WC',
			'guest_toilet'   => 'Gäste-WC',
			'floor_heating'  => 'Fußbodenheizung',
			'Smart Home'     => 'Smart Home',
			'Heliport'       => 'Heliport',
		];

		// Arrays (features, additional_features).
		if ( is_array( $value ) ) {
			return implode( ', ', array_map(
				fn( $v ) => $feature_labels[ (string) $v ] ?? (string) $v,
				$value
			) );
		}

		// Comma-separated feature strings.
		if ( ( $key === 'features' || $key === 'additional_features' ) && is_string( $value ) ) {
			return implode( ', ', array_map(
				fn( $v ) => $feature_labels[ trim( $v ) ] ?? trim( $v ),
				explode( ',', $value )
			) );
		}

		// Property type.
		if ( $key === 'property_type' ) {
			$types = [ 'apartment' => 'Wohnung', 'house' => 'Haus' ];
			return $types[ (string) $value ] ?? (string) $value;
		}

		// Condition.
		if ( $key === 'condition' ) {
			$conditions = [
				'new'              => 'Neubau',
				'renovated'        => 'Renoviert',
				'good'             => 'Gut',
				'needs_renovation' => 'Renovierungsbedürftig',
			];
			return $conditions[ (string) $value ] ?? (string) $value;
		}

		// Size with unit.
		if ( $key === 'size' ) {
			return $value . ' m²';
		}

		return (string) $value;
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

		$formatted = [
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

		// Add Propstack sync status if add-on is active.
		if ( class_exists( '\Resa\Propstack\PropstackSettings' ) ) {
			$formatted['propstack'] = [
				'synced'     => isset( $lead->propstack_synced ) ? (bool) $lead->propstack_synced : false,
				'propstackId' => isset( $lead->propstack_id ) ? (int) $lead->propstack_id : null,
				'error'      => $lead->propstack_error ?? null,
				'syncedAt'   => $lead->propstack_synced_at ?? null,
			];
		}

		return $formatted;
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
