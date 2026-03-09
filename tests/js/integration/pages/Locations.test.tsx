import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Locations } from '@admin/pages/Locations';

// ─── Mock Data ──────────────────────────────────────────

const mockLocations = [
	{
		id: 1,
		name: 'Berlin',
		slug: 'berlin',
		country: 'DE',
		bundesland: 'Berlin',
		region_type: 'large_city',
		latitude: 52.52,
		longitude: 13.405,
		zoom_level: 12,
		is_active: true,
		data: { grunderwerbsteuer: 6.0, maklerprovision: 3.57 },
		created_at: '2026-01-01T00:00:00Z',
	},
	{
		id: 2,
		name: 'München',
		slug: 'muenchen',
		country: 'DE',
		bundesland: 'Bayern',
		region_type: 'large_city',
		latitude: 48.1351,
		longitude: 11.582,
		zoom_level: 12,
		is_active: true,
		data: { grunderwerbsteuer: 3.5, maklerprovision: 3.57 },
		created_at: '2026-01-02T00:00:00Z',
	},
];

const mockCreateLocation = vi.fn();
const mockUpdateLocation = vi.fn();
const mockDeleteLocation = vi.fn();

// ─── Mocks ──────────────────────────────────────────────

vi.mock('@admin/hooks/useLocations', () => ({
	useLocations: vi.fn(() => ({
		data: mockLocations,
		isLoading: false,
		error: null,
	})),
	useCreateLocation: vi.fn(() => ({
		mutateAsync: mockCreateLocation,
		isPending: false,
	})),
	useUpdateLocation: vi.fn(() => ({
		mutateAsync: mockUpdateLocation,
		isPending: false,
	})),
	useDeleteLocation: vi.fn(() => ({
		mutateAsync: mockDeleteLocation,
		isPending: false,
	})),
}));

vi.mock('@admin/hooks/useFeatures', () => ({
	useFeatures: vi.fn(() => ({
		plan: 'premium',
		max_locations: null,
	})),
	useLocationCount: vi.fn(() => 2),
}));

vi.mock('@admin/components/LocationEditor', () => ({
	LocationEditor: ({
		onSave,
		onCancel,
	}: {
		onSave: (data: unknown) => void;
		onCancel: () => void;
		initialData?: unknown;
		isSaving?: boolean;
	}) => (
		<div data-testid="location-editor">
			<button onClick={onCancel}>Abbrechen</button>
			<button
				onClick={() =>
					onSave({
						name: 'Neuer Standort',
						slug: 'neuer-standort',
						country: 'DE',
						bundesland: '',
						region_type: 'medium_city',
						latitude: 50.0,
						longitude: 10.0,
						zoom_level: 13,
						data: {},
					})
				}
			>
				Speichern
			</button>
		</div>
	),
}));

// ─── Helpers ────────────────────────────────────────────

function renderLocations() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter>
				<Locations />
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
		page: 'resa-locations',
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

