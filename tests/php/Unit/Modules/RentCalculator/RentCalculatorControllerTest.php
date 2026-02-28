<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Modules\RentCalculator;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;
use Resa\Modules\RentCalculator\RentCalculatorController;
use Resa\Modules\RentCalculator\RentCalculatorService;

/**
 * Tests for RentCalculatorController.
 *
 * Focuses on getCalculationData() behavior:
 * - Pauschalmodus (uses preset factors)
 * - Individuell-Modus (uses custom factors)
 * - Location-specific overrides
 * - Fallback to region_type
 *
 * Uses Reflection to test the private getCalculationData() method directly,
 * avoiding the need to mock internal PHP functions like gmdate().
 */
class RentCalculatorControllerTest extends TestCase {

	use MockeryPHPUnitIntegration;

	private RentCalculatorController $controller;
	private ReflectionMethod $getCalculationDataMethod;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		$this->controller = new RentCalculatorController();

		// Make getCalculationData() accessible for testing.
		$this->getCalculationDataMethod = new ReflectionMethod( RentCalculatorController::class, 'getCalculationData' );
		$this->getCalculationDataMethod->setAccessible( true );

		// Mock common WordPress functions.
		Functions\when( '__' )->returnArg( 1 );
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Invoke the private getCalculationData() method.
	 *
	 * @param int $locationId Location ID.
	 * @return array<string,mixed> Calculation parameters.
	 */
	private function invokeGetCalculationData( int $locationId ): array {
		return $this->getCalculationDataMethod->invoke( $this->controller, $locationId );
	}

	// ========================================================================
	// Pauschalmodus Tests
	// ========================================================================

	public function test_pauschal_mode_uses_rural_preset(): void {
		// No ModuleSettings (null) → falls back to Location's region_type.
		$this->mockModuleSettings( null );

		// Location with region_type = rural.
		$this->mockLocation( 1, [
			'id'          => 1,
			'slug'        => 'rural-area',
			'name'        => 'Rural Area',
			'region_type' => 'rural',
		] );

		$data = $this->invokeGetCalculationData( 1 );

		// Rural preset has base_price = 5.50.
		$this->assertEquals( 5.50, $data['base_price'] );
		$this->assertArrayHasKey( 'location_ratings', $data );
		$this->assertArrayHasKey( 'condition_multipliers', $data );
	}

	public function test_pauschal_mode_uses_small_town_preset(): void {
		$this->mockModuleSettings( null );
		$this->mockLocation( 1, [ 'region_type' => 'small_town' ] );

		$data = $this->invokeGetCalculationData( 1 );

		$this->assertEquals( 7.50, $data['base_price'] );
	}

	public function test_pauschal_mode_uses_medium_city_preset(): void {
		$this->mockModuleSettings( null );
		$this->mockLocation( 1, [ 'region_type' => 'medium_city' ] );

		$data = $this->invokeGetCalculationData( 1 );

		$this->assertEquals( 9.50, $data['base_price'] );
	}

	public function test_pauschal_mode_uses_large_city_preset(): void {
		$this->mockModuleSettings( null );
		$this->mockLocation( 1, [ 'region_type' => 'large_city' ] );

		$data = $this->invokeGetCalculationData( 1 );

		$this->assertEquals( 14.00, $data['base_price'] );
	}

	// ========================================================================
	// Individuell-Modus Tests
	// ========================================================================

	public function test_individuell_mode_uses_custom_factors(): void {
		$customFactors = [
			'base_price'            => 12.00,
			'size_degression'       => 0.18,
			'location_ratings'      => [ '1' => 0.80, '2' => 0.90, '3' => 1.00, '4' => 1.15, '5' => 1.30 ],
			'condition_multipliers' => [ 'new' => 1.30, 'renovated' => 1.15, 'good' => 1.00, 'needs_renovation' => 0.75 ],
			'type_multipliers'      => [ 'apartment' => 1.00, 'house' => 1.20 ],
		];

		$this->mockModuleSettings( [
			'setup_mode' => 'individuell',
			'factors'    => $customFactors,
		] );

		// Location mock needed for fallback (but shouldn't be used).
		$this->mockLocation( 1, [ 'region_type' => 'medium_city' ] );

		$data = $this->invokeGetCalculationData( 1 );

		$this->assertEquals( 12.00, $data['base_price'] );
		$this->assertEquals( 0.18, $data['size_degression'] );
		$this->assertEquals( 1.30, $data['condition_multipliers']['new'] );
		$this->assertEquals( 1.20, $data['type_multipliers']['house'] );
	}

	public function test_individuell_mode_with_partial_factors(): void {
		// Only base_price and condition_multipliers set.
		$customFactors = [
			'base_price'            => 11.00,
			'condition_multipliers' => [ 'new' => 1.40, 'renovated' => 1.20, 'good' => 1.00, 'needs_renovation' => 0.70 ],
		];

		$this->mockModuleSettings( [
			'setup_mode' => 'individuell',
			'factors'    => $customFactors,
		] );

		$this->mockLocation( 1, [ 'region_type' => 'medium_city' ] );

		$data = $this->invokeGetCalculationData( 1 );

		$this->assertEquals( 11.00, $data['base_price'] );
		$this->assertEquals( 1.40, $data['condition_multipliers']['new'] );
	}

