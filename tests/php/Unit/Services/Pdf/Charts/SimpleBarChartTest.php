<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Services\Pdf\Charts;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Services\Pdf\Charts\SimpleBarChart;

class SimpleBarChartTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		Functions\when( 'esc_html' )->returnArg();
		Functions\when( 'esc_attr' )->returnArg();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_render_returns_empty_for_no_bars(): void {
		$chart = new SimpleBarChart();
		$this->assertSame( '', $chart->render( [] ) );
	}

	public function test_render_returns_svg_element(): void {
		$chart = new SimpleBarChart();
		$svg   = $chart->render( [
			[ 'label' => 'Berlin', 'value' => 1200 ],
			[ 'label' => 'München', 'value' => 1800 ],
		] );

		$this->assertStringStartsWith( '<svg', $svg );
		$this->assertStringEndsWith( '</svg>', $svg );
		$this->assertStringContainsString( 'xmlns="http://www.w3.org/2000/svg"', $svg );
	}

	public function test_render_contains_bar_rectangles(): void {
		$chart = new SimpleBarChart();
		$svg   = $chart->render( [
			[ 'label' => 'A', 'value' => 100 ],
			[ 'label' => 'B', 'value' => 200 ],
		] );

		$this->assertStringContainsString( '<rect', $svg );
		// Two bars = at least 2 rect elements.
		$this->assertGreaterThanOrEqual( 2, substr_count( $svg, '<rect' ) );
	}

	public function test_render_contains_labels(): void {
		$chart = new SimpleBarChart();
		$svg   = $chart->render( [
			[ 'label' => 'Hamburg', 'value' => 950 ],
		] );

		$this->assertStringContainsString( 'Hamburg', $svg );
	}

	public function test_render_displays_values_with_unit(): void {
		$chart = new SimpleBarChart();
		$svg   = $chart->render(
			[ [ 'label' => 'Test', 'value' => 1500 ] ],
			[ 'unit' => '€' ]
		);

		$this->assertStringContainsString( '1.500', $svg );
		$this->assertStringContainsString( '€', $svg );
	}

	public function test_render_contains_bold_value_text(): void {
		$chart = new SimpleBarChart();
		$svg   = $chart->render(
			[ [ 'label' => 'X', 'value' => 100 ] ],
		);

		// Value text above bars is rendered with font-weight="bold".
		$this->assertStringContainsString( 'font-weight="bold"', $svg );
	}

	public function test_render_uses_custom_colors(): void {
		$chart = new SimpleBarChart();
		$svg   = $chart->render(
			[ [ 'label' => 'A', 'value' => 100, 'color' => '#ff0000' ] ],
		);

		$this->assertStringContainsString( '#ff0000', $svg );
	}

	public function test_render_contains_baseline(): void {
		$chart = new SimpleBarChart();
		$svg   = $chart->render( [
			[ 'label' => 'A', 'value' => 100 ],
		] );

		$this->assertStringContainsString( '<line', $svg );
	}

	public function test_render_handles_zero_max_value(): void {
		$chart = new SimpleBarChart();
		$svg   = $chart->render( [
			[ 'label' => 'A', 'value' => 0 ],
			[ 'label' => 'B', 'value' => 0 ],
		] );

		// Should not divide by zero, still produce valid SVG.
		$this->assertStringStartsWith( '<svg', $svg );
	}
}
