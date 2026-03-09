import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Settings } from '@admin/pages/Settings';

// ─── Mock Data ──────────────────────────────────────────

const mockAgentData = {
	company_name: 'Test Immobilien GmbH',
	agent_name: 'Max Makler',
	agent_email: 'max@immobilien.de',
	agent_phone: '+49 30 12345',
	agent_title: 'Geschäftsführer',
	agent_photo_url: '',
	company_logo_url: '',
	company_website: 'https://test-immobilien.de',
	company_address: 'Teststraße 1, 10115 Berlin',
};

const mockBranding = {
	primary_color: '#a9e43f',
	secondary_color: '#1e303a',
	accent_color: '#3b82f6',
	logo_url: '',
	powered_by_enabled: true,
	powered_by_text: 'Powered by RESA',
	custom_css: '',
};

const mockMapSettings = {
	tile_style: 'osm' as const,
	default_zoom: 13,
	default_lat: 52.52,
	default_lng: 13.405,
	mapbox_api_key: '',
	google_maps_api_key: '',
};

const mockTeamMembers: unknown[] = [];
const mockLocations = [{ id: 1, name: 'Berlin', slug: 'berlin', is_active: true }];

// ─── Mocks ──────────────────────────────────────────────

vi.mock('@admin/hooks/useAgentData', () => ({
	useAgentData: vi.fn(() => ({
		data: mockAgentData,
		isLoading: false,
		error: null,
	})),
	useSaveAgentData: vi.fn(() => ({
		mutate: vi.fn(),
		mutateAsync: vi.fn(),
		isPending: false,
	})),
}));

vi.mock('@admin/hooks/useBranding', () => ({
	useBranding: vi.fn(() => ({
		data: mockBranding,
		isLoading: false,
	})),
	useSaveBranding: vi.fn(() => ({
		mutate: vi.fn(),
		mutateAsync: vi.fn(),
		isPending: false,
	})),
}));

vi.mock('@admin/hooks/useMapSettings', () => ({
	useMapSettings: vi.fn(() => ({
		data: mockMapSettings,
		isLoading: false,
	})),
	useSaveMapSettings: vi.fn(() => ({
		mutate: vi.fn(),
		mutateAsync: vi.fn(),
		isPending: false,
	})),
}));

vi.mock('@admin/hooks/useTeam', () => ({
	useTeamMembers: vi.fn(() => ({
		data: mockTeamMembers,
		isLoading: false,
	})),
	useCreateTeamMember: vi.fn(() => ({
		mutateAsync: vi.fn(),
		isPending: false,
	})),
	useUpdateTeamMember: vi.fn(() => ({
		mutateAsync: vi.fn(),
		isPending: false,
	})),
	useDeleteTeamMember: vi.fn(() => ({
		mutateAsync: vi.fn(),
		isPending: false,
	})),
}));

vi.mock('@admin/hooks/useLocations', () => ({
	useLocations: vi.fn(() => ({
		data: mockLocations,
		isLoading: false,
	})),
}));

vi.mock('@admin/hooks/usePdfSettings', () => ({
	usePdfSettings: vi.fn(() => ({
		data: { engine: 'dompdf', colors: {} },
		isLoading: false,
	})),
}));

vi.mock('@admin/lib/toast', () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock('@admin/components/settings/TrackingTab', () => ({
	TrackingTab: () => <div data-testid="tracking-tab">Tracking-Inhalt</div>,
}));

vi.mock('@admin/components/settings/GdprTab', () => ({
	GdprTab: () => <div data-testid="gdpr-tab">DSGVO-Inhalt</div>,
}));

vi.mock('@admin/components/communication/TemplatesTab', () => ({
	TemplatesTab: ({ onEdit }: { onEdit: (id: string) => void }) => (
		<div data-testid="templates-tab">
			<button onClick={() => onEdit('template-1')}>Template bearbeiten</button>
		</div>
	),
}));

vi.mock('@admin/components/communication/TemplateEditor', () => ({
	TemplateEditor: ({ onBack }: { onBack: () => void }) => (
		<div data-testid="template-editor">
			<button onClick={onBack}>Zurück</button>
		</div>
	),
}));

vi.mock('@admin/pages/PdfTemplates', () => ({
	BaseLayoutTab: () => <div data-testid="pdf-tab">PDF-Layout-Inhalt</div>,
}));

// ─── Helpers ────────────────────────────────────────────

function renderSettings() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter>
				<Settings />
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
		page: 'resa-settings',
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
		locationCount: 1,
		siteName: 'Test Site',
		adminEmail: 'admin@test.de',
		integrationTabs: [],
	};
});

// ─── Tests ──────────────────────────────────────────────

