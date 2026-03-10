/**
 * Tests for LocationRatingStep component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocationRatingStep } from '@frontend/components/shared/steps/LocationRatingStep';

describe('LocationRatingStep', () => {
	const defaultProps = {
		data: {},
		updateData: vi.fn(),
		errors: {},
	};

	it('rendert Titel und Slider', () => {
		render(<LocationRatingStep {...defaultProps} />);

		expect(screen.getByRole('heading')).toBeInTheDocument();
		expect(screen.getByRole('slider')).toBeInTheDocument();
	});

	it('zeigt Standard-Rating 3 an', () => {
		render(<LocationRatingStep {...defaultProps} />);

		expect(screen.getByText('3/5')).toBeInTheDocument();
		expect(screen.getByText('Gute Lage')).toBeInTheDocument();
	});

	it('zeigt bestehende Bewertung an', () => {
		render(<LocationRatingStep {...defaultProps} data={{ location_rating: 5 }} />);

		expect(screen.getByText('5/5')).toBeInTheDocument();
		expect(screen.getByText('Premium-Lage')).toBeInTheDocument();
	});

	it('zeigt Beschreibung für Rating 1', () => {
		render(<LocationRatingStep {...defaultProps} data={{ location_rating: 1 }} />);

		expect(screen.getByText('Einfache Lage')).toBeInTheDocument();
		expect(
			screen.getByText('Lärm, wenig Infrastruktur, einfache Umgebung'),
		).toBeInTheDocument();
	});

	it('zeigt Beschreibung für Rating 4', () => {
		render(<LocationRatingStep {...defaultProps} data={{ location_rating: 4 }} />);

		expect(screen.getByText('Sehr gute Lage')).toBeInTheDocument();
		expect(screen.getByText('Bevorzugte Wohngegend, gute Anbindung')).toBeInTheDocument();
	});

	it('ruft updateData bei Slider-Änderung auf', () => {
		const updateData = vi.fn();
		render(<LocationRatingStep {...defaultProps} updateData={updateData} />);

		const slider = screen.getByRole('slider');
		fireEvent.change(slider, { target: { value: '4' } });

		expect(updateData).toHaveBeenCalledWith({ location_rating: 4 });
	});

	it('zeigt Einfach und Premium Labels', () => {
		render(<LocationRatingStep {...defaultProps} />);

		expect(screen.getByText('Einfach')).toBeInTheDocument();
		expect(screen.getByText('Premium')).toBeInTheDocument();
	});

	it('zeigt Fehler an', () => {
		render(
			<LocationRatingStep
				{...defaultProps}
				errors={{ location_rating: 'Bitte bewerten Sie die Lage.' }}
			/>,
		);

		expect(screen.getByRole('alert')).toHaveTextContent('Bitte bewerten Sie die Lage.');
	});

	it('rendert keine Fehlermeldung wenn keine Fehler', () => {
		render(<LocationRatingStep {...defaultProps} />);

		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});
});
