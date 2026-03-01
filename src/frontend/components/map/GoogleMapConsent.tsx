/**
 * GoogleMapConsent — DSGVO consent placeholder for Google Maps.
 *
 * Shows a consent dialog before loading Google Maps to comply with
 * GDPR requirements (data transfer to Google servers in USA).
 */

import { useState } from 'react';
import { __ } from '@wordpress/i18n';

interface GoogleMapConsentProps {
	/** Height in pixels (matches map height) */
	height?: number;
	/** Callback when user accepts loading Google Maps */
	onAccept: () => void;
	/** Additional CSS class */
	className?: string;
}

export function GoogleMapConsent({
	height = 250,
	onAccept,
	className = '',
}: GoogleMapConsentProps) {
	const [isLoading, setIsLoading] = useState(false);

	const handleAccept = () => {
		setIsLoading(true);
		// Small delay for visual feedback
		setTimeout(() => {
			onAccept();
		}, 100);
	};

	return (
		<div
			className={`resa-map-consent ${className}`}
			style={{
				height: `${height}px`,
				width: '100%',
				borderRadius: 'var(--resa-radius)',
				backgroundColor: 'hsl(var(--resa-muted))',
				border: '1px solid hsl(var(--resa-border))',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: '16px',
				padding: '24px',
				textAlign: 'center',
				color: 'hsl(var(--resa-foreground))',
			}}
		>
			{/* Google Maps icon */}
			<div
				style={{
					width: '48px',
					height: '48px',
					borderRadius: '50%',
					backgroundColor: 'hsl(var(--resa-background))',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
				}}
			>
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
					<circle cx="12" cy="10" r="3" />
				</svg>
			</div>

			{/* Info text */}
			<div style={{ maxWidth: '280px' }}>
				<p
					style={{
						fontSize: '14px',
						fontWeight: 500,
						marginBottom: '8px',
					}}
				>
					{__('Karte wird von Google Maps bereitgestellt', 'resa')}
				</p>
				<p
					style={{
						fontSize: '12px',
						color: 'hsl(var(--resa-muted-foreground))',
						lineHeight: 1.5,
					}}
				>
					{__(
						'Beim Laden werden Daten an Google in die USA übermittelt. Weitere Informationen finden Sie in der Datenschutzerklärung.',
						'resa',
					)}
				</p>
			</div>

			{/* Accept button */}
			<button
				type="button"
				onClick={handleAccept}
				disabled={isLoading}
				style={{
					padding: '10px 24px',
					fontSize: '14px',
					fontWeight: 500,
					color: 'hsl(var(--resa-primary-foreground))',
					backgroundColor: 'hsl(var(--resa-primary))',
					border: 'none',
					borderRadius: 'var(--resa-radius)',
					cursor: isLoading ? 'wait' : 'pointer',
					opacity: isLoading ? 0.7 : 1,
					transition: 'opacity 0.2s, background-color 0.2s',
				}}
				onMouseEnter={(e) => {
					if (!isLoading) {
						e.currentTarget.style.opacity = '0.9';
					}
				}}
				onMouseLeave={(e) => {
					if (!isLoading) {
						e.currentTarget.style.opacity = '1';
					}
				}}
			>
				{isLoading ? __('Wird geladen…', 'resa') : __('Karte laden', 'resa')}
			</button>
		</div>
	);
}
