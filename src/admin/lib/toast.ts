/**
 * RESA Toast utilities — Wrapper around Sonner with RESA styling.
 *
 * Usage with i18n:
 *
 * ```tsx
 * import { __ } from '@wordpress/i18n';
 * import { toast } from '@/admin/lib/toast';
 *
 * // Success
 * toast.success(__('Einstellungen gespeichert', 'resa'));
 *
 * // Error
 * toast.error(__('Fehler beim Speichern', 'resa'));
 *
 * // With description
 * toast.success(__('Webhook erstellt', 'resa'), {
 *   description: __('Der Webhook wurde erfolgreich angelegt.', 'resa'),
 * });
 *
 * // Promise-based (shows loading → success/error)
 * toast.promise(saveMutation.mutateAsync(data), {
 *   loading: __('Speichert...', 'resa'),
 *   success: __('Gespeichert', 'resa'),
 *   error: __('Fehler beim Speichern', 'resa'),
 * });
 * ```
 */

import { toast as sonnerToast, type ExternalToast } from 'sonner';

// RESA Design System colors
const STYLES = {
	success: {
		style: {
			backgroundColor: '#f0fdf4',
			border: '1px solid #a9e43f',
			color: '#1e303a',
		},
	},
	error: {
		style: {
			backgroundColor: '#fef2f2',
			border: '1px solid #ef4444',
			color: '#991b1b',
		},
	},
	warning: {
		style: {
			backgroundColor: '#fffbeb',
			border: '1px solid #f59e0b',
			color: '#92400e',
		},
	},
	info: {
		style: {
			backgroundColor: '#eff6ff',
			border: '1px solid #3b82f6',
			color: '#1e40af',
		},
	},
} as const;

type ToastOptions = ExternalToast;

/**
 * RESA-styled toast notifications.
 *
 * All methods accept translated strings from __() function.
 */
export const toast = {
	/**
	 * Success notification (green border, light green background)
	 */
	success(message: string, options?: ToastOptions) {
		return sonnerToast.success(message, {
			...STYLES.success,
			...options,
		});
	},

	/**
	 * Error notification (red border, light red background)
	 */
	error(message: string, options?: ToastOptions) {
		return sonnerToast.error(message, {
			...STYLES.error,
			...options,
		});
	},

	/**
	 * Warning notification (orange border, light orange background)
	 */
	warning(message: string, options?: ToastOptions) {
		return sonnerToast.warning(message, {
			...STYLES.warning,
			...options,
		});
	},

	/**
	 * Info notification (blue border, light blue background)
	 */
	info(message: string, options?: ToastOptions) {
		return sonnerToast.info(message, {
			...STYLES.info,
			...options,
		});
	},

	/**
	 * Default notification (neutral styling)
	 */
	message(message: string, options?: ToastOptions) {
		return sonnerToast(message, options);
	},

	/**
	 * Promise-based toast — shows loading, then success or error.
	 *
	 * @example
	 * toast.promise(saveMutation.mutateAsync(data), {
	 *   loading: __('Speichert...', 'resa'),
	 *   success: __('Gespeichert', 'resa'),
	 *   error: __('Fehler', 'resa'),
	 * });
	 */
	promise<T>(
		promise: Promise<T>,
		messages: {
			loading: string;
			success: string | ((data: T) => string);
			error: string | ((error: unknown) => string);
		},
	) {
		return sonnerToast.promise(promise, {
			loading: messages.loading,
			success: (data) => {
				return {
					message:
						typeof messages.success === 'function'
							? messages.success(data)
							: messages.success,
					...STYLES.success,
				};
			},
			error: (err) => {
				return {
					message:
						typeof messages.error === 'function' ? messages.error(err) : messages.error,
					...STYLES.error,
				};
			},
		});
	},

	/**
	 * Dismiss a specific toast or all toasts
	 */
	dismiss(toastId?: string | number) {
		return sonnerToast.dismiss(toastId);
	},
};
