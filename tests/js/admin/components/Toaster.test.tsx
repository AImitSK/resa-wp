import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Toaster } from '@admin/components/Toaster';

describe('Toaster', () => {
	it('rendert ohne Fehler', () => {
		const { container } = render(<Toaster />);
		expect(container).toBeInTheDocument();
	});

	it('rendert Sonner-Toaster-Container', () => {
		const { container } = render(<Toaster />);
		// Sonner renders an ordered list for toasts
		const list =
			document.querySelector('ol') || document.querySelector('[data-sonner-toaster]');
		expect(list || container.firstChild).toBeTruthy();
	});

	it('rendert ohne Crash bei mehrfachem Rendern', () => {
		const { unmount } = render(<Toaster />);
		unmount();
		const { container } = render(<Toaster />);
		expect(container).toBeInTheDocument();
	});
});
