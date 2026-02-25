<?php

declare( strict_types=1 );

namespace Resa\Core;

/**
 * Contract for all RESA modules (Lead Tools).
 *
 * Each module (e.g. rent-calculator, value-calculator) implements
 * this interface and registers itself with the ModuleRegistry.
 */
interface ModuleInterface {

	/**
	 * Unique slug, e.g. 'rent-calculator'.
	 */
	public function getSlug(): string;

	/**
	 * Human-readable name, e.g. 'Mietpreis-Kalkulator'.
	 */
	public function getName(): string;

	/**
	 * Short description of the module.
	 */
	public function getDescription(): string;

	/**
	 * Semantic icon name from the Icon Registry.
	 */
	public function getIcon(): string;

	/**
	 * Category: 'calculator', 'analysis', 'checklist'.
	 */
	public function getCategory(): string;

	/**
	 * Pricing flag: 'free', 'pro', or 'paid'.
	 */
	public function getFlag(): string;

	/**
	 * Whether the module is currently activated by the admin.
	 */
	public function isActive(): bool;

	/**
	 * Activate or deactivate the module.
	 */
	public function setActive( bool $active ): void;

	/**
	 * Register module-specific REST API routes.
	 */
	public function registerRoutes(): void;

	/**
	 * Return the settings schema for the admin UI.
	 *
	 * @return array<string, mixed>
	 */
	public function getSettingsSchema(): array;

	/**
	 * Return the frontend configuration (steps, validation, etc.).
	 *
	 * @return array<string, mixed>
	 */
	public function getFrontendConfig(): array;

	/**
	 * Called when the module is activated.
	 */
	public function onActivate(): void;

	/**
	 * Called when the module is deactivated.
	 */
	public function onDeactivate(): void;
}
