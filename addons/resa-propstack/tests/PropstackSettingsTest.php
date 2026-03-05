<?php
/**
 * Tests for PropstackSettings
 *
 * @package Resa\Propstack\Tests
 */

namespace Resa\Propstack\Tests;

use PHPUnit\Framework\TestCase;
use Brain\Monkey;
use Brain\Monkey\Functions;
use Resa\Propstack\PropstackSettings;

/**
 * Test PropstackSettings class
 */
class PropstackSettingsTest extends TestCase {

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Test get() returns defaults when no option exists
	 */
	public function test_get_gibt_defaults_ohne_option(): void {
		Functions\when('get_option')->justReturn(false);

		$settings = PropstackSettings::get();

		$this->assertIsArray($settings);
		$this->assertFalse($settings['enabled']);
		$this->assertSame('', $settings['api_key']);
		$this->assertIsArray($settings['city_broker_mapping']);
		$this->assertEmpty($settings['city_broker_mapping']);
		$this->assertNull($settings['default_broker_id']);
		$this->assertSame(3, $settings['activity_task_due_days']);
	}

	/**
	 * Test update() merges with defaults
	 */
	public function test_update_merged_mit_defaults(): void {
		Functions\when('get_option')->justReturn(false);
		Functions\expect('update_option')
			->once()
			->with('resa_propstack_settings', Monkey\Functions\Args::type('array'))
			->andReturn(true);

		$result = PropstackSettings::update([
			'enabled' => true,
			'api_key' => 'test-key-123',
		]);

		$this->assertTrue($result);
	}

	/**
	 * Test isEnabled() returns false by default
	 */
	public function test_isEnabled_false_per_default(): void {
		Functions\when('get_option')->justReturn(false);

		$this->assertFalse(PropstackSettings::isEnabled());
	}

	/**
	 * Test isEnabled() returns true when enabled and API key exists
	 */
	public function test_isEnabled_true_wenn_api_key_vorhanden(): void {
		Functions\when('get_option')->justReturn([
			'enabled' => true,
			'api_key' => 'test-key',
		]);

		$this->assertTrue(PropstackSettings::isEnabled());
	}

	/**
	 * Test maskApiKey() shows only last 4 characters
	 */
	public function test_maskApiKey_zeigt_nur_letzte_4_zeichen(): void {
		$key = 'sk_test_1234567890abcdef';

		$masked = PropstackSettings::maskApiKey($key);

		$this->assertSame('****cdef', $masked);
	}

	/**
	 * Test maskApiKey() returns empty string for short keys
	 */
	public function test_maskApiKey_gibt_leer_bei_kurzen_keys(): void {
		$this->assertSame('', PropstackSettings::maskApiKey('abc'));
		$this->assertSame('', PropstackSettings::maskApiKey(''));
	}

	/**
	 * Test clearCaches() deletes all transients
	 */
	public function test_clearCaches_loescht_alle_transients(): void {
		Functions\expect('delete_transient')
			->times(3)
			->with(Monkey\Functions\Args::type('string'));

		PropstackSettings::clearCaches();
	}
}
