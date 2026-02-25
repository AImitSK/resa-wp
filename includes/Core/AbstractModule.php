<?php

declare( strict_types=1 );

namespace Resa\Core;

/**
 * Base implementation for RESA modules.
 *
 * Provides sensible defaults so concrete modules only need
 * to implement getSlug(), getName() and getDescription().
 */
abstract class AbstractModule implements ModuleInterface {

	/**
	 * @inheritDoc
	 */
	public function getIcon(): string {
		return 'default';
	}

	/**
	 * @inheritDoc
	 */
	public function getCategory(): string {
		return 'calculator';
	}

	/**
	 * @inheritDoc
	 */
	public function getFlag(): string {
		return 'free';
	}

	/**
	 * @inheritDoc
	 */
	public function isActive(): bool {
		return (bool) get_option( 'resa_module_' . $this->getSlug() . '_active', false );
	}

	/**
	 * @inheritDoc
	 */
	public function setActive( bool $active ): void {
		update_option( 'resa_module_' . $this->getSlug() . '_active', $active ? '1' : '0' );

		if ( $active ) {
			$this->onActivate();
		} else {
			$this->onDeactivate();
		}
	}

	/**
	 * @inheritDoc
	 */
	public function registerRoutes(): void {
		// Override in concrete module if needed.
	}

	/**
	 * @inheritDoc
	 *
	 * @return array<string, mixed>
	 */
	public function getSettingsSchema(): array {
		return [];
	}

	/**
	 * @inheritDoc
	 *
	 * @return array<string, mixed>
	 */
	public function getFrontendConfig(): array {
		return [];
	}

	/**
	 * @inheritDoc
	 */
	public function onActivate(): void {
		// Override in concrete module if needed.
	}

	/**
	 * @inheritDoc
	 */
	public function onDeactivate(): void {
		// Override in concrete module if needed.
	}

	/**
	 * Return module data as array (for REST API responses).
	 *
	 * @return array<string, mixed>
	 */
	public function toArray(): array {
		return [
			'slug'        => $this->getSlug(),
			'name'        => $this->getName(),
			'description' => $this->getDescription(),
			'icon'        => $this->getIcon(),
			'category'    => $this->getCategory(),
			'flag'        => $this->getFlag(),
			'active'      => $this->isActive(),
		];
	}
}
