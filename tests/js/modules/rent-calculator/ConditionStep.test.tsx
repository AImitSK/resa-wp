/**
 * Tests for ConditionStep component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConditionStep } from '@modules/rent-calculator/src/steps/ConditionStep';

describe('ConditionStep', () => {
	const defaultProps = {
		data: {},
		updateData: vi.fn(),
		errors: {},
	};

	it('rendert Titel und alle Optionen', () => {
		render(<ConditionStep {...defaultProps} />);

		expect(screen.getByRole('heading')).toBeInTheDocument();
		expect(screen.getByText('Neubau / Kernsaniert')).toBeInTheDocument();
		expect(screen.getByText('Kürzlich renoviert')).toBeInTheDocument();
		expect(screen.getByText('Guter Zustand')).toBeInTheDocument();
		expect(screen.getByText('Renovierungsbedürftig')).toBeInTheDocument();
	});

	it('ruft updateData bei Auswahl Neubau auf', () => {
		const updateData = vi.fn();
		render(<ConditionStep {...defaultProps} updateData={updateData} />);

		fireEvent.click(screen.getByText('Neubau / Kernsaniert'));

		expect(updateData).toHaveBeenCalledWith({ condition: 'new' });
	});

	it('ruft updateData bei Auswahl renoviert auf', () => {
		const updateData = vi.fn();
		render(<ConditionStep {...defaultProps} updateData={updateData} />);

		fireEvent.click(screen.getByText('Kürzlich renoviert'));

		expect(updateData).toHaveBeenCalledWith({ condition: 'renovated' });
	});

	it('ruft updateData bei Auswahl guter Zustand auf', () => {
		const updateData = vi.fn();
		render(<ConditionStep {...defaultProps} updateData={updateData} />);

		fireEvent.click(screen.getByText('Guter Zustand'));

		expect(updateData).toHaveBeenCalledWith({ condition: 'good' });
	});

	it('ruft updateData bei Auswahl renovierungsbedürftig auf', () => {
		const updateData = vi.fn();
		render(<ConditionStep {...defaultProps} updateData={updateData} />);

		fireEvent.click(screen.getByText('Renovierungsbedürftig'));

		expect(updateData).toHaveBeenCalledWith({ condition: 'needs_renovation' });
	});

	it('markiert ausgewählte Option', () => {
		render(<ConditionStep {...defaultProps} data={{ condition: 'good' }} />);

		const goodButton = screen.getByText('Guter Zustand').closest('button');
		expect(goodButton).toHaveClass('resa-border-primary');
	});

	it('zeigt Fehler an', () => {
		render(
			<ConditionStep
				{...defaultProps}
				errors={{ condition: 'Bitte wählen Sie den Zustand.' }}
			/>,
		);

		expect(screen.getByRole('alert')).toHaveTextContent('Bitte wählen Sie den Zustand.');
	});

	it('rendert keine Fehlermeldung wenn keine Fehler', () => {
		render(<ConditionStep {...defaultProps} />);

		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});
});
