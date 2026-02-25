/**
 * Admin context injected by PHP via wp_localize_script.
 */
export interface ResaAdminContext {
	restUrl: string;
	nonce: string;
	page: string;
	adminUrl: string;
	version: string;
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
