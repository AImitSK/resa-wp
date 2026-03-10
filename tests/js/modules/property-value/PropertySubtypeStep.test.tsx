/**
 * Tests for PropertySubtypeStep component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertySubtypeStep } from '@modules/property-value/src/steps/PropertySubtypeStep';

const houseSubtypes = [
	{ key: 'efh', label: 'Einfamilienhaus', icon: 'einfamilienhaus' },
	{ key: 'rh', label: 'Reihenhaus', icon: 'reihenhaus' },
	{ key: 'dhh', label: 'Doppelhaushälfte', icon: 'doppelhaushaelfte' },
	{ key: 'zfh', label: 'Zweifamilienhaus', icon: 'zweifamilienhaus' },
	{ key: 'mfh', label: 'Mehrfamilienhaus', icon: 'mehrfamilienhaus' },
];

const apartmentSubtypes = [
	{ key: 'eg', label: 'Erdgeschosswohnung', icon: 'erdgeschoss' },
	{ key: 'etage', label: 'Etagenwohnung', icon: 'etagenwohnung' },
	{ key: 'dg', label: 'Dachgeschosswohnung', icon: 'dachgeschoss' },
	{ key: 'maisonette', label: 'Maisonette', icon: 'maisonette' },
	{ key: 'penthouse', label: 'Penthouse', icon: 'penthouse' },
];

const defaultProps = {
	data: { property_type: 'house' as const },
	updateData: vi.fn(),
	errors: {},
	subtypesHouse: houseSubtypes,
	subtypesApartment: apartmentSubtypes,
};

describe('PropertySubtypeStep', () => {
	it('rendert Haus-Unterarten wenn property_type house ist', () => {
		render(<PropertySubtypeStep {...defaultProps} data={{ property_type: 'house' }} />);

		expect(screen.getByText('Einfamilienhaus')).toBeInTheDocument();
		expect(screen.getByText('Reihenhaus')).toBeInTheDocument();
		expect(screen.getByText('Doppelhaushälfte')).toBeInTheDocument();
		expect(screen.getByText('Zweifamilienhaus')).toBeInTheDocument();
		expect(screen.getByText('Mehrfamilienhaus')).toBeInTheDocument();
	});

	it('rendert Wohnungs-Unterarten wenn property_type apartment ist', () => {
		render(<PropertySubtypeStep {...defaultProps} data={{ property_type: 'apartment' }} />);

		expect(screen.getByText('Erdgeschosswohnung')).toBeInTheDocument();
		expect(screen.getByText('Etagenwohnung')).toBeInTheDocument();
		expect(screen.getByText('Dachgeschosswohnung')).toBeInTheDocument();
		expect(screen.getByText('Maisonette')).toBeInTheDocument();
		expect(screen.getByText('Penthouse')).toBeInTheDocument();
	});

	it('ruft updateData bei Klick auf Unterart auf', () => {
		const updateData = vi.fn();
		render(
			<PropertySubtypeStep
				{...defaultProps}
				updateData={updateData}
				data={{ property_type: 'house' }}
			/>,
		);

		fireEvent.click(screen.getByText('Einfamilienhaus'));

		expect(updateData).toHaveBeenCalledWith({ property_subtype: 'efh' });
	});

	it('zeigt Fehlermeldung an wenn errors.property_subtype gesetzt ist', () => {
		render(
			<PropertySubtypeStep
				{...defaultProps}
				errors={{ property_subtype: 'Bitte wählen Sie eine Unterart.' }}
			/>,
		);

		expect(screen.getByRole('alert')).toHaveTextContent('Bitte wählen Sie eine Unterart.');
	});

	it('rendert keine Fehlermeldung wenn keine Fehler', () => {
		render(<PropertySubtypeStep {...defaultProps} />);

		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});
});
