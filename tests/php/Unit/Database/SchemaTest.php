<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Database;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Database\Schema;

class SchemaTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		$this->setupWpdb();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_version_ist_gesetzt(): void {
		$this->assertNotEmpty( Schema::VERSION );
		$this->assertSame( '0.1.0', Schema::VERSION );
	}

	public function test_getTableNames_enthaelt_alle_6_tabellen(): void {
		$tables = Schema::getTableNames();

		$this->assertCount( 6, $tables );
		$this->assertContains( 'wp_resa_leads', $tables );
		$this->assertContains( 'wp_resa_tracking_daily', $tables );
		$this->assertContains( 'wp_resa_locations', $tables );
		$this->assertContains( 'wp_resa_email_log', $tables );
		$this->assertContains( 'wp_resa_agents', $tables );
		$this->assertContains( 'wp_resa_agent_locations', $tables );
	}

	public function test_needsMigration_true_wenn_keine_version(): void {
		Functions\expect( 'get_option' )
			->once()
			->with( 'resa_db_version', '' )
			->andReturn( '' );

		$this->assertTrue( Schema::needsMigration() );
	}

	public function test_needsMigration_true_wenn_alte_version(): void {
		Functions\expect( 'get_option' )
			->once()
			->with( 'resa_db_version', '' )
			->andReturn( '0.0.1' );

		$this->assertTrue( Schema::needsMigration() );
	}

	public function test_needsMigration_false_wenn_aktuelle_version(): void {
		Functions\expect( 'get_option' )
			->once()
			->with( 'resa_db_version', '' )
			->andReturn( Schema::VERSION );

		$this->assertFalse( Schema::needsMigration() );
	}

	public function test_migrate_ruft_dbDelta_und_speichert_version(): void {
		Functions\expect( 'dbDelta' )->once();
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_db_version', Schema::VERSION );

		// ABSPATH is defined in bootstrap.
		Schema::migrate( '' );
	}

	public function test_migrate_ueberspringt_bei_aktueller_version(): void {
		Functions\expect( 'dbDelta' )->never();
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_db_version', Schema::VERSION );

		Schema::migrate( Schema::VERSION );
	}

	public function test_dropAll_loescht_alle_tabellen_und_option(): void {
		global $wpdb;

		// 6 Tabellen + 1 delete_option.
		Functions\expect( 'delete_option' )
			->once()
			->with( 'resa_db_version' );

		Schema::dropAll();

		// Verify queries were executed (6 DROP TABLE statements).
		$this->assertSame( 6, $wpdb->queryCount );
	}

	/**
	 * Set up a minimal $wpdb mock.
	 */
	private function setupWpdb(): void {
		global $wpdb;

		$wpdb              = new \stdClass();
		$wpdb->prefix      = 'wp_';
		$wpdb->queryCount  = 0;

		// Mock the query method to count calls.
		$mock          = \Mockery::mock( 'wpdb' );
		$mock->prefix  = 'wp_';
		$mock->queryCount = 0;

		$mock->shouldReceive( 'query' )
			->andReturnUsing(
				function () use ( $mock ) {
					++$mock->queryCount;
					return true;
				}
			);

		$mock->shouldReceive( 'get_charset_collate' )
			->andReturn( 'DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci' );

		$wpdb = $mock;
	}
}
