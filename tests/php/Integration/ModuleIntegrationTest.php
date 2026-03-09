<?php

declare( strict_types=1 );

namespace Resa\Tests\Integration;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Core\ModuleRegistry;
use Resa\Core\ModuleInterface;

/**
 * Integration test: Module registration, activation, and route management.
 */
class ModuleIntegrationTest extends TestCase {

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

	// ── Registration ─────────────────────────────────────────

	public function test_register_fuegt_modul_hinzu(): void {
		$module = $this->createModule( 'rent-calculator' );

		$this->registry->register( $module );

		$this->assertTrue( $this->registry->has( 'rent-calculator' ) );
		$this->assertSame( $module, $this->registry->get( 'rent-calculator' ) );
	}

	public function test_register_wirft_bei_duplikat(): void {
		Functions\when( 'esc_html' )->returnArg();

		$this->registry->register( $this->createModule( 'rent-calculator' ) );

		$this->expectException( \InvalidArgumentException::class );
		$this->expectExceptionMessage( 'rent-calculator' );

		$this->registry->register( $this->createModule( 'rent-calculator' ) );
	}

	public function test_get_gibt_null_fuer_unbekannt(): void {
		$this->assertNull( $this->registry->get( 'nonexistent' ) );
	}

	// ── Multiple Modules ─────────────────────────────────────

	public function test_getAll_gibt_alle_module_zurueck(): void {
		$this->registry->register( $this->createModule( 'rent-calculator' ) );
		$this->registry->register( $this->createModule( 'value-calculator' ) );
		$this->registry->register( $this->createModule( 'purchase-costs' ) );

		$all = $this->registry->getAll();

		$this->assertCount( 3, $all );
		$this->assertArrayHasKey( 'rent-calculator', $all );
		$this->assertArrayHasKey( 'value-calculator', $all );
		$this->assertArrayHasKey( 'purchase-costs', $all );
	}

	// ── Active Modules ───────────────────────────────────────

	public function test_getActive_filtert_inaktive(): void {
		$this->registry->register( $this->createModule( 'rent-calculator', true ) );
		$this->registry->register( $this->createModule( 'value-calculator', false ) );
		$this->registry->register( $this->createModule( 'purchase-costs', true ) );

		$active = $this->registry->getActive();

		$this->assertCount( 2, $active );
		$this->assertArrayHasKey( 'rent-calculator', $active );
		$this->assertArrayHasKey( 'purchase-costs', $active );
		$this->assertArrayNotHasKey( 'value-calculator', $active );
	}

	public function test_getActiveCount_zaehlt_korrekt(): void {
		$this->registry->register( $this->createModule( 'rent-calculator', true ) );
		$this->registry->register( $this->createModule( 'value-calculator', false ) );

		$this->assertSame( 1, $this->registry->getActiveCount() );
	}

	public function test_getActiveCount_null_bei_keinen_modulen(): void {
		$this->assertSame( 0, $this->registry->getActiveCount() );
	}

	// ── Route Registration ───────────────────────────────────

	public function test_registerModuleRoutes_registriert_nur_aktive(): void {
		$active = $this->createModule( 'rent-calculator', true );
		$active->shouldReceive( 'registerRoutes' )->once();

		$inactive = $this->createModule( 'value-calculator', false );
		$inactive->shouldReceive( 'registerRoutes' )->never();

		$this->registry->register( $active );
		$this->registry->register( $inactive );

		$this->registry->registerModuleRoutes();
	}

	// ── Discovery ────────────────────────────────────────────

	public function test_discover_laedt_module_dateien(): void {
		// discover() scans modules/ directory, loads module.php files,
		// and fires resa_register_modules. Brain Monkey intercepts
		// add_action + do_action, so no modules actually register.
		Functions\expect( 'add_action' )
			->atLeast()
			->once();

		Functions\expect( 'do_action' )
			->once()
			->with( 'resa_register_modules', $this->registry );

		$this->registry->discover();

		$this->assertSame( [], $this->registry->getAll() );
	}

	// ── has() ────────────────────────────────────────────────

	public function test_has_gibt_true_fuer_registriert(): void {
		$this->registry->register( $this->createModule( 'rent-calculator' ) );

		$this->assertTrue( $this->registry->has( 'rent-calculator' ) );
		$this->assertFalse( $this->registry->has( 'unknown' ) );
	}

	// ── Helpers ──────────────────────────────────────────────

	/**
	 * @param string $slug   Module slug.
	 * @param bool   $active Whether module is active.
	 * @return ModuleInterface&\Mockery\MockInterface
	 */
	private function createModule( string $slug, bool $active = false ): ModuleInterface {
		$mock = Mockery::mock( ModuleInterface::class );
		$mock->shouldReceive( 'getSlug' )->andReturn( $slug );
		$mock->shouldReceive( 'isActive' )->andReturn( $active );

		return $mock;
	}
}
