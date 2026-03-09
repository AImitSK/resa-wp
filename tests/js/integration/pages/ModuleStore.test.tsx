import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ModuleStore } from '@admin/pages/ModuleStore';

// ─── Mock Data ──────────────────────────────────────────

const mockModules = [
	{
		slug: 'rent-calculator',
		name: 'Mietpreis-Kalkulator',
		description: 'Berechne den optimalen Mietpreis für deine Immobilie.',
		icon: 'calculator',
		category: 'calculator',
		flag: 'free' as const,
		active: true,
	},
	{
		slug: 'purchase-costs',
		name: 'Kaufnebenkosten-Rechner',
		description: 'Berechne alle Nebenkosten beim Immobilienkauf.',
		icon: 'bar-chart',
		category: 'calculator',
		flag: 'pro' as const,
		active: true,
	},
	{
		slug: 'budget-calculator',
		name: 'Budgetrechner',
		description: 'Ermittle das maximale Kaufbudget deines Interessenten.',
		icon: 'calculator',
		category: 'calculator',
		flag: 'pro' as const,
		active: false,
	},
	{
		slug: 'energy-check',
		name: 'Energieeffizienz-Check',
		description: 'Analyse der Energieeffizienz einer Immobilie.',
		icon: 'zap',
		category: 'check',
		flag: 'pro' as const,
		active: false,
	},
];

const mockToggle = vi.fn();

// ─── Mocks ──────────────────────────────────────────────

