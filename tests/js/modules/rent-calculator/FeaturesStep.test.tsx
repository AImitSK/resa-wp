/**
 * Tests for FeaturesStep component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeaturesStep } from '@modules/rent-calculator/src/steps/FeaturesStep';

describe('FeaturesStep', () => {
	const defaultProps = {
		data: {},
		updateData: vi.fn(),
		errors: {},
	};

	it('rendert Titel und Features', () => {
		render(<FeaturesStep {...defaultProps} />);

		expect(screen.getByRole('heading')).toBeInTheDocument();
		expect(screen.getByText('Balkon')).toBeInTheDocument();
		expect(screen.getByText('Terrasse')).toBeInTheDocument();
		expect(screen.getByText('Garten')).toBeInTheDocument();
	});

	it('rendert alle Standard-Features', () => {
		render(<FeaturesStep {...defaultProps} />);

		expect(screen.getByText('Aufzug')).toBeInTheDocument();
		expect(screen.getByText('Stellplatz')).toBeInTheDocument();
		expect(screen.getByText('Garage')).toBeInTheDocument();
		expect(screen.getByText('Keller')).toBeInTheDocument();
		expect(screen.getByText('Einbauküche')).toBeInTheDocument();
		expect(screen.getByText('Fußbodenheizung')).toBeInTheDocument();
		expect(screen.getByText('Gäste-WC')).toBeInTheDocument();
		expect(screen.getByText('Barrierefrei')).toBeInTheDocument();
	});

	it('ruft updateData bei Feature-Auswahl auf', () => {
		const updateData = vi.fn();
		render(<FeaturesStep {...defaultProps} updateData={updateData} />);

		fireEvent.click(screen.getByText('Balkon'));

		expect(updateData).toHaveBeenCalledWith({ features: ['balcony'] });
	});

	it('fügt Feature zur bestehenden Auswahl hinzu', () => {
		const updateData = vi.fn();
		render(
			<FeaturesStep
				{...defaultProps}
				updateData={updateData}
				data={{ features: ['balcony'] }}
			/>,
		);

		fireEvent.click(screen.getByText('Terrasse'));

		expect(updateData).toHaveBeenCalledWith({ features: ['balcony', 'terrace'] });
	});

	it('entfernt Feature bei erneutem Klick', () => {
		const updateData = vi.fn();
		render(
			<FeaturesStep
				{...defaultProps}
				updateData={updateData}
				data={{ features: ['balcony', 'terrace'] }}
			/>,
		);

		fireEvent.click(screen.getByText('Balkon'));

		expect(updateData).toHaveBeenCalledWith({ features: ['terrace'] });
	});

	it('markiert ausgewählte Features', () => {
		render(<FeaturesStep {...defaultProps} data={{ features: ['balcony', 'garage'] }} />);

		const balconyButton = screen.getByText('Balkon').closest('button');
		const garageButton = screen.getByText('Garage').closest('button');

		expect(balconyButton).toHaveClass('resa-border-primary');
		expect(garageButton).toHaveClass('resa-border-primary');
	});

	it('rendert Textarea für weitere Ausstattung', () => {
		render(<FeaturesStep {...defaultProps} />);

		expect(screen.getByLabelText(/Weitere Ausstattung/)).toBeInTheDocument();
	});

	it('ruft updateData bei Textarea-Eingabe auf', () => {
		const updateData = vi.fn();
		render(<FeaturesStep {...defaultProps} updateData={updateData} />);

		fireEvent.change(screen.getByLabelText(/Weitere Ausstattung/), {
			target: { value: 'Smart Home, Pool' },
		});

		expect(updateData).toHaveBeenCalledWith({ additional_features: 'Smart Home, Pool' });
	});

	it('zeigt bestehende zusätzliche Ausstattung an', () => {
		render(<FeaturesStep {...defaultProps} data={{ additional_features: 'Sauna' }} />);

		expect(screen.getByLabelText(/Weitere Ausstattung/)).toHaveValue('Sauna');
	});

	it('akzeptiert custom featureOptions', () => {
		const customFeatures = [
			{ key: 'pool', label: 'Pool', icon: 'pool' },
			{ key: 'sauna', label: 'Sauna', icon: 'sauna' },
		];

		render(<FeaturesStep {...defaultProps} featureOptions={customFeatures} />);

		expect(screen.getByText('Pool')).toBeInTheDocument();
		expect(screen.getByText('Sauna')).toBeInTheDocument();
		expect(screen.queryByText('Balkon')).not.toBeInTheDocument();
	});
});
