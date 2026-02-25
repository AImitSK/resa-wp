<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Core;

use PHPUnit\Framework\TestCase;
use Resa\Core\IconRegistry;

class IconRegistryTest extends TestCase {

	protected function setUp(): void {
		parent::setUp();
		IconRegistry::clearCache();
	}

	public function test_getSvg_findet_existierendes_icon(): void {
		$svg = IconRegistry::getSvg( 'haus' );

		$this->assertNotNull( $svg );
		$this->assertStringContainsString( '<svg', $svg );
		$this->assertStringContainsString( '--resa-icon-primary', $svg );
	}

	public function test_getSvg_gibt_null_fuer_unbekanntes_icon(): void {
		$this->assertNull( IconRegistry::getSvg( 'nonexistent-xyz' ) );
	}

	public function test_getSvg_cached_ergebnis(): void {
		$first  = IconRegistry::getSvg( 'wohnung' );
		$second = IconRegistry::getSvg( 'wohnung' );

		$this->assertNotNull( $first );
		$this->assertSame( $first, $second );
	}

	public function test_getDataUri_gibt_base64_zurueck(): void {
		$uri = IconRegistry::getDataUri( 'haus' );

		$this->assertNotNull( $uri );
		$this->assertStringStartsWith( 'data:image/svg+xml;base64,', $uri );
	}

	public function test_getDataUri_null_fuer_unbekanntes_icon(): void {
		$this->assertNull( IconRegistry::getDataUri( 'nonexistent-xyz' ) );
	}

	public function test_getAll_listet_alle_icons(): void {
		$names = IconRegistry::getAll();

		$this->assertNotEmpty( $names );
		$this->assertContains( 'haus', $names );
		$this->assertContains( 'wohnung', $names );
		$this->assertContains( 'balkon', $names );
		$this->assertContains( 'einfamilienhaus', $names );
		$this->assertGreaterThanOrEqual( 40, count( $names ) );
	}

	public function test_clearCache_leert_den_cache(): void {
		// Fill cache.
		IconRegistry::getSvg( 'haus' );

		// Clear.
		IconRegistry::clearCache();

		// Still works (re-reads from disk).
		$svg = IconRegistry::getSvg( 'haus' );
		$this->assertNotNull( $svg );
	}
}