describe('Settings Page', () => {
	describe('Rendering', () => {
		it('zeigt den Seitentitel "Einstellungen"', () => {
			renderSettings();
			expect(screen.getByText('Einstellungen')).toBeInTheDocument();
		});

		it('zeigt die Seitenbeschreibung', () => {
			renderSettings();
			expect(
				screen.getByText('Maklerdaten, Vorlagen, Tracking und weitere Einstellungen.'),
			).toBeInTheDocument();
		});
	});

	describe('Tab-Navigation', () => {
		it('zeigt alle sieben Tabs', () => {
			renderSettings();
			// Use getAllByText for "Maklerdaten" which appears in both tab and form heading
			expect(screen.getAllByText('Maklerdaten').length).toBeGreaterThanOrEqual(1);
			expect(screen.getByText('Team')).toBeInTheDocument();
			expect(screen.getByText('Karten')).toBeInTheDocument();
			expect(screen.getByText('Tracking')).toBeInTheDocument();
			expect(screen.getByText('Datenschutz')).toBeInTheDocument();
			expect(screen.getByText('PDF-Vorlagen')).toBeInTheDocument();
			expect(screen.getByText('E-Mail-Vorlagen')).toBeInTheDocument();
		});

		it('zeigt standardmäßig den Maklerdaten-Tab', () => {
			renderSettings();
			// Agent tab is active by default - should show loading or form
			const tabs = screen.getAllByRole('tab');
			const agentTab = tabs.find((t) => t.getAttribute('data-state') === 'active');
			expect(agentTab?.textContent).toContain('Maklerdaten');
		});

		it('wechselt zum Tracking-Tab beim Klick', async () => {
			const user = userEvent.setup();
			renderSettings();

			await user.click(screen.getByText('Tracking'));
			expect(screen.getByTestId('tracking-tab')).toBeInTheDocument();
		});

		it('wechselt zum Datenschutz-Tab beim Klick', async () => {
			const user = userEvent.setup();
			renderSettings();

			await user.click(screen.getByText('Datenschutz'));
			expect(screen.getByTestId('gdpr-tab')).toBeInTheDocument();
		});

		it('wechselt zum E-Mail-Vorlagen-Tab beim Klick', async () => {
			const user = userEvent.setup();
			renderSettings();

			await user.click(screen.getByText('E-Mail-Vorlagen'));
			expect(screen.getByTestId('templates-tab')).toBeInTheDocument();
		});

		it('wechselt zum PDF-Vorlagen-Tab beim Klick', async () => {
			const user = userEvent.setup();
			renderSettings();

			await user.click(screen.getByText('PDF-Vorlagen'));
			expect(screen.getByTestId('pdf-tab')).toBeInTheDocument();
		});
	});

	describe('Template-Editor Overlay', () => {
		it('öffnet den Template-Editor beim Klick auf "Template bearbeiten"', async () => {
			const user = userEvent.setup();
			renderSettings();

			// Switch to email tab
			await user.click(screen.getByText('E-Mail-Vorlagen'));
			// Click edit button
			await user.click(screen.getByText('Template bearbeiten'));

			expect(screen.getByTestId('template-editor')).toBeInTheDocument();
		});

		it('schließt den Template-Editor beim Klick auf "Zurück"', async () => {
			const user = userEvent.setup();
			renderSettings();

			// Open template editor
			await user.click(screen.getByText('E-Mail-Vorlagen'));
			await user.click(screen.getByText('Template bearbeiten'));
			expect(screen.getByTestId('template-editor')).toBeInTheDocument();

			// Close it
			await user.click(screen.getByText('Zurück'));
			expect(screen.queryByTestId('template-editor')).not.toBeInTheDocument();
		});
	});

	describe('Maklerdaten-Tab (Agent)', () => {
		it('zeigt vorausgefüllte Felder aus den API-Daten', () => {
			renderSettings();
			// The form should show agent data
			const inputs = screen.getAllByRole('textbox');
			expect(inputs.length).toBeGreaterThan(0);
		});
	});

	describe('Team-Tab', () => {
		it('wechselt zum Team-Tab', async () => {
			const user = userEvent.setup();
			renderSettings();

			const teamTab = screen.getByRole('tab', { name: 'Team' });
			await user.click(teamTab);
			expect(teamTab).toHaveAttribute('data-state', 'active');
		});
	});

	describe('Karten-Tab', () => {
		it('wechselt zum Karten-Tab', async () => {
			const user = userEvent.setup();
			renderSettings();

			const mapsTab = screen.getByRole('tab', { name: 'Karten' });
			await user.click(mapsTab);
			expect(mapsTab).toHaveAttribute('data-state', 'active');
		});
	});
});
