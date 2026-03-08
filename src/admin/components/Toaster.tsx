/**
 * RESA Toaster — Sonner-based toast notifications with RESA styling.
 *
 * Position: bottom-right (doesn't interfere with navigation)
 * Duration: 4 seconds (auto-dismiss)
 */

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
	return (
		<SonnerToaster
			position="bottom-right"
			offset={16}
			gap={8}
			duration={4000}
			visibleToasts={3}
			toastOptions={{
				style: {
					fontFamily:
						'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
					fontSize: '14px',
					borderRadius: '8px',
					padding: '12px 16px',
					boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
				},
			}}
		/>
	);
}
