<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Modules\RentCalculator;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Modules\RentCalculator\RentCalculatorService;

class RentCalculatorServiceTest extends TestCase {

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
			'base_price'            => 9.50,
			'size_degression'       => 0.20,
			'location_ratings'      => [ '1' => 0.85, '2' => 0.95, '3' => 1.00, '4' => 1.10, '5' => 1.25 ],
			'condition_multipliers' => [ 'new' => 1.25, 'renovated' => 1.10, 'good' => 1.00, 'needs_renovation' => 0.80 ],
			'type_multipliers'      => [ 'apartment' => 1.00, 'house' => 1.15 ],
			'feature_premiums'      => [ 'balcony' => 0.50, 'terrace' => 0.75, 'garden' => 1.00, 'elevator' => 0.30, 'parking' => 0.40, 'garage' => 0.60, 'cellar' => 0.20, 'fitted_kitchen' => 0.50, 'floor_heating' => 0.40, 'guest_toilet' => 0.25, 'barrier_free' => 0.30 ],
			'age_multipliers'       => [ 'before_1946' => 1.05, '1946_1959' => 0.95, '1960_1979' => 0.90, '1980_1989' => 0.95, '1990_1999' => 1.00, '2000_2014' => 1.05, '2015_plus' => 1.10 ],
		];
	}

	public function test_calculate_happy_path(): void {
		$result = RentCalculatorService::calculate(
			[
				'size'            => 70,
				'property_type'   => 'apartment',
				'condition'       => 'good',
				'location_rating' => 3,
				'features'        => [],
				'year_built'      => null,
			],
			$this->mittelstadtData()
		);

		// 70m², size_factor = (70/70)^0.20 = 1.0
		// preis = 9.50 * 1.0 * 1.0 (lage 3) * 1.0 (good) * 1.0 (apartment) * 1.0 (no age) = 9.50
		// monthly = 70 * 9.50 = 665.00
		$this->assertEquals( 665.00, $result['monthly_rent']['estimate'] );
		$this->assertEquals( 9.50, $result['price_per_sqm'] );
		$this->assertEquals( 7980.00, $result['annual_rent'] );

		// Range ±15%.
		$this->assertEquals( round( 665.00 * 0.85, 2 ), $result['monthly_rent']['low'] );
		$this->assertEquals( round( 665.00 * 1.15, 2 ), $result['monthly_rent']['high'] );
	}

	public function test_size_degression_small_apartment(): void {
		$result = RentCalculatorService::calculate(
			[
				'size'            => 35,
				'property_type'   => 'apartment',
				'condition'       => 'good',
				'location_rating' => 3,
				'features'        => [],
			],
			$this->mittelstadtData()
		);

		// size_factor = (70/35)^0.20 = 2^0.20 ≈ 1.1487
		// preis = 9.50 * 1.1487 = 10.91 (rounded)
		$this->assertGreaterThan( 9.50, $result['price_per_sqm'] );
	}

	public function test_size_degression_large_apartment(): void {
		$result = RentCalculatorService::calculate(
			[
				'size'            => 140,
				'property_type'   => 'apartment',
				'condition'       => 'good',
				'location_rating' => 3,
				'features'        => [],
			],
			$this->mittelstadtData()
		);

		// size_factor = (70/140)^0.20 = 0.5^0.20 ≈ 0.8706
		// preis = 9.50 * 0.8706 = 8.27 (rounded)
		$this->assertLessThan( 9.50, $result['price_per_sqm'] );
	}

	public function test_location_rating_multiplier(): void {
		$base = [
			'size' => 70, 'property_type' => 'apartment', 'condition' => 'good', 'features' => [],
		];

		$resultLow = RentCalculatorService::calculate(
			array_merge( $base, [ 'location_rating' => 1 ] ),
			$this->mittelstadtData()
		);

		$resultHigh = RentCalculatorService::calculate(
			array_merge( $base, [ 'location_rating' => 5 ] ),
			$this->mittelstadtData()
		);

		// Rating 1: 9.50 * 0.85 = 8.075 → monthly = 565.25
		// Rating 5: 9.50 * 1.25 = 11.875 → monthly = 831.25
		$this->assertLessThan( $resultHigh['monthly_rent']['estimate'], $resultLow['monthly_rent']['estimate'] );
		$this->assertEquals( round( 9.50 * 0.85, 2 ), $resultLow['price_per_sqm'] );
		$this->assertEquals( round( 9.50 * 1.25, 2 ), $resultHigh['price_per_sqm'] );
	}

	public function test_condition_multiplier(): void {
		$base = [
			'size' => 70, 'property_type' => 'apartment', 'location_rating' => 3, 'features' => [],
		];

		$resultNew = RentCalculatorService::calculate(
			array_merge( $base, [ 'condition' => 'new' ] ),
			$this->mittelstadtData()
		);

		$resultReno = RentCalculatorService::calculate(
			array_merge( $base, [ 'condition' => 'needs_renovation' ] ),
			$this->mittelstadtData()
		);

		// new: 9.50 * 1.25 = 11.875
		// needs_reno: 9.50 * 0.80 = 7.60
		$this->assertEquals( round( 9.50 * 1.25, 2 ), $resultNew['price_per_sqm'] );
		$this->assertEquals( round( 9.50 * 0.80, 2 ), $resultReno['price_per_sqm'] );
	}

	public function test_type_multiplier_house(): void {
		$result = RentCalculatorService::calculate(
			[
				'size' => 70, 'property_type' => 'house', 'condition' => 'good',
				'location_rating' => 3, 'features' => [],
			],
			$this->mittelstadtData()
		);

		$this->assertEquals( round( 9.50 * 1.15, 2 ), $result['price_per_sqm'] );
	}

	public function test_feature_premiums_are_additive(): void {
		$resultNoFeatures = RentCalculatorService::calculate(
			[
				'size' => 70, 'property_type' => 'apartment', 'condition' => 'good',
				'location_rating' => 3, 'features' => [],
			],
			$this->mittelstadtData()
		);

		$resultWithFeatures = RentCalculatorService::calculate(
			[
				'size' => 70, 'property_type' => 'apartment', 'condition' => 'good',
				'location_rating' => 3, 'features' => [ 'balcony', 'fitted_kitchen' ],
			],
			$this->mittelstadtData()
		);

		// Features: balcony (0.50) + fitted_kitchen (0.50) = 1.00 EUR/m²
		$diff = $resultWithFeatures['price_per_sqm'] - $resultNoFeatures['price_per_sqm'];
		$this->assertEquals( 1.00, $diff );
	}

	public function test_age_multiplier(): void {
		$base = [
			'size' => 70, 'property_type' => 'apartment', 'condition' => 'good',
			'location_rating' => 3, 'features' => [],
		];

		$resultOld = RentCalculatorService::calculate(
			array_merge( $base, [ 'year_built' => 1930 ] ),
			$this->mittelstadtData()
		);

		$resultNew = RentCalculatorService::calculate(
			array_merge( $base, [ 'year_built' => 2020 ] ),
			$this->mittelstadtData()
		);

		// 1930: before_1946 → 1.05 → 9.50 * 1.05 = 9.975
		// 2020: 2015_plus → 1.10 → 9.50 * 1.10 = 10.45
		$this->assertEquals( round( 9.50 * 1.05, 2 ), $resultOld['price_per_sqm'] );
		$this->assertEquals( round( 9.50 * 1.10, 2 ), $resultNew['price_per_sqm'] );
	}

	public function test_range_plus_minus_15_percent(): void {
		$result = RentCalculatorService::calculate(
			[
				'size' => 100, 'property_type' => 'apartment', 'condition' => 'good',
				'location_rating' => 3, 'features' => [],
			],
			$this->mittelstadtData()
		);

		$estimate = $result['monthly_rent']['estimate'];
		$this->assertEquals( round( $estimate * 0.85, 2 ), $result['monthly_rent']['low'] );
		$this->assertEquals( round( $estimate * 1.15, 2 ), $result['monthly_rent']['high'] );
	}

	/**
	 * @dataProvider marketPositionProvider
	 */
	public function test_market_position_percentiles( float $pricePerSqm, float $basePrice, int $expectedPercentile ): void {
		$result = RentCalculatorService::getMarketPosition( $pricePerSqm, $basePrice );
		$this->assertEquals( $expectedPercentile, $result['percentile'] );
	}

	/**
	 * @return array<string, array{float, float, int}>
	 */
	public static function marketPositionProvider(): array {
		return [
			'under 0.85 ratio'  => [ 7.00, 10.00, 20 ],   // 0.70
			'0.85-0.95 ratio'   => [ 9.00, 10.00, 35 ],   // 0.90
			'0.95-1.05 ratio'   => [ 10.00, 10.00, 50 ],  // 1.00
			'1.05-1.15 ratio'   => [ 11.00, 10.00, 65 ],  // 1.10
			'1.15-1.25 ratio'   => [ 12.00, 10.00, 80 ],  // 1.20
			'over 1.25 ratio'   => [ 13.00, 10.00, 90 ],  // 1.30
		];
	}

	public function test_market_position_zero_base_price(): void {
		$result = RentCalculatorService::getMarketPosition( 10.0, 0.0 );
		$this->assertEquals( 50, $result['percentile'] );
	}

	public function test_invalid_features_are_ignored(): void {
		$result = RentCalculatorService::calculate(
			[
				'size' => 70, 'property_type' => 'apartment', 'condition' => 'good',
				'location_rating' => 3, 'features' => [ 'balcony', 'invalid_feature', 'pool' ],
			],
			$this->mittelstadtData()
		);

		// Only balcony should count: +0.50
		$this->assertEquals( round( 9.50 + 0.50, 2 ), $result['price_per_sqm'] );
	}

	public function test_factors_breakdown_in_result(): void {
		$result = RentCalculatorService::calculate(
			[
				'size' => 70, 'property_type' => 'apartment', 'condition' => 'good',
				'location_rating' => 3, 'features' => [ 'balcony' ],
			],
			$this->mittelstadtData()
		);

		$this->assertArrayHasKey( 'factors', $result );
		$this->assertEquals( 9.50, $result['factors']['base_price'] );
		$this->assertEquals( 1.0, $result['factors']['size_factor'] );
		$this->assertEquals( 1.0, $result['factors']['location_impact'] );
		$this->assertEquals( 1.0, $result['factors']['condition_impact'] );
		$this->assertEquals( 1.0, $result['factors']['type_impact'] );
		$this->assertEquals( 0.50, $result['factors']['feature_premium'] );
		$this->assertEquals( 1, $result['factors']['features_count'] );
	}

	public function test_region_presets_are_available(): void {
		$presets = RentCalculatorService::getRegionPresets();

		$this->assertCount( 4, $presets );
		$this->assertArrayHasKey( 'rural', $presets );
		$this->assertArrayHasKey( 'small_town', $presets );
		$this->assertArrayHasKey( 'medium_city', $presets );
		$this->assertArrayHasKey( 'large_city', $presets );

		// Each preset has required keys.
		foreach ( $presets as $preset ) {
			$this->assertArrayHasKey( 'base_price', $preset );
			$this->assertArrayHasKey( 'location_ratings', $preset );
			$this->assertArrayHasKey( 'condition_multipliers', $preset );
			$this->assertArrayHasKey( 'type_multipliers', $preset );
			$this->assertArrayHasKey( 'feature_premiums', $preset );
			$this->assertArrayHasKey( 'age_multipliers', $preset );
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
		$result = RentCalculatorService::calculate(
			[
				'size'            => 70,
				'property_type'   => 'apartment',
				'condition'       => 'good',
				'location_rating' => 3,
				'features'        => [],
				'year_built'      => $yearBuilt,
			],
			$this->mittelstadtData()
		);

		// base_price * age_multiplier = price/m²
		$expectedPrice = round( 9.50 * $expectedMultiplier, 2 );
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
			'1946_1959 (1950)'   => [ 1950, '1946_1959', 0.95 ],
			'1946_1959 (1959)'   => [ 1959, '1946_1959', 0.95 ],
			'1960_1979 (1970)'   => [ 1970, '1960_1979', 0.90 ],
			'1960_1979 (1979)'   => [ 1979, '1960_1979', 0.90 ],
			'1980_1989 (1985)'   => [ 1985, '1980_1989', 0.95 ],
			'1980_1989 (1989)'   => [ 1989, '1980_1989', 0.95 ],
			'1990_1999 (1995)'   => [ 1995, '1990_1999', 1.00 ],
			'1990_1999 (1999)'   => [ 1999, '1990_1999', 1.00 ],
			'2000_2014 (2010)'   => [ 2010, '2000_2014', 1.05 ],
			'2000_2014 (2014)'   => [ 2014, '2000_2014', 1.05 ],
			'2015_plus (2020)'   => [ 2020, '2015_plus', 1.10 ],
			'2015_plus (2025)'   => [ 2025, '2015_plus', 1.10 ],
		];
	}

	// ========================================================================
	// All Conditions (DataProvider)
	// ========================================================================

	/**
	 * @dataProvider conditionProvider
	 */
	public function test_all_conditions_correct_multiplier(
		string $condition,
		float $expectedMultiplier
	): void {
		$result = RentCalculatorService::calculate(
			[
				'size'            => 70,
				'property_type'   => 'apartment',
				'condition'       => $condition,
				'location_rating' => 3,
				'features'        => [],
			],
			$this->mittelstadtData()
		);

		$expectedPrice = round( 9.50 * $expectedMultiplier, 2 );
		$this->assertEquals(
			$expectedPrice,
			$result['price_per_sqm'],
			"Condition '{$condition}' should have multiplier {$expectedMultiplier}"
		);
		$this->assertEquals( round( $expectedMultiplier, 4 ), $result['factors']['condition_impact'] );
	}

	/**
	 * @return array<string, array{string, float}>
	 */
	public static function conditionProvider(): array {
		return [
			'new'              => [ 'new', 1.25 ],
			'renovated'        => [ 'renovated', 1.10 ],
			'good'             => [ 'good', 1.00 ],
			'needs_renovation' => [ 'needs_renovation', 0.80 ],
		];
	}

	// ========================================================================
	// All Features individually (DataProvider)
	// ========================================================================

	/**
	 * @dataProvider featureProvider
	 */
	public function test_each_feature_premium_correct(
		string $feature,
		float $expectedPremium
	): void {
		$resultWithoutFeature = RentCalculatorService::calculate(
			[
				'size'            => 70,
				'property_type'   => 'apartment',
				'condition'       => 'good',
				'location_rating' => 3,
				'features'        => [],
			],
			$this->mittelstadtData()
		);

		$resultWithFeature = RentCalculatorService::calculate(
			[
				'size'            => 70,
				'property_type'   => 'apartment',
				'condition'       => 'good',
				'location_rating' => 3,
				'features'        => [ $feature ],
			],
			$this->mittelstadtData()
		);

		$diff = $resultWithFeature['price_per_sqm'] - $resultWithoutFeature['price_per_sqm'];
		$this->assertEquals(
			$expectedPremium,
			round( $diff, 2 ),
			"Feature '{$feature}' should add {$expectedPremium} EUR/m²"
		);
		$this->assertEquals( $expectedPremium, $resultWithFeature['factors']['feature_premium'] );
		$this->assertEquals( 1, $resultWithFeature['factors']['features_count'] );
	}

	/**
	 * @return array<string, array{string, float}>
	 */
	public static function featureProvider(): array {
		return [
			'balcony'        => [ 'balcony', 0.50 ],
			'terrace'        => [ 'terrace', 0.75 ],
			'garden'         => [ 'garden', 1.00 ],
			'elevator'       => [ 'elevator', 0.30 ],
			'parking'        => [ 'parking', 0.40 ],
			'garage'         => [ 'garage', 0.60 ],
			'cellar'         => [ 'cellar', 0.20 ],
			'fitted_kitchen' => [ 'fitted_kitchen', 0.50 ],
			'floor_heating'  => [ 'floor_heating', 0.40 ],
			'guest_toilet'   => [ 'guest_toilet', 0.25 ],
			'barrier_free'   => [ 'barrier_free', 0.30 ],
		];
	}

	// ========================================================================
	// All Location Ratings 1-5 (DataProvider)
	// ========================================================================

	/**
	 * @dataProvider locationRatingProvider
	 */
	public function test_all_location_ratings(
		int $rating,
		float $expectedMultiplier
	): void {
		$result = RentCalculatorService::calculate(
			[
				'size'            => 70,
				'property_type'   => 'apartment',
				'condition'       => 'good',
				'location_rating' => $rating,
				'features'        => [],
			],
			$this->mittelstadtData()
		);

		$expectedPrice = round( 9.50 * $expectedMultiplier, 2 );
		$this->assertEquals(
			$expectedPrice,
			$result['price_per_sqm'],
			"Rating {$rating} should have multiplier {$expectedMultiplier}"
		);
		$this->assertEquals( round( $expectedMultiplier, 4 ), $result['factors']['location_impact'] );
	}

	/**
	 * @return array<string, array{int, float}>
	 */
	public static function locationRatingProvider(): array {
		return [
			'rating 1' => [ 1, 0.85 ],
			'rating 2' => [ 2, 0.95 ],
			'rating 3' => [ 3, 1.00 ],
			'rating 4' => [ 4, 1.10 ],
			'rating 5' => [ 5, 1.25 ],
		];
	}

	// ========================================================================
	// All Region Presets (DataProvider)
	// ========================================================================

	/**
	 * @dataProvider regionPresetProvider
	 */
	public function test_each_preset_base_price(
		string $preset,
		float $expectedBasePrice
	): void {
		$presets = RentCalculatorService::getRegionPresets();

		$this->assertArrayHasKey( $preset, $presets, "Preset '{$preset}' should exist" );
		$this->assertEquals(
			$expectedBasePrice,
			$presets[ $preset ]['base_price'],
			"Preset '{$preset}' should have base_price {$expectedBasePrice}"
		);
	}

	/**
	 * @return array<string, array{string, float}>
	 */
	public static function regionPresetProvider(): array {
		return [
			'rural'       => [ 'rural', 5.50 ],
			'small_town'  => [ 'small_town', 7.50 ],
			'medium_city' => [ 'medium_city', 9.50 ],
			'large_city'  => [ 'large_city', 14.00 ],
		];
	}

	// ========================================================================
	// Combination Test: All Factors Simultaneously
	// ========================================================================

	public function test_all_factors_combined_calculation(): void {
		// 50m², house, renovated, rating 4, Baujahr 2010, 3 Features
		$result = RentCalculatorService::calculate(
			[
				'size'            => 50,
				'property_type'   => 'house',
				'condition'       => 'renovated',
				'location_rating' => 4,
				'features'        => [ 'balcony', 'fitted_kitchen', 'cellar' ],
				'year_built'      => 2010,
			],
			$this->mittelstadtData()
		);

		// Manual calculation:
		// 1. size_factor = (70/50)^0.20 = 1.4^0.20 ≈ 1.0696
		// 2. base * size = 9.50 * 1.0696 = 10.1612
		// 3. * location (4) = 10.1612 * 1.10 = 11.1773
		// 4. * condition (renovated) = 11.1773 * 1.10 = 12.295
		// 5. * type (house) = 12.295 * 1.15 = 14.139
		// 6. * age (2000_2014) = 14.139 * 1.05 = 14.846
		// 7. + features = 14.846 + 0.50 + 0.50 + 0.20 = 16.046
		// 8. round = 16.05

		// Allow for small rounding differences.
		$this->assertEqualsWithDelta( 16.05, $result['price_per_sqm'], 0.02 );
		$this->assertEqualsWithDelta( 50 * 16.05, $result['monthly_rent']['estimate'], 1.0 );

		// Verify all factors are present.
		$this->assertEquals( 9.50, $result['factors']['base_price'] );
		$this->assertEqualsWithDelta( 1.0696, $result['factors']['size_factor'], 0.001 );
		$this->assertEquals( 1.10, $result['factors']['location_impact'] );
		$this->assertEquals( 1.10, $result['factors']['condition_impact'] );
		$this->assertEquals( 1.15, $result['factors']['type_impact'] );
		$this->assertEquals( 1.05, $result['factors']['age_impact'] );
		$this->assertEquals( 1.20, $result['factors']['feature_premium'] ); // 0.50 + 0.50 + 0.20
		$this->assertEquals( 3, $result['factors']['features_count'] );
	}

	// ========================================================================
	// Edge Cases
	// ========================================================================

	public function test_minimum_size_boundary(): void {
		// Minimum size is 10m² (enforced by Service).
		$result = RentCalculatorService::calculate(
			[
				'size'            => 10,
				'property_type'   => 'apartment',
				'condition'       => 'good',
				'location_rating' => 3,
				'features'        => [],
			],
			$this->mittelstadtData()
		);

		// size_factor = (70/10)^0.20 = 7^0.20 ≈ 1.4758
		$this->assertGreaterThan( 9.50, $result['price_per_sqm'] );
		$this->assertEquals( 10, $result['monthly_rent']['estimate'] / $result['price_per_sqm'] );
	}

	public function test_size_below_minimum_is_clamped(): void {
		// Size < 10 should be clamped to 10.
		$resultLow = RentCalculatorService::calculate(
			[
				'size'            => 5,
				'property_type'   => 'apartment',
				'condition'       => 'good',
				'location_rating' => 3,
				'features'        => [],
			],
			$this->mittelstadtData()
		);

		$resultMin = RentCalculatorService::calculate(
			[
				'size'            => 10,
				'property_type'   => 'apartment',
				'condition'       => 'good',
				'location_rating' => 3,
				'features'        => [],
			],
			$this->mittelstadtData()
		);

		// Both should have the same price/m² since 5 is clamped to 10.
		$this->assertEquals( $resultMin['price_per_sqm'], $resultLow['price_per_sqm'] );
	}

	public function test_maximum_size_boundary(): void {
		// Large size (10000m²).
		$result = RentCalculatorService::calculate(
			[
				'size'            => 10000,
				'property_type'   => 'apartment',
				'condition'       => 'good',
				'location_rating' => 3,
				'features'        => [],
			],
			$this->mittelstadtData()
		);

		// size_factor = (70/10000)^0.20 = 0.007^0.20 ≈ 0.384
		$this->assertLessThan( 9.50, $result['price_per_sqm'] );
		$this->assertGreaterThan( 0, $result['price_per_sqm'] );
	}

	public function test_null_year_built_uses_default(): void {
		$result = RentCalculatorService::calculate(
			[
				'size'            => 70,
				'property_type'   => 'apartment',
				'condition'       => 'good',
				'location_rating' => 3,
				'features'        => [],
				'year_built'      => null,
			],
			$this->mittelstadtData()
		);

		// age_impact should be 1.0 when year_built is null.
		$this->assertEquals( 1.0, $result['factors']['age_impact'] );
		$this->assertEquals( 9.50, $result['price_per_sqm'] );
	}

	public function test_empty_features_array(): void {
		$result = RentCalculatorService::calculate(
			[
				'size'            => 70,
				'property_type'   => 'apartment',
				'condition'       => 'good',
				'location_rating' => 3,
				'features'        => [],
			],
			$this->mittelstadtData()
		);

		$this->assertEquals( 0.0, $result['factors']['feature_premium'] );
		$this->assertEquals( 0, $result['factors']['features_count'] );
	}

	public function test_all_features_combined(): void {
		// All 11 features at once.
		$allFeatures = [
			'balcony',
			'terrace',
			'garden',
			'elevator',
			'parking',
			'garage',
			'cellar',
			'fitted_kitchen',
			'floor_heating',
			'guest_toilet',
			'barrier_free',
		];

		$result = RentCalculatorService::calculate(
			[
				'size'            => 70,
				'property_type'   => 'apartment',
				'condition'       => 'good',
				'location_rating' => 3,
				'features'        => $allFeatures,
			],
			$this->mittelstadtData()
		);

		// Sum of all premiums: 0.50 + 0.75 + 1.00 + 0.30 + 0.40 + 0.60 + 0.20 + 0.50 + 0.40 + 0.25 + 0.30 = 5.20.
		$expectedPremium = 5.20;
		$this->assertEquals( $expectedPremium, $result['factors']['feature_premium'] );
		$this->assertEquals( 11, $result['factors']['features_count'] );
		$this->assertEquals( 9.50 + $expectedPremium, $result['price_per_sqm'] );
	}

	public function test_rating_clamped_to_1_when_below(): void {
		// Rating below 1 should be clamped to 1.
		$result = RentCalculatorService::calculate(
			[
				'size'            => 70,
				'property_type'   => 'apartment',
				'condition'       => 'good',
				'location_rating' => 0,
				'features'        => [],
			],
			$this->mittelstadtData()
		);

		// Rating 1: multiplier 0.85.
		$this->assertEquals( round( 9.50 * 0.85, 2 ), $result['price_per_sqm'] );
	}

	public function test_rating_clamped_to_5_when_above(): void {
		// Rating above 5 should be clamped to 5.
		$result = RentCalculatorService::calculate(
			[
				'size'            => 70,
				'property_type'   => 'apartment',
				'condition'       => 'good',
				'location_rating' => 10,
				'features'        => [],
			],
			$this->mittelstadtData()
		);

		// Rating 5: multiplier 1.25.
		$this->assertEquals( round( 9.50 * 1.25, 2 ), $result['price_per_sqm'] );
	}

	public function test_unknown_property_type_uses_default(): void {
		$result = RentCalculatorService::calculate(
			[
				'size'            => 70,
				'property_type'   => 'castle',
				'condition'       => 'good',
				'location_rating' => 3,
				'features'        => [],
			],
			$this->mittelstadtData()
		);

		// Unknown type falls back to 1.0 multiplier.
		$this->assertEquals( 1.0, $result['factors']['type_impact'] );
	}

	public function test_unknown_condition_uses_default(): void {
		$result = RentCalculatorService::calculate(
			[
				'size'            => 70,
				'property_type'   => 'apartment',
				'condition'       => 'destroyed',
				'location_rating' => 3,
				'features'        => [],
			],
			$this->mittelstadtData()
		);

		// Unknown condition falls back to 1.0 multiplier.
		$this->assertEquals( 1.0, $result['factors']['condition_impact'] );
	}

	// ========================================================================
	// Region Preset Structure Validation
	// ========================================================================

	/**
	 * @dataProvider regionPresetProvider
	 */
	public function test_preset_has_all_required_fields( string $preset ): void {
		$presets    = RentCalculatorService::getRegionPresets();
		$presetData = $presets[ $preset ];

		$this->assertArrayHasKey( 'label', $presetData );
		$this->assertArrayHasKey( 'base_price', $presetData );
		$this->assertArrayHasKey( 'size_degression', $presetData );
		$this->assertArrayHasKey( 'location_ratings', $presetData );
		$this->assertArrayHasKey( 'condition_multipliers', $presetData );
		$this->assertArrayHasKey( 'type_multipliers', $presetData );
		$this->assertArrayHasKey( 'feature_premiums', $presetData );
		$this->assertArrayHasKey( 'age_multipliers', $presetData );

		// Verify structure of nested arrays.
		$this->assertCount( 5, $presetData['location_ratings'] );
		$this->assertCount( 4, $presetData['condition_multipliers'] );
		$this->assertCount( 2, $presetData['type_multipliers'] );
		$this->assertCount( 11, $presetData['feature_premiums'] );
		$this->assertCount( 7, $presetData['age_multipliers'] );
	}

	public function test_presets_can_be_used_for_calculation(): void {
		$presets = RentCalculatorService::getRegionPresets();

		foreach ( $presets as $presetKey => $presetData ) {
			$result = RentCalculatorService::calculate(
				[
					'size'            => 70,
					'property_type'   => 'apartment',
					'condition'       => 'good',
					'location_rating' => 3,
					'features'        => [],
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
	// Age Multiplier with Full Format (min_year/max_year)
	// ========================================================================

	public function test_age_multiplier_full_format_with_year_ranges(): void {
		$locationData = [
			'base_price'      => 10.00,
			'age_multipliers' => [
				'before_1946' => [ 'multiplier' => 1.05, 'min_year' => 0, 'max_year' => 1945 ],
				'1946_1959'   => [ 'multiplier' => 0.95, 'min_year' => 1946, 'max_year' => 1959 ],
				'1960_1979'   => [ 'multiplier' => 0.90, 'min_year' => 1960, 'max_year' => 1979 ],
				'2015_plus'   => [ 'multiplier' => 1.10, 'min_year' => 2015, 'max_year' => PHP_INT_MAX ],
			],
		];

		$result1940 = RentCalculatorService::calculate(
			[
				'size'            => 70,
				'property_type'   => 'apartment',
				'condition'       => 'good',
				'location_rating' => 3,
				'features'        => [],
				'year_built'      => 1940,
			],
			$locationData
		);

		$result2020 = RentCalculatorService::calculate(
			[
				'size'            => 70,
				'property_type'   => 'apartment',
				'condition'       => 'good',
				'location_rating' => 3,
				'features'        => [],
				'year_built'      => 2020,
			],
			$locationData
		);

		$this->assertEquals( 1.05, $result1940['factors']['age_impact'] );
		$this->assertEquals( 1.10, $result2020['factors']['age_impact'] );
	}

	// ========================================================================
	// Location Ratings with Full Format (multiplier object)
	// ========================================================================

	public function test_location_ratings_full_format_with_multiplier_object(): void {
		$locationData = [
			'base_price'       => 10.00,
			'location_ratings' => [
				'1' => [ 'multiplier' => 0.80, 'label' => 'Einfach' ],
				'3' => [ 'multiplier' => 1.00, 'label' => 'Normal' ],
				'5' => [ 'multiplier' => 1.30, 'label' => 'Premium' ],
			],
		];

		$result = RentCalculatorService::calculate(
			[
				'size'            => 70,
				'property_type'   => 'apartment',
				'condition'       => 'good',
				'location_rating' => 5,
				'features'        => [],
			],
			$locationData
		);

		$this->assertEquals( 1.30, $result['factors']['location_impact'] );
		$this->assertEquals( 13.00, $result['price_per_sqm'] );
	}
}
