import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ResaIcon } from '@/components/icons/ResaIcon';
import * as registry from '@/components/icons/registry';

// Mock the registry to avoid importing all 40 SVGs in tests.
vi.mock('@/components/icons/registry', () => ({
	getIcon: vi.fn(),
	getIconNames: vi.fn(() => ['haus', 'wohnung']),
	icons: {},
}));

describe('ResaIcon', () => {
	it('rendert SVG-Inhalt für bekanntes Icon', () => {
		vi.mocked(registry.getIcon).mockReturnValue(
			'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
		);

		const { container } = render(<ResaIcon name="haus" />);

		const span = container.querySelector('span');
		expect(span).not.toBeNull();
		expect(span?.innerHTML).toContain('<svg');
		expect(span?.innerHTML).toContain('circle');
	});

	it('gibt null zurück für unbekanntes Icon', () => {
		vi.mocked(registry.getIcon).mockReturnValue(undefined);

		const { container } = render(<ResaIcon name="nonexistent" />);
		expect(container.innerHTML).toBe('');
	});

	it('wendet size als width/height an', () => {
		vi.mocked(registry.getIcon).mockReturnValue('<svg></svg>');

		const { container } = render(<ResaIcon name="haus" size={48} />);

		const span = container.querySelector('span');
		expect(span?.style.width).toBe('48px');
		expect(span?.style.height).toBe('48px');
	});

	it('verwendet Standard-Größe 24px', () => {
		vi.mocked(registry.getIcon).mockReturnValue('<svg></svg>');

		const { container } = render(<ResaIcon name="haus" />);

		const span = container.querySelector('span');
		expect(span?.style.width).toBe('24px');
		expect(span?.style.height).toBe('24px');
	});

	it('setzt className auf span', () => {
		vi.mocked(registry.getIcon).mockReturnValue('<svg></svg>');

		const { container } = render(<ResaIcon name="haus" className="resa-text-blue-600" />);

		const span = container.querySelector('span');
		expect(span?.className).toBe('resa-text-blue-600');
	});

	it('ist dekorativ ohne label (aria-hidden)', () => {
		vi.mocked(registry.getIcon).mockReturnValue('<svg></svg>');

		const { container } = render(<ResaIcon name="haus" />);

		const span = container.querySelector('span');
		expect(span?.getAttribute('aria-hidden')).toBe('true');
		expect(span?.getAttribute('role')).toBe('presentation');
	});

	it('hat aria-label wenn label gesetzt', () => {
		vi.mocked(registry.getIcon).mockReturnValue('<svg></svg>');

		const { container } = render(<ResaIcon name="haus" label="Haus-Icon" />);

		const span = container.querySelector('span');
		expect(span?.getAttribute('aria-label')).toBe('Haus-Icon');
		expect(span?.getAttribute('role')).toBe('img');
		expect(span?.getAttribute('aria-hidden')).toBeNull();
	});
});
