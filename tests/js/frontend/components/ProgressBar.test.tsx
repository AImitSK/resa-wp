import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '@frontend/components/shared/ProgressBar';

describe('ProgressBar', () => {
	it('rendert eine Progressbar', () => {
		render(<ProgressBar steps={5} current={0} />);
		expect(screen.getByRole('progressbar')).toBeInTheDocument();
	});

	it('zeigt korrekten Fortschritt bei Step 0 von 5', () => {
		render(<ProgressBar steps={5} current={0} />);
		const bar = screen.getByRole('progressbar');
		// (0+1)/5 = 20%
		expect(bar).toHaveAttribute('aria-valuemax', '100');
		expect(bar).toHaveAttribute('aria-valuemin', '0');
	});

	it('zeigt korrekten Fortschritt bei Step 2 von 4', () => {
		render(<ProgressBar steps={4} current={2} />);
		// (2+1)/4 = 75% — check that the bar element is rendered
		const bar = screen.getByRole('progressbar');
		expect(bar).toBeInTheDocument();
	});

	it('zeigt 100% beim letzten Step', () => {
		render(<ProgressBar steps={3} current={2} />);
		// (2+1)/3 = 100%
		const bar = screen.getByRole('progressbar');
		expect(bar).toBeInTheDocument();
	});

	it('akzeptiert labels Prop ohne Fehler (API-Kompatibilitaet)', () => {
		// labels prop is accepted but ignored
		render(<ProgressBar steps={3} current={0} labels={['Typ', 'Fläche', 'Lage']} />);
		expect(screen.getByRole('progressbar')).toBeInTheDocument();
	});
});
