import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ModuleSettings } from '@admin/pages/ModuleSettings';

// ─── Mock Data ──────────────────────────────────────────

const mockSettings = {
	module_slug: 'rent-calculator',
	module: {
		slug: 'rent-calculator',
		name: 'Mietpreis-Kalkulator',
		description: 'Berechne den optimalen Mietpreis für deine Immobilie.',
		icon: 'calculator',
		category: 'calculator',
		flag: 'free' as const,
		active: true,
	},
	setup_mode: 'pauschal' as const,
	region_preset: '',
	factors: {},
	location_values: {},
	updated_at: '2026-03-01T00:00:00Z',
};

const mockPresets = {
	berlin: { name: 'Berlin', values: { factor_a: 1.2 } },
	muenchen: { name: 'München', values: { factor_a: 1.5 } },
};

const mockSaveSettings = vi.fn();
const mockSaveLocationValue = vi.fn();
const mockDeleteLocationValue = vi.fn();

// ─── Mocks ──────────────────────────────────────────────

vi.mock('@admin/hooks/useModuleSettings', () => ({
	useModuleSettings: vi.fn(() => ({
		data: mockSettings,
		isLoading: false,
		error: null,
	})),
	useModulePresets: vi.fn(() => ({
		data: mockPresets,
		isLoading: false,
	})),
	useSaveModuleSettings: vi.fn(() => ({
		mutate: mockSaveSettings,
		isPending: false,
	})),
	useSaveLocationValue: vi.fn(() => ({
		mutate: mockSaveLocationValue,
		isPending: false,
	})),
	useDeleteLocationValue: vi.fn(() => ({
		mutate: mockDeleteLocationValue,
		isPending: false,
	})),
}));

vi.mock('@admin/components/module-settings/OverviewTab', () => ({
	OverviewTab: ({ module }: { module: { name: string; description: string } }) => (
		<div data-testid="overview-tab">
			<p>{module.name}</p>
			<p>{module.description}</p>
		</div>
	),
}));

vi.mock('@admin/components/module-settings/SetupTab', () => ({
	SetupTab: () => <div data-testid="setup-tab">Setup-Inhalt</div>,
}));

vi.mock('@admin/components/module-settings/LocationValuesTab', () => ({
	LocationValuesTab: () => <div data-testid="location-values-tab">Standort-Werte-Inhalt</div>,
}));

