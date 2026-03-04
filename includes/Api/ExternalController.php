<?php

declare( strict_types=1 );

namespace Resa\Api;

use Resa\Models\Lead;
use Resa\Models\Location;

/**
 * Read-only REST endpoints for external API key access.
 *
 * These endpoints are authenticated via Bearer token (API key)
 * or admin session. They expose leads and locations data
 * without sensitive internal fields (notes, meta, consent_text).
 */
class ExternalController extends RestController {

	/**
	 * @inheritDoc
	 */
	public function registerRoutes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/external/leads',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'leads' ],
				'permission_callback' => [ $this, 'apiKeyAccess' ],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/external/leads/(?P<id>\d+)',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'leadDetail' ],
				'permission_callback' => [ $this, 'apiKeyAccess' ],
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
			'/external/locations',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'locations' ],
				'permission_callback' => [ $this, 'apiKeyAccess' ],
			]
		);
	}

	/**
	 * GET /external/leads — Paginated lead list.
	 */
	public function leads( \WP_REST_Request $request ): \WP_REST_Response {
		$filters = [
			'page'       => $request->get_param( 'page' ) ?? 1,
			'per_page'   => $request->get_param( 'perPage' ) ?? 25,
			'status'     => $request->get_param( 'status' ),
			'asset_type' => $request->get_param( 'assetType' ),
		];

		$result = Lead::getAll( $filters );

		$items = array_map(
			[ self::class, 'formatLeadSummary' ],
			$result['items']
		);

		return $this->success( [
			'items'      => $items,
			'total'      => $result['total'],
			'page'       => $result['page'],
			'perPage'    => $result['per_page'],
			'totalPages' => $result['total_pages'],
		] );
	}

	/**
	 * GET /external/leads/{id} — Single lead detail (without internal fields).
	 */
	public function leadDetail( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id   = (int) $request->get_param( 'id' );
		$lead = Lead::findById( $id );

		if ( ! $lead || $lead->status === 'partial' ) {
			return $this->notFound();
		}

		return $this->success( self::formatLeadDetail( $lead ) );
	}

	/**
	 * GET /external/locations — All active locations.
	 */
	public function locations(): \WP_REST_Response {
		$locations = Location::getAll( true );

		$items = array_map(
			[ self::class, 'formatLocation' ],
			$locations
		);

		return $this->success( $items );
	}

	/**
	 * Format a lead for list view (summary).
	 *
	 * Excludes: notes, meta, consent_text.
	 *
	 * @param object $lead Lead row.
	 * @return array<string,mixed>
	 */
	private static function formatLeadSummary( object $lead ): array {
		return [
			'id'           => (int) $lead->id,
			'assetType'    => $lead->asset_type,
			'status'       => $lead->status,
			'firstName'    => $lead->first_name,
			'lastName'     => $lead->last_name,
			'email'        => $lead->email,
			'phone'        => $lead->phone,
			'locationId'   => (int) $lead->location_id,
			'locationName' => $lead->location_name ?? null,
			'createdAt'    => $lead->created_at,
			'completedAt'  => $lead->completed_at,
		];
	}

	/**
	 * Format a lead for detail view.
	 *
	 * Includes inputs and result, but excludes: notes, meta, consent_text.
	 *
	 * @param object $lead Lead row.
	 * @return array<string,mixed>
	 */
	private static function formatLeadDetail( object $lead ): array {
		return [
			'id'           => (int) $lead->id,
			'sessionId'    => $lead->session_id,
			'assetType'    => $lead->asset_type,
			'status'       => $lead->status,
			'firstName'    => $lead->first_name,
			'lastName'     => $lead->last_name,
			'email'        => $lead->email,
			'phone'        => $lead->phone,
			'company'      => $lead->company,
			'salutation'   => $lead->salutation,
			'message'      => $lead->message,
			'locationId'   => (int) $lead->location_id,
			'agentId'      => $lead->agent_id ? (int) $lead->agent_id : null,
			'inputs'       => json_decode( $lead->inputs ?? '{}', true ),
			'result'       => json_decode( $lead->result ?? 'null', true ),
			'consentGiven' => (bool) $lead->consent_given,
			'gclid'        => $lead->gclid,
			'fbclid'       => $lead->fbclid,
			'pdfSent'      => (bool) $lead->pdf_sent,
			'createdAt'    => $lead->created_at,
			'updatedAt'    => $lead->updated_at,
			'completedAt'  => $lead->completed_at,
		];
	}

	/**
	 * Format a location for external API.
	 *
	 * @param object $location Location row.
	 * @return array<string,mixed>
	 */
	private static function formatLocation( object $location ): array {
		return [
			'id'         => (int) $location->id,
			'slug'       => $location->slug,
			'name'       => $location->name,
			'country'    => $location->country,
			'bundesland' => $location->bundesland,
			'regionType' => $location->region_type,
			'latitude'   => $location->latitude ? (float) $location->latitude : null,
			'longitude'  => $location->longitude ? (float) $location->longitude : null,
			'isActive'   => (bool) $location->is_active,
		];
	}
}