	// ========================================================================
	// Location-Specific Override Tests
	// ========================================================================

	public function test_location_base_price_override(): void {
		$globalFactors = [
			'base_price'            => 9.50,
			'location_ratings'      => [ '1' => 0.85, '3' => 1.00, '5' => 1.25 ],
			'condition_multipliers' => [ 'good' => 1.00 ],
		];

		// Location 1 has override base_price = 15.00.
		$this->mockModuleSettings( [
			'setup_mode'      => 'individuell',
			'factors'         => $globalFactors,
			'location_values' => [
				'1' => [ 'base_price' => 15.00 ],
			],
		] );

		$this->mockLocation( 1, [ 'region_type' => 'medium_city' ] );

		$data = $this->invokeGetCalculationData( 1 );

		// Should use location-specific base_price = 15.00.
		$this->assertEquals( 15.00, $data['base_price'] );
	}

	public function test_location_without_override_uses_global_base_price(): void {
		$globalFactors = [
			'base_price'            => 9.50,
			'location_ratings'      => [ '1' => 0.85, '3' => 1.00, '5' => 1.25 ],
			'condition_multipliers' => [ 'good' => 1.00 ],
		];

		// Only Location 1 has override, Location 2 does not.
		$this->mockModuleSettings( [
			'setup_mode'      => 'individuell',
			'factors'         => $globalFactors,
			'location_values' => [
				'1' => [ 'base_price' => 15.00 ],
			],
		] );

		$this->mockLocation( 2, [ 'region_type' => 'medium_city' ] );

		$data = $this->invokeGetCalculationData( 2 );

		// Should use global base_price = 9.50.
		$this->assertEquals( 9.50, $data['base_price'] );
	}

	public function test_location_override_with_zero_base_price_uses_global(): void {
		$globalFactors = [
			'base_price'            => 10.00,
			'location_ratings'      => [ '3' => 1.00 ],
			'condition_multipliers' => [ 'good' => 1.00 ],
		];

		// Location 1 has base_price = 0 (should use global).
		$this->mockModuleSettings( [
			'setup_mode'      => 'individuell',
			'factors'         => $globalFactors,
			'location_values' => [
				'1' => [ 'base_price' => 0 ],
			],
		] );

		$this->mockLocation( 1, [ 'region_type' => 'medium_city' ] );

		$data = $this->invokeGetCalculationData( 1 );

		// base_price = 0 is treated as "not set", so global is used.
		$this->assertEquals( 10.00, $data['base_price'] );
	}

	public function test_multiple_locations_different_overrides(): void {
		$globalFactors = [
			'base_price'            => 8.00,
			'location_ratings'      => [ '3' => 1.00 ],
			'condition_multipliers' => [ 'good' => 1.00 ],
		];

		$this->mockModuleSettings( [
			'setup_mode'      => 'individuell',
			'factors'         => $globalFactors,
			'location_values' => [
				'1' => [ 'base_price' => 12.00 ],
				'2' => [ 'base_price' => 18.00 ],
				'3' => [ 'base_price' => 6.00 ],
			],
		] );

		// Test Location 1.
		$this->mockLocation( 1, [ 'region_type' => 'small_town' ] );
		$data1 = $this->invokeGetCalculationData( 1 );
		$this->assertEquals( 12.00, $data1['base_price'] );

		// Test Location 2.
		$this->mockLocation( 2, [ 'region_type' => 'large_city' ] );
		$data2 = $this->invokeGetCalculationData( 2 );
		$this->assertEquals( 18.00, $data2['base_price'] );

		// Test Location 3.
		$this->mockLocation( 3, [ 'region_type' => 'rural' ] );
		$data3 = $this->invokeGetCalculationData( 3 );
		$this->assertEquals( 6.00, $data3['base_price'] );
	}

	// ========================================================================
	// Fallback to Region Type Tests
	// ========================================================================

	public function test_fallback_to_location_region_type_when_no_settings(): void {
		// No ModuleSettings exist.
		$this->mockModuleSettings( null );

		// Location has region_type = large_city.
		$this->mockLocation( 1, [ 'region_type' => 'large_city' ] );

		$data = $this->invokeGetCalculationData( 1 );

		// Should use large_city preset base_price = 14.00.
		$this->assertEquals( 14.00, $data['base_price'] );
	}

	public function test_fallback_to_medium_city_when_no_region_type(): void {
		// No ModuleSettings.
		$this->mockModuleSettings( null );

		// Location without region_type (null).
		$this->mockLocation( 1, [ 'region_type' => null ] );

		$data = $this->invokeGetCalculationData( 1 );

		// Should fallback to medium_city preset base_price = 9.50.
		$this->assertEquals( 9.50, $data['base_price'] );
	}

