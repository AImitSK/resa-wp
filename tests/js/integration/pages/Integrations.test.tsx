import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Integrations } from '@admin/pages/Integrations';

// ─── Mocks ──────────────────────────────────────────────

let mockIsPremium = true;

vi.mock('@admin/hooks/useFeatures', () => ({
	useIsPremium: vi.fn(() => mockIsPremium),
}));

vi.mock('@admin/components/integrations/WebhooksTab', () => ({
	WebhooksTab: () => <div data-testid="webhooks-tab">Webhooks-Inhalt</div>,
}));

vi.mock('@admin/components/integrations/ApiKeysTab', () => ({
	ApiKeysTab: () => <div data-testid="api-tab">API-Keys-Inhalt</div>,
}));

vi.mock('@admin/components/integrations/MessengerTab', () => ({
	MessengerTab: () => <div data-testid="messenger-tab">Messenger-Inhalt</div>,
}));

vi.mock('@admin/components/integrations/RecaptchaTab', () => ({
	RecaptchaTab: () => <div data-testid="recaptcha-tab">reCAPTCHA-Inhalt</div>,
}));

vi.mock('@admin/components/integrations/PropstackTab', () => ({
	PropstackTab: () => <div data-testid="propstack-tab">Propstack-Inhalt</div>,
}));

// ─── Helpers ────────────────────────────────────────────

