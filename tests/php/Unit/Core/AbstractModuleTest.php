<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Core;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Core\AbstractModule;

class AbstractModuleTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_defaults_sind_korrekt(): void {
		$module = $this->createConcreteModule();

		$this->assertSame( 'default', $module->getIcon() );
		$this->assertSame( 'calculator', $module->getCategory() );
		$this->assertSame( 'free', $module->getFlag() );
		$this->assertSame( [], $module->getSettingsSchema() );
		$this->assertSame( [], $module->getFrontendConfig() );
	}

	public function test_isActive_liest_option(): void {
		Functions\expect( 'get_option' )
			->once()
			->with( 'resa_module_test-mod_active', false )
			->andReturn( '1' );

		$module = $this->createConcreteModule();

		$this->assertTrue( $module->isActive() );
	}

	public function test_isActive_false_bei_fehlender_option(): void {
		Functions\expect( 'get_option' )
			->once()
			->with( 'resa_module_test-mod_active', false )
			->andReturn( false );

		$module = $this->createConcreteModule();

		$this->assertFalse( $module->isActive() );
	}

	public function test_setActive_true_speichert_und_ruft_onActivate(): void {
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_module_test-mod_active', '1' );

		$module   = $this->createConcreteModule();
		$module->setActive( true );

		$this->assertTrue( $module->activateCalled );
		$this->assertFalse( $module->deactivateCalled );
	}

	public function test_setActive_false_speichert_und_ruft_onDeactivate(): void {
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_module_test-mod_active', '0' );

		$module = $this->createConcreteModule();
		$module->setActive( false );

		$this->assertFalse( $module->activateCalled );
		$this->assertTrue( $module->deactivateCalled );
	}

	public function test_toArray_enthaelt_alle_felder(): void {
		Functions\expect( 'get_option' )->once()->andReturn( '1' );

		$module = $this->createConcreteModule();
		$data   = $module->toArray();

		$this->assertSame( 'test-mod', $data['slug'] );
		$this->assertSame( 'Test Modul', $data['name'] );
		$this->assertSame( 'Ein Testmodul.', $data['description'] );
		$this->assertSame( 'default', $data['icon'] );
		$this->assertSame( 'calculator', $data['category'] );
		$this->assertSame( 'free', $data['flag'] );
		$this->assertTrue( $data['active'] );
	}

	public function test_registerRoutes_ist_noop(): void {
		$module = $this->createConcreteModule();
		$module->registerRoutes();

		// No exception thrown — default is a no-op.
		$this->assertTrue( true );
	}

	/**
	 * Create a concrete implementation for testing.
	 */
	private function createConcreteModule(): ConcreteTestModule {
		return new ConcreteTestModule();
	}
}

/**
 * Concrete test implementation of AbstractModule.
 *
 * @internal Only used in AbstractModuleTest.
 */
class ConcreteTestModule extends AbstractModule {

	public bool $activateCalled   = false;
	public bool $deactivateCalled = false;

	public function getSlug(): string {
		return 'test-mod';
	}

	public function getName(): string {
		return 'Test Modul';
	}

	public function getDescription(): string {
		return 'Ein Testmodul.';
	}

	public function onActivate(): void {
		$this->activateCalled = true;
	}

	public function onDeactivate(): void {
		$this->deactivateCalled = true;
	}
}
