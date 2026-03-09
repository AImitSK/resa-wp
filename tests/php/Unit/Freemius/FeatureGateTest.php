<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Freemius;

use Brain\Monkey;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Core\ModuleInterface;
use Resa\Core\ModuleRegistry;
use Resa\Freemius\FeatureGate;
use Resa\Freemius\FreemiusInit;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class FeatureGateTest extends TestCase {

	use MockeryPHPUnitIntegration;

	private ModuleRegistry $registry;
	private FeatureGate $gate;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		FreemiusInit::reset();

		$this->registry = new ModuleRegistry();
		$this->gate     = new FeatureGate( $this->registry );
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	// ─── Plan Detection (SDK unavailable = free) ────────────

	public function test_isFree_true_wenn_sdk_nicht_verfuegbar(): void {
		$this->assertTrue( $this->gate->isFree() );
	}

	public function test_isPremium_false_wenn_sdk_nicht_verfuegbar(): void {
		$this->assertFalse( $this->gate->isPremium() );
	}

	public function test_isTrial_false_wenn_sdk_nicht_verfuegbar(): void {
		$this->assertFalse( $this->gate->isTrial() );
	}

	// ─── Module Gating ──────────────────────────────────────

	public function test_canUseModule_true_fuer_free_modul(): void {
		$module = $this->createModuleMock( 'calc', 'free' );
		$this->registry->register( $module );

		$this->assertTrue( $this->gate->canUseModule( 'calc' ) );
	}

	public function test_canUseModule_false_fuer_pro_modul_ohne_premium(): void {
		$module = $this->createModuleMock( 'pro-calc', 'pro' );
		$this->registry->register( $module );

		// SDK not available → always free.
		$this->assertFalse( $this->gate->canUseModule( 'pro-calc' ) );
	}

	public function test_canUseModule_false_fuer_paid_modul(): void {
		$module = $this->createModuleMock( 'addon', 'paid' );
		$this->registry->register( $module );

		$this->assertFalse( $this->gate->canUseModule( 'addon' ) );
	}

	public function test_canUseModule_false_fuer_unbekanntes_modul(): void {
		$this->assertFalse( $this->gate->canUseModule( 'nonexistent' ) );
	}

	// ─── Module Activation Limits ───────────────────────────

	public function test_canActivateModule_respektiert_free_limit(): void {
		// Register 3 free modules, activate 2.
		$this->registry->register( $this->createModuleMock( 'a', 'free', true ) );
		$this->registry->register( $this->createModuleMock( 'b', 'free', true ) );
		$this->registry->register( $this->createModuleMock( 'c', 'free', false ) );

		// Module c cannot be activated (limit = 2, already 2 active).
		$this->assertFalse( $this->gate->canActivateModule( 'c' ) );
	}

	public function test_canActivateModule_erlaubt_bereits_aktives_modul(): void {
		$this->registry->register( $this->createModuleMock( 'a', 'free', true ) );
		$this->registry->register( $this->createModuleMock( 'b', 'free', true ) );

		// Module a is already active → toggling should work.
		$this->assertTrue( $this->gate->canActivateModule( 'a' ) );
	}

	public function test_canActivateModule_erlaubt_unter_limit(): void {
		$this->registry->register( $this->createModuleMock( 'a', 'free', true ) );
		$this->registry->register( $this->createModuleMock( 'b', 'free', false ) );

		// Only 1 active, limit is 2 → ok.
		$this->assertTrue( $this->gate->canActivateModule( 'b' ) );
	}

	// ─── Feature Limits ─────────────────────────────────────

	public function test_canAddLocation_respektiert_free_limit(): void {
		$this->assertTrue( $this->gate->canAddLocation( 0 ) );
		$this->assertFalse( $this->gate->canAddLocation( 1 ) );
	}

	public function test_getLeadLimit_ist_50_fuer_free(): void {
		$this->assertSame( 50, $this->gate->getLeadLimit() );
	}

	public function test_premium_features_gesperrt_im_free_modus(): void {
		$this->assertFalse( $this->gate->canExportLeads() );
		$this->assertFalse( $this->gate->canUsePdfDesigner() );
		$this->assertFalse( $this->gate->canUseSmtp() );
		$this->assertFalse( $this->gate->canRemoveBranding() );
		$this->assertFalse( $this->gate->canUseWebhooks() );
	}

	// ─── toArray ────────────────────────────────────────────

	public function test_toArray_enthaelt_alle_gates(): void {
		$data = $this->gate->toArray();

		$this->assertSame( 'free', $data['plan'] );
		$this->assertFalse( $data['is_trial'] );
		$this->assertSame( FeatureGate::FREE_MAX_MODULES, $data['max_modules'] );
		$this->assertSame( FeatureGate::FREE_MAX_LOCATIONS, $data['max_locations'] );
		$this->assertSame( FeatureGate::FREE_MAX_LEADS, $data['max_leads'] );
		$this->assertFalse( $data['can_export_leads'] );
		$this->assertFalse( $data['can_use_pdf_designer'] );
		$this->assertFalse( $data['can_use_smtp'] );
		$this->assertFalse( $data['can_remove_branding'] );
		$this->assertFalse( $data['can_use_webhooks'] );
	}

	// ─── Helpers ────────────────────────────────────────────

	private function createModuleMock( string $slug, string $flag, bool $active = false ): ModuleInterface {
		$mock = Mockery::mock( ModuleInterface::class );
		$mock->shouldReceive( 'getSlug' )->andReturn( $slug );
		$mock->shouldReceive( 'getFlag' )->andReturn( $flag );
		$mock->shouldReceive( 'isActive' )->andReturn( $active );

		return $mock;
	}
}
