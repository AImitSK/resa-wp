/**
 * AdminPageLayout — Reusable page layout for all admin pages.
 *
 * Two variants:
 * - "overview": Header with logo + title, content area, footer
 * - "detail": Breadcrumb bar with back button, content area, footer
 */

import { ReactNode } from 'react';
import { __ } from '@wordpress/i18n';
import { ArrowLeft } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BreadcrumbItem {
	label: string;
	onClick?: () => void;
}

interface AdminPageLayoutProps {
	children: ReactNode;
	/** Layout variant */
	variant?: 'overview' | 'detail';
	/** Page title (for overview variant) */
	title?: string;
	/** Page description (for overview variant) */
	description?: string;
	/** Breadcrumb items (for detail variant) */
	breadcrumbs?: BreadcrumbItem[];
	/** Back button handler (for detail variant) */
	onBack?: () => void;
	/** Whether to show the logo in overview header */
	showLogo?: boolean;
	/** Additional content for the header area (e.g., action buttons) */
	headerActions?: ReactNode;
	/** Content to show below the main content but above footer */
	footerContent?: ReactNode;
}

const pluginUrl = window.resaAdmin?.pluginUrl ?? '';
const logoUrl = `${pluginUrl}assets/images/resa-smart-assets.png`;
const version = window.resaAdmin?.version ?? '';
const plan = window.resaAdmin?.features?.plan ?? 'free';

/**
 * Footer component - shared across all variants
 */
function PageFooter() {
	return (
		<div
			style={{
				backgroundColor: '#1e303a',
				color: 'white',
				padding: '16px 24px',
				borderRadius: '0 0 12px 12px',
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				fontSize: '13px',
			}}
		>
			<div>© {new Date().getFullYear()} RESA - smart assets</div>
			<div style={{ display: 'flex', gap: '24px' }}>
				<a
					href="https://www.resa-wp.com"
					target="_blank"
					rel="noopener noreferrer"
					style={{ color: 'white', textDecoration: 'none' }}
				>
					www.resa-wp.com
				</a>
				<a
					href="https://www.resa-wp.com/support"
					target="_blank"
					rel="noopener noreferrer"
					style={{ color: 'white', textDecoration: 'none' }}
				>
					Support
				</a>
			</div>
		</div>
	);
}

/**
 * Overview header - Logo + Title + Description
 */
function OverviewHeader({
	title,
	description,
	showLogo,
	headerActions,
}: {
	title?: string;
	description?: string;
	showLogo?: boolean;
	headerActions?: ReactNode;
}) {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				padding: '12px 24px',
				backgroundColor: 'hsl(210 40% 96.1%)',
				borderRadius: '12px 12px 0 0',
				marginBottom: '24px',
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
				{showLogo !== false && (
					<img
						src={logoUrl}
						alt="RESA Smart Assets"
						style={{ height: '48px', width: 'auto' }}
					/>
				)}
				<div>
					{title && (
						<h2
							style={{
								fontSize: '24px',
								fontWeight: 600,
								lineHeight: 1.2,
								margin: 0,
								color: '#1e303a',
							}}
						>
							{title}
						</h2>
					)}
					{description && (
						<p
							style={{
								fontSize: '14px',
								color: '#1e303a',
								marginTop: '4px',
								marginBottom: 0,
							}}
						>
							{description}
						</p>
					)}
					{headerActions && <div style={{ marginTop: '16px' }}>{headerActions}</div>}
				</div>
			</div>
			<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
				<span style={{ fontSize: '13px', color: '#1e303a' }}>v{version}</span>
				<Badge
					style={{
						backgroundColor: plan === 'premium' ? '#a9e43f' : '#1e303a',
						color: plan === 'premium' ? '#1e303a' : 'white',
						fontSize: '11px',
						padding: '4px 10px',
					}}
				>
					{plan === 'premium' ? 'Premium' : 'Free'}
				</Badge>
			</div>
		</div>
	);
}

/**
 * Detail header - Breadcrumb bar with back button
 */
function DetailHeader({
	breadcrumbs,
	onBack,
}: {
	breadcrumbs?: BreadcrumbItem[];
	onBack?: () => void;
}) {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				backgroundColor: 'hsl(210 40% 96.1%)',
				padding: '10px 24px',
				borderRadius: '12px 12px 0 0',
			}}
		>
			<nav aria-label="breadcrumb">
				<ol
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						margin: 0,
						padding: 0,
						listStyle: 'none',
						fontSize: '14px',
					}}
				>
					{breadcrumbs?.map((crumb, index) => (
						<li
							key={index}
							style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
						>
							{index > 0 && (
								<span style={{ color: 'hsl(215.4 16.3% 46.9%)' }}>/</span>
							)}
							{crumb.onClick ? (
								<span
									onClick={crumb.onClick}
									style={{
										color: 'hsl(215.4 16.3% 46.9%)',
										cursor: 'pointer',
									}}
								>
									{crumb.label}
								</span>
							) : (
								<span style={{ fontWeight: 500, color: '#1e303a' }}>
									{crumb.label}
								</span>
							)}
						</li>
					))}
				</ol>
			</nav>
			{onBack && (
				<Button variant="ghost" size="sm" onClick={onBack} style={{ gap: '6px' }}>
					<ArrowLeft style={{ width: '16px', height: '16px' }} />
					{__('Zurück', 'resa')}
				</Button>
			)}
		</div>
	);
}

/**
 * Main layout component
 */
export function AdminPageLayout({
	children,
	variant = 'overview',
	title,
	description,
	breadcrumbs,
	onBack,
	showLogo = true,
	headerActions,
	footerContent,
}: AdminPageLayoutProps) {
	return (
		<Card style={{ minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
			{variant === 'overview' ? (
				<OverviewHeader
					title={title}
					description={description}
					showLogo={showLogo}
					headerActions={headerActions}
				/>
			) : (
				<DetailHeader breadcrumbs={breadcrumbs} onBack={onBack} />
			)}

			<CardContent
				className="resa-space-y-6"
				style={{ flex: 1, paddingTop: variant === 'detail' ? '24px' : undefined }}
			>
				{children}
			</CardContent>

			{footerContent && <div style={{ padding: '0 24px 24px' }}>{footerContent}</div>}

			<PageFooter />
		</Card>
	);
}

/**
 * Convenience exports for common patterns
 */
export { PageFooter };
