/**
 * Tests for AddressStep component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddressStep } from '@modules/rent-calculator/src/steps/AddressStep';

// Mock AddressInput component
vi.mock('@frontend/components/shared', () => ({
	AddressInput: vi.fn(({ value, onChange, boundTo, placeholder, error, showMap }) => (
		<div data-testid="address-input">
			<input
				type="text"
				placeholder={placeholder}
				defaultValue={value?.displayName || ''}
				aria-invalid={!!error}
				data-bound-to={boundTo?.name || ''}
				data-show-map={String(showMap)}
				data-testid="address-text-input"
			/>
			<button
				type="button"
				data-testid="select-address"
				onClick={() =>
					onChange({
						displayName: 'Teststraße 1, 80333 München',
						lat: 48.1351,
						lng: 11.582,
					})
				}
			>
				Select
			</button>
			<button type="button" data-testid="clear-address" onClick={() => onChange(null)}>
				Clear
			</button>
			{error && <p role="alert">{error}</p>}
		</div>
	)),
}));

// Mock window.resaFrontend
const mockResaFrontend = {
	restUrl: 'http://localhost/wp-json/resa/v1/',
	nonce: 'test-nonce',
};

describe('AddressStep', () => {
	const defaultProps = {
		data: {},
		updateData: vi.fn(),
		errors: {},
	};

	beforeEach(() => {
		(window as unknown as { resaFrontend: typeof mockResaFrontend }).resaFrontend =
			mockResaFrontend;
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('rendert Titel und Beschreibung', () => {
		render(<AddressStep {...defaultProps} />);

		expect(screen.getByRole('heading')).toHaveTextContent('Wo befindet sich die Immobilie?');
		expect(screen.getByText(/Adresse der Immobilie/)).toBeInTheDocument();
	});

	it('zeigt stadtspezifische Beschreibung wenn cityBounds angegeben', () => {
		render(
			<AddressStep
				{...defaultProps}
				cityBounds={{ name: 'München', lat: 48.1351, lng: 11.582 }}
			/>,
		);

		expect(screen.getByText(/Adresse in München/)).toBeInTheDocument();
	});

	it('rendert AddressInput Komponente', () => {
		render(<AddressStep {...defaultProps} />);

		expect(screen.getByTestId('address-input')).toBeInTheDocument();
	});

	it('übergibt boundTo an AddressInput', () => {
		const cityBounds = { name: 'München', lat: 48.1351, lng: 11.582 };
		render(<AddressStep {...defaultProps} cityBounds={cityBounds} />);

		const input = screen.getByTestId('address-text-input');
		expect(input).toHaveAttribute('data-bound-to', 'München');
	});

	it('ruft updateData mit Adresse bei Auswahl', () => {
		const updateData = vi.fn();
		render(<AddressStep {...defaultProps} updateData={updateData} />);

		// Click the mock select button to trigger onChange
		fireEvent.click(screen.getByTestId('select-address'));

		expect(updateData).toHaveBeenCalledWith({
			address: 'Teststraße 1, 80333 München',
			address_lat: 48.1351,
			address_lng: 11.582,
		});
	});

	it('zeigt vorhandene Adresse an', () => {
		render(
			<AddressStep
				{...defaultProps}
				data={{
					address: 'Musterstraße 5, 80333 München',
					address_lat: 48.1355,
					address_lng: 11.5825,
				}}
			/>,
		);

		const input = screen.getByTestId('address-text-input');
		expect(input).toHaveValue('Musterstraße 5, 80333 München');
	});

	it('zeigt Fehlermeldung an', () => {
		render(
			<AddressStep
				{...defaultProps}
				errors={{ address: 'Bitte wählen Sie eine Adresse aus den Vorschlägen.' }}
			/>,
		);

		expect(screen.getByRole('alert')).toHaveTextContent(
			'Bitte wählen Sie eine Adresse aus den Vorschlägen.',
		);
	});

	it('zeigt Hinweis zum Überspringen', () => {
		render(<AddressStep {...defaultProps} />);

		expect(screen.getByText(/können diesen Schritt überspringen/)).toBeInTheDocument();
	});

	it('ruft updateData mit undefined Werten auf bei Löschen', () => {
		const updateData = vi.fn();
		render(
			<AddressStep
				{...defaultProps}
				updateData={updateData}
				data={{
					address: 'Teststraße 1',
					address_lat: 48.1351,
					address_lng: 11.582,
				}}
			/>,
		);

		// Click the mock clear button to trigger onChange(null)
		fireEvent.click(screen.getByTestId('clear-address'));

		expect(updateData).toHaveBeenCalledWith({
			address: undefined,
			address_lat: undefined,
			address_lng: undefined,
		});
	});

	it('übergibt showMap=true an AddressInput', () => {
		render(<AddressStep {...defaultProps} />);

		const input = screen.getByTestId('address-text-input');
		expect(input).toHaveAttribute('data-show-map', 'true');
	});
});
