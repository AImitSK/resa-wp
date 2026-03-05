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
	can_use_messenger: boolean;
	can_use_advanced_tracking: boolean;
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
 * Supported messenger platforms.
 */
export type MessengerPlatform = 'slack' | 'teams' | 'discord';

/**
 * Messenger connection configuration from the REST API.
 */
export interface MessengerConfig {
	id: number;
	name: string;
	platform: MessengerPlatform;
	webhookUrl: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

/**
 * Data for creating/updating a messenger connection.
 */
export interface MessengerFormData {
	name: string;
	platform: MessengerPlatform;
	webhookUrl: string;
	isActive: boolean;
}

/**
 * Result from a messenger test send.
 */
export interface MessengerTestResult {
	success: boolean;
	statusCode?: number;
	error?: string;
}

/**
 * Privacy / GDPR settings from the REST API.
 */
export interface PrivacySettings {
	privacy_url: string;
	consent_text: string;
	newsletter_text: string;
	lead_retention_days: number;
	email_log_retention_days: number;
	anonymize_instead_of_delete: boolean;
}

/**
 * reCAPTCHA v3 settings from the REST API.
 */
export interface RecaptchaSettings {
	enabled: boolean;
	site_key: string;
	secret_key: string;
	threshold: number;
}

/**
 * Tracking settings from the REST API.
 */
export interface TrackingSettings {
	funnel_tracking_enabled: boolean;
	partial_leads_enabled: boolean;
	partial_lead_ttl_days: number;
	datalayer_enabled: boolean;
	google_ads_fv_id: string;
	google_ads_fv_label: string;
	google_ads_fs_id: string;
	google_ads_fs_label: string;
	enhanced_conversions_enabled: boolean;
	gclid_capture_enabled: boolean;
	utm_capture_enabled: boolean;
}

/**
 * Funnel summary data from the analytics endpoint.
 */
export interface FunnelSummary {
	views: number;
	starts: number;
	form_views: number;
	form_submits: number;
	result_views: number;
	start_rate: number;
	completion_rate: number;
	conversion_rate: number;
}

/**
 * Daily funnel breakdown for trend charts.
 */
export interface FunnelDaily {
	date: string;
	views: number;
	starts: number;
	form_views: number;
	form_submits: number;
	result_views: number;
}

/**
 * Combined funnel response from GET /analytics/funnel.
 */
export interface FunnelData {
	summary: FunnelSummary;
	daily: FunnelDaily[];
	filters: {
		dateFrom: string;
		dateTo: string;
		assetType: string;
		locationId: number | null;
	};
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

/**
 * Propstack CRM integration settings.
 */
export interface PropstackSettings {
	enabled: boolean;
	api_key: string;
	api_key_masked?: string;
	city_broker_mapping: Record<number, number>;
	default_broker_id: number | null;
	contact_source_id: number | null;
	activity_enabled: boolean;
	activity_type_id: number | null;
	activity_create_task: boolean;
	activity_task_due_days: number;
	sync_newsletter_only: boolean;
	newsletter_broker_id: number | null;
}

/**
 * Propstack broker (Makler).
 */
export interface PropstackBroker {
	id: number;
	name: string;
	email: string;
	phone?: string;
}

/**
 * Propstack contact source (Kontaktquelle).
 */
export interface PropstackContactSource {
	id: number;
	name: string;
}

/**
 * Propstack activity type.
 */
export interface PropstackActivityType {
	id: number;
	name: string;
	category?: string;
}

/**
 * Result from Propstack connection test.
 */
export interface PropstackTestResult {
	success: boolean;
	broker_count?: number;
	error?: string;
}
