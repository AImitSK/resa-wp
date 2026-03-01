/**
 * Tests for AddressAutocomplete component.
 *
 * Note: Tests focus on static rendering and basic interactions.
 * Async behavior with debounced API calls is complex to test
 * and is better covered by integration/e2e tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AddressAutocomplete } from '@frontend/components/map/AddressAutocomplete';

// Mock window.resaFrontend
const mockResaFrontend = {
	restUrl: 'http://localhost/wp-json/resa/v1/',
	nonce: 'test-nonce',
};

describe('AddressAutocomplete', () => {
	beforeEach(() => {
		(window as unknown as { resaFrontend: typeof mockResaFrontend }).resaFrontend =
			mockResaFrontend;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('rendert Input-Feld mit Placeholder', () => {
		render(<AddressAutocomplete onSelect={vi.fn()} />);

		const input = screen.getByRole('textbox');
		expect(input).toBeInTheDocument();
		expect(input).toHaveAttribute('placeholder', 'Straße und Hausnummer eingeben…');
	});

	it('rendert mit benutzerdefiniertem Placeholder', () => {
		render(<AddressAutocomplete onSelect={vi.fn()} placeholder="Adresse eingeben" />);

		const input = screen.getByRole('textbox');
		expect(input).toHaveAttribute('placeholder', 'Adresse eingeben');
	});

	it('zeigt Fehlermeldung an', () => {
		render(<AddressAutocomplete onSelect={vi.fn()} error="Ungültige Adresse" />);

		expect(screen.getByRole('alert')).toHaveTextContent('Ungültige Adresse');
	});

	it('deaktiviert Input wenn disabled=true', () => {
		render(<AddressAutocomplete onSelect={vi.fn()} disabled />);

		const input = screen.getByRole('textbox');
		expect(input).toBeDisabled();
	});

	it('hat korrekte ARIA-Attribute', () => {
		render(<AddressAutocomplete onSelect={vi.fn()} />);

		const input = screen.getByRole('textbox');
		expect(input).toHaveAttribute('aria-label', 'Adresssuche');
		expect(input).toHaveAttribute('aria-expanded', 'false');
		expect(input).toHaveAttribute('aria-haspopup', 'listbox');
		expect(input).toHaveAttribute('aria-autocomplete', 'list');
	});

	it('zeigt initialen Wert im Input', () => {
		render(<AddressAutocomplete onSelect={vi.fn()} value="Teststraße 1" />);

		// Check that input has value
		const input = screen.getByRole('textbox');
		expect(input).toHaveValue('Teststraße 1');
	});

	it('wendet zusätzliche className an', () => {
		const { container } = render(
			<AddressAutocomplete onSelect={vi.fn()} className="custom-class" />,
		);

		const wrapper = container.querySelector('.resa-address-autocomplete');
		expect(wrapper).toHaveClass('custom-class');
	});

	it('zeigt keinen Clear-Button wenn Input leer', () => {
		render(<AddressAutocomplete onSelect={vi.fn()} />);

		// There should be no button with "Eingabe löschen" label
		expect(screen.queryByRole('button', { name: 'Eingabe löschen' })).not.toBeInTheDocument();
	});

	it('akzeptiert boundTo Prop ohne Fehler', () => {
		// Just verify component doesn't crash with boundTo
		render(
			<AddressAutocomplete
				onSelect={vi.fn()}
				boundTo={{ name: 'München', lat: 48.1351, lng: 11.582 }}
			/>,
		);

		expect(screen.getByRole('textbox')).toBeInTheDocument();
	});
});
