/**
 * Tests for PropertyDetailsStep component.
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

	it('rendert Titel und alle Felder', () => {
		render(<PropertyDetailsStep {...defaultProps} />);

		expect(screen.getByRole('heading')).toBeInTheDocument();
		expect(screen.getByLabelText(/Wohnfläche/)).toBeInTheDocument();
		expect(screen.getByLabelText(/Zimmer/)).toBeInTheDocument();
		expect(screen.getByLabelText(/Baujahr/)).toBeInTheDocument();
	});

	it('ruft updateData bei Eingabe Wohnfläche auf', () => {
		const updateData = vi.fn();
		render(<PropertyDetailsStep {...defaultProps} updateData={updateData} />);

		fireEvent.change(screen.getByLabelText(/Wohnfläche/), { target: { value: '75' } });

		expect(updateData).toHaveBeenCalledWith({ size: 75 });
	});

	it('ruft updateData bei Auswahl Zimmer auf', () => {
		const updateData = vi.fn();
		render(<PropertyDetailsStep {...defaultProps} updateData={updateData} />);

		fireEvent.change(screen.getByLabelText(/Zimmer/), { target: { value: '3' } });

		expect(updateData).toHaveBeenCalledWith({ rooms: 3 });
	});

	it('ruft updateData bei Eingabe Baujahr auf', () => {
		const updateData = vi.fn();
		render(<PropertyDetailsStep {...defaultProps} updateData={updateData} />);

		fireEvent.change(screen.getByLabelText(/Baujahr/), { target: { value: '1990' } });

		expect(updateData).toHaveBeenCalledWith({ year_built: 1990 });
	});

	it('zeigt bestehende Daten an', () => {
		render(
			<PropertyDetailsStep
				{...defaultProps}
				data={{ size: 80, rooms: 3, year_built: 2010 }}
			/>,
		);

		expect(screen.getByLabelText(/Wohnfläche/)).toHaveValue(80);
		expect(screen.getByLabelText(/Zimmer/)).toHaveValue('3');
		expect(screen.getByLabelText(/Baujahr/)).toHaveValue(2010);
	});

	it('zeigt Fehler für Wohnfläche an', () => {
		render(
			<PropertyDetailsStep
				{...defaultProps}
				errors={{ size: 'Wohnfläche ist erforderlich.' }}
			/>,
		);

		expect(screen.getByRole('alert')).toHaveTextContent('Wohnfläche ist erforderlich.');
	});

	it('zeigt Fehler für Baujahr an', () => {
		render(
			<PropertyDetailsStep
				{...defaultProps}
				errors={{ year_built: 'Ungültiges Baujahr.' }}
			/>,
		);

		expect(screen.getByRole('alert')).toHaveTextContent('Ungültiges Baujahr.');
	});

	it('setzt size auf undefined bei leerer Eingabe', () => {
		const updateData = vi.fn();
		render(
			<PropertyDetailsStep {...defaultProps} updateData={updateData} data={{ size: 70 }} />,
		);

		fireEvent.change(screen.getByLabelText(/Wohnfläche/), { target: { value: '' } });

		expect(updateData).toHaveBeenCalledWith({ size: undefined });
	});
});
