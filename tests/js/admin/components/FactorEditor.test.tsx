import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { FactorEditor } from '@admin/components/FactorEditor';

// Wrapper to provide form context
function FactorEditorWrapper({ defaultValues }: { defaultValues?: Record<string, unknown> }) {
	const form = useForm({
		defaultValues: defaultValues ?? {
			factors: {
				base_price: 12.5,
				size_degression: 0.05,
				location_ratings: { '1': 0.85, '2': 0.95, '3': 1.0, '4': 1.1, '5': 1.25 },
				condition_multipliers: {
					new: 1.2,
					renovated: 1.05,
					good: 1.0,
					needs_renovation: 0.85,
				},
				type_multipliers: { apartment: 1.0, house: 1.1 },
				feature_premiums: {
					balcony: 0.5,
					terrace: 0.8,
					garden: 0.7,
					elevator: 0.3,
					parking: 0.4,
					garage: 0.6,
					cellar: 0.1,
					fitted_kitchen: 0.4,
					floor_heating: 0.5,
					guest_toilet: 0.2,
					barrier_free: 0.3,
				},
				age_multipliers: {
					before_1946: 0.9,
					'1946_1959': 0.85,
					'1960_1979': 0.88,
					'1980_1989': 0.92,
					'1990_1999': 0.95,
					'2000_2014': 1.0,
					'2015_plus': 1.1,
				},
			},
		},
	});

	return <FactorEditor form={form} />;
}

describe('FactorEditor', () => {
	describe('Rendering', () => {
		it('zeigt Basiswert-Felder', () => {
			render(<FactorEditorWrapper />);
			expect(screen.getByText(/Basismietpreis/)).toBeInTheDocument();
			expect(screen.getByText(/ßendegression/)).toBeInTheDocument();
		});

		it('zeigt alle 5 Faktor-Gruppen', () => {
			render(<FactorEditorWrapper />);
			expect(screen.getByText('Lage-Faktoren')).toBeInTheDocument();
			expect(screen.getByText('Zustands-Faktoren')).toBeInTheDocument();
			expect(screen.getByText('Immobilientyp-Faktoren')).toBeInTheDocument();
			expect(screen.getByText(/Ausstattungs-Zuschläge/)).toBeInTheDocument();
			expect(screen.getByText('Alter-Faktoren')).toBeInTheDocument();
		});

		it('zeigt Lage-Faktor-Items', () => {
			render(<FactorEditorWrapper />);
			expect(screen.getByText(/Einfache Lage/)).toBeInTheDocument();
			expect(screen.getByText(/Normale Lage/)).toBeInTheDocument();
			expect(screen.getByText(/Gute Lage/)).toBeInTheDocument();
			expect(screen.getByText(/Sehr gute Lage/)).toBeInTheDocument();
			expect(screen.getByText(/Premium-Lage/)).toBeInTheDocument();
		});

		it('zeigt Zustands-Faktor-Items', () => {
			render(<FactorEditorWrapper />);
			// "Neubau" appears in both condition (Neubau/Kernsaniert) and age (Neubau ab 2015)
			const neubauItems = screen.getAllByText(/Neubau/);
			expect(neubauItems.length).toBeGreaterThanOrEqual(2);
			expect(screen.getByText(/Renoviert$/)).toBeInTheDocument();
			expect(screen.getByText(/Guter Zustand/)).toBeInTheDocument();
			expect(screen.getByText(/Renovierungsbedürftig/)).toBeInTheDocument();
		});

		it('zeigt Immobilientyp-Items', () => {
			render(<FactorEditorWrapper />);
			expect(screen.getByText('Wohnung')).toBeInTheDocument();
			expect(screen.getByText('Haus')).toBeInTheDocument();
		});

		it('zeigt Alter-Faktor-Items', () => {
			render(<FactorEditorWrapper />);
			expect(screen.getByText(/Altbau/)).toBeInTheDocument();
			expect(screen.getByText(/Nachkriegsbau/)).toBeInTheDocument();
			expect(screen.getByText(/Neubau \(ab 2015\)/)).toBeInTheDocument();
		});

		it('zeigt vorausgefüllte Werte', () => {
			render(<FactorEditorWrapper />);
			expect(screen.getByDisplayValue('12.5')).toBeInTheDocument();
			expect(screen.getByDisplayValue('0.05')).toBeInTheDocument();
		});
	});

	describe('Interaktion', () => {
		it('erlaubt Änderung des Basispreises', async () => {
			const user = userEvent.setup();
			render(<FactorEditorWrapper />);

			const basePriceInput = screen.getByDisplayValue('12.5');
			await user.clear(basePriceInput);
			await user.type(basePriceInput, '15.0');
			expect(basePriceInput).toHaveValue(15.0);
		});
	});
});
