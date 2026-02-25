import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { z } from 'zod';
import { StepWizard } from '@frontend/components/shared/StepWizard';
import type { StepConfig, StepProps } from '@frontend/types/wizard';

// Simple test step components.
function Step1({ data, updateData }: StepProps) {
	return (
		<div>
			<h2>Immobilientyp</h2>
			<button type="button" onClick={() => updateData({ type: 'apartment' })}>
				Wohnung wählen
			</button>
			{data.type && <span>Gewählt: {String(data.type)}</span>}
		</div>
	);
}

function Step2({ data, updateData, errors }: StepProps) {
	return (
		<div>
			<h2>Fläche</h2>
			<input
				type="number"
				value={String(data.area ?? '')}
				onChange={(e) => updateData({ area: Number(e.target.value) })}
				aria-label="Fläche"
			/>
			{errors.area && <span role="alert">{errors.area}</span>}
		</div>
	);
}

function Step3() {
	return (
		<div>
			<h2>Zusammenfassung</h2>
		</div>
	);
}

const basicSteps: StepConfig[] = [
	{ id: 'type', label: 'Typ', component: Step1 },
	{ id: 'area', label: 'Fläche', component: Step2 },
	{ id: 'summary', label: 'Zusammenfassung', component: Step3 },
];

const stepsWithValidation: StepConfig[] = [
	{
		id: 'type',
		label: 'Typ',
		component: Step1,
		schema: z.object({ type: z.string().min(1, 'Typ ist erforderlich') }),
	},
	{
		id: 'area',
		label: 'Fläche',
		component: Step2,
		schema: z.object({
			type: z.string(),
			area: z
				.number({ invalid_type_error: 'Fläche ist erforderlich' })
				.min(10, 'Mindestens 10 m²'),
		}),
	},
	{ id: 'summary', label: 'Zusammenfassung', component: Step3 },
];

describe('StepWizard', () => {
	it('rendert den ersten Step initial', () => {
		render(<StepWizard steps={basicSteps} onComplete={vi.fn()} />);
		expect(screen.getByRole('heading', { name: 'Immobilientyp' })).toBeInTheDocument();
	});

	it('zeigt die ProgressBar', () => {
		render(<StepWizard steps={basicSteps} onComplete={vi.fn()} />);
		expect(screen.getByRole('progressbar')).toBeInTheDocument();
	});

	it('navigiert zum nächsten Step bei Klick auf Weiter', async () => {
		render(<StepWizard steps={basicSteps} onComplete={vi.fn()} />);

		fireEvent.click(screen.getByText('Weiter'));

		await waitFor(() => {
			expect(screen.getByRole('heading', { name: 'Fläche' })).toBeInTheDocument();
		});
	});

	it('navigiert zurück bei Klick auf Zurück', async () => {
		render(<StepWizard steps={basicSteps} onComplete={vi.fn()} />);

		// Go to step 2.
		fireEvent.click(screen.getByText('Weiter'));
		await waitFor(() => {
			expect(screen.getByRole('heading', { name: 'Fläche' })).toBeInTheDocument();
		});

		// Go back to step 1.
		fireEvent.click(screen.getByText('Zurück'));
		await waitFor(() => {
			expect(screen.getByRole('heading', { name: 'Immobilientyp' })).toBeInTheDocument();
		});
	});

	it('deaktiviert Zurück-Button auf erstem Step', () => {
		render(<StepWizard steps={basicSteps} onComplete={vi.fn()} />);
		const backBtn = screen.getByText('Zurück');
		expect(backBtn).toBeDisabled();
	});

	it('zeigt "Ergebnis anzeigen" auf dem letzten Step', async () => {
		render(<StepWizard steps={basicSteps} onComplete={vi.fn()} />);

		// Navigate to last step.
		fireEvent.click(screen.getByText('Weiter'));
		await waitFor(() => screen.getByRole('heading', { name: 'Fläche' }));

		fireEvent.click(screen.getByText('Weiter'));
		await waitFor(() => screen.getByRole('heading', { name: 'Zusammenfassung' }));

		expect(screen.getByText('Ergebnis anzeigen')).toBeInTheDocument();
	});

	it('ruft onComplete mit gesammelten Daten auf', async () => {
		const onComplete = vi.fn();
		render(
			<StepWizard
				steps={basicSteps}
				onComplete={onComplete}
				initialData={{ type: 'house' }}
			/>,
		);

		// Navigate through all steps.
		fireEvent.click(screen.getByText('Weiter'));
		await waitFor(() => screen.getByRole('heading', { name: 'Fläche' }));

		fireEvent.click(screen.getByText('Weiter'));
		await waitFor(() => screen.getByRole('heading', { name: 'Zusammenfassung' }));

		fireEvent.click(screen.getByText('Ergebnis anzeigen'));
		await waitFor(() => {
			expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ type: 'house' }));
		});
	});

	it('erhält Daten zwischen Steps', async () => {
		render(<StepWizard steps={basicSteps} onComplete={vi.fn()} />);

		// Set data in step 1.
		fireEvent.click(screen.getByText('Wohnung wählen'));
		expect(screen.getByText('Gewählt: apartment')).toBeInTheDocument();

		// Navigate to step 2 and back.
		fireEvent.click(screen.getByText('Weiter'));
		await waitFor(() => screen.getByRole('heading', { name: 'Fläche' }));

		fireEvent.click(screen.getByText('Zurück'));
		await waitFor(() => {
			expect(screen.getByText('Gewählt: apartment')).toBeInTheDocument();
		});
	});

	it('blockiert Navigation wenn Zod-Validierung fehlschlägt', async () => {
		render(<StepWizard steps={stepsWithValidation} onComplete={vi.fn()} />);

		// Try to advance without setting data — should stay on step 1.
		fireEvent.click(screen.getByText('Weiter'));

		await waitFor(() => {
			// Should still be on step 1.
			expect(screen.getByRole('heading', { name: 'Immobilientyp' })).toBeInTheDocument();
		});
	});

	it('zeigt Validierungsfehler an', async () => {
		render(
			<StepWizard
				steps={stepsWithValidation}
				onComplete={vi.fn()}
				initialData={{ type: 'house' }}
			/>,
		);

		// Go to step 2.
		fireEvent.click(screen.getByText('Weiter'));
		await waitFor(() => screen.getByRole('heading', { name: 'Fläche' }));

		// Try to advance without valid area.
		fireEvent.click(screen.getByText('Weiter'));
		await waitFor(() => {
			expect(screen.getByRole('alert')).toBeInTheDocument();
		});
	});

	it('lässt Navigation zu wenn Validierung bestanden', async () => {
		render(
			<StepWizard
				steps={stepsWithValidation}
				onComplete={vi.fn()}
				initialData={{ type: 'house', area: 80 }}
			/>,
		);

		// Step 1: valid (type is set).
		fireEvent.click(screen.getByText('Weiter'));
		await waitFor(() => screen.getByRole('heading', { name: 'Fläche' }));

		// Step 2: valid (area is 80).
		fireEvent.click(screen.getByText('Weiter'));
		await waitFor(() => {
			expect(screen.getByRole('heading', { name: 'Zusammenfassung' })).toBeInTheDocument();
		});
	});

	it('akzeptiert benutzerdefinierte Button-Labels', () => {
		render(
			<StepWizard
				steps={basicSteps}
				onComplete={vi.fn()}
				backLabel="Back"
				nextLabel="Next"
				completeLabel="Submit"
			/>,
		);

		expect(screen.getByText('Back')).toBeInTheDocument();
		expect(screen.getByText('Next')).toBeInTheDocument();
	});
});
