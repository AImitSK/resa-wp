import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LeadForm } from '@frontend/components/shared/LeadForm';
import type { LeadFormConfig } from '@frontend/types/lead-form';

const MINIMAL_CONFIG: LeadFormConfig = {
	fields: [
		{
			slug: 'first_name',
			type: 'text',
			label: 'Vorname',
			placeholder: 'Max',
			status: 'required',
			order: 1,
		},
		{
			slug: 'email',
			type: 'email',
			label: 'E-Mail',
			placeholder: 'max@test.de',
			status: 'required',
			order: 2,
		},
		{
			slug: 'consent',
			type: 'checkbox',
			label: 'Ich stimme der [Datenschutzerklärung] zu.',
			status: 'required',
			order: 99,
		},
	],
	buttonText: 'Ergebnis anzeigen',
	privacyUrl: '/datenschutz',
	trustBadgeText: 'Ihre Daten sind sicher.',
};

describe('LeadForm', () => {
	it('rendert alle sichtbaren Felder', () => {
		render(<LeadForm config={MINIMAL_CONFIG} onSubmit={vi.fn()} />);

		expect(screen.getByLabelText(/Vorname/)).toBeInTheDocument();
		expect(screen.getByLabelText(/E-Mail/)).toBeInTheDocument();
	});

	it('rendert den Submit-Button mit konfiguriertem Text', () => {
		render(<LeadForm config={MINIMAL_CONFIG} onSubmit={vi.fn()} />);
		expect(screen.getByText('Ergebnis anzeigen')).toBeInTheDocument();
	});

	it('rendert die Trust-Badge', () => {
		render(<LeadForm config={MINIMAL_CONFIG} onSubmit={vi.fn()} />);
		expect(screen.getByText(/Ihre Daten sind sicher/)).toBeInTheDocument();
	});

	it('zeigt Pflicht-Markierung (*) für required Felder', () => {
		const { container } = render(<LeadForm config={MINIMAL_CONFIG} onSubmit={vi.fn()} />);
		const stars = container.querySelectorAll('.resa-text-destructive');
		// first_name and email are required text inputs → 2 stars.
		expect(stars.length).toBeGreaterThanOrEqual(2);
	});

	it('blendet versteckte Felder aus', () => {
		const config: LeadFormConfig = {
			...MINIMAL_CONFIG,
			fields: [
				...MINIMAL_CONFIG.fields,
				{
					slug: 'phone',
					type: 'tel',
					label: 'Telefon',
					status: 'hidden',
					order: 3,
				},
			],
		};

		render(<LeadForm config={config} onSubmit={vi.fn()} />);
		expect(screen.queryByLabelText(/Telefon/)).not.toBeInTheDocument();
	});

	it('zeigt Validierungsfehler bei leerem Submit', async () => {
		render(<LeadForm config={MINIMAL_CONFIG} onSubmit={vi.fn()} />);

		fireEvent.click(screen.getByText('Ergebnis anzeigen'));

		await waitFor(() => {
			const alerts = screen.getAllByRole('alert');
			expect(alerts.length).toBeGreaterThan(0);
		});
	});

	it('ruft onSubmit mit Daten auf bei gültigem Formular', async () => {
		const onSubmit = vi.fn();
		render(<LeadForm config={MINIMAL_CONFIG} onSubmit={onSubmit} />);

		fireEvent.change(screen.getByLabelText(/Vorname/), {
			target: { value: 'Max' },
		});
		fireEvent.change(screen.getByLabelText(/E-Mail/), {
			target: { value: 'max@test.de' },
		});
		fireEvent.click(screen.getByLabelText(/Datenschutzerklärung/));

		fireEvent.click(screen.getByText('Ergebnis anzeigen'));

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					first_name: 'Max',
					email: 'max@test.de',
					consent: true,
				}),
			);
		});
	});

	it('zeigt Ladeindikator wenn isSubmitting=true', () => {
		render(<LeadForm config={MINIMAL_CONFIG} onSubmit={vi.fn()} isSubmitting={true} />);

		expect(screen.getByText('Wird gesendet…')).toBeInTheDocument();
	});

	it('rendert Datenschutz-Link in Consent-Checkbox', () => {
		render(<LeadForm config={MINIMAL_CONFIG} onSubmit={vi.fn()} />);

		const link = screen.getByText('Datenschutzerklärung');
		expect(link).toHaveAttribute('href', '/datenschutz');
		expect(link).toHaveAttribute('target', '_blank');
	});

	it('verwendet Standardkonfiguration wenn kein config übergeben', () => {
		render(<LeadForm onSubmit={vi.fn()} />);

		// Should render default balanced preset fields.
		expect(screen.getByLabelText(/Vorname/)).toBeInTheDocument();
		expect(screen.getByPlaceholderText('max@beispiel.de')).toBeInTheDocument();
	});
});
