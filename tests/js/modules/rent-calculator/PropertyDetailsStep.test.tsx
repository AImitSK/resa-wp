/**
 * Tests for PropertyDetailsStep component.
 *
 * The component uses SliderInput for all numeric fields (Wohnfläche, Zimmer, Baujahr).
 * SliderInput renders range inputs + number inputs, not labels/selects.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyDetailsStep } from '@modules/rent-calculator/src/steps/PropertyDetailsStep';

describe('PropertyDetailsStep', () => {
	const defaultProps = {
		data: {},
		updateData: vi.fn(),
		errors: {},
	};

	it('rendert Titel und alle Feld-Ueberschriften', () => {
		render(<PropertyDetailsStep {...defaultProps} />);

		expect(screen.getByText('Grunddaten der Immobilie')).toBeInTheDocument();
		expect(screen.getByText(/Wohnfläche/)).toBeInTheDocument();
		expect(screen.getByText('Zimmer')).toBeInTheDocument();
		expect(screen.getByText('Baujahr')).toBeInTheDocument();
	});

	it('rendert drei SliderInputs (range + number)', () => {
		const { container } = render(<PropertyDetailsStep {...defaultProps} />);

		// 3 range inputs (sliders)
		const sliders = container.querySelectorAll('input[type="range"]');
		expect(sliders).toHaveLength(3);

		// 3 number inputs (alternative input)
		const numberInputs = container.querySelectorAll('input[type="number"]');
		expect(numberInputs).toHaveLength(3);
	});

	it('ruft updateData bei Aenderung des Wohnflaeche-Sliders auf', () => {
		const updateData = vi.fn();
		const { container } = render(
			<PropertyDetailsStep {...defaultProps} updateData={updateData} />,
		);

		// SliderInput writes default on mount
		updateData.mockClear();

		const sliders = container.querySelectorAll('input[type="range"]');
		fireEvent.change(sliders[0], { target: { value: '85' } });

		expect(updateData).toHaveBeenCalledWith({ size: 85 });
	});

	it('ruft updateData bei Aenderung des Zimmer-Sliders auf', () => {
		const updateData = vi.fn();
		const { container } = render(
			<PropertyDetailsStep {...defaultProps} updateData={updateData} />,
		);

		updateData.mockClear();

		const sliders = container.querySelectorAll('input[type="range"]');
		fireEvent.change(sliders[1], { target: { value: '4' } });

		expect(updateData).toHaveBeenCalledWith({ rooms: 4 });
	});

	it('ruft updateData bei Aenderung des Baujahr-Sliders auf', () => {
		const updateData = vi.fn();
		const { container } = render(
			<PropertyDetailsStep {...defaultProps} updateData={updateData} />,
		);

		updateData.mockClear();

		const sliders = container.querySelectorAll('input[type="range"]');
		fireEvent.change(sliders[2], { target: { value: '2005' } });

		expect(updateData).toHaveBeenCalledWith({ year_built: 2005 });
	});

	it('zeigt bestehende Daten in den number inputs', () => {
		const { container } = render(
			<PropertyDetailsStep
				{...defaultProps}
				data={{ size: 80, rooms: 3, year_built: 2010 }}
			/>,
		);

		const numberInputs = container.querySelectorAll('input[type="number"]');
		expect(numberInputs[0]).toHaveValue(80);
		expect(numberInputs[1]).toHaveValue(3);
		expect(numberInputs[2]).toHaveValue(2010);
	});

	it('zeigt Fehler fuer Wohnflaeche an', () => {
		render(
			<PropertyDetailsStep
				{...defaultProps}
				errors={{ size: 'Wohnfläche ist erforderlich.' }}
			/>,
		);

		expect(screen.getByRole('alert')).toHaveTextContent('Wohnfläche ist erforderlich.');
	});

	it('zeigt Fehler fuer Baujahr an', () => {
		render(
			<PropertyDetailsStep
				{...defaultProps}
				errors={{ year_built: 'Ungültiges Baujahr.' }}
			/>,
		);

		expect(screen.getByRole('alert')).toHaveTextContent('Ungültiges Baujahr.');
	});

	it('schreibt Default-Werte beim Mount in wizard data', () => {
		const updateData = vi.fn();
		render(<PropertyDetailsStep {...defaultProps} updateData={updateData} />);

		// SliderInput calls onChange(default) on mount for each undefined field
		expect(updateData).toHaveBeenCalledWith({ size: 70 });
		expect(updateData).toHaveBeenCalledWith({ rooms: 3 });
		expect(updateData).toHaveBeenCalledWith({ year_built: 1990 });
	});
});
