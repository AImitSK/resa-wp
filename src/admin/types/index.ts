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
