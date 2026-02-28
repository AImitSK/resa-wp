<?php

declare( strict_types=1 );

namespace Resa\Api;

use Resa\Models\Agent;

/**
 * REST controller for agent (broker) data.
 *
 * Admin-only endpoints for managing the primary agent's
 * contact info, company details, and branding data.
 */
class AgentsController extends RestController {

	/**
	 * @inheritDoc
	 */
	public function registerRoutes(): void {
		// Get/update the default (primary) agent.
		register_rest_route(
			self::NAMESPACE,
			'/admin/agent',
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
	}

	/**
	 * GET /admin/agent — Get the primary agent data.
	 */
	public function show(): \WP_REST_Response {
		$agent = Agent::getDefault();

		return $this->success( self::format( $agent ) );
	}

	/**
	 * PUT /admin/agent — Update (or create) the primary agent.
	 */
	public function update( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$params = $request->get_json_params();

		// Validate required fields.
		if ( empty( $params['name'] ) || trim( $params['name'] ) === '' ) {
			return $this->validationError( [
				'name' => __( 'Name ist erforderlich.', 'resa' ),
			] );
		}

		if ( empty( $params['email'] ) || ! is_email( $params['email'] ) ) {
			return $this->validationError( [
				'email' => __( 'Gültige E-Mail-Adresse erforderlich.', 'resa' ),
			] );
		}

		$data = [
			'name'        => $params['name'],
			'email'       => $params['email'],
			'phone'       => $params['phone'] ?? '',
			'company'     => $params['company'] ?? '',
			'address'     => $params['address'] ?? '',
			'website'     => $params['website'] ?? '',
			'imprint_url' => $params['imprint_url'] ?? '',
		];

		// Optional photo URL.
		if ( array_key_exists( 'photo_url', $params ) ) {
			$data['photo_url'] = $params['photo_url'];
		}

		$agentId = Agent::saveDefault( $data );

		if ( $agentId === false ) {
			return $this->error(
				'resa_save_failed',
				__( 'Maklerdaten konnten nicht gespeichert werden.', 'resa' ),
				500
			);
		}

		$agent = Agent::findById( $agentId );

		return $this->success( self::format( $agent ) );
	}

	/**
	 * Format an agent row for API responses.
	 *
	 * @param object|null $agent Agent row.
	 * @return array<string,mixed>
	 */
	private static function format( ?object $agent ): array {
		if ( ! $agent ) {
			// Return empty default structure.
			return [
				'id'         => null,
				'name'       => '',
				'company'    => '',
				'email'      => '',
				'phone'      => '',
				'address'    => '',
				'website'    => '',
				'imprintUrl' => '',
				'photoUrl'   => null,
			];
		}

		return [
			'id'         => (int) $agent->id,
			'name'       => $agent->name ?? '',
			'company'    => $agent->company ?? '',
			'email'      => $agent->email ?? '',
			'phone'      => $agent->phone ?? '',
			'address'    => $agent->address ?? '',
			'website'    => $agent->website ?? '',
			'imprintUrl' => $agent->imprint_url ?? '',
			'photoUrl'   => $agent->photo_url ?: null,
		];
	}
}
