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
		// Get/update the default (primary) agent (backwards compat).
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

		// List all agents / create new agent.
		register_rest_route(
			self::NAMESPACE,
			'/admin/agents',
			[
				[
					'methods'             => 'GET',
					'callback'            => [ $this, 'index' ],
					'permission_callback' => [ $this, 'adminAccess' ],
				],
				[
					'methods'             => 'POST',
					'callback'            => [ $this, 'create' ],
					'permission_callback' => [ $this, 'adminAccess' ],
				],
			]
		);

		// Get/update/delete a specific agent.
		register_rest_route(
			self::NAMESPACE,
			'/admin/agents/(?P<id>\d+)',
			[
				[
					'methods'             => 'PUT',
					'callback'            => [ $this, 'updateAgent' ],
					'permission_callback' => [ $this, 'adminAccess' ],
				],
				[
					'methods'             => 'DELETE',
					'callback'            => [ $this, 'deleteAgent' ],
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
	 * GET /admin/agents — List all agents with location assignments.
	 */
	public function index(): \WP_REST_Response {
		$agents = Agent::getAll();

		return $this->success( array_map( [ self::class, 'formatFull' ], $agents ) );
	}

	/**
	 * POST /admin/agents — Create a new agent.
	 */
	public function create( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$params = $request->get_json_params();

		$validation = self::validateAgentParams( $params );
		if ( is_wp_error( $validation ) ) {
			return $validation;
		}

		$data = self::extractAgentData( $params );

		$agentId = Agent::create( $data );

		if ( $agentId === false ) {
			return $this->error(
				'resa_save_failed',
				__( 'Ansprechpartner konnte nicht erstellt werden.', 'resa' ),
				500
			);
		}

		// Sync location assignments.
		if ( isset( $params['locationIds'] ) && is_array( $params['locationIds'] ) ) {
			Agent::syncLocations( $agentId, array_map( 'absint', $params['locationIds'] ) );
		}

		$agent = Agent::findById( $agentId );
		if ( $agent ) {
			$agent->location_ids = array_map( 'absint', $params['locationIds'] ?? [] );
		}

		return $this->success( self::formatFull( $agent ), 201 );
	}

	/**
	 * PUT /admin/agents/{id} — Update an existing agent.
	 */
	public function updateAgent( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id     = (int) $request->get_param( 'id' );
		$params = $request->get_json_params();

		$existing = Agent::findById( $id );
		if ( ! $existing ) {
			return $this->notFound( __( 'Ansprechpartner nicht gefunden.', 'resa' ) );
		}

		$validation = self::validateAgentParams( $params );
		if ( is_wp_error( $validation ) ) {
			return $validation;
		}

		$data = self::extractAgentData( $params );
		Agent::update( $id, $data );

		// Sync location assignments.
		if ( isset( $params['locationIds'] ) && is_array( $params['locationIds'] ) ) {
			Agent::syncLocations( $id, array_map( 'absint', $params['locationIds'] ) );
		}

		$agent = Agent::findById( $id );
		if ( $agent ) {
			$agent->location_ids = array_map( 'absint', $params['locationIds'] ?? [] );
		}

		return $this->success( self::formatFull( $agent ) );
	}

	/**
	 * DELETE /admin/agents/{id} — Delete an agent.
	 */
	public function deleteAgent( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id = (int) $request->get_param( 'id' );

		$existing = Agent::findById( $id );
		if ( ! $existing ) {
			return $this->notFound( __( 'Ansprechpartner nicht gefunden.', 'resa' ) );
		}

		Agent::delete( $id );

		return $this->success( null, 204 );
	}

	/**
	 * Validate required agent parameters.
	 *
	 * @param array<string,mixed> $params Request parameters.
	 * @return bool|\WP_Error True on success, WP_Error on failure.
	 */
	private static function validateAgentParams( array $params ): bool|\WP_Error {
		$errors = [];

		if ( empty( $params['name'] ) || trim( $params['name'] ) === '' ) {
			$errors['name'] = __( 'Name ist erforderlich.', 'resa' );
		}

		if ( empty( $params['email'] ) || ! is_email( $params['email'] ) ) {
			$errors['email'] = __( 'Gültige E-Mail-Adresse erforderlich.', 'resa' );
		}

		if ( ! empty( $errors ) ) {
			return new \WP_Error(
				'resa_validation',
				__( 'Validierungsfehler.', 'resa' ),
				[ 'status' => 400, 'errors' => $errors ]
			);
		}

		return true;
	}

	/**
	 * Extract agent data from request params.
	 *
	 * @param array<string,mixed> $params Request parameters.
	 * @return array<string,mixed>
	 */
	private static function extractAgentData( array $params ): array {
		$data = [
			'name'     => $params['name'],
			'position' => $params['position'] ?? '',
			'email'    => $params['email'],
			'phone'    => $params['phone'] ?? '',
		];

		if ( array_key_exists( 'photoUrl', $params ) ) {
			$data['photo_url'] = $params['photoUrl'] ?? '';
		}

		return $data;
	}

	/**
	 * Format an agent row for API responses (basic, for backwards compat).
	 *
	 * @param object|null $agent Agent row.
	 * @return array<string,mixed>
	 */
	private static function format( ?object $agent ): array {
		if ( ! $agent ) {
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

	/**
	 * Format an agent row with full details for the team management API.
	 *
	 * @param object|null $agent Agent row with location_ids.
	 * @return array<string,mixed>
	 */
	private static function formatFull( ?object $agent ): array {
		if ( ! $agent ) {
			return [
				'id'          => null,
				'name'        => '',
				'position'    => '',
				'email'       => '',
				'phone'       => '',
				'photoUrl'    => null,
				'locationIds' => [],
			];
		}

		return [
			'id'          => (int) $agent->id,
			'name'        => $agent->name ?? '',
			'position'    => $agent->position ?? '',
			'email'       => $agent->email ?? '',
			'phone'       => $agent->phone ?? '',
			'photoUrl'    => $agent->photo_url ?: null,
			'locationIds' => $agent->location_ids ?? [],
		];
	}
}
