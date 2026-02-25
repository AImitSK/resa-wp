<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Core;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Core\Activator;

class ActivatorTest extends TestCase {

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

	public function test_activate_speichert_version(): void {
		Functions\expect( 'update_option' )->zeroOrMoreTimes();
		Functions\expect( 'get_option' )->zeroOrMoreTimes()->andReturn( '2026-01-01 00:00:00' );
		Functions\expect( 'set_transient' )->once();
		Functions\expect( 'flush_rewrite_rules' )->once();
		Functions\expect( 'dbDelta' )->zeroOrMoreTimes();

		Activator::activate();

		// Verify version was stored.
		$this->assertTrue( true );
	}

	public function test_activate_setzt_install_timestamp_bei_erstinstallation(): void {
		$installedAtCalled = false;

		Functions\expect( 'update_option' )->zeroOrMoreTimes()
			->andReturnUsing(
				function ( string $key ) use ( &$installedAtCalled ): bool {
					if ( $key === 'resa_installed_at' ) {
						$installedAtCalled = true;
					}
					return true;
				}
			);

		Functions\expect( 'get_option' )->zeroOrMoreTimes()
			->andReturnUsing(
				function ( string $key ) {
					if ( $key === 'resa_installed_at' ) {
						return false; // Erstinstallation.
					}
					return '';
				}
			);

		Functions\expect( 'current_time' )
			->once()
			->with( 'mysql' )
			->andReturn( '2026-02-25 12:00:00' );

		Functions\expect( 'set_transient' )->once();
		Functions\expect( 'flush_rewrite_rules' )->once();
		Functions\expect( 'dbDelta' )->zeroOrMoreTimes();

		Activator::activate();

		$this->assertTrue( $installedAtCalled );
	}

	/**
	 * Set up a minimal $wpdb mock for Schema::migrate().
	 */
	private function setupWpdb(): void {
		global $wpdb;

		$mock         = \Mockery::mock( 'wpdb' );
		$mock->prefix = 'wp_';

		$mock->shouldReceive( 'get_charset_collate' )
			->andReturn( 'DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci' );

		$mock->shouldReceive( 'get_var' )->andReturn( '0' );

		$wpdb = $mock;
	}
}
