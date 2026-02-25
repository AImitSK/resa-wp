/**
 * Tests for the RentResult component.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RentResult } from '@modules/rent-calculator/src/result/RentResult';
import type { RentCalculationResult, RentCalculatorData } from '@modules/rent-calculator/src/types';

const mockResult: RentCalculationResult = {
	monthly_rent: { estimate: 1285, low: 1092, high: 1478 },
	annual_rent: 15420,
	price_per_sqm: 18.36,
	market_position: { percentile: 65, label: 'Überdurchschnittlich' },
	city: { id: 1, name: 'München', slug: 'muenchen' },
	factors: {
		base_price: 14.0,
		size_factor: 1.0,
		location_impact: 1.1,
		condition_impact: 1.0,
		type_impact: 1.0,
		age_impact: 1.0,
		feature_premium: 1.0,
		features_count: 2,
	},
};

const mockInputs: RentCalculatorData = {
	property_type: 'apartment',
	size: 70,
	city_id: 1,
	city_name: 'München',
	condition: 'good',
	location_rating: 4,
	features: ['balcony', 'fitted_kitchen'],
};

describe('RentResult', () => {
	it('renders monthly rent estimate', () => {
		render(<RentResult result={mockResult} inputs={mockInputs} />);
		// German formatting: 1.285 €
		expect(screen.getByText(/1\.285/)).toBeInTheDocument();
	});

	it('renders market position label', () => {
		render(<RentResult result={mockResult} inputs={mockInputs} />);
		expect(screen.getByText('Überdurchschnittlich')).toBeInTheDocument();
	});

	it('renders input summary', () => {
		render(<RentResult result={mockResult} inputs={mockInputs} />);
		expect(screen.getByText(/Wohnung/)).toBeInTheDocument();
		expect(screen.getByText(/70 m²/)).toBeInTheDocument();
		expect(screen.getByText(/München/)).toBeInTheDocument();
	});

	it('renders feature list', () => {
		render(<RentResult result={mockResult} inputs={mockInputs} />);
		expect(screen.getByText(/Balkon/)).toBeInTheDocument();
		expect(screen.getByText(/Einbauküche/)).toBeInTheDocument();
	});

	it('renders agent hint', () => {
		render(<RentResult result={mockResult} inputs={mockInputs} />);
		expect(screen.getByText(/Immobilienexperte analysiert/)).toBeInTheDocument();
	});
});
