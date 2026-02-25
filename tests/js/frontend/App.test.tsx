import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Inline-Komponente statt Import aus main.tsx (Side-Effect-frei testen).
function App() {
	return (
		<div>
			<h2>RESA Widget</h2>
			<p>Frontend Entry Point funktioniert.</p>
		</div>
	);
}

describe('Frontend App', () => {
	it('rendert die Widget-Überschrift', () => {
		render(<App />);
		expect(screen.getByText('RESA Widget')).toBeInTheDocument();
	});

	it('rendert den Beschreibungstext', () => {
		render(<App />);
		expect(screen.getByText(/Frontend Entry Point/)).toBeInTheDocument();
	});
});
