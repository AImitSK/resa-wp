<?php

declare( strict_types=1 );

namespace Resa\Modules\Demo;

use Resa\Core\AbstractModule;

/**
 * Demo module for testing the module system.
 *
 * This module exists solely to verify that module discovery,
 * registration, and activation work correctly. It will be
 * removed once a real module (rent-calculator) is implemented.
 */
class DemoModule extends AbstractModule {

	/**
	 * @inheritDoc
	 */
	public function getSlug(): string {
		return 'demo';
	}

	/**
	 * @inheritDoc
	 */
	public function getName(): string {
		return 'Demo-Modul';
	}

	/**
	 * @inheritDoc
	 */
	public function getDescription(): string {
		return 'Testmodul zur Validierung des Modul-Systems.';
	}

	/**
	 * @inheritDoc
	 */
	public function getIcon(): string {
		return 'beaker';
	}

	/**
	 * @inheritDoc
	 */
	public function getCategory(): string {
		return 'demo';
	}

	/**
	 * @inheritDoc
	 *
	 * @return array<string, mixed>
	 */
	public function getFrontendConfig(): array {
		return [
			'steps' => [
				[
					'key'   => 'intro',
					'title' => 'Willkommen',
				],
			],
		];
	}
}
