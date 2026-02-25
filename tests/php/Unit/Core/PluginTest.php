<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Core;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Core\Plugin;

class PluginTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		$this->resetPluginSingleton();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_init_registriert_hooks(): void {
		// Expect activation/deactivation hooks.
		Functions\expect( 'register_activation_hook' )->once();
		Functions\expect( 'register_deactivation_hook' )->once();

		// Expect core hooks.
		Functions\expect( 'add_action' )
			->times( 2 )
			->andReturnUsing( function ( string $hook ): bool {
				$this->assertContains( $hook, [ 'init', 'plugins_loaded' ] );
				return true;
			} );

		Plugin::init();

		// Instance should be set.
		$this->assertNotNull( Plugin::getInstance() );
	}

	public function test_init_ist_idempotent(): void {
		// First init — registers hooks.
		Functions\expect( 'register_activation_hook' )->once();
		Functions\expect( 'register_deactivation_hook' )->once();
		Functions\expect( 'add_action' )->times( 2 );
		Plugin::init();

		// Second call — should not register anything again.
		Plugin::init();
		$this->assertNotNull( Plugin::getInstance() );
	}

	public function test_loadTextDomain_laedt_resa_domain(): void {
		Functions\expect( 'register_activation_hook' )->once();
		Functions\expect( 'register_deactivation_hook' )->once();
		Functions\expect( 'add_action' )->times( 2 );
		Plugin::init();

		Functions\expect( 'load_plugin_textdomain' )
			->once()
			->with( 'resa', false, \Mockery::type( 'string' ) );

		$plugin = Plugin::getInstance();
		$this->assertNotNull( $plugin );
		$plugin->loadTextDomain();
	}

	/**
	 * Reset the static singleton so each test starts fresh.
	 */
	private function resetPluginSingleton(): void {
		$reflection = new \ReflectionClass( Plugin::class );
		$property   = $reflection->getProperty( 'instance' );
		$property->setAccessible( true );
		$property->setValue( null, null );
	}
}
