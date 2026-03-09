import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '@admin/pages/Dashboard';

// ─── Mocks ──────────────────────────────────────────────

const mockLeadStats = { new: 5, contacted: 3, qualified: 2, completed: 1, lost: 0 };

const mockLeads = {
	items: [
		{
			id: 1,
			sessionId: 'sess-1',
			firstName: 'Max',
			lastName: 'Mustermann',
			email: 'max@example.com',
			phone: null,
			assetType: 'rent-calculator',
			locationId: 1,
			locationName: 'Berlin',
			status: 'new' as const,
			createdAt: '2026-03-01T10:00:00Z',
			result: null,
		},
		{
			id: 2,
			sessionId: 'sess-2',
			firstName: 'Anna',
			lastName: 'Schmidt',
			email: 'anna@example.com',
			phone: null,
			assetType: 'purchase-costs',
			locationId: 1,
			locationName: 'Berlin',
			status: 'contacted' as const,
			createdAt: '2026-03-02T14:00:00Z',
			result: null,
		},
	],
	total: 42,
};

const mockEmptyLeads = { items: [], total: 0 };

const mockLocations = [
	{ id: 1, name: 'Berlin', slug: 'berlin', is_active: true },
	{ id: 2, name: 'München', slug: 'muenchen', is_active: true },
];

const mockModules = [
	{ slug: 'rent-calculator', name: 'Mietpreis-Kalkulator', active: true, flag: 'free' },
	{ slug: 'purchase-costs', name: 'Kaufnebenkosten-Rechner', active: true, flag: 'pro' },
	{ slug: 'budget-calculator', name: 'Budgetrechner', active: false, flag: 'pro' },
];

vi.mock('@admin/hooks/useLeads', () => ({
	useLeads: vi.fn(() => ({
		data: mockLeads,
		isLoading: false,
		error: null,
		isSuccess: true,
	})),
	useLeadStats: vi.fn(() => ({
		data: mockLeadStats,
		isLoading: false,
		error: null,
	})),
}));

vi.mock('@admin/hooks/useLocations', () => ({
	useLocations: vi.fn(() => ({
		data: mockLocations,
		isLoading: false,
	})),
}));

vi.mock('@admin/hooks/useFeatures', () => ({
	useFeatures: vi.fn(() => ({
		plan: 'free',
		max_modules: 2,
		max_locations: 1,
	})),
}));

vi.mock('@admin/hooks/useModules', () => ({
	useModules: vi.fn(() => ({
		data: mockModules,
		isLoading: false,
	})),
}));

// ─── Helpers ────────────────────────────────────────────

function renderDashboard() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter>
				<Dashboard />
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
		page: 'resa',
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
		locationCount: 2,
		siteName: 'Test Site',
		adminEmail: 'admin@test.de',
		integrationTabs: [],
	};
});

// ─── Tests ──────────────────────────────────────────────