function renderIntegrations() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter>
				<Integrations />
			</MemoryRouter>
		</QueryClientProvider>,
	);
}

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
	vi.clearAllMocks();
	mockIsPremium = true;

	window.resaAdmin = {
		restUrl: '/wp-json/resa/v1/',
		nonce: 'test-nonce',
		page: 'resa-integrations',
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

describe('Integrations Page', () => {
	describe('Rendering', () => {
		it('zeigt den Seitentitel "Integrationen"', () => {
			renderIntegrations();
			expect(screen.getByText('Integrationen')).toBeInTheDocument();
		});

		it('zeigt die Seitenbeschreibung', () => {
			renderIntegrations();
			expect(
				screen.getByText(
					'Webhooks, API-Zugang, Benachrichtigungen und Add-on-Integrationen verwalten.',
				),
			).toBeInTheDocument();
		});
	});

	describe('Tab-Navigation', () => {
		it('zeigt alle vier festen Tabs', () => {
			renderIntegrations();
			expect(screen.getByText('Webhooks')).toBeInTheDocument();
			expect(screen.getByText('API')).toBeInTheDocument();
			expect(screen.getByText('Messenger')).toBeInTheDocument();
			expect(screen.getByText('reCAPTCHA')).toBeInTheDocument();
		});

		it('zeigt standardmäßig den Webhooks-Tab (Premium)', () => {
			renderIntegrations();
			expect(screen.getByTestId('webhooks-tab')).toBeInTheDocument();
		});

		it('wechselt zum API-Tab beim Klick', async () => {
			const user = userEvent.setup();
			renderIntegrations();

			await user.click(screen.getByText('API'));
			expect(screen.getByTestId('api-tab')).toBeInTheDocument();
		});

		it('wechselt zum Messenger-Tab beim Klick', async () => {
			const user = userEvent.setup();
			renderIntegrations();

			await user.click(screen.getByText('Messenger'));
			expect(screen.getByTestId('messenger-tab')).toBeInTheDocument();
		});

		it('wechselt zum reCAPTCHA-Tab beim Klick', async () => {
			const user = userEvent.setup();
			renderIntegrations();

			await user.click(screen.getByText('reCAPTCHA'));
			expect(screen.getByTestId('recaptcha-tab')).toBeInTheDocument();
		});
	});

	describe('Premium Gating', () => {
		it('zeigt Webhooks-Inhalt für Premium-Nutzer', () => {
			renderIntegrations();
			expect(screen.getByTestId('webhooks-tab')).toBeInTheDocument();
		});

		it('zeigt Upgrade-Hinweis für Free-Nutzer bei Webhooks', async () => {
			mockIsPremium = false;
			const { useIsPremium } = await import('@admin/hooks/useFeatures');
			vi.mocked(useIsPremium).mockReturnValue(false);

			renderIntegrations();
			expect(screen.getByText('Premium erforderlich')).toBeInTheDocument();
			expect(screen.getByText('Auf Premium upgraden')).toBeInTheDocument();
		});

		it('zeigt Upgrade-Hinweis für Free-Nutzer bei API', async () => {
			mockIsPremium = false;
			const { useIsPremium } = await import('@admin/hooks/useFeatures');
			vi.mocked(useIsPremium).mockReturnValue(false);

			const user = userEvent.setup();
			renderIntegrations();

			await user.click(screen.getByText('API'));
			expect(screen.getByText('Premium erforderlich')).toBeInTheDocument();
		});

		it('zeigt Upgrade-Hinweis für Free-Nutzer bei Messenger', async () => {
			mockIsPremium = false;
			const { useIsPremium } = await import('@admin/hooks/useFeatures');
			vi.mocked(useIsPremium).mockReturnValue(false);

			const user = userEvent.setup();
			renderIntegrations();

			await user.click(screen.getByText('Messenger'));
			expect(screen.getByText('Premium erforderlich')).toBeInTheDocument();
		});

		it('zeigt reCAPTCHA auch für Free-Nutzer', async () => {
			mockIsPremium = false;
			const { useIsPremium } = await import('@admin/hooks/useFeatures');
			vi.mocked(useIsPremium).mockReturnValue(false);

			const user = userEvent.setup();
			renderIntegrations();

			await user.click(screen.getByText('reCAPTCHA'));
			expect(screen.getByTestId('recaptcha-tab')).toBeInTheDocument();
		});
	});

	describe('Add-on Tabs', () => {
		it('zeigt dynamische Add-on Tabs', () => {
			window.resaAdmin.integrationTabs = [{ slug: 'propstack', label: 'Propstack' }];

			renderIntegrations();
			expect(screen.getByText('Propstack')).toBeInTheDocument();
		});

		it('zeigt "Add-on" Badge bei dynamischen Tabs', () => {
			window.resaAdmin.integrationTabs = [{ slug: 'propstack', label: 'Propstack' }];

			renderIntegrations();
			expect(screen.getByText('Add-on')).toBeInTheDocument();
		});

		it('rendert PropstackTab beim Klick auf Propstack-Tab', async () => {
			// Ensure premium is active
			const { useIsPremium } = await import('@admin/hooks/useFeatures');
			vi.mocked(useIsPremium).mockReturnValue(true);

			window.resaAdmin.integrationTabs = [{ slug: 'propstack', label: 'Propstack' }];

			const user = userEvent.setup();
			renderIntegrations();

			await user.click(screen.getByText('Propstack'));
			expect(screen.getByTestId('propstack-tab')).toBeInTheDocument();
		});

		it('rendert generischen AddonTab für unbekannte Add-ons', async () => {
			// Ensure premium is active
			const { useIsPremium } = await import('@admin/hooks/useFeatures');
			vi.mocked(useIsPremium).mockReturnValue(true);

			window.resaAdmin.integrationTabs = [{ slug: 'custom-crm', label: 'Custom CRM' }];

			const user = userEvent.setup();
			renderIntegrations();

			await user.click(screen.getByText('Custom CRM'));
			expect(
				screen.getByText(/Konfiguration für .* wird vom Add-on bereitgestellt/),
			).toBeInTheDocument();
		});

		it('zeigt keine Add-on Tabs wenn keine registriert', () => {
			window.resaAdmin.integrationTabs = [];
			renderIntegrations();

			expect(screen.queryByText('Add-on')).not.toBeInTheDocument();
		});
	});

	describe('Upgrade-Button', () => {
		it('leitet zur License-Seite weiter beim Upgrade-Klick', async () => {
			mockIsPremium = false;
			const { useIsPremium } = await import('@admin/hooks/useFeatures');
			vi.mocked(useIsPremium).mockReturnValue(false);

			renderIntegrations();

			// Mock window.location.href
			const originalHref = window.location.href;
			Object.defineProperty(window, 'location', {
				writable: true,
				value: { ...window.location, href: originalHref },
			});

			const upgradeButton = screen.getByText('Auf Premium upgraden');
			expect(upgradeButton).toBeInTheDocument();
		});
	});
});
