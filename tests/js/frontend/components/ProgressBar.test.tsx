import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '@frontend/components/shared/ProgressBar';

describe('ProgressBar', () => {
	it('rendert die korrekte Anzahl Steps', () => {
		const { container } = render(<ProgressBar steps={5} current={0} />);
		// 5 step dots (circles with numbers or checkmarks).
		const dots = container.querySelectorAll('.resa-rounded-full');
		expect(dots).toHaveLength(5);
	});

	it('markiert abgeschlossene Steps mit Häkchen', () => {
		const { container } = render(<ProgressBar steps={4} current={2} />);
		// Steps 0 and 1 should show checkmarks (svg).
		const svgs = container.querySelectorAll('svg');
		expect(svgs).toHaveLength(2);
	});

	it('zeigt den aktuellen Step-Index als Zahl', () => {
		render(<ProgressBar steps={3} current={1} />);
		// Step 2 (index 1) shows "2".
		expect(screen.getByText('2')).toBeInTheDocument();
	});

	it('zeigt Labels wenn übergeben', () => {
		render(<ProgressBar steps={3} current={0} labels={['Typ', 'Fläche', 'Lage']} />);
		expect(screen.getByText('Typ')).toBeInTheDocument();
		expect(screen.getByText('Fläche')).toBeInTheDocument();
		expect(screen.getByText('Lage')).toBeInTheDocument();
	});

	it('hat korrekte ARIA-Attribute', () => {
		render(<ProgressBar steps={5} current={2} />);
		const bar = screen.getByRole('progressbar');
		expect(bar).toHaveAttribute('aria-valuenow', '3');
		expect(bar).toHaveAttribute('aria-valuemin', '1');
		expect(bar).toHaveAttribute('aria-valuemax', '5');
	});

	it('rendert Verbindungslinien zwischen Steps', () => {
		const { container } = render(<ProgressBar steps={4} current={0} />);
		// 3 connecting lines between 4 dots.
		const lines = container.querySelectorAll('.resa-h-0\\.5');
		expect(lines).toHaveLength(3);
	});
});
