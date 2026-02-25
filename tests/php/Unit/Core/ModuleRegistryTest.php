<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Core;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Core\ModuleInterface;
use Resa\Core\ModuleRegistry;

class ModuleRegistryTest extends TestCase {

	use MockeryPHPUnitIntegration;

	private ModuleRegistry $registry;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		$this->registry = new ModuleRegistry();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_register_fuegt_modul_hinzu(): void {
		$module = $this->createModule( 'test-module' );

		$this->registry->register( $module );

		$this->assertTrue( $this->registry->has( 'test-module' ) );
		$this->assertSame( $module, $this->registry->get( 'test-module' ) );
	}

	public function test_register_wirft_exception_bei_doppeltem_slug(): void {
		Functions\expect( 'esc_html' )
			->once()
			->with( 'duplicate' )
			->andReturn( 'duplicate' );

		$module1 = $this->createModule( 'duplicate' );
		$module2 = $this->createModule( 'duplicate' );

		$this->registry->register( $module1 );

		$this->expectException( \InvalidArgumentException::class );
		$this->expectExceptionMessage( 'Module "duplicate" is already registered.' );

		$this->registry->register( $module2 );
	}

	public function test_get_gibt_null_bei_unbekanntem_slug(): void {
		$this->assertNull( $this->registry->get( 'nonexistent' ) );
	}

	public function test_has_gibt_false_bei_unbekanntem_slug(): void {
		$this->assertFalse( $this->registry->has( 'nonexistent' ) );
	}

	public function test_getAll_liefert_alle_module(): void {
		$module1 = $this->createModule( 'mod-a' );
		$module2 = $this->createModule( 'mod-b' );

		$this->registry->register( $module1 );
		$this->registry->register( $module2 );

		$all = $this->registry->getAll();

		$this->assertCount( 2, $all );
		$this->assertArrayHasKey( 'mod-a', $all );
		$this->assertArrayHasKey( 'mod-b', $all );
	}

	public function test_getActive_filtert_nur_aktive(): void {
		$active   = $this->createModule( 'active', true );
		$inactive = $this->createModule( 'inactive', false );

		$this->registry->register( $active );
		$this->registry->register( $inactive );

		$result = $this->registry->getActive();

		$this->assertCount( 1, $result );
		$this->assertArrayHasKey( 'active', $result );
	}

	public function test_getActiveCount_zaehlt_korrekt(): void {
		$this->registry->register( $this->createModule( 'a', true ) );
		$this->registry->register( $this->createModule( 'b', false ) );
		$this->registry->register( $this->createModule( 'c', true ) );

		$this->assertSame( 2, $this->registry->getActiveCount() );
	}

	public function test_discover_laedt_module_und_feuert_action(): void {
		// RESA_PLUGIN_DIR points to project root which has modules/demo/.
		Functions\expect( 'do_action' )
			->once()
			->with( 'resa_register_modules', $this->registry );

		$this->registry->discover();

		// Brain Monkey mocks do_action, so callbacks don't fire.
		// We verify the action was triggered with the registry.
		$this->assertCount( 0, $this->registry->getAll() );
	}

	public function test_registerModuleRoutes_ruft_nur_aktive_auf(): void {
		$active = $this->createModule( 'active', true );
		$active->expects( $this->once() )->method( 'registerRoutes' );

		$inactive = $this->createModule( 'inactive', false );
		$inactive->expects( $this->never() )->method( 'registerRoutes' );

		$this->registry->register( $active );
		$this->registry->register( $inactive );

		$this->registry->registerModuleRoutes();
	}

	/**
	 * Create a mock ModuleInterface.
	 */
	private function createModule( string $slug, bool $active = false ): ModuleInterface {
		$mock = $this->createMock( ModuleInterface::class );
		$mock->method( 'getSlug' )->willReturn( $slug );
		$mock->method( 'isActive' )->willReturn( $active );

		return $mock;
	}
}
