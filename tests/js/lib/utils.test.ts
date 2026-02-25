import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn()', () => {
	it('verbindet mehrere Klassen', () => {
		expect(cn('resa-p-2', 'resa-mt-4')).toBe('resa-p-2 resa-mt-4');
	});

	it('löst Tailwind-Konflikte auf', () => {
		expect(cn('resa-p-2', 'resa-p-4')).toBe('resa-p-4');
	});

	it('filtert falsy-Werte', () => {
		const showMargin = false;
		expect(cn('resa-p-2', showMargin && 'resa-mt-4', null, undefined, 'resa-text-sm')).toBe(
			'resa-p-2 resa-text-sm',
		);
	});

	it('verarbeitet leere Eingabe', () => {
		expect(cn()).toBe('');
	});
});
