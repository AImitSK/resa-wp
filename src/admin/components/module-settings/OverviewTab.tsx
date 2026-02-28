/**
 * Overview tab — Module info and status display.
 */

import { __ } from '@wordpress/i18n';
import type { ModuleInfo } from '../../hooks/useModuleSettings';

interface OverviewTabProps {
	module: ModuleInfo;
}

export function OverviewTab({ module }: OverviewTabProps) {
	const statCardStyle: React.CSSProperties = {
		backgroundColor: 'hsl(210 40% 96.1%)',
		borderRadius: '8px',
		padding: '16px',
	};

	const statLabelStyle: React.CSSProperties = {
		fontSize: '11px',
		color: 'hsl(215.4 16.3% 46.9%)',
		textTransform: 'uppercase',
		letterSpacing: '0.05em',
		fontWeight: 500,
	};

	const statValueStyle: React.CSSProperties = {
		fontSize: '18px',
		fontWeight: 600,
		color: '#1e303a',
		marginTop: '4px',
	};

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
			{/* Module description */}
			<div
				style={{
					backgroundColor: 'hsl(210 40% 96.1%)',
					borderRadius: '8px',
					padding: '20px',
				}}
			>
				<p style={{ fontSize: '14px', color: '#1e303a', lineHeight: 1.6, margin: 0 }}>
					{module.description}
				</p>
			</div>

			{/* Quick stats */}
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
				<div style={statCardStyle}>
					<div style={statLabelStyle}>{__('Kategorie', 'resa')}</div>
					<div style={statValueStyle}>
						{module.category === 'calculator'
							? __('Kalkulator', 'resa')
							: module.category}
					</div>
				</div>
				<div style={statCardStyle}>
					<div style={statLabelStyle}>{__('Status', 'resa')}</div>
					<div
						style={{
							...statValueStyle,
							color: module.active ? '#a9e43f' : 'hsl(215.4 16.3% 46.9%)',
						}}
					>
						{module.active ? __('Aktiv', 'resa') : __('Inaktiv', 'resa')}
					</div>
				</div>
				<div style={statCardStyle}>
					<div style={statLabelStyle}>{__('Plan', 'resa')}</div>
					<div
						style={{
							...statValueStyle,
							color: module.flag === 'pro' ? '#a9e43f' : '#1e303a',
						}}
					>
						{module.flag === 'free'
							? 'Free'
							: module.flag === 'pro'
								? 'Premium'
								: 'Add-on'}
					</div>
				</div>
			</div>

			{/* Shortcode info */}
			<div
				style={{
					backgroundColor: 'hsl(210 40% 96.1%)',
					borderRadius: '8px',
					padding: '20px',
				}}
			>
				<h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1e303a', margin: 0 }}>
					{__('Shortcode', 'resa')}
				</h3>
				<p
					style={{
						fontSize: '13px',
						color: 'hsl(215.4 16.3% 46.9%)',
						marginTop: '8px',
						marginBottom: '12px',
					}}
				>
					{__(
						'Füge diesen Shortcode auf einer Seite ein, um das Modul anzuzeigen:',
						'resa',
					)}
				</p>
				<code
					style={{
						display: 'inline-block',
						backgroundColor: '#1e303a',
						color: '#a9e43f',
						padding: '8px 16px',
						borderRadius: '6px',
						fontSize: '13px',
						fontFamily: 'ui-monospace, monospace',
					}}
				>
					{`[resa module="${module.slug}"]`}
				</code>
			</div>

			{/* Documentation link */}
			<div
				style={{
					backgroundColor: 'hsl(210 40% 96.1%)',
					borderRadius: '8px',
					padding: '20px',
				}}
			>
				<h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1e303a', margin: 0 }}>
					{__('Dokumentation', 'resa')}
				</h3>
				<p
					style={{
						fontSize: '13px',
						color: 'hsl(215.4 16.3% 46.9%)',
						marginTop: '8px',
						marginBottom: 0,
					}}
				>
					{__(
						'Weitere Informationen zur Konfiguration und Verwendung dieses Moduls findest du in der',
						'resa',
					)}{' '}
					<a
						href="https://www.resa-wp.com/docs"
						target="_blank"
						rel="noopener noreferrer"
						style={{ color: '#1e303a', fontWeight: 500 }}
					>
						{__('Dokumentation', 'resa')}
					</a>
					.
				</p>
			</div>
		</div>
	);
}
