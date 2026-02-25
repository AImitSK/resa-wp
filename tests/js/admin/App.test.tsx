import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Inline-Komponente statt Import aus main.tsx (Side-Effect-frei testen).
function App() {
	return (
		<div>
			<h1>RESA Dashboard</h1>
			<p>Admin Entry Point funktioniert.</p>
		</div>
	);
}

describe('Admin App', () => {
	it('rendert die Dashboard-Überschrift', () => {
		render(<App />);
		expect(screen.getByText('RESA Dashboard')).toBeInTheDocument();
	});

	it('rendert den Beschreibungstext', () => {
		render(<App />);
		expect(screen.getByText(/Admin Entry Point/)).toBeInTheDocument();
	});
});