	public function test_fallback_to_medium_city_when_empty_factors(): void {
		// ModuleSettings with empty factors.
		$this->mockModuleSettings( [
			'setup_mode' => 'individuell',
			'factors'    => [],
		] );

		$this->mockLocation( 1, [ 'region_type' => 'large_city' ] );

		$data = $this->invokeGetCalculationData( 1 );

		// Empty factors → falls back to location's region_type preset.
		$this->assertEquals( 14.00, $data['base_price'] );
	}

	public function test_fallback_to_medium_city_when_null_factors(): void {
		// ModuleSettings with null factors.
		$this->mockModuleSettings( [
			'setup_mode' => 'pauschal',
			'factors'    => null,
		] );

		$this->mockLocation( 1, [ 'region_type' => 'small_town' ] );

		$data = $this->invokeGetCalculationData( 1 );

		// Null factors → falls back to location's region_type preset.
		$this->assertEquals( 7.50, $data['base_price'] );
	}

	// ========================================================================
	// Preset Structure Verification
	// ========================================================================

	/**
	 * @dataProvider presetDataProvider
	 */
	public function test_preset_contains_all_required_keys( string $regionType, float $expectedBasePrice ): void {
		$this->mockModuleSettings( null );
		$this->mockLocation( 1, [ 'region_type' => $regionType ] );

		$data = $this->invokeGetCalculationData( 1 );

		// Verify all required keys are present.
		$this->assertArrayHasKey( 'base_price', $data );
		$this->assertArrayHasKey( 'size_degression', $data );
		$this->assertArrayHasKey( 'location_ratings', $data );
		$this->assertArrayHasKey( 'condition_multipliers', $data );
		$this->assertArrayHasKey( 'type_multipliers', $data );
		$this->assertArrayHasKey( 'feature_premiums', $data );
		$this->assertArrayHasKey( 'age_multipliers', $data );

		// Verify correct base_price.
		$this->assertEquals( $expectedBasePrice, $data['base_price'] );
	}

	/**
	 * @return array<string, array{string, float}>
	 */
	public static function presetDataProvider(): array {
		return [
			'rural'       => [ 'rural', 5.50 ],
			'small_town'  => [ 'small_town', 7.50 ],
			'medium_city' => [ 'medium_city', 9.50 ],
			'large_city'  => [ 'large_city', 14.00 ],
		];
	}

	// ========================================================================
	// Helper Methods
	// ========================================================================

	/**
	 * Mock ModuleSettings::getBySlug() response.
	 *
	 * @param array<string,mixed>|null $settings Settings or null if not found.
	 */
	private function mockModuleSettings( ?array $settings ): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )
			->with( Mockery::pattern( '/SELECT.*FROM.*resa_module_settings.*WHERE.*module_slug/' ), 'rent-calculator' )
			->andReturn( 'SELECT * FROM wp_resa_module_settings WHERE module_slug = "rent-calculator"' );

		if ( $settings === null ) {
			$wpdb->shouldReceive( 'get_row' )
				->with( 'SELECT * FROM wp_resa_module_settings WHERE module_slug = "rent-calculator"' )
				->andReturn( null );
		} else {
			$row = (object) [
				'id'              => 1,
				'module_slug'     => 'rent-calculator',
				'setup_mode'      => $settings['setup_mode'] ?? 'pauschal',
				'region_preset'   => $settings['region_preset'] ?? 'medium_city',
				'factors'         => isset( $settings['factors'] ) ? json_encode( $settings['factors'] ) : null,
				'location_values' => isset( $settings['location_values'] ) ? json_encode( $settings['location_values'] ) : '{}',
				'created_at'      => '2025-01-01 00:00:00',
				'updated_at'      => '2025-01-01 00:00:00',
			];

			$wpdb->shouldReceive( 'get_row' )
				->with( 'SELECT * FROM wp_resa_module_settings WHERE module_slug = "rent-calculator"' )
				->andReturn( $row );
		}
	}

	/**
	 * Mock Location::findById() response.
	 *
	 * @param int                 $locationId Location ID.
	 * @param array<string,mixed> $data       Location data overrides.
	 */
	private function mockLocation( int $locationId, array $data = [] ): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )
			->with( Mockery::pattern( '/SELECT.*FROM.*resa_locations.*WHERE.*id/' ), $locationId )
			->andReturn( "SELECT * FROM wp_resa_locations WHERE id = {$locationId} LIMIT 1" );

		$row = (object) array_merge(
			[
				'id'          => $locationId,
				'slug'        => 'test-location',
				'name'        => 'Test Location',
				'country'     => 'DE',
				'bundesland'  => '',
				'region_type' => 'medium_city',
				'currency'    => 'EUR',
				'data'        => '{}',
				'factors'     => null,
				'agent_id'    => null,
				'is_active'   => 1,
				'created_at'  => '2025-01-01 00:00:00',
				'updated_at'  => '2025-01-01 00:00:00',
			],
			$data
		);

		$wpdb->shouldReceive( 'get_row' )
			->with( "SELECT * FROM wp_resa_locations WHERE id = {$locationId} LIMIT 1" )
			->andReturn( $row );
	}
}
