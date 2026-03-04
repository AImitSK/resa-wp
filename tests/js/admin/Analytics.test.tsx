import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Analytics } from '@admin/pages/Analytics';

function renderWithProviders() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
		},
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter>
				<Analytics />
			</MemoryRouter>
		</QueryClientProvider>,
	);
}

beforeEach(() => {
	window.resaAdmin = {
		restUrl: '/wp-json/resa/v1/',
		nonce: 'test-nonce',
		page: 'resa-analytics',
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

describe('Analytics', () => {
	it('rendert die Analytics-Überschrift', () => {
		renderWithProviders();

		expect(screen.getByRole('heading', { level: 2, name: 'Analytics' })).toBeInTheDocument();
	});

	it('zeigt die Filter-Leiste mit Datum-Feldern', () => {
		renderWithProviders();

		expect(screen.getByText('Von')).toBeInTheDocument();
		expect(screen.getByText('Bis')).toBeInTheDocument();
		expect(screen.getByText('Smart Asset')).toBeInTheDocument();
	});

	it('zeigt Lade-Zustand', () => {
		renderWithProviders();

		expect(screen.getByText('Daten werden geladen...')).toBeInTheDocument();
	});

	it('enthält die Beschreibung', () => {
		renderWithProviders();

		expect(screen.getByText(/Funnel-Tracking und Conversion-Daten/)).toBeInTheDocument();
	});
});
