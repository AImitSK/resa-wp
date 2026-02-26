import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '@admin/App';

beforeEach(() => {
	window.resaAdmin = {
		restUrl: '/wp-json/resa/v1/',
		nonce: 'test-nonce',
		page: 'resa',
		adminUrl: '/wp-admin/admin.php',
		version: '1.0.0',
	};
});

describe('Admin App', () => {
	it('rendert das Dashboard als Startseite', () => {
		window.resaAdmin.page = 'resa';
		render(<App />);
		expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
		expect(screen.getByText(/Leads gesamt/)).toBeInTheDocument();
	});

	it('rendert die Leads-Seite wenn page=resa-leads', () => {
		window.resaAdmin.page = 'resa-leads';
		render(<App />);
		expect(screen.getByRole('heading', { level: 1, name: 'Leads' })).toBeInTheDocument();
		expect(screen.getByText(/Alle erfassten Leads/)).toBeInTheDocument();
	});

	it('rendert die Smart Assets-Seite wenn page=resa-modules', () => {
		window.resaAdmin.page = 'resa-modules';
		render(<App />);
		// Die Seite zeigt "Module werden geladen..." während des API-Calls
		expect(screen.getByText(/Module werden geladen|Smart Assets/)).toBeInTheDocument();
	});

	it('rendert die Locations-Seite wenn page=resa-locations', () => {
		window.resaAdmin.page = 'resa-locations';
		render(<App />);
		// Die Locations-Seite zeigt immer die Überschrift "Standorte", auch während des Ladens
		expect(screen.getByRole('heading', { level: 1, name: 'Standorte' })).toBeInTheDocument();
	});

	it('rendert die Kommunikation-Seite wenn page=resa-communication', () => {
		window.resaAdmin.page = 'resa-communication';
		render(<App />);
		expect(
			screen.getByRole('heading', { level: 1, name: 'Kommunikation' }),
		).toBeInTheDocument();
	});

	it('rendert die PDF-Vorlagen-Seite wenn page=resa-pdf', () => {
		window.resaAdmin.page = 'resa-pdf';
		render(<App />);
		expect(screen.getByRole('heading', { level: 1, name: 'PDF-Vorlagen' })).toBeInTheDocument();
	});

	it('rendert die Shortcode-Seite wenn page=resa-shortcode', () => {
		window.resaAdmin.page = 'resa-shortcode';
		render(<App />);
		expect(
			screen.getByRole('heading', { level: 1, name: 'Shortcode Generator' }),
		).toBeInTheDocument();
	});

	it('rendert die Integrationen-Seite wenn page=resa-integrations', () => {
		window.resaAdmin.page = 'resa-integrations';
		render(<App />);
		expect(
			screen.getByRole('heading', { level: 1, name: 'Integrationen' }),
		).toBeInTheDocument();
	});

	it('rendert die Einstellungen-Seite wenn page=resa-settings', () => {
		window.resaAdmin.page = 'resa-settings';
		render(<App />);
		expect(
			screen.getByRole('heading', { level: 1, name: 'Einstellungen' }),
		).toBeInTheDocument();
	});

	it('rendert das Layout mit Content-Bereich', () => {
		render(<App />);
		// Navigation is now handled by WordPress admin sidebar (no in-app nav).
		const main = screen.getByRole('main');
		expect(main).toBeInTheDocument();
	});

	it('fällt auf Dashboard zurück bei unbekanntem page-Slug', () => {
		window.resaAdmin.page = 'unknown-slug';
		render(<App />);
		expect(screen.getByText(/Leads gesamt/)).toBeInTheDocument();
	});
});
