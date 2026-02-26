/**
 * Tests for CityStep component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CityStep } from '@modules/rent-calculator/src/steps/CityStep';
import type { CityOption } from '@modules/rent-calculator/src/types';

const mockCities: CityOption[] = [
	{ id: 1, name: 'München', slug: 'muenchen' },
	{ id: 2, name: 'Berlin', slug: 'berlin' },
	{ id: 3, name: 'Hamburg', slug: 'hamburg' },
];

describe('CityStep', () => {
	const defaultProps = {
		data: {},
		updateData: vi.fn(),
		errors: {},
		cities: mockCities,
	};

	it('rendert Titel und Dropdown', () => {
		render(<CityStep {...defaultProps} />);

		expect(screen.getByRole('heading')).toBeInTheDocument();
		expect(screen.getByLabelText(/Standort/)).toBeInTheDocument();
	});

	it('zeigt alle Städte als Optionen', () => {
		render(<CityStep {...defaultProps} />);

		expect(screen.getByText('München')).toBeInTheDocument();
		expect(screen.getByText('Berlin')).toBeInTheDocument();
		expect(screen.getByText('Hamburg')).toBeInTheDocument();
	});

	it('zeigt Bitte wählen als erste Option', () => {
		render(<CityStep {...defaultProps} />);

		const select = screen.getByLabelText(/Standort/) as HTMLSelectElement;
		expect(select.options[0].text).toBe('Bitte wählen');
	});

	it('ruft updateData mit Stadt-Daten bei Auswahl auf', () => {
		const updateData = vi.fn();
		render(<CityStep {...defaultProps} updateData={updateData} />);

		fireEvent.change(screen.getByLabelText(/Standort/), { target: { value: '1' } });

		expect(updateData).toHaveBeenCalledWith({
			city_id: 1,
			city_name: 'München',
			city_slug: 'muenchen',
		});
	});

	it('setzt Stadt-Daten zurück bei leerer Auswahl', () => {
		const updateData = vi.fn();
		render(<CityStep {...defaultProps} updateData={updateData} data={{ city_id: 1 }} />);

		fireEvent.change(screen.getByLabelText(/Standort/), { target: { value: '' } });

		expect(updateData).toHaveBeenCalledWith({
			city_id: undefined,
			city_name: undefined,
			city_slug: undefined,
		});
	});

	it('zeigt bestehende Auswahl an', () => {
		render(<CityStep {...defaultProps} data={{ city_id: 2 }} />);

		expect(screen.getByLabelText(/Standort/)).toHaveValue('2');
	});

	it('zeigt Fehler an', () => {
		render(
			<CityStep {...defaultProps} errors={{ city_id: 'Bitte wählen Sie einen Standort.' }} />,
		);

		expect(screen.getByRole('alert')).toHaveTextContent('Bitte wählen Sie einen Standort.');
	});

	it('rendert keine Fehlermeldung wenn keine Fehler', () => {
		render(<CityStep {...defaultProps} />);

		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});
});