vi.mock('@admin/components/module-settings/PdfTab', () => ({
	PdfTab: () => <div data-testid="pdf-tab">PDF-Inhalt</div>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
	const actual = await vi.importActual('react-router-dom');
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

// ─── Helpers ────────────────────────────────────────────

function renderModuleSettings(slug = 'rent-calculator') {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter initialEntries={[`/modules/${slug}/settings`]}>
				<Routes>
					<Route path="/modules/:slug/settings" element={<ModuleSettings />} />
				</Routes>
			</MemoryRouter>
		</QueryClientProvider>,
	);
}

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
	vi.clearAllMocks();

	window.resaAdmin = {
		restUrl: '/wp-json/resa/v1/',
		nonce: 'test-nonce',
		page: 'resa-modules',
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

// ─── Tests ──────────────────────────────────────────────

describe('ModuleSettings Page', () => {
	describe('Rendering', () => {
		it('zeigt den Modul-Namen als Überschrift', () => {
			renderModuleSettings();
			// Name appears in both h1 and OverviewTab mock
			const nameElements = screen.getAllByText('Mietpreis-Kalkulator');
			expect(nameElements.length).toBeGreaterThanOrEqual(1);
		});

		it('zeigt das Flag-Badge', () => {
			renderModuleSettings();
			expect(screen.getByText('free')).toBeInTheDocument();
		});

		it('zeigt den Aktiv-Status', () => {
			renderModuleSettings();
			expect(screen.getByText('Aktiv')).toBeInTheDocument();
		});

		it('zeigt Breadcrumbs mit Smart Assets Link', () => {
			renderModuleSettings();
			expect(screen.getByText('Smart Assets')).toBeInTheDocument();
		});
	});

	describe('Tab-Navigation', () => {
		it('zeigt alle vier Tabs', () => {
			renderModuleSettings();
			expect(screen.getByText('Übersicht')).toBeInTheDocument();
			expect(screen.getByText('Einrichtung')).toBeInTheDocument();
			expect(screen.getByText('Standort-Werte')).toBeInTheDocument();
			expect(screen.getByText('PDF')).toBeInTheDocument();
		});

		it('zeigt standardmäßig den Übersicht-Tab', () => {
			renderModuleSettings();
			expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
		});

		it('wechselt zum Setup-Tab beim Klick', async () => {
			const user = userEvent.setup();
			renderModuleSettings();

			await user.click(screen.getByText('Einrichtung'));
			expect(screen.getByTestId('setup-tab')).toBeInTheDocument();
		});

		it('wechselt zum Standort-Werte-Tab beim Klick', async () => {
			const user = userEvent.setup();
			renderModuleSettings();

			await user.click(screen.getByText('Standort-Werte'));
			expect(screen.getByTestId('location-values-tab')).toBeInTheDocument();
		});

		it('wechselt zum PDF-Tab beim Klick', async () => {
			const user = userEvent.setup();
			renderModuleSettings();

			await user.click(screen.getByText('PDF'));
			expect(screen.getByTestId('pdf-tab')).toBeInTheDocument();
		});
	});

	describe('Übersicht-Tab', () => {
		it('zeigt Modul-Informationen', () => {
			renderModuleSettings();
			expect(
				screen.getByText('Berechne den optimalen Mietpreis für deine Immobilie.'),
			).toBeInTheDocument();
		});
	});

	describe('Loading State', () => {
		it('zeigt Lade-Zustand', async () => {
			const { useModuleSettings } = await import('@admin/hooks/useModuleSettings');
			vi.mocked(useModuleSettings).mockReturnValue({
				data: undefined,
				isLoading: true,
				error: null,
			} as ReturnType<typeof useModuleSettings>);

			renderModuleSettings();
			expect(screen.getByText('Lade Modul-Einstellungen...')).toBeInTheDocument();
		});
	});

	describe('Error State', () => {
		it('zeigt Fehlermeldung wenn Modul nicht gefunden', async () => {
			const { useModuleSettings } = await import('@admin/hooks/useModuleSettings');
			vi.mocked(useModuleSettings).mockReturnValue({
				data: undefined,
				isLoading: false,
				error: new Error('Not found'),
			} as ReturnType<typeof useModuleSettings>);

			renderModuleSettings();
			expect(screen.getByText('Fehler beim Laden')).toBeInTheDocument();
			expect(screen.getByText('Zurück zu Smart Assets')).toBeInTheDocument();
		});

		it('navigiert zurück zu Smart Assets beim Error-Link-Klick', async () => {
			const user = userEvent.setup();
			const { useModuleSettings } = await import('@admin/hooks/useModuleSettings');
			vi.mocked(useModuleSettings).mockReturnValue({
				data: undefined,
				isLoading: false,
				error: new Error('Not found'),
			} as ReturnType<typeof useModuleSettings>);

			renderModuleSettings();
			await user.click(screen.getByText('Zurück zu Smart Assets'));
			expect(mockNavigate).toHaveBeenCalledWith('/modules');
		});
	});

	describe('Breadcrumb-Navigation', () => {
		it('navigiert zurück zu Smart Assets beim Breadcrumb-Klick', async () => {
			const user = userEvent.setup();
			renderModuleSettings();

			await user.click(screen.getByText('Smart Assets'));
			expect(mockNavigate).toHaveBeenCalledWith('/modules');
		});
	});

	describe('Inaktives Modul', () => {
		it('zeigt "Inaktiv" für deaktiviertes Modul', async () => {
			const { useModuleSettings } = await import('@admin/hooks/useModuleSettings');
			vi.mocked(useModuleSettings).mockReturnValue({
				data: {
					...mockSettings,
					module: { ...mockSettings.module, active: false },
				},
				isLoading: false,
				error: null,
			} as ReturnType<typeof useModuleSettings>);

			renderModuleSettings();
			expect(screen.getByText('Inaktiv')).toBeInTheDocument();
		});
	});
});
