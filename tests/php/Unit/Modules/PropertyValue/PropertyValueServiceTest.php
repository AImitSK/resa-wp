<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Modules\PropertyValue;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Modules\PropertyValue\PropertyValueService;

class PropertyValueServiceTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		// Mock WordPress translation functions for getRegionPresets().
		Functions\stubTranslationFunctions();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Standard Mittelstadt location data for testing.
	 *
	 * @return array<string,mixed>
	 */
	private function mittelstadtData(): array {
		return [
			'base_price'            => 3200,
			'plot_price_per_sqm'    => 180,
			'size_degression'       => 0.18,
			'type_multipliers'      => [ 'house' => 1.00, 'apartment' => 0.95 ],
			'subtype_multipliers'   => [
				'efh' => 1.00, 'rh' => 0.90, 'dhh' => 0.95, 'zfh' => 1.05, 'mfh' => 1.10,
				'eg' => 0.95, 'etage' => 1.00, 'dg' => 0.98, 'maisonette' => 1.05, 'penthouse' => 1.20,
			],
			'condition_multipliers' => [ 'new' => 1.25, 'renovated' => 1.10, 'good' => 1.00, 'needs_renovation' => 0.75 ],
			'quality_multipliers'   => [ 'premium' => 1.25, 'normal' => 1.00, 'basic' => 0.80 ],
			'rental_discount'       => [ 'owner_occupied' => 1.00, 'rented' => 0.92, 'vacant' => 1.00 ],
			'location_ratings'      => [ '1' => 0.80, '2' => 0.92, '3' => 1.00, '4' => 1.12, '5' => 1.30 ],
			'age_multipliers'       => [ 'before_1946' => 1.05, '1946_1959' => 0.90, '1960_1979' => 0.85, '1980_1989' => 0.92, '1990_1999' => 1.00, '2000_2014' => 1.08, '2015_plus' => 1.15 ],
			'feature_premiums'      => [ 'balcony' => 15, 'terrace' => 25, 'garden' => 30, 'elevator' => 10, 'parking' => 12, 'garage' => 20, 'cellar' => 8, 'fitted_kitchen' => 15, 'floor_heating' => 18, 'guest_toilet' => 8, 'barrier_free' => 10, 'solar' => 20 ],
		];
	}

	// ========================================================================
	// Happy Path
	// ========================================================================

	public function test_calculate_happy_path(): void {
		$result = PropertyValueService::calculate(
			[
				'size'              => 100,
				'property_type'     => 'house',
				'property_subtype'  => 'efh',
				'condition'         => 'good',
				'quality'           => 'normal',
				'rental_status'     => 'owner_occupied',
				'location_rating'   => 3,
				'features'          => [],
				'year_built'        => null,
			],
			$this->mittelstadtData()
		);

		// 100m², size_factor = (100/100)^0.18 = 1.0
		// preis = 3200 * 1.0 * 1.0 (house) * 1.0 (efh) * 1.0 (good) * 1.0 (no age)
		//         * 1.0 (normal) * 1.0 (lage 3) * 1.0 (owner) + 0 features = 3200
		// estimated_value = 100 * 3200 = 320000
		$this->assertEquals( 3200.00, $result['price_per_sqm'] );
		$this->assertEquals( 320000.00, $result['estimated_value']['estimate'] );
		$this->assertNull( $result['plot_value'] ); // No plot_size given.

		// Range ±12%.
		$this->assertEquals( round( 320000.00 * 0.88, 2 ), $result['estimated_value']['low'] );
		$this->assertEquals( round( 320000.00 * 1.12, 2 ), $result['estimated_value']['high'] );
	}

	// ========================================================================
	// Size Degression
	// ========================================================================

	public function test_size_degression_small_property(): void {
		$result = PropertyValueService::calculate(
			[
				'size'              => 50,
				'property_type'     => 'house',
				'property_subtype'  => 'efh',
				'condition'         => 'good',
				'quality'           => 'normal',
				'rental_status'     => 'owner_occupied',
				'location_rating'   => 3,
				'features'          => [],
			],
			$this->mittelstadtData()
		);

		// size_factor = (100/50)^0.18 = 2^0.18 > 1
		$this->assertGreaterThan( 3200.00, $result['price_per_sqm'] );
	}

	public function test_size_degression_large_property(): void {
		$result = PropertyValueService::calculate(
			[
				'size'              => 200,
				'property_type'     => 'house',
				'property_subtype'  => 'efh',
				'condition'         => 'good',
				'quality'           => 'normal',
				'rental_status'     => 'owner_occupied',
				'location_rating'   => 3,
				'features'          => [],
			],
			$this->mittelstadtData()
		);

		// size_factor = (100/200)^0.18 = 0.5^0.18 < 1
		$this->assertLessThan( 3200.00, $result['price_per_sqm'] );
	}

	// ========================================================================
	// Individual Multiplier Factors
	// ========================================================================

	public function test_type_multiplier(): void {
		$base = [
			'size' => 100, 'property_subtype' => 'etage', 'condition' => 'good',
			'quality' => 'normal', 'rental_status' => 'owner_occupied',
			'location_rating' => 3, 'features' => [],
		];

		$resultHouse = PropertyValueService::calculate(
			array_merge( $base, [ 'property_type' => 'house' ] ),
			$this->mittelstadtData()
		);
		$resultApartment = PropertyValueService::calculate(
			array_merge( $base, [ 'property_type' => 'apartment' ] ),
			$this->mittelstadtData()
		);

		$this->assertEquals( 1.00, $resultHouse['factors']['type_impact'] );
		$this->assertEquals( 0.95, $resultApartment['factors']['type_impact'] );
		$this->assertGreaterThan( $resultApartment['price_per_sqm'], $resultHouse['price_per_sqm'] );
	}

	public function test_subtype_multiplier(): void {
		$base = [
			'size' => 100, 'property_type' => 'house', 'condition' => 'good',
			'quality' => 'normal', 'rental_status' => 'owner_occupied',
			'location_rating' => 3, 'features' => [],
		];

		$resultEfh = PropertyValueService::calculate(
			array_merge( $base, [ 'property_subtype' => 'efh' ] ),
			$this->mittelstadtData()
		);
		$resultRh = PropertyValueService::calculate(
			array_merge( $base, [ 'property_subtype' => 'rh' ] ),
			$this->mittelstadtData()
		);

		$this->assertEquals( 1.00, $resultEfh['factors']['subtype_impact'] );
		$this->assertEquals( 0.90, $resultRh['factors']['subtype_impact'] );
		$this->assertEquals( round( 3200 * 0.90, 2 ), $resultRh['price_per_sqm'] );
	}

	public function test_condition_multiplier(): void {
		$base = [
			'size' => 100, 'property_type' => 'house', 'property_subtype' => 'efh',
			'quality' => 'normal', 'rental_status' => 'owner_occupied',
			'location_rating' => 3, 'features' => [],
		];

		$resultNew = PropertyValueService::calculate(
			array_merge( $base, [ 'condition' => 'new' ] ),
			$this->mittelstadtData()
		);
		$resultReno = PropertyValueService::calculate(
			array_merge( $base, [ 'condition' => 'needs_renovation' ] ),
			$this->mittelstadtData()
		);

		$this->assertEquals( round( 3200 * 1.25, 2 ), $resultNew['price_per_sqm'] );
		$this->assertEquals( round( 3200 * 0.75, 2 ), $resultReno['price_per_sqm'] );
	}

	public function test_quality_multiplier(): void {
		$base = [
			'size' => 100, 'property_type' => 'house', 'property_subtype' => 'efh',
			'condition' => 'good', 'rental_status' => 'owner_occupied',
			'location_rating' => 3, 'features' => [],
		];

		$resultPremium = PropertyValueService::calculate(
			array_merge( $base, [ 'quality' => 'premium' ] ),
			$this->mittelstadtData()
		);
		$resultBasic = PropertyValueService::calculate(
			array_merge( $base, [ 'quality' => 'basic' ] ),
			$this->mittelstadtData()
		);

		$this->assertEquals( 1.25, $resultPremium['factors']['quality_impact'] );
		$this->assertEquals( 0.80, $resultBasic['factors']['quality_impact'] );
		$this->assertEquals( round( 3200 * 1.25, 2 ), $resultPremium['price_per_sqm'] );
		$this->assertEquals( round( 3200 * 0.80, 2 ), $resultBasic['price_per_sqm'] );
	}

	public function test_rental_status_multiplier(): void {
		$base = [
			'size' => 100, 'property_type' => 'house', 'property_subtype' => 'efh',
			'condition' => 'good', 'quality' => 'normal',
			'location_rating' => 3, 'features' => [],
		];

		$resultOwner = PropertyValueService::calculate(
			array_merge( $base, [ 'rental_status' => 'owner_occupied' ] ),
			$this->mittelstadtData()
		);
		$resultRented = PropertyValueService::calculate(
			array_merge( $base, [ 'rental_status' => 'rented' ] ),
			$this->mittelstadtData()
		);

		$this->assertEquals( 1.00, $resultOwner['factors']['rental_impact'] );
		$this->assertEquals( 0.92, $resultRented['factors']['rental_impact'] );
		$this->assertEquals( round( 3200 * 0.92, 2 ), $resultRented['price_per_sqm'] );
	}

	public function test_location_rating_multiplier(): void {
		$base = [
			'size' => 100, 'property_type' => 'house', 'property_subtype' => 'efh',
			'condition' => 'good', 'quality' => 'normal', 'rental_status' => 'owner_occupied',
			'features' => [],
		];

		$resultLow = PropertyValueService::calculate(
			array_merge( $base, [ 'location_rating' => 1 ] ),
			$this->mittelstadtData()
		);
		$resultHigh = PropertyValueService::calculate(
			array_merge( $base, [ 'location_rating' => 5 ] ),
			$this->mittelstadtData()
		);

		$this->assertEquals( round( 3200 * 0.80, 2 ), $resultLow['price_per_sqm'] );
		$this->assertEquals( round( 3200 * 1.30, 2 ), $resultHigh['price_per_sqm'] );
	}

	public function test_age_multiplier(): void {
		$base = [
			'size' => 100, 'property_type' => 'house', 'property_subtype' => 'efh',
			'condition' => 'good', 'quality' => 'normal', 'rental_status' => 'owner_occupied',
			'location_rating' => 3, 'features' => [],
		];

		$resultOld = PropertyValueService::calculate(
			array_merge( $base, [ 'year_built' => 1930 ] ),
			$this->mittelstadtData()
		);
		$resultNew = PropertyValueService::calculate(
			array_merge( $base, [ 'year_built' => 2020 ] ),
			$this->mittelstadtData()
		);

		// 1930: before_1946 → 1.05, 2020: 2015_plus → 1.15
		$this->assertEquals( round( 3200 * 1.05, 2 ), $resultOld['price_per_sqm'] );
		$this->assertEquals( round( 3200 * 1.15, 2 ), $resultNew['price_per_sqm'] );
	}

	// ========================================================================
	// Plot Value
	// ========================================================================

	public function test_plot_value_for_house(): void {
		$result = PropertyValueService::calculate(
			[
				'size'              => 100,
				'property_type'     => 'house',
				'property_subtype'  => 'efh',
				'condition'         => 'good',
				'quality'           => 'normal',
				'rental_status'     => 'owner_occupied',
				'location_rating'   => 3,
				'features'          => [],
				'plot_size'         => 500,
			],
			$this->mittelstadtData()
		);

		// plot_value = 500 * 180 = 90000
		$this->assertEquals( 90000.00, $result['plot_value'] );
		// estimated_value = 100 * 3200 + 90000 = 410000
		$this->assertEquals( 410000.00, $result['estimated_value']['estimate'] );
	}

	public function test_plot_value_null_for_apartment(): void {
		$result = PropertyValueService::calculate(
			[
				'size'              => 100,
				'property_type'     => 'apartment',
				'property_subtype'  => 'etage',
				'condition'         => 'good',
				'quality'           => 'normal',
				'rental_status'     => 'owner_occupied',
				'location_rating'   => 3,
				'features'          => [],
				'plot_size'         => 500, // Should be ignored for apartments.
			],
			$this->mittelstadtData()
		);

		$this->assertNull( $result['plot_value'] );
	}

	// ========================================================================
	// Feature Premiums
	// ========================================================================

	public function test_feature_premium_addition(): void {
		$resultNoFeatures = PropertyValueService::calculate(
			[
				'size' => 100, 'property_type' => 'house', 'property_subtype' => 'efh',
				'condition' => 'good', 'quality' => 'normal', 'rental_status' => 'owner_occupied',
				'location_rating' => 3, 'features' => [],
			],
			$this->mittelstadtData()
		);

		$resultWithFeatures = PropertyValueService::calculate(
			[
				'size' => 100, 'property_type' => 'house', 'property_subtype' => 'efh',
				'condition' => 'good', 'quality' => 'normal', 'rental_status' => 'owner_occupied',
				'location_rating' => 3, 'features' => [ 'balcony', 'fitted_kitchen' ],
			],
			$this->mittelstadtData()
		);

		// balcony (15) + fitted_kitchen (15) = 30 EUR/m²
		$diff = $resultWithFeatures['price_per_sqm'] - $resultNoFeatures['price_per_sqm'];
		$this->assertEquals( 30.00, $diff );
	}

	public function test_solar_feature_premium(): void {
		$resultNoSolar = PropertyValueService::calculate(
			[
				'size' => 100, 'property_type' => 'house', 'property_subtype' => 'efh',
				'condition' => 'good', 'quality' => 'normal', 'rental_status' => 'owner_occupied',
				'location_rating' => 3, 'features' => [],
			],
			$this->mittelstadtData()
		);

		$resultWithSolar = PropertyValueService::calculate(
			[
				'size' => 100, 'property_type' => 'house', 'property_subtype' => 'efh',
				'condition' => 'good', 'quality' => 'normal', 'rental_status' => 'owner_occupied',
				'location_rating' => 3, 'features' => [ 'solar' ],
			],
			$this->mittelstadtData()
		);

		// solar = 20 EUR/m²
		$diff = $resultWithSolar['price_per_sqm'] - $resultNoSolar['price_per_sqm'];
		$this->assertEquals( 20.00, $diff );
		$this->assertEquals( 20.00, $resultWithSolar['factors']['feature_premium'] );
	}

	// ========================================================================
	// Range ±12%
	// ========================================================================

	public function test_range_plus_minus_12_percent(): void {
		$result = PropertyValueService::calculate(
			[
				'size' => 100, 'property_type' => 'house', 'property_subtype' => 'efh',
				'condition' => 'good', 'quality' => 'normal', 'rental_status' => 'owner_occupied',
				'location_rating' => 3, 'features' => [],
			],
			$this->mittelstadtData()
		);

		$estimate = $result['estimated_value']['estimate'];
		$this->assertEquals( round( $estimate * 0.88, 2 ), $result['estimated_value']['low'] );
		$this->assertEquals( round( $estimate * 1.12, 2 ), $result['estimated_value']['high'] );
	}

	// ========================================================================
	// Market Position
	// ========================================================================

	/**
	 * @dataProvider marketPositionProvider
	 */
	public function test_market_position_percentiles( float $pricePerSqm, float $basePrice, int $expectedPercentile ): void {
		$result = PropertyValueService::getMarketPosition( $pricePerSqm, $basePrice );
		$this->assertEquals( $expectedPercentile, $result['percentile'] );
	}

	/**
	 * @return array<string, array{float, float, int}>
	 */
	public static function marketPositionProvider(): array {
		return [
			'under 0.85 ratio'  => [ 2200.0, 3200.0, 20 ],   // 0.6875
			'0.85-0.95 ratio'   => [ 2900.0, 3200.0, 35 ],   // 0.9063
			'0.95-1.05 ratio'   => [ 3200.0, 3200.0, 50 ],   // 1.00
			'1.05-1.15 ratio'   => [ 3500.0, 3200.0, 65 ],   // 1.09375
			'1.15-1.25 ratio'   => [ 3800.0, 3200.0, 80 ],   // 1.1875
			'over 1.25 ratio'   => [ 4200.0, 3200.0, 90 ],   // 1.3125
		];
	}

	public function test_market_position_labels(): void {
		$result20 = PropertyValueService::getMarketPosition( 2200.0, 3200.0 );
		$result50 = PropertyValueService::getMarketPosition( 3200.0, 3200.0 );
		$result90 = PropertyValueService::getMarketPosition( 4200.0, 3200.0 );

		$this->assertEquals( 'Unterdurchschnittlich', $result20['label'] );
		$this->assertEquals( 'Durchschnittlich', $result50['label'] );
		$this->assertEquals( 'Premium-Segment', $result90['label'] );
	}

	public function test_market_position_zero_base_price(): void {
		$result = PropertyValueService::getMarketPosition( 3200.0, 0.0 );
		$this->assertEquals( 50, $result['percentile'] );
	}

	// ========================================================================
	// Region Presets
	// ========================================================================

	public function test_region_presets_are_available(): void {
		$presets = PropertyValueService::getRegionPresets();

		$this->assertCount( 4, $presets );
		$this->assertArrayHasKey( 'rural', $presets );
		$this->assertArrayHasKey( 'small_town', $presets );
		$this->assertArrayHasKey( 'medium_city', $presets );
		$this->assertArrayHasKey( 'large_city', $presets );

		foreach ( $presets as $preset ) {
			$this->assertArrayHasKey( 'base_price', $preset );
			$this->assertArrayHasKey( 'plot_price_per_sqm', $preset );
			$this->assertArrayHasKey( 'type_multipliers', $preset );
			$this->assertArrayHasKey( 'subtype_multipliers', $preset );
			$this->assertArrayHasKey( 'condition_multipliers', $preset );
			$this->assertArrayHasKey( 'quality_multipliers', $preset );
			$this->assertArrayHasKey( 'rental_discount', $preset );
			$this->assertArrayHasKey( 'location_ratings', $preset );
			$this->assertArrayHasKey( 'age_multipliers', $preset );
			$this->assertArrayHasKey( 'feature_premiums', $preset );
		}
	}

	/**
	 * @dataProvider regionPresetProvider
	 */
	public function test_each_preset_base_price( string $preset, int $expectedBasePrice ): void {
		$presets = PropertyValueService::getRegionPresets();

		$this->assertArrayHasKey( $preset, $presets, "Preset '{$preset}' should exist" );
		$this->assertEquals(
			$expectedBasePrice,
			$presets[ $preset ]['base_price'],
			"Preset '{$preset}' should have base_price {$expectedBasePrice}"
		);
	}

	/**
	 * @return array<string, array{string, int}>
	 */
	public static function regionPresetProvider(): array {
		return [
			'rural'       => [ 'rural', 1800 ],
			'small_town'  => [ 'small_town', 2500 ],
			'medium_city' => [ 'medium_city', 3200 ],
			'large_city'  => [ 'large_city', 4500 ],
		];
	}

	/**
	 * @dataProvider regionPresetProvider
	 */
	public function test_preset_has_all_required_fields( string $preset ): void {
		$presets    = PropertyValueService::getRegionPresets();
		$presetData = $presets[ $preset ];

		$this->assertArrayHasKey( 'label', $presetData );
		$this->assertArrayHasKey( 'base_price', $presetData );
		$this->assertArrayHasKey( 'size_degression', $presetData );
		$this->assertArrayHasKey( 'type_multipliers', $presetData );
		$this->assertArrayHasKey( 'subtype_multipliers', $presetData );
		$this->assertArrayHasKey( 'condition_multipliers', $presetData );
		$this->assertArrayHasKey( 'quality_multipliers', $presetData );
		$this->assertArrayHasKey( 'rental_discount', $presetData );
		$this->assertArrayHasKey( 'location_ratings', $presetData );
		$this->assertArrayHasKey( 'age_multipliers', $presetData );
		$this->assertArrayHasKey( 'feature_premiums', $presetData );

		// Verify structure of nested arrays.
		$this->assertCount( 5, $presetData['location_ratings'] );
		$this->assertCount( 4, $presetData['condition_multipliers'] );
		$this->assertCount( 2, $presetData['type_multipliers'] );
		$this->assertCount( 10, $presetData['subtype_multipliers'] );
		$this->assertCount( 3, $presetData['quality_multipliers'] );
		$this->assertCount( 3, $presetData['rental_discount'] );
		$this->assertCount( 12, $presetData['feature_premiums'] );
		$this->assertCount( 7, $presetData['age_multipliers'] );
	}

	public function test_presets_can_be_used_for_calculation(): void {
		$presets = PropertyValueService::getRegionPresets();

		foreach ( $presets as $presetKey => $presetData ) {
			$result = PropertyValueService::calculate(
				[
					'size'              => 100,
					'property_type'     => 'house',
					'property_subtype'  => 'efh',
					'condition'         => 'good',
					'quality'           => 'normal',
					'rental_status'     => 'owner_occupied',
					'location_rating'   => 3,
					'features'          => [],
				],
				$presetData
			);

			$this->assertEquals(
				$presetData['base_price'],
				$result['price_per_sqm'],
				"Preset '{$presetKey}' should calculate correctly with neutral inputs"
			);
			$this->assertEquals(
				$presetData['base_price'],
				$result['factors']['base_price'],
				"Preset '{$presetKey}' should report correct base_price in factors"
			);
		}
	}

	// ========================================================================
	// All Age Classes (DataProvider)
	// ========================================================================

	/**
	 * @dataProvider ageClassProvider
	 */
	public function test_all_age_classes_correct_multiplier(
		int $yearBuilt,
		string $expectedClass,
		float $expectedMultiplier
	): void {
		$result = PropertyValueService::calculate(
			[
				'size'              => 100,
				'property_type'     => 'house',
				'property_subtype'  => 'efh',
				'condition'         => 'good',
				'quality'           => 'normal',
				'rental_status'     => 'owner_occupied',
				'location_rating'   => 3,
				'features'          => [],
				'year_built'        => $yearBuilt,
			],
			$this->mittelstadtData()
		);

		$expectedPrice = round( 3200 * $expectedMultiplier, 2 );
		$this->assertEquals(
			$expectedPrice,
			$result['price_per_sqm'],
			"Year {$yearBuilt} (class: {$expectedClass}) should have multiplier {$expectedMultiplier}"
		);
		$this->assertEquals( round( $expectedMultiplier, 4 ), $result['factors']['age_impact'] );
	}

	/**
	 * @return array<string, array{int, string, float}>
	 */
	public static function ageClassProvider(): array {
		return [
			'before_1946 (1930)' => [ 1930, 'before_1946', 1.05 ],
			'before_1946 (1945)' => [ 1945, 'before_1946', 1.05 ],
			'1946_1959 (1950)'   => [ 1950, '1946_1959', 0.90 ],
			'1946_1959 (1959)'   => [ 1959, '1946_1959', 0.90 ],
			'1960_1979 (1970)'   => [ 1970, '1960_1979', 0.85 ],
			'1960_1979 (1979)'   => [ 1979, '1960_1979', 0.85 ],
			'1980_1989 (1985)'   => [ 1985, '1980_1989', 0.92 ],
			'1980_1989 (1989)'   => [ 1989, '1980_1989', 0.92 ],
			'1990_1999 (1995)'   => [ 1995, '1990_1999', 1.00 ],
			'1990_1999 (1999)'   => [ 1999, '1990_1999', 1.00 ],
			'2000_2014 (2010)'   => [ 2010, '2000_2014', 1.08 ],
			'2000_2014 (2014)'   => [ 2014, '2000_2014', 1.08 ],
			'2015_plus (2020)'   => [ 2020, '2015_plus', 1.15 ],
			'2015_plus (2025)'   => [ 2025, '2015_plus', 1.15 ],
		];
	}

	// ========================================================================
	// Edge Cases
	// ========================================================================

	public function test_minimum_size_boundary(): void {
		$result = PropertyValueService::calculate(
			[
				'size'              => 10,
				'property_type'     => 'house',
				'property_subtype'  => 'efh',
				'condition'         => 'good',
				'quality'           => 'normal',
				'rental_status'     => 'owner_occupied',
				'location_rating'   => 3,
				'features'          => [],
			],
			$this->mittelstadtData()
		);

		// size_factor = (100/10)^0.18 = 10^0.18 > 1
		$this->assertGreaterThan( 3200.00, $result['price_per_sqm'] );
		$this->assertEqualsWithDelta( 10, $result['estimated_value']['estimate'] / $result['price_per_sqm'], 0.01 );
	}

	public function test_size_below_minimum_is_clamped(): void {
		$resultLow = PropertyValueService::calculate(
			[
				'size' => 5, 'property_type' => 'house', 'property_subtype' => 'efh',
				'condition' => 'good', 'quality' => 'normal', 'rental_status' => 'owner_occupied',
				'location_rating' => 3, 'features' => [],
			],
			$this->mittelstadtData()
		);

		$resultMin = PropertyValueService::calculate(
			[
				'size' => 10, 'property_type' => 'house', 'property_subtype' => 'efh',
				'condition' => 'good', 'quality' => 'normal', 'rental_status' => 'owner_occupied',
				'location_rating' => 3, 'features' => [],
			],
			$this->mittelstadtData()
		);

		// Both should have the same price/m² since 5 is clamped to 10.
		$this->assertEquals( $resultMin['price_per_sqm'], $resultLow['price_per_sqm'] );
	}

	public function test_maximum_size_boundary(): void {
		$result = PropertyValueService::calculate(
			[
				'size'              => 10000,
				'property_type'     => 'house',
				'property_subtype'  => 'efh',
				'condition'         => 'good',
				'quality'           => 'normal',
				'rental_status'     => 'owner_occupied',
				'location_rating'   => 3,
				'features'          => [],
			],
			$this->mittelstadtData()
		);

		$this->assertLessThan( 3200.00, $result['price_per_sqm'] );
		$this->assertGreaterThan( 0, $result['price_per_sqm'] );
	}

	public function test_null_year_built_uses_default(): void {
		$result = PropertyValueService::calculate(
			[
				'size'              => 100,
				'property_type'     => 'house',
				'property_subtype'  => 'efh',
				'condition'         => 'good',
				'quality'           => 'normal',
				'rental_status'     => 'owner_occupied',
				'location_rating'   => 3,
				'features'          => [],
				'year_built'        => null,
			],
			$this->mittelstadtData()
		);

		$this->assertEquals( 1.0, $result['factors']['age_impact'] );
		$this->assertEquals( 3200.00, $result['price_per_sqm'] );
	}

	public function test_invalid_features_are_ignored(): void {
		$result = PropertyValueService::calculate(
			[
				'size' => 100, 'property_type' => 'house', 'property_subtype' => 'efh',
				'condition' => 'good', 'quality' => 'normal', 'rental_status' => 'owner_occupied',
				'location_rating' => 3, 'features' => [ 'balcony', 'invalid_feature', 'pool' ],
			],
			$this->mittelstadtData()
		);

		// Only balcony should count: +15
		$this->assertEquals( round( 3200 + 15, 2 ), $result['price_per_sqm'] );
	}

	public function test_rating_clamped_to_1_when_below(): void {
		$result = PropertyValueService::calculate(
			[
				'size' => 100, 'property_type' => 'house', 'property_subtype' => 'efh',
				'condition' => 'good', 'quality' => 'normal', 'rental_status' => 'owner_occupied',
				'location_rating' => 0, 'features' => [],
			],
			$this->mittelstadtData()
		);

		$this->assertEquals( round( 3200 * 0.80, 2 ), $result['price_per_sqm'] );
	}

	public function test_rating_clamped_to_5_when_above(): void {
		$result = PropertyValueService::calculate(
			[
				'size' => 100, 'property_type' => 'house', 'property_subtype' => 'efh',
				'condition' => 'good', 'quality' => 'normal', 'rental_status' => 'owner_occupied',
				'location_rating' => 10, 'features' => [],
			],
			$this->mittelstadtData()
		);

		$this->assertEquals( round( 3200 * 1.30, 2 ), $result['price_per_sqm'] );
	}

	public function test_factors_breakdown_in_result(): void {
		$result = PropertyValueService::calculate(
			[
				'size'              => 100,
				'property_type'     => 'house',
				'property_subtype'  => 'efh',
				'condition'         => 'good',
				'quality'           => 'normal',
				'rental_status'     => 'owner_occupied',
				'location_rating'   => 3,
				'features'          => [ 'balcony' ],
			],
			$this->mittelstadtData()
		);

		$this->assertArrayHasKey( 'factors', $result );
		$this->assertEquals( 3200, $result['factors']['base_price'] );
		$this->assertEquals( 1.0, $result['factors']['size_factor'] );
		$this->assertEquals( 1.0, $result['factors']['type_impact'] );
		$this->assertEquals( 1.0, $result['factors']['subtype_impact'] );
		$this->assertEquals( 1.0, $result['factors']['condition_impact'] );
		$this->assertEquals( 1.0, $result['factors']['quality_impact'] );
		$this->assertEquals( 1.0, $result['factors']['location_impact'] );
		$this->assertEquals( 1.0, $result['factors']['rental_impact'] );
		$this->assertEquals( 15.0, $result['factors']['feature_premium'] );
		$this->assertEquals( 1, $result['factors']['features_count'] );
	}

	// ========================================================================
	// Combination Test: All Factors Simultaneously
	// ========================================================================

	public function test_all_factors_combined_calculation(): void {
		// 80m², apartment penthouse, renovated, premium, rented, rating 4, year 2010, 3 features
		$result = PropertyValueService::calculate(
			[
				'size'              => 80,
				'property_type'     => 'apartment',
				'property_subtype'  => 'penthouse',
				'condition'         => 'renovated',
				'quality'           => 'premium',
				'rental_status'     => 'rented',
				'location_rating'   => 4,
				'features'          => [ 'balcony', 'fitted_kitchen', 'elevator' ],
				'year_built'        => 2010,
			],
			$this->mittelstadtData()
		);

		// Manual calculation:
		// 1. size_factor = (100/80)^0.18 = 1.25^0.18 ≈ 1.0406
		// 2. base * size = 3200 * 1.0406 = 3329.92
		// 3. * type (apartment) = 3329.92 * 0.95 = 3163.42
		// 4. * subtype (penthouse) = 3163.42 * 1.20 = 3796.11
		// 5. * condition (renovated) = 3796.11 * 1.10 = 4175.72
		// 6. * age (2000_2014) = 4175.72 * 1.08 = 4509.78
		// 7. * quality (premium) = 4509.78 * 1.25 = 5637.22
		// 8. * location (4) = 5637.22 * 1.12 = 6313.69
		// 9. * rental (rented) = 6313.69 * 0.92 = 5808.59
		// 10. + features = 5808.59 + 15 + 15 + 10 = 5848.59

		// Allow for small rounding differences.
		$this->assertEqualsWithDelta( 5848.59, $result['price_per_sqm'], 5.0 );

		// Verify all factors are present.
		$this->assertEquals( 3200, $result['factors']['base_price'] );
		$this->assertEqualsWithDelta( 1.0406, $result['factors']['size_factor'], 0.001 );
		$this->assertEquals( 0.95, $result['factors']['type_impact'] );
		$this->assertEquals( 1.20, $result['factors']['subtype_impact'] );
		$this->assertEquals( 1.10, $result['factors']['condition_impact'] );
		$this->assertEquals( 1.08, $result['factors']['age_impact'] );
		$this->assertEquals( 1.25, $result['factors']['quality_impact'] );
		$this->assertEquals( 1.12, $result['factors']['location_impact'] );
		$this->assertEquals( 0.92, $result['factors']['rental_impact'] );
		$this->assertEquals( 40.0, $result['factors']['feature_premium'] ); // 15 + 15 + 10
		$this->assertEquals( 3, $result['factors']['features_count'] );

		// No plot value for apartment.
		$this->assertNull( $result['plot_value'] );
	}
}
