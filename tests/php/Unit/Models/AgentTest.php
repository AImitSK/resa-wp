<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Models;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Models\Agent;

class AgentTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_getDefault_gibt_ersten_aktiven_agent_zurueck(): void {
		global $wpdb;

		$row = (object) [
			'id'      => 1,
			'name'    => 'Max Mustermann',
			'email'   => 'max@mustermann-immo.de',
			'company' => 'Mustermann Immobilien',
		];

		$wpdb->shouldReceive( 'prepare' )
			->once()
			->andReturn( 'SELECT * FROM wp_resa_agents WHERE is_active = 1 ORDER BY id ASC LIMIT 1' );

		$wpdb->shouldReceive( 'get_row' )
			->once()
			->andReturn( $row );

		$result = Agent::getDefault();

		$this->assertNotNull( $result );
		$this->assertEquals( 'Max Mustermann', $result->name );
		$this->assertEquals( 'max@mustermann-immo.de', $result->email );
	}

	public function test_getDefault_gibt_null_zurueck_wenn_kein_agent(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( null );

		$result = Agent::getDefault();

		$this->assertNull( $result );
	}

	public function test_findById_gibt_agent_zurueck(): void {
		global $wpdb;

		$row = (object) [
			'id'    => 5,
			'name'  => 'Hans Makler',
			'email' => 'hans@makler.de',
		];

		$wpdb->shouldReceive( 'prepare' )
			->once()
			->andReturn( 'SELECT * FROM wp_resa_agents WHERE id = 5 LIMIT 1' );

		$wpdb->shouldReceive( 'get_row' )
			->once()
			->andReturn( $row );

		$result = Agent::findById( 5 );

		$this->assertNotNull( $result );
		$this->assertEquals( 5, $result->id );
		$this->assertEquals( 'Hans Makler', $result->name );
	}

	public function test_create_gibt_id_zurueck(): void {
		global $wpdb;

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'sanitize_email' )->andReturnFirstArg();
		Functions\expect( 'sanitize_textarea_field' )->andReturnFirstArg();
		Functions\expect( 'esc_url_raw' )->andReturnFirstArg();
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );
		Functions\expect( 'current_time' )->andReturn( '2026-01-15 10:00:00' );

		$wpdb->shouldReceive( 'insert' )
			->once()
			->andReturnUsing( function () use ( $wpdb ) {
				$wpdb->insert_id = 42;
				return 1;
			} );

		$id = Agent::create( [
			'name'    => 'Neuer Makler',
			'email'   => 'neu@makler.de',
			'company' => 'Neue Immobilien GmbH',
			'phone'   => '+49 123 456789',
		] );

		$this->assertEquals( 42, $id );
	}

	public function test_create_gibt_false_bei_fehler(): void {
		global $wpdb;

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'sanitize_email' )->andReturnFirstArg();
		Functions\expect( 'sanitize_textarea_field' )->andReturnFirstArg();
		Functions\expect( 'esc_url_raw' )->andReturnFirstArg();
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );
		Functions\expect( 'current_time' )->andReturn( '2026-01-15 10:00:00' );

		$wpdb->shouldReceive( 'insert' )->once()->andReturn( false );

		$result = Agent::create( [ 'name' => 'Test', 'email' => 'test@test.de' ] );

		$this->assertFalse( $result );
	}

	public function test_update_aktualisiert_felder(): void {
		global $wpdb;

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'sanitize_email' )->andReturnFirstArg();

		$wpdb->shouldReceive( 'update' )
			->once()
			->with(
				'wp_resa_agents',
				Mockery::on( function ( $fields ) {
					return $fields['name'] === 'Neuer Name'
						&& $fields['email'] === 'neu@email.de';
				} ),
				[ 'id' => 1 ],
				Mockery::type( 'array' ),
				[ '%d' ]
			)
			->andReturn( 1 );

		$result = Agent::update( 1, [
			'name'  => 'Neuer Name',
			'email' => 'neu@email.de',
		] );

		$this->assertTrue( $result );
	}

	public function test_update_gibt_false_bei_leeren_daten(): void {
		$result = Agent::update( 1, [] );

		$this->assertFalse( $result );
	}

	public function test_saveDefault_erstellt_neuen_agent_wenn_keiner_existiert(): void {
		global $wpdb;

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'sanitize_email' )->andReturnFirstArg();
		Functions\expect( 'sanitize_textarea_field' )->andReturnFirstArg();
		Functions\expect( 'esc_url_raw' )->andReturnFirstArg();
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );
		Functions\expect( 'current_time' )->andReturn( '2026-01-15 10:00:00' );

		// getDefault returns null
		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( null );

		// create is called
		$wpdb->shouldReceive( 'insert' )
			->once()
			->andReturnUsing( function () use ( $wpdb ) {
				$wpdb->insert_id = 99;
				return 1;
			} );

		$result = Agent::saveDefault( [
			'name'  => 'Erster Makler',
			'email' => 'erster@makler.de',
		] );

		$this->assertEquals( 99, $result );
	}

	public function test_saveDefault_aktualisiert_existierenden_agent(): void {
		global $wpdb;

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'sanitize_email' )->andReturnFirstArg();

		$existing = (object) [ 'id' => 5, 'name' => 'Alter Name' ];

		// getDefault returns existing agent
		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( $existing );

		// update is called
		$wpdb->shouldReceive( 'update' )->once()->andReturn( 1 );

		$result = Agent::saveDefault( [
			'name'  => 'Neuer Name',
			'email' => 'neu@email.de',
		] );

		$this->assertEquals( 5, $result );
	}

	public function test_create_sanitized_inputs_korrekt(): void {
		global $wpdb;

		Functions\expect( 'sanitize_text_field' )
			->times( 3 ) // name, phone, company
			->andReturnFirstArg();
		Functions\expect( 'sanitize_email' )
			->once()
			->with( 'test@example.com' )
			->andReturn( 'test@example.com' );
		Functions\expect( 'sanitize_textarea_field' )
			->once()
			->andReturnFirstArg();
		Functions\expect( 'esc_url_raw' )
			->times( 3 ) // photo_url, website, imprint_url
			->andReturnFirstArg();
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );
		Functions\expect( 'current_time' )->andReturn( '2026-01-15 10:00:00' );

		$wpdb->shouldReceive( 'insert' )
			->once()
			->andReturnUsing( function () use ( $wpdb ) {
				$wpdb->insert_id = 1;
				return 1;
			} );

		Agent::create( [
			'name'    => 'Test Makler',
			'email'   => 'test@example.com',
			'phone'   => '+49 123 456',
			'company' => 'Test GmbH',
			'address' => "Teststraße 1\n12345 Berlin",
			'website' => 'https://example.com',
		] );

		// Assertions are implicit - test passes if no exceptions
		$this->assertTrue( true );
	}

	public function test_update_sanitized_url_felder(): void {
		global $wpdb;

		Functions\expect( 'esc_url_raw' )
			->once()
			->with( 'https://neue-website.de' )
			->andReturn( 'https://neue-website.de' );

		$wpdb->shouldReceive( 'update' )->once()->andReturn( 1 );

		$result = Agent::update( 1, [
			'website' => 'https://neue-website.de',
		] );

		$this->assertTrue( $result );
	}
}
