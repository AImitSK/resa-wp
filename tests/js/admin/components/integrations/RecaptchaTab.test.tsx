import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const mockSettingsDisabled = {
	enabled: false,
	site_key: '',
	secret_key: '',
	threshold: 0.5,
};

const mockSettingsEnabled = {
	enabled: true,
	site_key: '6LcTest',
	secret_key: '6LcSecret',
	threshold: 0.5,
};

const mockSaveMutation = {
	mutate: vi.fn(),
	isPending: false,
	isSuccess: false,
};

let currentMockSettings = mockSettingsDisabled;

vi.mock('@admin/hooks/useRecaptchaSettings', () => ({
	useRecaptchaSettings: () => ({
		data: currentMockSettings,
		isLoading: false,
	}),
	useSaveRecaptchaSettings: () => mockSaveMutation,
}));

// Import after mock setup.
const { RecaptchaTab } = await import('@admin/components/integrations/RecaptchaTab');

function renderWithProviders() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
		},
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter>
				<RecaptchaTab />
			</MemoryRouter>
		</QueryClientProvider>,
	);
}

beforeEach(() => {
	window.resaAdmin = {
		restUrl: '/wp-json/resa/v1/',
		nonce: 'test-nonce',
		page: 'resa-integrations',
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

describe('RecaptchaTab', () => {
	beforeEach(() => {
		currentMockSettings = mockSettingsDisabled;
	});

	it('rendert die Überschrift', () => {
		renderWithProviders();

		expect(screen.getByText('Verbindung')).toBeInTheDocument();
	});

	it('rendert den Speichern-Button', () => {
		renderWithProviders();

		expect(screen.getByRole('button', { name: 'Speichern' })).toBeInTheDocument();
	});

	it('hat den Speichern-Button initial deaktiviert', () => {
		renderWithProviders();

		const button = screen.getByRole('button', { name: 'Speichern' });
		expect(button).toBeDisabled();
	});

	it('rendert Site Key und Secret Key Felder wenn aktiviert', () => {
		currentMockSettings = mockSettingsEnabled;
		renderWithProviders();

		expect(screen.getByLabelText('Site Key')).toBeInTheDocument();
		expect(screen.getByLabelText('Secret Key')).toBeInTheDocument();
	});

	it('rendert den Score-Schwellenwert wenn aktiviert', () => {
		currentMockSettings = mockSettingsEnabled;
		renderWithProviders();

		expect(screen.getByLabelText('Score-Schwellenwert')).toBeInTheDocument();
	});

	it('rendert den Hinweis-Text mit Link wenn aktiviert', () => {
		currentMockSettings = mockSettingsEnabled;
		renderWithProviders();

		expect(screen.getByText('Google reCAPTCHA Admin Console')).toBeInTheDocument();
	});

	it('rendert den Switch', () => {
		renderWithProviders();

		expect(screen.getByRole('switch')).toBeInTheDocument();
	});
});