describe('Dashboard', () => {
	describe('Rendering', () => {
		it('zeigt den Seitentitel "Dashboard"', () => {
			renderDashboard();
			expect(screen.getByText('Dashboard')).toBeInTheDocument();
		});

		it('zeigt die Seitenbeschreibung', () => {
			renderDashboard();
			expect(
				screen.getByText('Übersicht über Leads, Standorte und aktive Assets.'),
			).toBeInTheDocument();
		});
	});

	describe('KPI Cards', () => {
		it('zeigt die Card "Leads gesamt"', () => {
			renderDashboard();
			expect(screen.getByText('Leads gesamt')).toBeInTheDocument();
		});

		it('zeigt die Card "Neue Leads" mit Anzahl', () => {
			renderDashboard();
			expect(screen.getByText('Neue Leads')).toBeInTheDocument();
			expect(screen.getByText('5')).toBeInTheDocument();
		});

		it('zeigt die Card "Standorte" mit Anzahl', () => {
			renderDashboard();
			expect(screen.getByText('Standorte')).toBeInTheDocument();
		});

		it('zeigt die Card "Smart Assets" mit aktiven Modulen', () => {
			renderDashboard();
			expect(screen.getByText('Smart Assets')).toBeInTheDocument();
		});

		it('zeigt den Plan-Badge "Free"', () => {
			renderDashboard();
			const badges = screen.getAllByText('Free');
			expect(badges.length).toBeGreaterThan(0);
		});

		it('zeigt Standort-Nutzung als Text', () => {
			renderDashboard();
			expect(screen.getByText(/aktive Städte/)).toBeInTheDocument();
		});

		it('zeigt Smart Assets-Nutzung als Text', () => {
			renderDashboard();
			// "Sie haben X / Y aktiv" matches both cards, use specific text
			expect(screen.getByText(/Sie haben \d+ \/ \d+ aktiv$/)).toBeInTheDocument();
		});
	});

	describe('Zeitraum-Picker', () => {
		it('zeigt den Standard-Zeitraum "Dieser Monat"', () => {
			renderDashboard();
			expect(screen.getByText('Dieser Monat')).toBeInTheDocument();
		});

		it('zeigt den Trend-Label für den gewählten Zeitraum', () => {
			renderDashboard();
			expect(screen.getByText('Trend diesen Monat')).toBeInTheDocument();
		});
	});

	describe('Neueste Leads Tabelle', () => {
		it('zeigt die Überschrift "Neueste Leads"', () => {
			renderDashboard();
			expect(screen.getByText('Neueste Leads')).toBeInTheDocument();
		});

		it('zeigt Tabellen-Header (Name, E-Mail, Modul, Datum, Status)', () => {
			renderDashboard();
			expect(screen.getByText('Name')).toBeInTheDocument();
			expect(screen.getByText('E-Mail')).toBeInTheDocument();
			expect(screen.getByText('Modul')).toBeInTheDocument();
			expect(screen.getByText('Datum')).toBeInTheDocument();
			expect(screen.getByText('Status')).toBeInTheDocument();
		});

		it('zeigt Lead-Daten in der Tabelle', () => {
			renderDashboard();
			expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
			expect(screen.getByText('max@example.com')).toBeInTheDocument();
			expect(screen.getByText('Anna Schmidt')).toBeInTheDocument();
			expect(screen.getByText('anna@example.com')).toBeInTheDocument();
		});

		it('zeigt Modul-Namen statt Slugs', () => {
			renderDashboard();
			expect(screen.getByText('Mietpreis-Kalkulator')).toBeInTheDocument();
			expect(screen.getByText('Kaufnebenkosten-Rechner')).toBeInTheDocument();
		});

		it('zeigt Status-Badges', () => {
			renderDashboard();
			expect(screen.getByText('Neu')).toBeInTheDocument();
			expect(screen.getByText('Kontaktiert')).toBeInTheDocument();
		});

		it('zeigt formatierte Datumsanzeige', () => {
			renderDashboard();
			expect(screen.getByText('01.03.2026')).toBeInTheDocument();
			expect(screen.getByText('02.03.2026')).toBeInTheDocument();
		});
	});

	describe('Navigation', () => {
		it('zeigt "Alle Leads anzeigen" Buttons', () => {
			renderDashboard();
			const buttons = screen.getAllByText('Alle Leads anzeigen');
			expect(buttons.length).toBeGreaterThanOrEqual(1);
		});

		it('zeigt "Einstellungen" Buttons für Standorte und Assets', () => {
			renderDashboard();
			const settingsButtons = screen.getAllByText('Einstellungen');
			expect(settingsButtons.length).toBe(2);
		});
	});

	describe('Empty State', () => {
		it('zeigt Empty State wenn keine Leads vorhanden', async () => {
			const { useLeads } = await import('@admin/hooks/useLeads');
			vi.mocked(useLeads).mockReturnValue({
				data: mockEmptyLeads,
				isLoading: false,
				error: null,
				isSuccess: true,
			} as ReturnType<typeof useLeads>);

			renderDashboard();
			expect(screen.getByText('Noch keine Leads')).toBeInTheDocument();
			expect(
				screen.getByText('Leads erscheinen hier, sobald Besucher die Formulare ausfüllen.'),
			).toBeInTheDocument();
		});
	});

	describe('Loading State', () => {
		it('zeigt Spinner wenn Leads laden', async () => {
			const { useLeads } = await import('@admin/hooks/useLeads');
			vi.mocked(useLeads).mockReturnValue({
				data: undefined,
				isLoading: true,
				error: null,
				isSuccess: false,
			} as ReturnType<typeof useLeads>);

			renderDashboard();
			expect(screen.getByText('Lade Leads...')).toBeInTheDocument();
		});
	});

	describe('Error State', () => {
		it('zeigt Fehlermeldung bei API-Fehler', async () => {
			const { useLeadStats } = await import('@admin/hooks/useLeads');
			vi.mocked(useLeadStats).mockReturnValue({
				data: undefined,
				isLoading: false,
				error: new Error('Network error'),
			} as ReturnType<typeof useLeadStats>);

			renderDashboard();
			expect(screen.getByText('Fehler beim Laden')).toBeInTheDocument();
			expect(
				screen.getByText('Die Dashboard-Daten konnten nicht geladen werden.'),
			).toBeInTheDocument();
		});
	});
});