vi.mock('@admin/hooks/useModules', () => ({
	useModules: vi.fn(() => ({
		data: mockModules,
		isLoading: false,
		error: null,
	})),
	useToggleModule: vi.fn(() => ({
		mutate: mockToggle,
		isPending: false,
	})),
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

function renderModuleStore() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter>
				<ModuleStore />
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

describe('ModuleStore Page', () => {
	describe('Rendering', () => {
		it('zeigt den Seitentitel "Smart Assets"', () => {
			renderModuleStore();
			expect(screen.getByText('Smart Assets')).toBeInTheDocument();
		});

		it('zeigt die Seitenbeschreibung', () => {
			renderModuleStore();
			expect(
				screen.getByText('Aktiviere und konfiguriere deine Lead-Tools.'),
			).toBeInTheDocument();
		});
	});

	describe('Filter Tabs', () => {
		it('zeigt alle drei Filter-Tabs', () => {
			renderModuleStore();
			// Filter tabs with count badges
			const tabs = screen.getAllByRole('tab');
			expect(tabs.length).toBeGreaterThanOrEqual(3);
		});

		it('zeigt korrekte Anzahl-Badges', () => {
			renderModuleStore();
			// Total: 4, Free: 1, Premium: 3
			expect(screen.getByText('4')).toBeInTheDocument();
			expect(screen.getByText('1')).toBeInTheDocument();
			expect(screen.getByText('3')).toBeInTheDocument();
		});

		it('filtert Module nach "free"', async () => {
			const user = userEvent.setup();
			renderModuleStore();

			// Click the "free" filter tab (not the badge inside module cards)
			const freeTab = screen
				.getAllByRole('tab')
				.find((tab) => tab.textContent?.includes('free'));
			expect(freeTab).toBeDefined();
			await user.click(freeTab!);

			expect(screen.getByText('Mietpreis-Kalkulator')).toBeInTheDocument();
			expect(screen.queryByText('Kaufnebenkosten-Rechner')).not.toBeInTheDocument();
			expect(screen.queryByText('Budgetrechner')).not.toBeInTheDocument();
		});

		it('filtert Module nach "premium"', async () => {
			const user = userEvent.setup();
			renderModuleStore();

			await user.click(screen.getByText(/premium/));

			expect(screen.queryByText('Mietpreis-Kalkulator')).not.toBeInTheDocument();
			expect(screen.getByText('Kaufnebenkosten-Rechner')).toBeInTheDocument();
			expect(screen.getByText('Budgetrechner')).toBeInTheDocument();
		});
	});

	describe('Suche', () => {
		it('zeigt Suchfeld', () => {
			renderModuleStore();
			expect(screen.getByPlaceholderText('Suchen...')).toBeInTheDocument();
		});

		it('filtert Module nach Suchbegriff', async () => {
			const user = userEvent.setup();
			renderModuleStore();

			await user.type(screen.getByPlaceholderText('Suchen...'), 'Budget');

			expect(screen.getByText('Budgetrechner')).toBeInTheDocument();
			expect(screen.queryByText('Mietpreis-Kalkulator')).not.toBeInTheDocument();
		});

		it('zeigt leeren Zustand wenn Suche keine Treffer hat', async () => {
			const user = userEvent.setup();
			renderModuleStore();

			await user.type(screen.getByPlaceholderText('Suchen...'), 'xyz-nicht-vorhanden');

			expect(screen.getByText('Keine Module gefunden.')).toBeInTheDocument();
		});
	});

	describe('Modul-Cards', () => {
		it('zeigt alle Module', () => {
			renderModuleStore();
			expect(screen.getByText('Mietpreis-Kalkulator')).toBeInTheDocument();
			expect(screen.getByText('Kaufnebenkosten-Rechner')).toBeInTheDocument();
			expect(screen.getByText('Budgetrechner')).toBeInTheDocument();
			expect(screen.getByText('Energieeffizienz-Check')).toBeInTheDocument();
		});

		it('zeigt Modul-Beschreibungen', () => {
			renderModuleStore();
			expect(
				screen.getByText('Berechne den optimalen Mietpreis für deine Immobilie.'),
			).toBeInTheDocument();
		});

		it('zeigt Flag-Badges (free/Premium)', () => {
			renderModuleStore();
			// "free" badges for free module flag + filter tab
			const freeBadges = screen.getAllByText('free');
			expect(freeBadges.length).toBeGreaterThanOrEqual(1);

			const premiumBadges = screen.getAllByText('Premium');
			expect(premiumBadges.length).toBeGreaterThanOrEqual(1);
		});

		it('zeigt Aktiv/Inaktiv-Label für schaltbare Module', () => {
			renderModuleStore();
			// Only free module (rent-calculator) has a switch; pro modules show "Premium erforderlich" or switch
			const switches = screen.getAllByRole('switch');
			expect(switches.length).toBeGreaterThan(0);
		});

		it('zeigt "Premium erforderlich" für nicht-aktive Pro-Module', () => {
			renderModuleStore();
			const premiumRequired = screen.getAllByText('Premium erforderlich');
			expect(premiumRequired.length).toBeGreaterThan(0);
		});
	});

	describe('Toggle-Interaktion', () => {
		it('ruft Toggle-Mutation auf beim Switch-Klick', async () => {
			const user = userEvent.setup();
			renderModuleStore();

			// Find switch elements (active modules have switches)
			const switches = screen.getAllByRole('switch');
			expect(switches.length).toBeGreaterThan(0);

			await user.click(switches[0]);
			expect(mockToggle).toHaveBeenCalled();
		});
	});

	describe('Loading State', () => {
		it('zeigt Lade-Zustand', async () => {
			const { useModules } = await import('@admin/hooks/useModules');
			vi.mocked(useModules).mockReturnValue({
				data: undefined,
				isLoading: true,
				error: null,
			} as ReturnType<typeof useModules>);

			renderModuleStore();
			expect(screen.getByText('Module werden geladen...')).toBeInTheDocument();
		});
	});

	describe('Error State', () => {
		it('zeigt Fehlermeldung bei API-Fehler', async () => {
			const { useModules } = await import('@admin/hooks/useModules');
			vi.mocked(useModules).mockReturnValue({
				data: undefined,
				isLoading: false,
				error: new Error('Network error'),
			} as ReturnType<typeof useModules>);

			renderModuleStore();
			expect(screen.getByText('Fehler beim Laden')).toBeInTheDocument();
			expect(
				screen.getByText('Die Module konnten nicht geladen werden.'),
			).toBeInTheDocument();
		});
	});

	describe('Sortierung', () => {
		it('zeigt alle Module im default "alle" Filter', async () => {
			// Re-mock to ensure clean state
			const { useModules } = await import('@admin/hooks/useModules');
			vi.mocked(useModules).mockReturnValue({
				data: mockModules,
				isLoading: false,
				error: null,
			} as ReturnType<typeof useModules>);

			renderModuleStore();

			// All modules should be visible in "alle" filter
			expect(screen.getByText('Mietpreis-Kalkulator')).toBeInTheDocument();
			expect(screen.getByText('Kaufnebenkosten-Rechner')).toBeInTheDocument();
			expect(screen.getByText('Budgetrechner')).toBeInTheDocument();
			expect(screen.getByText('Energieeffizienz-Check')).toBeInTheDocument();
		});
	});
});
