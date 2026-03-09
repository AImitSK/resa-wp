import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState } from '@admin/components/LoadingState';

describe('LoadingState', () => {
	it('rendert Standard-Nachricht', () => {
		render(<LoadingState />);
		expect(screen.getByText('Wird geladen...')).toBeInTheDocument();
	});

	it('rendert custom Nachricht', () => {
		render(<LoadingState message="Lade Daten..." />);
		expect(screen.getByText('Lade Daten...')).toBeInTheDocument();
	});

	it('rendert Spinner', () => {
		const { container } = render(<LoadingState />);
		// Spinner is an SVG element
		const svg = container.querySelector('svg');
		expect(svg).toBeInTheDocument();
	});

	it('nutzt normalen Padding standardmäßig', () => {
		const { container } = render(<LoadingState />);
		const wrapper = container.firstChild as HTMLElement;
		expect(wrapper.style.padding).toContain('48px');
	});

	it('nutzt kompakten Padding bei size="compact"', () => {
		const { container } = render(<LoadingState size="compact" />);
		const wrapper = container.firstChild as HTMLElement;
		expect(wrapper.style.padding).toContain('24px');
	});
});
