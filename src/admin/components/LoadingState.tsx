/**
 * Unified loading state component for admin pages.
 *
 * Uses Spinner + Text pattern with inline styles for WP Admin consistency.
 * Replaces inconsistent Skeleton/Spinner patterns across the codebase.
 */

import { __ } from '@wordpress/i18n';
import { Spinner } from '@/components/ui/spinner';

interface LoadingStateProps {
	/** Loading message to display */
	message?: string;
	/** Vertical padding - 'normal' (48px) or 'compact' (24px) */
	size?: 'normal' | 'compact';
}

const containerStyles: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: '8px',
};

const textStyles: React.CSSProperties = {
	fontSize: '14px',
	color: 'hsl(215.4 16.3% 46.9%)',
	margin: 0,
};

export function LoadingState({
	message = __('Wird geladen...', 'resa'),
	size = 'normal',
}: LoadingStateProps) {
	return (
		<div
			style={{
				...containerStyles,
				padding: size === 'compact' ? '24px 0' : '48px 0',
			}}
		>
			<Spinner style={{ width: '20px', height: '20px' }} />
			<span style={textStyles}>{message}</span>
		</div>
	);
}
