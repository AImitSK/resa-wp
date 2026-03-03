import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
	prefix: 'resa-',
});

/**
 * Merge Tailwind CSS classes with conflict resolution.
 *
 * Uses clsx for conditional classes + tailwind-merge to handle
 * conflicting utilities (e.g. resa-p-2 + resa-p-4 → resa-p-4).
 *
 * Shared between frontend widget and admin dashboard.
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

/**
 * Get the portal container for Radix UI components.
 *
 * Admin Tailwind uses `important: '#resa-admin-root'`, which means all
 * resa-* utility classes only apply inside that element. Radix portals
 * default to document.body (outside the admin root), breaking all styles.
 *
 * This helper returns #resa-admin-root when it exists (admin context),
 * or undefined (frontend context, where `important: true` handles it).
 */
export function getPortalContainer(): HTMLElement | undefined {
	return document.getElementById('resa-admin-root') ?? undefined;
}
