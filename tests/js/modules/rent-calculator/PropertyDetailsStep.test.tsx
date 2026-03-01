/**
 * Tests for PropertyDetailsStep component.
 *
 * Note: The rooms field uses Radix UI Select which renders differently
 * from native HTML select elements.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
		// Radix UI Select uses combobox role
		expect(screen.getByRole('combobox')).toBeInTheDocument();
		expect(screen.getByLabelText(/Baujahr/)).toBeInTheDocument();
	});

	it('ruft updateData bei Eingabe Wohnfläche auf', () => {
		const updateData = vi.fn();
		render(<PropertyDetailsStep {...defaultProps} updateData={updateData} />);

		fireEvent.change(screen.getByLabelText(/Wohnfläche/), { target: { value: '75' } });

		expect(updateData).toHaveBeenCalledWith({ size: 75 });
	});

	it('ruft updateData bei Auswahl Zimmer auf', async () => {
		const user = userEvent.setup();
		const updateData = vi.fn();
		render(<PropertyDetailsStep {...defaultProps} updateData={updateData} />);

		// Click to open dropdown
		await user.click(screen.getByRole('combobox'));

		// Wait for options and click "3"
		await waitFor(() => {
			expect(screen.getByRole('option', { name: '3' })).toBeInTheDocument();
		});
		await user.click(screen.getByRole('option', { name: '3' }));

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
		// Radix UI Select shows selected value in the trigger
		expect(screen.getByRole('combobox')).toHaveTextContent('3');
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
