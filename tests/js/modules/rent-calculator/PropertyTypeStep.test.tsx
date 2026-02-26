/**
 * Tests for PropertyTypeStep component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyTypeStep } from '@modules/rent-calculator/src/steps/PropertyTypeStep';

describe('PropertyTypeStep', () => {
	const defaultProps = {
		data: {},
		updateData: vi.fn(),
		errors: {},
	};

	it('rendert Titel und Optionen', () => {
		render(<PropertyTypeStep {...defaultProps} />);

		expect(screen.getByRole('heading')).toBeInTheDocument();
		expect(screen.getByText('Wohnung')).toBeInTheDocument();
		expect(screen.getByText('Haus')).toBeInTheDocument();
	});

	it('ruft updateData bei Auswahl Wohnung auf', () => {
		const updateData = vi.fn();
		render(<PropertyTypeStep {...defaultProps} updateData={updateData} />);

		fireEvent.click(screen.getByText('Wohnung'));

		expect(updateData).toHaveBeenCalledWith({ property_type: 'apartment' });
	});

	it('ruft updateData bei Auswahl Haus auf', () => {
		const updateData = vi.fn();
		render(<PropertyTypeStep {...defaultProps} updateData={updateData} />);

		fireEvent.click(screen.getByText('Haus'));

		expect(updateData).toHaveBeenCalledWith({ property_type: 'house' });
	});

	it('markiert ausgewählte Option apartment', () => {
		render(<PropertyTypeStep {...defaultProps} data={{ property_type: 'apartment' }} />);

		const apartmentButton = screen.getByText('Wohnung').closest('button');
		expect(apartmentButton).toHaveClass('resa-border-primary');
	});

	it('markiert ausgewählte Option house', () => {
		render(<PropertyTypeStep {...defaultProps} data={{ property_type: 'house' }} />);

		const houseButton = screen.getByText('Haus').closest('button');
		expect(houseButton).toHaveClass('resa-border-primary');
	});

	it('zeigt Fehler an', () => {
		render(
			<PropertyTypeStep
				{...defaultProps}
				errors={{ property_type: 'Bitte wählen Sie eine Immobilienart.' }}
			/>,
		);

		expect(screen.getByRole('alert')).toHaveTextContent('Bitte wählen Sie eine Immobilienart.');
	});

	it('rendert keine Fehlermeldung wenn keine Fehler', () => {
		render(<PropertyTypeStep {...defaultProps} />);

		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});
});
