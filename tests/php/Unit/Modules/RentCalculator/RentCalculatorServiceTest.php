<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Modules\RentCalculator;

use PHPUnit\Framework\TestCase;
use Resa\Modules\RentCalculator\RentCalculatorService;

class RentCalculatorServiceTest extends TestCase {

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

		// Features: balcony (0.50) + fitted_kitchen (0.50) = 1.00 €/m²
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
}
