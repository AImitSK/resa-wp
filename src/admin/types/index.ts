/**
 * Feature gate data from Freemius.
 */
export interface FeatureGate {
	plan: 'free' | 'premium';
	is_trial: boolean;
	max_modules: number | null;
	max_locations: number | null;
	max_leads: number;
	can_export_leads: boolean;
	can_use_pdf_designer: boolean;
	can_use_smtp: boolean;
	can_remove_branding: boolean;
	can_use_webhooks: boolean;
	can_use_api_keys: boolean;
}

/**
 * Integration tab registered by an add-on plugin via `resa_integration_tabs` filter.
 */
export interface IntegrationTab {
	slug: string;
	label: string;
}

/**
 * Admin context injected by PHP via wp_localize_script.
 */
export interface ResaAdminContext {
	restUrl: string;
	nonce: string;
	page: string;
	adminUrl: string;
	pluginUrl: string;
	version: string;
	features: FeatureGate;
	locationCount: number;
	siteName: string;
	adminEmail: string;
	integrationTabs: IntegrationTab[];
}

/**
 * Global window augmentation for resaAdmin context.
 */
declare global {
	interface Window {
		resaAdmin: ResaAdminContext;
	}
}

/**
 * Navigation item for the admin sidebar.
 */
export interface NavItem {
	slug: string;
	label: string;
	icon?: string;
}

/**
 * Module summary for the module store.
 */
export interface ModuleSummary {
	slug: string;
	name: string;
	description: string;
	icon: string;
	category: string;
	flag: 'free' | 'pro' | 'paid';
	active: boolean;
}

/**
 * Webhook configuration from the REST API.
 */
export interface WebhookConfig {
	id: number;
	name: string;
	url: string;
	secret: string;
	events: string[];
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

/**
 * API key configuration from the REST API (never contains plain key).
 */
export interface ApiKeyConfig {
	id: number;
	name: string;
	keyPrefix: string;
	isActive: boolean;
	lastUsedAt: string | null;
	createdAt: string;
}

/**
 * API key creation response (includes plain key once).
 */
export interface ApiKeyCreateResponse extends ApiKeyConfig {
	key: string;
}

/**
 * Data for creating/updating a webhook.
 */
export interface WebhookFormData {
	name: string;
	url: string;
	secret?: string;
	events: string[];
	isActive: boolean;
}

/**
 * Result from a webhook test send.
 */
export interface WebhookTestResult {
	success: boolean;
	statusCode?: number;
	error?: string;
}
