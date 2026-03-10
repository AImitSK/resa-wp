/**
 * Tests for CityStep component.
 *
 * Note: CityStep uses Radix UI Select which renders differently from native
 * HTML select elements. Options are in a portal and require clicking to open.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CityStep } from '@frontend/components/shared/steps/CityStep';
import type { CityOption } from '@modules/rent-calculator/src/types';

const mockCities: CityOption[] = [
	{ id: 1, name: 'München', slug: 'muenchen', latitude: 48.1351, longitude: 11.582 },
	{ id: 2, name: 'Berlin', slug: 'berlin', latitude: 52.52, longitude: 13.405 },
	{ id: 3, name: 'Hamburg', slug: 'hamburg', latitude: 53.5511, longitude: 9.9937 },
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
		// Radix UI Select uses a trigger with combobox role
		expect(screen.getByRole('combobox')).toBeInTheDocument();
	});

	it('zeigt Standort Label', () => {
		render(<CityStep {...defaultProps} />);

		// Label for the select
		expect(screen.getByLabelText(/Standort/)).toBeInTheDocument();
	});

	it('zeigt Bitte wählen als Placeholder', () => {
		render(<CityStep {...defaultProps} />);

		expect(screen.getByText('Bitte wählen')).toBeInTheDocument();
	});

	it('zeigt alle Städte als Optionen beim Öffnen', async () => {
		const user = userEvent.setup();
		render(<CityStep {...defaultProps} />);

		// Click to open dropdown
		await user.click(screen.getByRole('combobox'));

		// Options should be visible
		await waitFor(() => {
			expect(screen.getByRole('option', { name: 'München' })).toBeInTheDocument();
			expect(screen.getByRole('option', { name: 'Berlin' })).toBeInTheDocument();
			expect(screen.getByRole('option', { name: 'Hamburg' })).toBeInTheDocument();
		});
	});

	it('ruft updateData mit Stadt-Daten bei Auswahl auf', async () => {
		const user = userEvent.setup();
		const updateData = vi.fn();
		render(<CityStep {...defaultProps} updateData={updateData} />);

		// Click to open dropdown
		await user.click(screen.getByRole('combobox'));

		// Click München option
		await waitFor(() => {
			expect(screen.getByRole('option', { name: 'München' })).toBeInTheDocument();
		});
		await user.click(screen.getByRole('option', { name: 'München' }));

		expect(updateData).toHaveBeenCalledWith({
			city_id: 1,
			city_name: 'München',
			city_slug: 'muenchen',
			city_lat: 48.1351,
			city_lng: 11.582,
		});
	});

	it('zeigt ausgewählte Stadt an', () => {
		render(
			<CityStep
				{...defaultProps}
				data={{ city_id: 2, city_name: 'Berlin', city_slug: 'berlin' }}
			/>,
		);

		// The trigger should show the selected city name
		expect(screen.getByRole('combobox')).toHaveTextContent('Berlin');
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

	it('zeigt Titel', () => {
		render(<CityStep {...defaultProps} />);

		expect(screen.getByRole('heading')).toHaveTextContent('In welcher Stadt?');
	});
});
