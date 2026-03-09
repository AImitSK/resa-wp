<?php

declare( strict_types=1 );

namespace Resa\Tests\Integration;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Models\Agent;

/**
 * Integration test: Agent CRUD, location sync, and default agent logic.
 */
class AgentAssignmentTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'sanitize_email' )->returnArg();
		Functions\when( 'sanitize_textarea_field' )->returnArg();
		Functions\when( 'esc_url_raw' )->returnArg();
		Functions\when( 'absint' )->alias( fn( $v ) => abs( (int) $v ) );
		Functions\when( 'current_time' )->justReturn( '2025-06-01 12:00:00' );
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	// ── Create ───────────────────────────────────────────────

	public function test_create_erstellt_agent(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'insert' )
			->once()
			->with(
				'wp_resa_agents',
				Mockery::on( fn( $data ) =>
					$data['name'] === 'Max Mustermann' &&
					$data['email'] === 'max@example.com' &&
					$data['company'] === 'Immobilien GmbH' &&
					$data['is_active'] === 1
				),
				Mockery::type( 'array' )
			)
			->andReturnUsing( function () use ( $wpdb ) {
				$wpdb->insert_id = 1;
				return 1;
			} );

		$id = Agent::create( [
			'name'    => 'Max Mustermann',
			'email'   => 'max@example.com',
			'phone'   => '+49 170 1234567',
			'company' => 'Immobilien GmbH',
		] );

		$this->assertSame( 1, $id );
	}

	// ── getDefault ───────────────────────────────────────────

	public function test_getDefault_gibt_ersten_aktiven_agent(): void {
		global $wpdb;

		$agent = (object) [
			'id'        => 1,
			'name'      => 'Max Mustermann',
			'is_active' => 1,
		];

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( $agent );

		$result = Agent::getDefault();

		$this->assertSame( 1, $result->id );
		$this->assertSame( 'Max Mustermann', $result->name );
	}

	public function test_getDefault_gibt_null_ohne_agenten(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( null );

		$this->assertNull( Agent::getDefault() );
	}

	// ── saveDefault ──────────────────────────────────────────

	public function test_saveDefault_erstellt_neuen_agent(): void {
		global $wpdb;

		// getDefault → null (no existing agent).
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( null );

		// create.
		$wpdb->shouldReceive( 'insert' )
			->once()
			->andReturnUsing( function () use ( $wpdb ) {
				$wpdb->insert_id = 1;
				return 1;
			} );

		$id = Agent::saveDefault( [ 'name' => 'Neuer Agent' ] );

		$this->assertSame( 1, $id );
	}

	public function test_saveDefault_aktualisiert_bestehenden(): void {
		global $wpdb;

		$existing = (object) [ 'id' => 5, 'name' => 'Alt', 'is_active' => 1 ];

		// getDefault → existing agent.
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( $existing );

		// update.
		$wpdb->shouldReceive( 'update' )
			->once()
			->with(
				'wp_resa_agents',
				Mockery::on( fn( $data ) => $data['name'] === 'Neu' ),
				[ 'id' => 5 ],
				Mockery::type( 'array' ),
				[ '%d' ]
			)
			->andReturn( 1 );

		$id = Agent::saveDefault( [ 'name' => 'Neu' ] );

		$this->assertSame( 5, $id );
	}

	// ── Location Sync ────────────────────────────────────────

	public function test_syncLocations_loescht_alte_und_setzt_neue(): void {
		global $wpdb;

		// Delete existing.
		$wpdb->shouldReceive( 'delete' )
			->once()
			->with( 'wp_resa_agent_locations', [ 'agent_id' => 1 ], [ '%d' ] )
			->andReturn( 2 );

		// Insert new (3 locations).
		$wpdb->shouldReceive( 'insert' )
			->times( 3 )
			->with(
				'wp_resa_agent_locations',
				Mockery::type( 'array' ),
				[ '%d', '%d' ]
			)
			->andReturn( 1 );

		Agent::syncLocations( 1, [ 10, 20, 30 ] );

		// No assertion needed — mock expectations verify the calls.
		$this->assertTrue( true );
	}

	public function test_syncLocations_mit_leerer_liste(): void {
		global $wpdb;

		// Delete existing.
		$wpdb->shouldReceive( 'delete' )
			->once()
			->with( 'wp_resa_agent_locations', [ 'agent_id' => 1 ], [ '%d' ] )
			->andReturn( 0 );

		// No inserts.
		$wpdb->shouldReceive( 'insert' )->never();

		Agent::syncLocations( 1, [] );

		$this->assertTrue( true );
	}

	// ── getByLocationId ──────────────────────────────────────

	public function test_getByLocationId_gibt_zugewiesene_agenten(): void {
		global $wpdb;

		$agents = [
			(object) [ 'id' => 1, 'name' => 'Agent A', 'is_active' => 1 ],
			(object) [ 'id' => 2, 'name' => 'Agent B', 'is_active' => 1 ],
		];

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( $agents );

		$result = Agent::getByLocationId( 10 );

		$this->assertCount( 2, $result );
		$this->assertSame( 'Agent A', $result[0]->name );
	}

	public function test_getByLocationId_gibt_leeres_array(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( false );

		$this->assertSame( [], Agent::getByLocationId( 999 ) );
	}

	// ── Delete (Cascade) ─────────────────────────────────────

	public function test_delete_loescht_pivot_und_agent(): void {
		global $wpdb;

		// Pivot table first.
		$wpdb->shouldReceive( 'delete' )
			->once()
			->with( 'wp_resa_agent_locations', [ 'agent_id' => 1 ], [ '%d' ] )
			->andReturn( 3 );

		// Agent table.
		$wpdb->shouldReceive( 'delete' )
			->once()
			->with( 'wp_resa_agents', [ 'id' => 1 ], [ '%d' ] )
			->andReturn( 1 );

		$this->assertTrue( Agent::delete( 1 ) );
	}

	// ── getAll with Locations ────────────────────────────────

	public function test_getAll_haengt_location_ids_an(): void {
		global $wpdb;

		$agents = [
			(object) [ 'id' => 1, 'name' => 'Agent A' ],
			(object) [ 'id' => 2, 'name' => 'Agent B' ],
		];

		// Agents query.
		$wpdb->shouldReceive( 'get_results' )
			->once()
			->andReturn( $agents );

		// Pivot query.
		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_results' )
			->once()
			->andReturn( [
				(object) [ 'agent_id' => 1, 'location_id' => 10 ],
				(object) [ 'agent_id' => 1, 'location_id' => 20 ],
				(object) [ 'agent_id' => 2, 'location_id' => 10 ],
			] );

		$result = Agent::getAll();

		$this->assertCount( 2, $result );
		$this->assertSame( [ 10, 20 ], $result[0]->location_ids );
		$this->assertSame( [ 10 ], $result[1]->location_ids );
	}

	public function test_getAll_leer(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( false );

		$this->assertSame( [], Agent::getAll() );
	}
}
