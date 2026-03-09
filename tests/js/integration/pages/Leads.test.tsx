import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Leads } from '@admin/pages/Leads';

// ─── Mock Data ──────────────────────────────────────────

const mockLeadsList = {
	page: 1,
	totalPages: 1,
	items: [
		{
			id: 1,
			sessionId: 'sess-1',
			firstName: 'Max',
			lastName: 'Mustermann',
			email: 'max@example.com',
			phone: '+49 30 12345',
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
			locationId: 2,
			locationName: 'München',
			status: 'contacted' as const,
			createdAt: '2026-03-02T14:00:00Z',
			result: null,
		},
		{
			id: 3,
			sessionId: 'sess-3',
			firstName: 'Tom',
			lastName: 'Weber',
			email: 'tom@example.com',
			phone: null,
			assetType: 'rent-calculator',
			locationId: 1,
			locationName: 'Berlin',
			status: 'qualified' as const,
			createdAt: '2026-03-03T09:00:00Z',
			result: null,
		},
	],
	total: 3,
};

const _mockLeadDetail = {
	id: 1,
	sessionId: 'sess-1',
	firstName: 'Max',
	lastName: 'Mustermann',
	email: 'max@example.com',
	phone: '+49 30 12345',
	company: 'Test GmbH',
	salutation: 'Herr',
	message: null,
	assetType: 'rent-calculator',
	locationId: 1,
	locationName: 'Berlin',
	status: 'new' as const,
	createdAt: '2026-03-01T10:00:00Z',
	updatedAt: '2026-03-01T10:00:00Z',
	completedAt: null,
	result: { rent_value: 1200 },
	inputs: { property_type: 'apartment', size: 80 },
	meta: {},
	notes: null,
	agentId: null,
	consentGiven: true,
	consentText: 'Ich stimme zu',
	consentDate: '2026-03-01T10:00:00Z',
};

const mockLeadStats = { new: 5, contacted: 3, qualified: 2, completed: 1, lost: 0 };

const mockLocations = [
	{ id: 1, name: 'Berlin', slug: 'berlin', is_active: true },
	{ id: 2, name: 'München', slug: 'muenchen', is_active: true },
];

const mockUpdateLead = vi.fn();
const mockDeleteLead = vi.fn();
const mockExportLeads = vi.fn();

// ─── Mocks ──────────────────────────────────────────────

vi.mock('@admin/hooks/useLeads', () => ({
	useLeads: vi.fn(() => ({
		data: mockLeadsList,
		isLoading: false,
		error: null,
		isSuccess: true,
	})),
	useLead: vi.fn(() => ({
		data: null,
		isLoading: false,
	})),
	useLeadStats: vi.fn(() => ({
		data: mockLeadStats,
		isLoading: false,
		error: null,
	})),
	useUpdateLead: vi.fn(() => ({
		mutate: mockUpdateLead,
		mutateAsync: mockUpdateLead,
		isPending: false,
	})),
	useDeleteLead: vi.fn(() => ({
		mutate: mockDeleteLead,
		mutateAsync: mockDeleteLead,
		isPending: false,
	})),
	useExportLeads: vi.fn(() => ({
		mutate: mockExportLeads,
		isPending: false,
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
		plan: 'premium',
		can_export_leads: true,
	})),
}));

vi.mock('@admin/hooks/usePropstack', () => ({
	useManualPropstackSync: vi.fn(() => ({
		mutate: vi.fn(),
		isPending: false,
	})),
}));

vi.mock('@admin/components/leads/LeadEmailLogSection', () => ({
	LeadEmailLogSection: () => <div data-testid="email-log">Email Log</div>,
}));

vi.mock('@admin/components/map/LeafletMapWrapper', () => ({
	LeafletMapWrapper: () => <div data-testid="leaflet-map">Map</div>,
}));

// ─── Helpers ────────────────────────────────────────────

function renderLeads() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter>
				<Leads />
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
		page: 'resa-leads',
		adminUrl: '/wp-admin/admin.php',
		pluginUrl: '/wp-content/plugins/resa/',
		version: '1.0.0',
		features: {
			plan: 'premium',
			is_trial: false,
			max_modules: null,
			max_locations: null,
			max_leads: 999,
			can_export_leads: true,
			can_use_pdf_designer: true,
			can_use_smtp: true,
			can_remove_branding: true,
			can_use_webhooks: true,
			can_use_api_keys: true,
			can_use_messenger: true,
			can_use_advanced_tracking: true,
		},
		locationCount: 2,
		siteName: 'Test Site',
		adminEmail: 'admin@test.de',
		integrationTabs: [],
	};
});

