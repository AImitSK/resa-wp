<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Modules\PropertyValue;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Modules\PropertyValue\PropertyValueModule;

class PropertyValueModuleTest extends TestCase {

	use MockeryPHPUnitIntegration;

	private PropertyValueModule $module;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		Functions\stubTranslationFunctions();

		$this->module = new PropertyValueModule();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_getSlug_returns_property_value(): void {
		$this->assertSame( 'property-value', $this->module->getSlug() );
	}

	public function test_getName_returns_non_empty_string(): void {
		$name = $this->module->getName();

		$this->assertIsString( $name );
		$this->assertNotEmpty( $name );
	}

	public function test_getFlag_returns_pro(): void {
		$this->assertSame( 'pro', $this->module->getFlag() );
	}

	public function test_getIcon_returns_haus_euro(): void {
		$this->assertSame( 'haus-euro', $this->module->getIcon() );
	}

	public function test_getCategory_returns_calculator(): void {
		$this->assertSame( 'calculator', $this->module->getCategory() );
	}

	public function test_getSettingsSchema_has_factors_key(): void {
		$schema = $this->module->getSettingsSchema();

		$this->assertArrayHasKey( 'factors', $schema );
	}

	public function test_getSettingsSchema_has_location_values_key(): void {
		$schema = $this->module->getSettingsSchema();

		$this->assertArrayHasKey( 'location_values', $schema );
	}

	public function test_getFrontendConfig_has_steps(): void {
		$config = $this->module->getFrontendConfig();

		$this->assertArrayHasKey( 'steps', $config );
		$this->assertIsArray( $config['steps'] );
		$this->assertNotEmpty( $config['steps'] );
	}

	public function test_getFrontendConfig_has_features(): void {
		$config = $this->module->getFrontendConfig();

		$this->assertArrayHasKey( 'features', $config );
		$this->assertIsArray( $config['features'] );
		$this->assertNotEmpty( $config['features'] );
	}

	public function test_getFrontendConfig_has_subtypes_house(): void {
		$config = $this->module->getFrontendConfig();

		$this->assertArrayHasKey( 'subtypes_house', $config );
		$this->assertIsArray( $config['subtypes_house'] );
		$this->assertNotEmpty( $config['subtypes_house'] );
	}

	public function test_getFrontendConfig_has_subtypes_apartment(): void {
		$config = $this->module->getFrontendConfig();

		$this->assertArrayHasKey( 'subtypes_apartment', $config );
		$this->assertIsArray( $config['subtypes_apartment'] );
		$this->assertNotEmpty( $config['subtypes_apartment'] );
	}

	public function test_getFrontendConfig_steps_have_key_and_title(): void {
		$config = $this->module->getFrontendConfig();

		foreach ( $config['steps'] as $step ) {
			$this->assertArrayHasKey( 'key', $step );
			$this->assertArrayHasKey( 'title', $step );
			$this->assertNotEmpty( $step['key'] );
			$this->assertNotEmpty( $step['title'] );
		}
	}

	public function test_getFrontendConfig_features_have_key_label_icon(): void {
		$config = $this->module->getFrontendConfig();

		foreach ( $config['features'] as $feature ) {
			$this->assertArrayHasKey( 'key', $feature );
			$this->assertArrayHasKey( 'label', $feature );
			$this->assertArrayHasKey( 'icon', $feature );
		}
	}

	public function test_getDescription_returns_non_empty_string(): void {
		$description = $this->module->getDescription();

		$this->assertIsString( $description );
		$this->assertNotEmpty( $description );
	}
}
