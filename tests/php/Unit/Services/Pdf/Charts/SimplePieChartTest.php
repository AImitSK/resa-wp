<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Services\Pdf\Charts;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Services\Pdf\Charts\SimplePieChart;

class SimplePieChartTest extends TestCase {

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

	public function test_render_returns_empty_for_no_slices(): void {
		$chart = new SimplePieChart();
		$this->assertSame( '', $chart->render( [] ) );
	}

	public function test_render_returns_svg_element(): void {
		$chart = new SimplePieChart();
		$svg   = $chart->render( [
			[ 'label' => 'Lage', 'value' => 40 ],
			[ 'label' => 'Ausstattung', 'value' => 30 ],
			[ 'label' => 'Größe', 'value' => 30 ],
		] );

		$this->assertStringStartsWith( '<svg', $svg );
		$this->assertStringEndsWith( '</svg>', $svg );
	}

	public function test_render_contains_arc_paths(): void {
		$chart = new SimplePieChart();
		$svg   = $chart->render( [
			[ 'label' => 'A', 'value' => 50 ],
			[ 'label' => 'B', 'value' => 50 ],
		] );

		$this->assertStringContainsString( '<path', $svg );
	}

	public function test_render_shows_legend_by_default(): void {
		$chart = new SimplePieChart();
		$svg   = $chart->render( [
			[ 'label' => 'Lage', 'value' => 60 ],
			[ 'label' => 'Zustand', 'value' => 40 ],
		] );

		$this->assertStringContainsString( 'Lage', $svg );
		$this->assertStringContainsString( 'Zustand', $svg );
		// Percentages should be shown.
		$this->assertStringContainsString( '60%', $svg );
		$this->assertStringContainsString( '40%', $svg );
	}

	public function test_render_hides_legend_when_configured(): void {
		$chart = new SimplePieChart();
		$svg   = $chart->render(
			[ [ 'label' => 'Only', 'value' => 100 ] ],
			[ 'showLegend' => false ]
		);

		// SVG should be narrower without legend.
		$this->assertStringStartsWith( '<svg', $svg );
	}

	public function test_render_with_title(): void {
		$chart = new SimplePieChart();
		$svg   = $chart->render(
			[ [ 'label' => 'A', 'value' => 100 ] ],
			[ 'title' => 'Einflussfaktoren' ]
		);

		$this->assertStringContainsString( 'Einflussfaktoren', $svg );
	}

	public function test_render_donut_mode(): void {
		$chart = new SimplePieChart();
		$svg   = $chart->render(
			[
				[ 'label' => 'A', 'value' => 70 ],
				[ 'label' => 'B', 'value' => 30 ],
			],
			[ 'donut' => true ]
		);

		// Donut creates paths with inner arcs (more path segments).
		$this->assertStringContainsString( '<path', $svg );
	}

	public function test_render_uses_custom_colors(): void {
		$chart = new SimplePieChart();
		$svg   = $chart->render(
			[ [ 'label' => 'A', 'value' => 100, 'color' => '#ff5500' ] ],
		);

		$this->assertStringContainsString( '#ff5500', $svg );
	}

	public function test_render_returns_empty_for_zero_total(): void {
		$chart = new SimplePieChart();
		$svg   = $chart->render( [
			[ 'label' => 'A', 'value' => 0 ],
			[ 'label' => 'B', 'value' => 0 ],
		] );

		$this->assertSame( '', $svg );
	}
}