describe('Locations Page', () => {
	describe('Rendering', () => {
		it('zeigt den Seitentitel "Standorte"', () => {
			renderLocations();
			expect(screen.getByText('Standorte')).toBeInTheDocument();
		});

		it('zeigt die Seitenbeschreibung', () => {
			renderLocations();
			expect(
				screen.getByText('Verwalte Städte und Regionen mit regionalen Kostensätzen.'),
			).toBeInTheDocument();
		});
	});

	describe('Toolbar', () => {
		it('zeigt den "Neuer Standort" Button', () => {
			renderLocations();
			expect(screen.getByText('Neuer Standort')).toBeInTheDocument();
		});
	});

	describe('Standort-Tabelle', () => {
		it('zeigt Tabellen-Header', () => {
			renderLocations();
			expect(screen.getByText('Name')).toBeInTheDocument();
			expect(screen.getByText('Bundesland')).toBeInTheDocument();
			expect(screen.getByText('Regionstyp')).toBeInTheDocument();
			expect(screen.getByText('GrESt')).toBeInTheDocument();
			expect(screen.getByText('Status')).toBeInTheDocument();
		});

		it('zeigt Standort-Daten', () => {
			renderLocations();
			// Berlin appears as both name and bundesland
			const berlinElements = screen.getAllByText('Berlin');
			expect(berlinElements.length).toBeGreaterThanOrEqual(1);
			expect(screen.getByText('München')).toBeInTheDocument();
		});

		it('zeigt Bundesländer', () => {
			renderLocations();
			// Note: "Berlin" exists both as name and bundesland
			expect(screen.getByText('Bayern')).toBeInTheDocument();
		});

		it('zeigt Regionstyp-Badges', () => {
			renderLocations();
			const badges = screen.getAllByText('Großstadt');
			expect(badges.length).toBe(2);
		});

		it('zeigt Grunderwerbsteuer-Werte', () => {
			renderLocations();
			expect(screen.getByText('6,0 %')).toBeInTheDocument();
			expect(screen.getByText('3,5 %')).toBeInTheDocument();
		});

		it('zeigt Aktiv-Status', () => {
			renderLocations();
			const activeLabels = screen.getAllByText('Aktiv');
			expect(activeLabels.length).toBe(2);
		});
	});

	describe('Navigation zu Create-View', () => {
		it('wechselt zur Create-View beim Klick auf "Neuer Standort"', async () => {
			const user = userEvent.setup();
			renderLocations();

			await user.click(screen.getByText('Neuer Standort'));
			expect(screen.getByTestId('location-editor')).toBeInTheDocument();
		});

		it('zeigt Breadcrumbs in der Create-View', async () => {
			const user = userEvent.setup();
			renderLocations();

			await user.click(screen.getByText('Neuer Standort'));
			expect(screen.getByText('Neuer Standort')).toBeInTheDocument();
		});
	});

	describe('Create-Flow', () => {
		it('ruft createMutation auf beim Speichern', async () => {
			const user = userEvent.setup();
			renderLocations();

			await user.click(screen.getByText('Neuer Standort'));
			await user.click(screen.getByText('Speichern'));

			expect(mockCreateLocation).toHaveBeenCalled();
		});

		it('kehrt zur Liste zurück beim Abbrechen', async () => {
			const user = userEvent.setup();
			renderLocations();

			await user.click(screen.getByText('Neuer Standort'));
			await user.click(screen.getByText('Abbrechen'));

			// Back in list view
			expect(
				screen.getByText('Verwalte Städte und Regionen mit regionalen Kostensätzen.'),
			).toBeInTheDocument();
		});
	});

	describe('Empty State', () => {
		it('zeigt Empty State wenn keine Standorte vorhanden', async () => {
			const { useLocations } = await import('@admin/hooks/useLocations');
			vi.mocked(useLocations).mockReturnValue({
				data: [],
				isLoading: false,
				error: null,
			} as ReturnType<typeof useLocations>);

			renderLocations();
			expect(screen.getByText('Keine Standorte vorhanden')).toBeInTheDocument();
			expect(
				screen.getByText('Erstelle deinen ersten Standort, um loszulegen.'),
			).toBeInTheDocument();
			expect(screen.getByText('Ersten Standort anlegen')).toBeInTheDocument();
		});
	});

	describe('Loading State', () => {
		it('zeigt Spinner wenn Standorte laden', async () => {
			const { useLocations } = await import('@admin/hooks/useLocations');
			vi.mocked(useLocations).mockReturnValue({
				data: undefined,
				isLoading: true,
				error: null,
			} as ReturnType<typeof useLocations>);

			renderLocations();
			expect(screen.getByText('Lade Standorte...')).toBeInTheDocument();
		});
	});

	describe('Error State', () => {
		it('zeigt Fehlermeldung bei API-Fehler', async () => {
			const { useLocations } = await import('@admin/hooks/useLocations');
			vi.mocked(useLocations).mockReturnValue({
				data: undefined,
				isLoading: false,
				error: new Error('Network error'),
			} as ReturnType<typeof useLocations>);

			renderLocations();
			expect(screen.getByText('Fehler beim Laden')).toBeInTheDocument();
			expect(
				screen.getByText('Die Standorte konnten nicht geladen werden.'),
			).toBeInTheDocument();
		});
	});

	describe('Free-Plan Limit', () => {
		it('zeigt Upgrade-Hinweis wenn Standort-Limit erreicht (Free Plan)', async () => {
			const { useFeatures, useLocationCount } = await import('@admin/hooks/useFeatures');
			const { useLocations } = await import('@admin/hooks/useLocations');

			// Free plan with 1 max location, and 1 existing location
			vi.mocked(useFeatures).mockReturnValue({
				plan: 'free',
				max_locations: 1,
			} as ReturnType<typeof useFeatures>);
			vi.mocked(useLocationCount).mockReturnValue(1);
			vi.mocked(useLocations).mockReturnValue({
				data: [mockLocations[0]],
				isLoading: false,
				error: null,
			} as ReturnType<typeof useLocations>);

			renderLocations();
			expect(screen.getByText('Standort-Limit erreicht')).toBeInTheDocument();
			expect(screen.getByText('Upgrade')).toBeInTheDocument();
		});

		it('deaktiviert "Neuer Standort" Button wenn Limit erreicht', async () => {
			const { useFeatures, useLocationCount } = await import('@admin/hooks/useFeatures');
			const { useLocations } = await import('@admin/hooks/useLocations');

			vi.mocked(useFeatures).mockReturnValue({
				plan: 'free',
				max_locations: 1,
			} as ReturnType<typeof useFeatures>);
			vi.mocked(useLocationCount).mockReturnValue(1);
			vi.mocked(useLocations).mockReturnValue({
				data: [mockLocations[0]],
				isLoading: false,
				error: null,
			} as ReturnType<typeof useLocations>);

			renderLocations();
			const addButton = screen.getByText('Neuer Standort').closest('button');
			expect(addButton).toBeDisabled();
		});
	});
});
