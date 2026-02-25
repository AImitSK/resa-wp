<?php

declare( strict_types=1 );

namespace Resa\Freemius;

use Resa\Core\ModuleInterface;
use Resa\Core\ModuleRegistry;

/**
 * Feature gating based on Freemius plan.
 *
 * Checks module flags (free/pro/paid) against the active
 * Freemius license. Falls back to free-mode when SDK
 * is unavailable (graceful degradation).
 *
 * Free-Plan Limits:
 * - Max 2 active modules (the two free ones)
 * - Max 1 location
 * - Last 50 leads visible
 * - No CSV export, no PDF designer, no SMTP, no integrations
 */
class FeatureGate {

	/** Free-plan limit: max active modules. */
	public const FREE_MAX_MODULES = 2;

	/** Free-plan limit: max locations. */
	public const FREE_MAX_LOCATIONS = 1;

	/** Free-plan limit: max visible leads. */
	public const FREE_MAX_LEADS = 50;

	private ModuleRegistry $moduleRegistry;

	public function __construct( ModuleRegistry $moduleRegistry ) {
		$this->moduleRegistry = $moduleRegistry;
	}

	// ─── Plan Detection ─────────────────────────────────────

	/**
	 * Whether the current site has an active premium license.
	 */
	public function isPremium(): bool {
		if ( ! FreemiusInit::isAvailable() ) {
			return false;
		}

		return resa_fs()->can_use_premium_code();
	}

	/**
	 * Whether the current site is on the free plan.
	 */
	public function isFree(): bool {
		return ! $this->isPremium();
	}

	/**
	 * Whether the site is currently in a trial period.
	 */
	public function isTrial(): bool {
		if ( ! FreemiusInit::isAvailable() ) {
			return false;
		}

		return resa_fs()->is_trial();
	}

	// ─── Module Gating ──────────────────────────────────────

	/**
	 * Whether a module can be used (flag + plan check).
	 */
	public function canUseModule( string $slug ): bool {
		$module = $this->moduleRegistry->get( $slug );

		if ( $module === null ) {
			return false;
		}

		return $this->checkModuleFlag( $module );
	}

	/**
	 * Whether a module can be activated (flag + plan + limits).
	 */
	public function canActivateModule( string $slug ): bool {
		if ( ! $this->canUseModule( $slug ) ) {
			return false;
		}

		$module = $this->moduleRegistry->get( $slug );

		if ( $module === null ) {
			return false;
		}

		// Already active? Always allow (toggle off should work).
		if ( $module->isActive() ) {
			return true;
		}

		// Premium has no module count limit.
		if ( $this->isPremium() ) {
			return true;
		}

		// Free plan: check active module count limit.
		return $this->moduleRegistry->getActiveCount() < self::FREE_MAX_MODULES;
	}

	/**
	 * Check module flag against current plan.
	 */
	private function checkModuleFlag( ModuleInterface $module ): bool {
		$flag = $module->getFlag();

		if ( $flag === 'free' ) {
			return true;
		}

		if ( $flag === 'pro' ) {
			return $this->isPremium();
		}

		// 'paid' modules require a specific add-on (future).
		return false;
	}

	// ─── Feature Limits ─────────────────────────────────────

	/**
	 * Whether a new location can be added.
	 */
	public function canAddLocation( int $currentCount ): bool {
		if ( $this->isPremium() ) {
			return true;
		}

		return $currentCount < self::FREE_MAX_LOCATIONS;
	}

	/**
	 * Max number of visible leads for the current plan.
	 */
	public function getLeadLimit(): int {
		if ( $this->isPremium() ) {
			return PHP_INT_MAX;
		}

		return self::FREE_MAX_LEADS;
	}

	/**
	 * Whether leads can be exported as CSV.
	 */
	public function canExportLeads(): bool {
		return $this->isPremium();
	}

	/**
	 * Whether the PDF designer can be used.
	 */
	public function canUsePdfDesigner(): bool {
		return $this->isPremium();
	}

	/**
	 * Whether custom SMTP / Brevo email can be used.
	 */
	public function canUseSmtp(): bool {
		return $this->isPremium();
	}

	/**
	 * Whether RESA branding can be removed.
	 */
	public function canRemoveBranding(): bool {
		return $this->isPremium();
	}

	/**
	 * Whether webhooks / Zapier integration is available.
	 */
	public function canUseWebhooks(): bool {
		return $this->isPremium();
	}

	// ─── Summary ────────────────────────────────────────────

	/**
	 * Return all feature gates as array (for REST API / frontend).
	 *
	 * @return array<string, mixed>
	 */
	public function toArray(): array {
		return [
			'plan'                 => $this->isPremium() ? 'premium' : 'free',
			'is_trial'             => $this->isTrial(),
			'max_modules'          => $this->isPremium() ? null : self::FREE_MAX_MODULES,
			'max_locations'        => $this->isPremium() ? null : self::FREE_MAX_LOCATIONS,
			'max_leads'            => $this->getLeadLimit(),
			'can_export_leads'     => $this->canExportLeads(),
			'can_use_pdf_designer' => $this->canUsePdfDesigner(),
			'can_use_smtp'         => $this->canUseSmtp(),
			'can_remove_branding'  => $this->canRemoveBranding(),
			'can_use_webhooks'     => $this->canUseWebhooks(),
		];
	}
}
