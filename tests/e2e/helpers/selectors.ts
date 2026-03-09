/**
 * Zentrale Selektoren für E2E Tests.
 * Alle UI-Selektoren an einem Ort für einfache Wartung.
 */

// === Frontend Widget ===
export const widget = {
	root: '.resa-widget-root',
	progressBar: '[role="progressbar"]',
	nextButton: 'button:has-text("Weiter")',
	backButton: 'button:has-text("Zurück")',
	completeButton: 'button:has-text("Ergebnis anzeigen")',
	submitButton: 'button[type="submit"]',
	errorMessage: '[role="alert"]',
	loadingSpinner: '.resa-animate-spin',
} as const;

// === Lead Form ===
export const leadForm = {
	firstName: '#resa-firstName',
	lastName: '#resa-lastName',
	email: '#resa-email',
	phone: '#resa-phone',
	message: '#resa-message',
	consent: '#resa-consent',
	honeypot: '#resa-website',
} as const;

// === Rent Calculator Steps ===
export const rentSteps = {
	propertyTypeWohnung: 'button:has-text("Wohnung")',
	propertyTypeHaus: 'button:has-text("Haus")',
	sizeInput: '#resa-size',
	roomsSelect: '#resa-rooms',
	yearInput: '#resa-year',
} as const;

// === Admin ===
export const admin = {
	root: '#resa-admin-root',
	menuItem: (slug: string) => `a[href*="page=${slug}"]`,
	pageTitle: 'h1',
} as const;

// === Admin Navigation ===
export const adminPages = {
	dashboard: 'admin.php?page=resa',
	leads: 'admin.php?page=resa-leads',
	modules: 'admin.php?page=resa-modules',
	locations: 'admin.php?page=resa-locations',
	settings: 'admin.php?page=resa-settings',
	analytics: 'admin.php?page=resa-analytics',
	integrations: 'admin.php?page=resa-integrations',
} as const;

// === Admin Leads ===
export const adminLeads = {
	table: 'table',
	searchInput: 'input[type="search"], input[placeholder*="Such"]',
	statusTabs: '[role="tablist"]',
	deleteButton: 'button:has-text("Löschen")',
	confirmDelete: 'button:has-text("Bestätigen"), button:has-text("Ja")',
} as const;

// === Admin Locations ===
export const adminLocations = {
	addButton: 'button:has-text("Standort"), button:has-text("Hinzufügen"), button:has-text("Neu")',
	nameInput: 'input[name="name"], input[placeholder*="Name"]',
	zipInput: 'input[name="zipCode"], input[name="zip"], input[placeholder*="PLZ"]',
	regionInput: 'input[name="region"], input[placeholder*="Region"]',
	saveButton: 'button:has-text("Speichern")',
} as const;

// === Admin Modules ===
export const adminModules = {
	moduleCard: '[class*="card"], [class*="Card"]',
	toggleSwitch: '[role="switch"]',
	settingsButton: 'button:has-text("Einstellungen"), button:has-text("Konfigurieren")',
} as const;

// === Admin Settings ===
export const adminSettings = {
	tabs: '[role="tablist"]',
	tab: (name: string) => `[role="tab"]:has-text("${name}")`,
	saveButton: 'button:has-text("Speichern")',
	toast: '[data-sonner-toast], [role="status"]',
} as const;

// === WordPress ===
export const wp = {
	loginForm: '#loginform',
	usernameInput: '#user_login',
	passwordInput: '#user_pass',
	loginButton: '#wp-submit',
	loginError: '#login_error',
	adminBar: '#wpadminbar',
	logoutLink: 'a[href*="action=logout"]',
} as const;
