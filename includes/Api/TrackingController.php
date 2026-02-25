<?php

declare( strict_types=1 );

namespace Resa\Api;

use Resa\Services\Tracking\TrackingService;

/**
 * REST controller for tracking endpoints.
 *
 * Public endpoint (no auth):
 *  POST /tracking — Record a funnel event from the frontend.
 *
 * Admin endpoint:
 *  GET /analytics/funnel — Get aggregated funnel data for the dashboard.
 */
final class TrackingController extends RestController {

	/**
	 * Register tracking routes.
	 */
	public function registerRoutes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/tracking',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'recordEvent' ],
				'permission_callback' => [ $this, 'publicAccess' ],
				'args'                => $this->getTrackingArgs(),
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/analytics/funnel',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getFunnel' ],
				'permission_callback' => [ $this, 'adminAccess' ],
				'args'                => $this->getFunnelArgs(),
			]
		);
	}

	/**
	 * Record a tracking event.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function recordEvent( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$event = $this->requiredString( $request, 'event' );
		if ( is_wp_error( $event ) ) {
			return $event;
		}

		if ( ! TrackingService::isValidEvent( $event ) ) {
			return $this->validationError(
				[
					'event' => __( 'Ungültiger Event-Typ.', 'resa' ),
				]
			);
		}

		$assetType = $this->requiredString( $request, 'assetType' );
		if ( is_wp_error( $assetType ) ) {
			return $assetType;
		}

		$locationId = absint( $request->get_param( 'locationId' ) ?? 0 );

		$success = TrackingService::record( $event, $assetType, $locationId );

		if ( ! $success ) {
			return $this->error( 'resa_tracking_failed', __( 'Tracking-Event konnte nicht aufgezeichnet werden.', 'resa' ), 500 );
		}

		return $this->success( [ 'recorded' => true ], 201 );
	}

	/**
	 * Get aggregated funnel data for the admin dashboard.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function getFunnel( \WP_REST_Request $request ): \WP_REST_Response {
		$dateFrom = sanitize_text_field( $request->get_param( 'dateFrom' ) ?? gmdate( 'Y-m-d', strtotime( '-30 days' ) ) );
		$dateTo   = sanitize_text_field( $request->get_param( 'dateTo' ) ?? gmdate( 'Y-m-d' ) );

		$assetType  = sanitize_text_field( $request->get_param( 'assetType' ) ?? '' );
		$locationId = $request->get_param( 'locationId' );
		$locationId = $locationId !== null ? absint( $locationId ) : null;

		$funnel = TrackingService::getFunnelData( $dateFrom, $dateTo, $assetType, $locationId );
		$daily  = TrackingService::getDailyBreakdown( $dateFrom, $dateTo, $assetType );

		return $this->success(
			[
				'summary' => $funnel,
				'daily'   => $daily,
				'filters' => [
					'dateFrom'   => $dateFrom,
					'dateTo'     => $dateTo,
					'assetType'  => $assetType,
					'locationId' => $locationId,
				],
			]
		);
	}

	/**
	 * Argument definitions for the tracking endpoint.
	 *
	 * @return array<string,array<string,mixed>>
	 */
	private function getTrackingArgs(): array {
		return [
			'event'      => [
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
			'sessionId'  => [
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			],
			'step'       => [
				'required' => false,
				'type'     => 'integer',
			],
			'stepTotal'  => [
				'required' => false,
				'type'     => 'integer',
			],
		];
	}

	/**
	 * Argument definitions for the funnel analytics endpoint.
	 *
	 * @return array<string,array<string,mixed>>
	 */
	private function getFunnelArgs(): array {
		return [
			'dateFrom'   => [
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			],
			'dateTo'     => [
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			],
			'assetType'  => [
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			],
			'locationId' => [
				'required' => false,
				'type'     => 'integer',
			],
		];
	}
}