// ─── Tests ──────────────────────────────────────────────

describe('Leads Page', () => {
	describe('Rendering', () => {
		it('zeigt den Seitentitel "Leads"', () => {
			renderLeads();
			expect(screen.getByText('Leads')).toBeInTheDocument();
		});

		it('zeigt die Seitenbeschreibung', () => {
			renderLeads();
			expect(
				screen.getByText('Verwalte und bearbeite deine eingegangenen Leads.'),
			).toBeInTheDocument();
		});
	});

	describe('Status-Filter-Tabs', () => {
		it('zeigt Status-Filter-Tabs', () => {
			renderLeads();
			expect(screen.getByText('alle')).toBeInTheDocument();
			expect(screen.getByText('neu')).toBeInTheDocument();
			expect(screen.getByText('kontaktiert')).toBeInTheDocument();
			expect(screen.getByText('qualifiziert')).toBeInTheDocument();
		});
	});

	describe('Suchfeld', () => {
		it('zeigt ein Suchfeld', () => {
			renderLeads();
			expect(screen.getByPlaceholderText(/Suchen/)).toBeInTheDocument();
		});

		it('erlaubt Texteingabe im Suchfeld', async () => {
			const user = userEvent.setup();
			renderLeads();

			const searchInput = screen.getByPlaceholderText(/Suchen/);
			await user.type(searchInput, 'Max');
			expect(searchInput).toHaveValue('Max');
		});
	});

	describe('Leads-Tabelle', () => {
		it('zeigt Tabellen-Header', () => {
			renderLeads();
			expect(screen.getByText('Name')).toBeInTheDocument();
			expect(screen.getByText('E-Mail')).toBeInTheDocument();
		});

		it('zeigt Lead-Daten in der Tabelle', () => {
			renderLeads();
			expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
			expect(screen.getByText('max@example.com')).toBeInTheDocument();
			expect(screen.getByText('Anna Schmidt')).toBeInTheDocument();
			expect(screen.getByText('Tom Weber')).toBeInTheDocument();
		});

		it('zeigt Gesamtanzahl der Leads', () => {
			renderLeads();
			// Pagination shows "Seite X von Y" or total count
			expect(screen.getByText(/von/)).toBeInTheDocument();
		});
	});

	describe('Empty State', () => {
		it('zeigt Empty State wenn keine Leads vorhanden', async () => {
			const { useLeads } = await import('@admin/hooks/useLeads');
			vi.mocked(useLeads).mockReturnValue({
				data: { items: [], total: 0 },
				isLoading: false,
				error: null,
				isSuccess: true,
			} as ReturnType<typeof useLeads>);

			renderLeads();
			expect(screen.getByText(/Noch keine Leads|Keine passenden Leads/)).toBeInTheDocument();
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

			renderLeads();
			expect(screen.getByText(/Lade/)).toBeInTheDocument();
		});
	});

	describe('Error State', () => {
		it('zeigt Fehlermeldung bei API-Fehler', async () => {
			const { useLeads } = await import('@admin/hooks/useLeads');
			vi.mocked(useLeads).mockReturnValue({
				data: undefined,
				isLoading: false,
				error: new Error('API Error'),
				isSuccess: false,
			} as ReturnType<typeof useLeads>);

			renderLeads();
			expect(screen.getByText('Fehler beim Laden')).toBeInTheDocument();
		});
	});

	describe('Pagination', () => {
		it('zeigt Pagination-Steuerung', async () => {
			// Re-set mock (previous tests may have overridden it)
			const { useLeads } = await import('@admin/hooks/useLeads');
			vi.mocked(useLeads).mockReturnValue({
				data: mockLeadsList,
				isLoading: false,
				error: null,
				isSuccess: true,
			} as ReturnType<typeof useLeads>);

			renderLeads();
			// Pagination shows both row count and page info
			expect(screen.getByText(/Zeilen insgesamt/)).toBeInTheDocument();
			expect(screen.getByText(/Seite 1 von 1/)).toBeInTheDocument();
		});
	});

	describe('Export', () => {
		it('zeigt Export-Button für Premium-Nutzer', () => {
			renderLeads();
			expect(screen.getByText(/Export/)).toBeInTheDocument();
		});
	});
});
