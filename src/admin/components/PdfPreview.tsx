/**
 * Simplified PDF layout preview.
 *
 * Renders a scaled-down HTML representation of the PDF base layout.
 * Purely client-side — no server calls needed.
 */

import { __ } from '@wordpress/i18n';
import type { PdfSettings } from '../hooks/usePdfSettings';
import type { TeamMember } from '../hooks/useTeam';

interface PdfPreviewProps {
	settings: PdfSettings;
	logoUrl?: string;
	agents?: TeamMember[];
}

export function PdfPreview({ settings, logoUrl, agents = [] }: PdfPreviewProps) {
	const today = new Date().toLocaleDateString('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});

	const displayAgents = settings.showAgents ? agents.slice(0, 4) : [];

	return (
		<div
			style={{
				border: '1px solid hsl(214.3 31.8% 91.4%)',
				borderRadius: '8px',
				overflow: 'hidden',
				backgroundColor: '#fff',
			}}
		>
			{/* Title bar */}
			<div
				style={{
					padding: '8px 12px',
					backgroundColor: 'hsl(210 40% 98%)',
					borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
					fontSize: '11px',
					fontWeight: 600,
					color: 'hsl(215.4 16.3% 46.9%)',
				}}
			>
				{__('Vorschau', 'resa')}
			</div>

			{/* PDF page simulation */}
			<div
				style={{
					padding: '24px',
					minHeight: '400px',
					display: 'flex',
					flexDirection: 'column',
					fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
					fontSize: '10px',
					lineHeight: 1.4,
					color: '#1e293b',
					position: 'relative',
				}}
			>
				{/* Header */}
				<div
					style={{
						display: 'flex',
						justifyContent:
							settings.logoPosition === 'center'
								? 'center'
								: settings.logoPosition === 'right'
									? 'flex-end'
									: 'flex-start',
						alignItems: 'center',
						paddingBottom: '8px',
						borderBottom: '2px solid #a9e43f',
						marginBottom: '4px',
						gap: '8px',
						position: 'relative',
					}}
				>
					{/* Left: header text (when logo is center or right) */}
					{settings.logoPosition !== 'left' && settings.headerText && (
						<span
							style={{
								fontSize: '8px',
								color: '#94a3b8',
								position: 'absolute',
								left: 0,
							}}
						>
							{settings.headerText}
						</span>
					)}

					{/* Logo */}
					{logoUrl ? (
						<img
							src={logoUrl}
							alt="Logo"
							style={{
								maxHeight: `${Math.round(settings.logoSize * 0.67)}px`,
								maxWidth: '120px',
								objectFit: 'contain',
							}}
						/>
					) : (
						<span style={{ fontSize: '8px', color: '#94a3b8' }}>
							{settings.headerText || 'RESA — Real Estate Smart Assets'}
						</span>
					)}

					{/* Right: date (not shown when logo is right — footer is enough) */}
					{settings.showDate && settings.logoPosition !== 'right' && (
						<span
							style={{
								fontSize: '8px',
								color: '#94a3b8',
								position: 'absolute',
								right: 0,
							}}
						>
							{today}
						</span>
					)}
				</div>

				{/* Header text below logo (when logo is left) */}
				{settings.logoPosition === 'left' && logoUrl && settings.headerText && (
					<div
						style={{
							fontSize: '8px',
							color: '#94a3b8',
							marginBottom: '8px',
							marginTop: '2px',
						}}
					>
						{settings.headerText}
					</div>
				)}

				{/* Spacer when no header text below */}
				{!(settings.logoPosition === 'left' && logoUrl && settings.headerText) && (
					<div style={{ marginBottom: '8px' }} />
				)}

				{/* Title placeholder */}
				<div
					style={{
						height: '14px',
						width: '70%',
						backgroundColor: '#0f172a',
						borderRadius: '2px',
						marginBottom: '12px',
						opacity: 0.15,
					}}
				/>

				{/* Content placeholder blocks */}
				<div style={{ flex: 1 }}>
					<div
						style={{
							height: '8px',
							width: '100%',
							backgroundColor: '#e2e8f0',
							borderRadius: '2px',
							marginBottom: '6px',
						}}
					/>
					<div
						style={{
							height: '8px',
							width: '90%',
							backgroundColor: '#e2e8f0',
							borderRadius: '2px',
							marginBottom: '6px',
						}}
					/>
					<div
						style={{
							height: '8px',
							width: '75%',
							backgroundColor: '#e2e8f0',
							borderRadius: '2px',
							marginBottom: '16px',
						}}
					/>

					{/* Result box placeholder */}
					<div
						style={{
							backgroundColor: '#f0f9ff',
							border: '1px solid #bae6fd',
							borderLeft: '3px solid #a9e43f',
							padding: '10px 12px',
							borderRadius: '3px',
							marginBottom: '16px',
						}}
					>
						<div
							style={{
								height: '12px',
								width: '40%',
								backgroundColor: '#a9e43f',
								borderRadius: '2px',
								marginBottom: '4px',
								opacity: 0.4,
							}}
						/>
						<div
							style={{
								height: '6px',
								width: '60%',
								backgroundColor: '#94a3b8',
								borderRadius: '2px',
								opacity: 0.3,
							}}
						/>
					</div>

					{/* More content placeholders */}
					<div
						style={{
							height: '8px',
							width: '95%',
							backgroundColor: '#e2e8f0',
							borderRadius: '2px',
							marginBottom: '6px',
						}}
					/>
					<div
						style={{
							height: '8px',
							width: '85%',
							backgroundColor: '#e2e8f0',
							borderRadius: '2px',
							marginBottom: '6px',
						}}
					/>
				</div>

				{/* Agent cards */}
				{displayAgents.length > 0 && (
					<div style={{ marginTop: '16px' }}>
						<div
							style={{
								fontSize: '9px',
								fontWeight: 600,
								color: '#334155',
								marginBottom: '8px',
							}}
						>
							{__('Ihre Ansprechpartner', 'resa')}
						</div>
						<div
							style={{
								display: 'flex',
								flexWrap: 'wrap',
								gap: '8px',
							}}
						>
							{displayAgents.map((agent) => (
								<div
									key={agent.id ?? agent.name}
									style={{
										flex: '1 1 calc(50% - 4px)',
										minWidth: '120px',
										backgroundColor: '#f8fafc',
										border: '1px solid #e2e8f0',
										borderRadius: '4px',
										padding: '8px',
										display: 'flex',
										gap: '6px',
										alignItems: 'flex-start',
									}}
								>
									{agent.photoUrl ? (
										<img
											src={agent.photoUrl}
											alt={agent.name}
											style={{
												width: '24px',
												height: '24px',
												borderRadius: '50%',
												objectFit: 'cover',
												flexShrink: 0,
											}}
										/>
									) : (
										<div
											style={{
												width: '24px',
												height: '24px',
												borderRadius: '50%',
												backgroundColor: '#e2e8f0',
												flexShrink: 0,
											}}
										/>
									)}
									<div style={{ minWidth: 0 }}>
										<div
											style={{
												fontWeight: 600,
												fontSize: '9px',
												color: '#0f172a',
												whiteSpace: 'nowrap',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
											}}
										>
											{agent.name}
										</div>
										{agent.position && (
											<div style={{ fontSize: '7px', color: '#64748b' }}>
												{agent.position}
											</div>
										)}
										{agent.phone && (
											<div style={{ fontSize: '7px', color: '#64748b' }}>
												{agent.phone}
											</div>
										)}
										{agent.email && (
											<div style={{ fontSize: '7px', color: '#64748b' }}>
												{agent.email}
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Footer */}
				<div
					style={{
						borderTop: '1px solid #e2e8f0',
						paddingTop: '6px',
						marginTop: '16px',
						display: 'flex',
						justifyContent: 'space-between',
						fontSize: '7px',
						color: '#94a3b8',
					}}
				>
					<span>{settings.footerText || 'RESA — Real Estate Smart Assets'}</span>
					{settings.showDate && <span>{today}</span>}
				</div>
			</div>
		</div>
	);
}
