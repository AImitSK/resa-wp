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
		expect(screen.getByRole('heading', { level: 2, name: 'Dashboard' })).toBeInTheDocument();
		expect(screen.getByText(/Leads gesamt/)).toBeInTheDocument();
	});

	it('rendert die Leads-Seite wenn page=resa-leads', () => {
		window.resaAdmin.page = 'resa-leads';
		render(<App />);
		expect(screen.getByRole('heading', { level: 2, name: 'Leads' })).toBeInTheDocument();
		expect(
			screen.getByText(/Verwalte und bearbeite deine eingegangenen Leads/),
		).toBeInTheDocument();
	});

	it('rendert die Smart Assets-Seite wenn page=resa-modules', () => {
		window.resaAdmin.page = 'resa-modules';
		render(<App />);
		expect(screen.getByRole('heading', { level: 2, name: 'Smart Assets' })).toBeInTheDocument();
	});

	it('rendert die Locations-Seite wenn page=resa-locations', () => {
		window.resaAdmin.page = 'resa-locations';
		render(<App />);
		// Die Locations-Seite zeigt immer die Überschrift "Standorte", auch während des Ladens
		expect(screen.getByRole('heading', { level: 2, name: 'Standorte' })).toBeInTheDocument();
	});

	it('rendert die Analytics-Seite wenn page=resa-analytics', () => {
		window.resaAdmin.page = 'resa-analytics';
		render(<App />);
		expect(screen.getByRole('heading', { level: 2, name: 'Analytics' })).toBeInTheDocument();
	});

	it('rendert die Vorlagen-Seite wenn page=resa-templates', () => {
		window.resaAdmin.page = 'resa-templates';
		render(<App />);
		expect(screen.getByRole('heading', { level: 2, name: 'Vorlagen' })).toBeInTheDocument();
	});

	it('rendert die Integrationen-Seite wenn page=resa-integrations', () => {
		window.resaAdmin.page = 'resa-integrations';
		render(<App />);
		expect(
			screen.getByRole('heading', { level: 2, name: 'Integrationen' }),
		).toBeInTheDocument();
	});

	it('rendert die Einstellungen-Seite wenn page=resa-settings', () => {
		window.resaAdmin.page = 'resa-settings';
		render(<App />);
		expect(
			screen.getByRole('heading', { level: 2, name: 'Einstellungen' }),
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
