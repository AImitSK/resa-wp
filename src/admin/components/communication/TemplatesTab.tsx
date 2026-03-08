/**
 * Templates tab — list of all email templates with status badges.
 *
 * Follows inline-styles pattern for consistent WP Admin styling.
 */

import { useState, type ReactNode } from 'react';
import { __ } from '@wordpress/i18n';
import { Mail, ChevronRight } from 'lucide-react';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';
import { Button } from '@/components/ui/button';
import { LoadingState } from '../LoadingState';

// ─── Styled Button Components ────────────────────────────

function OutlineButton({
	children,
	onClick,
	disabled,
}: {
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
}) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<Button
			type="button"
			size="sm"
			onClick={onClick}
			disabled={disabled}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				backgroundColor: isHovered ? 'hsl(210 40% 96.1%)' : 'white',
				color: '#1e303a',
				border: '1px solid hsl(214.3 31.8% 78%)',
				cursor: disabled ? 'not-allowed' : 'pointer',
				opacity: disabled ? 0.5 : 1,
				gap: '6px',
			}}
		>
			{children}
		</Button>
	);
}

// ─── Styles ─────────────────────────────────────────────

const cardStyles: React.CSSProperties = {
	border: '1px solid hsl(214.3 31.8% 91.4%)',
	borderRadius: '8px',
	boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
	backgroundColor: 'white',
	padding: '16px',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: '16px',
	transition: 'box-shadow 0.15s ease-in-out',
};

const cardHoverStyles: React.CSSProperties = {
	...cardStyles,
	boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
};

const iconBoxStyles: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '40px',
	height: '40px',
	borderRadius: '8px',
	backgroundColor: 'hsl(210 40% 96.1%)',
	flexShrink: 0,
};

const badgeBaseStyles: React.CSSProperties = {
	display: 'inline-flex',
	alignItems: 'center',
	padding: '2px 8px',
	fontSize: '11px',
	fontWeight: 500,
	borderRadius: '9999px',
};

const badgeActiveStyles: React.CSSProperties = {
	...badgeBaseStyles,
	backgroundColor: '#a9e43f',
	color: '#1e303a',
};

const badgeInactiveStyles: React.CSSProperties = {
	...badgeBaseStyles,
	backgroundColor: 'hsl(210 40% 96.1%)',
	color: 'hsl(215.4 16.3% 46.9%)',
};

const sectionTitleStyles: React.CSSProperties = {
	margin: 0,
	fontSize: '16px',
	fontWeight: 600,
	color: '#1e303a',
};

const sectionDescStyles: React.CSSProperties = {
	margin: '4px 0 0 0',
	fontSize: '13px',
	color: 'hsl(215.4 16.3% 46.9%)',
};

// ─── Component ──────────────────────────────────────────

interface TemplatesTabProps {
	onEdit: (templateId: string) => void;
}

export function TemplatesTab({ onEdit }: TemplatesTabProps) {
	const { data: templates, isLoading } = useEmailTemplates();
	const [hoveredId, setHoveredId] = useState<string | null>(null);

	if (isLoading) {
		return <LoadingState message={__('Lade Vorlagen...', 'resa')} />;
	}

	if (!templates || templates.length === 0) {
		return (
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					padding: '48px 24px',
					textAlign: 'center',
					border: '2px dashed hsl(214.3 31.8% 78%)',
					borderRadius: '16px',
				}}
			>
				<p
					style={{
						fontSize: '16px',
						fontWeight: 500,
						color: '#1e303a',
						margin: '0 0 4px 0',
					}}
				>
					{__('Keine Vorlagen vorhanden', 'resa')}
				</p>
				<p style={{ fontSize: '14px', color: 'hsl(215.4 16.3% 46.9%)', margin: 0 }}>
					{__('E-Mail-Vorlagen werden automatisch erstellt.', 'resa')}
				</p>
			</div>
		);
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			{/* Header */}
			<div>
				<h2 style={sectionTitleStyles}>{__('E-Mail-Vorlagen', 'resa')}</h2>
				<p style={sectionDescStyles}>
					{__(
						'Passe die automatischen E-Mails an, die an Leads und Interessenten versendet werden.',
						'resa',
					)}
				</p>
			</div>

			{/* Template List */}
			<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
				{templates.map((template) => (
					<div
						key={template.id}
						style={hoveredId === template.id ? cardHoverStyles : cardStyles}
						onMouseEnter={() => setHoveredId(template.id)}
						onMouseLeave={() => setHoveredId(null)}
					>
						{/* Left: Icon + Info */}
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '12px',
								minWidth: 0,
							}}
						>
							<div style={iconBoxStyles}>
								<Mail style={{ width: '20px', height: '20px', color: '#1e303a' }} />
							</div>
							<div style={{ minWidth: 0 }}>
								<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									<h3
										style={{
											margin: 0,
											fontSize: '14px',
											fontWeight: 600,
											color: '#1e303a',
										}}
									>
										{template.name}
									</h3>
									<span
										style={
											template.is_active
												? badgeActiveStyles
												: badgeInactiveStyles
										}
									>
										{template.is_active
											? __('Aktiv', 'resa')
											: __('Inaktiv', 'resa')}
									</span>
								</div>
								<p
									style={{
										margin: '2px 0 0 0',
										fontSize: '13px',
										color: 'hsl(215.4 16.3% 46.9%)',
									}}
								>
									{template.description}
								</p>
								<p
									style={{
										margin: '6px 0 0 0',
										fontSize: '12px',
										color: 'hsl(215.4 16.3% 46.9%)',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
									}}
								>
									{__('Betreff:', 'resa')}{' '}
									<span style={{ color: '#1e303a' }}>{template.subject}</span>
								</p>
							</div>
						</div>

						{/* Right: Edit Button */}
						<OutlineButton onClick={() => onEdit(template.id)}>
							{__('Bearbeiten', 'resa')}
							<ChevronRight style={{ width: '14px', height: '14px' }} />
						</OutlineButton>
					</div>
				))}
			</div>
		</div>
	);
}
