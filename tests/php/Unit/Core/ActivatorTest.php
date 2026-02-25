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
    }

    protected function tearDown(): void {
        Monkey\tearDown();
        parent::tearDown();
    }

    public function test_activate_speichert_version(): void {
        Functions\expect( 'update_option' )
            ->once()
            ->with( 'resa_version', RESA_VERSION );

        Functions\expect( 'get_option' )
            ->once()
            ->with( 'resa_installed_at' )
            ->andReturn( '2026-01-01 00:00:00' );

        Functions\expect( 'set_transient' )->once();
        Functions\expect( 'flush_rewrite_rules' )->once();

        Activator::activate();
    }

    public function test_activate_setzt_install_timestamp_bei_erstinstallation(): void {
        Functions\expect( 'update_option' )
            ->twice(); // version + installed_at

        Functions\expect( 'get_option' )
            ->once()
            ->with( 'resa_installed_at' )
            ->andReturn( false );

        Functions\expect( 'current_time' )
            ->once()
            ->with( 'mysql' )
            ->andReturn( '2026-02-25 12:00:00' );

        Functions\expect( 'set_transient' )->once();
        Functions\expect( 'flush_rewrite_rules' )->once();

        Activator::activate();
    }
}
