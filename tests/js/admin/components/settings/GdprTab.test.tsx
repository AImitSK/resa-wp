import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const mockSettings = {
	privacy_url: '',
	consent_text: 'Ich stimme der Verarbeitung meiner Daten gemäß der [Datenschutzerklärung] zu.',
	newsletter_text: 'Ja, ich möchte Markt-Updates per E-Mail erhalten.',
	lead_retention_days: 0,
	email_log_retention_days: 365,
	anonymize_instead_of_delete: false,
};

const mockSaveMutation = {
	mutate: vi.fn(),
	isPending: false,
	isSuccess: false,
};

vi.mock('@admin/hooks/usePrivacySettings', () => ({
	usePrivacySettings: () => ({
		data: mockSettings,
		isLoading: false,
	}),
	useSavePrivacySettings: () => mockSaveMutation,
}));

// Import after mock setup.
const { GdprTab } = await import('@admin/components/settings/GdprTab');

function renderWithProviders() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
		},
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter>
				<GdprTab />
			</MemoryRouter>
		</QueryClientProvider>,
	);
}

beforeEach(() => {
	window.resaAdmin = {
		restUrl: '/wp-json/resa/v1/',
		nonce: 'test-nonce',
		page: 'resa-settings',
		adminUrl: '/wp-admin/admin.php',
		pluginUrl: '/wp-content/plugins/resa/',
		version: '1.0.0',
		features: {
			plan: 'free',
			is_trial: false,
			max_modules: 2,
			max_locations: 1,
			max_leads: 50,
			can_export_leads: false,
			can_use_pdf_designer: false,
			can_use_smtp: false,
			can_remove_branding: false,
			can_use_webhooks: false,
			can_use_api_keys: false,
			can_use_messenger: false,
			can_use_advanced_tracking: false,
		},
		locationCount: 1,
		siteName: 'Test Site',
		adminEmail: 'admin@test.de',
		integrationTabs: [],
	};
});

describe('GdprTab', () => {
	it('rendert den Speichern-Button', () => {
		renderWithProviders();

		expect(screen.getByRole('button', { name: 'Speichern' })).toBeInTheDocument();
	});

	it('rendert die drei Card-Überschriften', () => {
		renderWithProviders();

		expect(screen.getByText('Einwilligung')).toBeInTheDocument();
		expect(screen.getByText('Datenaufbewahrung')).toBeInTheDocument();
		expect(screen.getByText('WordPress Privacy Tools')).toBeInTheDocument();
	});

	it('enthält Datenschutzerklärung-URL Feld', () => {
		renderWithProviders();

		expect(screen.getByLabelText('Datenschutzerklärung-URL')).toBeInTheDocument();
	});

	it('enthält Einwilligungstext Feld', () => {
		renderWithProviders();

		expect(screen.getByLabelText('Einwilligungstext')).toBeInTheDocument();
	});

	it('enthält Newsletter Opt-In Text Feld', () => {
		renderWithProviders();

		expect(screen.getByLabelText('Newsletter Opt-In Text')).toBeInTheDocument();
	});

	it('zeigt WP Privacy Tools Info-Text', () => {
		renderWithProviders();

		expect(
			screen.getByText(/RESA ist in die WordPress-Datenschutzwerkzeuge integriert/),
		).toBeInTheDocument();
	});

	it('zeigt exportierte Daten-Liste', () => {
		renderWithProviders();

		expect(screen.getByText('Exportierte Daten:')).toBeInTheDocument();
		expect(screen.getByText(/Lead-Stammdaten \(Name, E-Mail, Telefon\)/)).toBeInTheDocument();
	});

	it('zeigt Löschungs-Info', () => {
		renderWithProviders();

		expect(screen.getByText('Bei Löschung werden entfernt:')).toBeInTheDocument();
	});

	it('hat den Speichern-Button initial deaktiviert', () => {
		renderWithProviders();

		const button = screen.getByRole('button', { name: 'Speichern' });
		expect(button).toBeDisabled();
	});
});
