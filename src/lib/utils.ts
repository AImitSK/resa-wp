import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge( {
	prefix: 'resa-',
} );

/**
 * Merge Tailwind CSS classes with conflict resolution.
 *
 * Uses clsx for conditional classes + tailwind-merge to handle
 * conflicting utilities (e.g. resa-p-2 + resa-p-4 → resa-p-4).
 *
 * Shared between frontend widget and admin dashboard.
 */
export function cn( ...inputs: ClassValue[] ): string {
	return twMerge( clsx( inputs ) );
}
