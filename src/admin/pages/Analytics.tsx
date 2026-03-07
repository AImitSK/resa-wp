/**
 * Analytics page — Funnel visualization, KPI cards, trend charts.
 *
 * Uses the existing GET /analytics/funnel endpoint.
 * Premium users see interactive Nivo charts.
 * Free users see numeric KPIs + upgrade CTA.
 *
 * Follows the Dashboard.tsx inline-styles pattern for WordPress
 * CSS compatibility (resa-prefixed Tailwind for grid only).
 */

import { useState, useMemo, lazy, Suspense } from 'react';
import { __ } from '@wordpress/i18n';
import { Eye, TrendingUp, BarChart3, Users, Lock, Crown } from 'lucide-react';

// Lazy-load Nivo charts — only the chart components are code-split;
// the page itself (with React Query hooks) stays in the main bundle.
const LazyBarChart = lazy(() => import('@nivo/bar').then((m) => ({ default: m.ResponsiveBar })));
const LazyLineChart = lazy(() => import('@nivo/line').then((m) => ({ default: m.ResponsiveLine })));

import { AdminPageLayout } from '../components/AdminPageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useFunnelData } from '../hooks/useAnalytics';
import { useLocations } from '../hooks/useLocations';
import { useFeatures } from '../hooks/useFeatures';

// ─── Styles (Dashboard pattern) ─────────────────────────

const cardStyles: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	padding: '20px',
	height: '100%',
};

const cardHeaderStyles: React.CSSProperties = {
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'flex-start',
	marginBottom: '12px',
};

const cardTitleStyles: React.CSSProperties = {
	fontSize: '14px',
	fontWeight: 500,
	color: 'hsl(215.4 16.3% 46.9%)',
	margin: 0,
};

const cardValueStyles: React.CSSProperties = {
	fontSize: '32px',
	fontWeight: 600,
	color: '#1e303a',
	lineHeight: 1.2,
	marginBottom: '4px',
};

const cardFooterStyles: React.CSSProperties = {
	marginTop: 'auto',
	fontSize: '13px',
	color: 'hsl(215.4 16.3% 46.9%)',
};

const filterBarStyles: React.CSSProperties = {
	display: 'flex',
	flexWrap: 'wrap',
	alignItems: 'flex-end',
	gap: '16px',
	padding: '20px',
};

const filterLabelStyles: React.CSSProperties = {
	display: 'block',
	fontSize: '13px',
	fontWeight: 500,
	color: 'hsl(215.4 16.3% 46.9%)',
	marginBottom: '6px',
};

const dateInputStyles: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	height: '36px',
	padding: '0 12px',
	fontSize: '13px',
	backgroundColor: 'white',
	border: '1px solid hsl(214.3 31.8% 91.4%)',
	borderRadius: '6px',
	color: '#1e303a',
	width: '160px',
};

const sectionTitleStyles: React.CSSProperties = {
	fontSize: '16px',
	fontWeight: 600,
	color: '#1e303a',
	margin: '0 0 16px 0',
};

// ─── Helpers ────────────────────────────────────────────

function formatDate30DaysAgo(): string {
	const d = new Date();
	d.setDate(d.getDate() - 30);
	return d.toISOString().slice(0, 10);
}

function formatDateToday(): string {
	return new Date().toISOString().slice(0, 10);
}

const MODULE_NAMES: Record<string, string> = {
	'rent-calculator': __('Mietpreis-Kalkulator', 'resa'),
	'purchase-costs': __('Kaufnebenkosten-Rechner', 'resa'),
	'budget-calculator': __('Budgetrechner', 'resa'),
};

// ─── Main Component ─────────────────────────────────────

export function Analytics() {
	const features = useFeatures();
	const isPremium = features.can_use_advanced_tracking;

	const [dateFrom, setDateFrom] = useState(formatDate30DaysAgo);
	const [dateTo, setDateTo] = useState(formatDateToday);
	const [assetType, setAssetType] = useState('all');
	const [locationId, setLocationId] = useState('all');

	const { data: funnel, isLoading } = useFunnelData({
		dateFrom,
		dateTo,
		assetType: assetType === 'all' ? '' : assetType,
		locationId: locationId === 'all' ? null : parseInt(locationId, 10),
	});
	const { data: locations } = useLocations();

	// Chart colors — concrete values (CSS variables don't work in D3/Nivo).
	const chartColors = ['#a9e43f', '#1e303a', '#3b82f6'];

	// Funnel bar chart data — reversed so "Views" is at the top.
	const funnelBarData = useMemo(() => {
		if (!funnel?.summary) return [];
		const s = funnel.summary;
		return [
			{ stage: __('Ergebnis', 'resa'), value: s.result_views ?? 0 },
			{ stage: __('Leads', 'resa'), value: s.form_submits ?? 0 },
			{ stage: __('Formular', 'resa'), value: s.form_views ?? 0 },
			{ stage: __('Starts', 'resa'), value: s.starts ?? 0 },
			{ stage: __('Views', 'resa'), value: s.views ?? 0 },
		];
	}, [funnel?.summary]);

	// Trend line chart data.
	const trendLineData = useMemo(() => {
		if (!funnel?.daily || funnel.daily.length === 0) return [];
		return [
			{
				id: __('Views', 'resa'),
				data: funnel.daily.map((d) => ({ x: d.date, y: d.views ?? 0 })),
			},
			{
				id: __('Starts', 'resa'),
				data: funnel.daily.map((d) => ({ x: d.date, y: d.starts ?? 0 })),
			},
			{
				id: __('Leads', 'resa'),
				data: funnel.daily.map((d) => ({ x: d.date, y: d.form_submits ?? 0 })),
			},
		];
	}, [funnel]);

	return (
		<AdminPageLayout
			variant="overview"
			title={__('Analytics', 'resa')}
			description={__('Funnel-Tracking und Conversion-Daten deiner Smart Assets.', 'resa')}
		>
			{/* Filter Bar */}
			<Card>
				<div style={filterBarStyles}>
					<div>
						<span style={filterLabelStyles}>{__('Von', 'resa')}</span>
						<input
							type="date"
							value={dateFrom}
							onChange={(e) => setDateFrom(e.target.value)}
							style={dateInputStyles}
						/>
					</div>
					<div>
						<span style={filterLabelStyles}>{__('Bis', 'resa')}</span>
						<input
							type="date"
							value={dateTo}
							onChange={(e) => setDateTo(e.target.value)}
							style={dateInputStyles}
						/>
					</div>
					<div>
						<span style={filterLabelStyles}>{__('Smart Asset', 'resa')}</span>
						<Select value={assetType} onValueChange={setAssetType}>
							<SelectTrigger
								style={{
									width: '200px',
									height: '36px',
									backgroundColor: 'white',
									border: '1px solid hsl(214.3 31.8% 91.4%)',
									borderRadius: '6px',
									fontSize: '13px',
								}}
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{__('Alle', 'resa')}</SelectItem>
								{Object.entries(MODULE_NAMES).map(([slug, name]) => (
									<SelectItem key={slug} value={slug}>
										{name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{locations && locations.length > 0 && (
						<div>
							<span style={filterLabelStyles}>{__('Standort', 'resa')}</span>
							<Select value={locationId} onValueChange={setLocationId}>
								<SelectTrigger
									style={{
										width: '200px',
										height: '36px',
										backgroundColor: 'white',
										border: '1px solid hsl(214.3 31.8% 91.4%)',
										borderRadius: '6px',
										fontSize: '13px',
									}}
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{__('Alle', 'resa')}</SelectItem>
									{locations.map((loc) => (
										<SelectItem key={loc.id} value={String(loc.id)}>
											{loc.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
				</div>
			</Card>

			{/* Loading */}
			{isLoading && (
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						padding: '32px',
						gap: '8px',
					}}
				>
					<Spinner style={{ width: '20px', height: '20px' }} />
					<span style={{ color: 'hsl(215.4 16.3% 46.9%)' }}>
						{__('Daten werden geladen...', 'resa')}
					</span>
				</div>
			)}

			{/* Empty state */}
			{!isLoading && funnel && !funnel.summary && (
				<div style={{ textAlign: 'center', padding: '32px' }}>
					<div
						style={{
							width: '48px',
							height: '48px',
							margin: '0 auto 16px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: '50%',
							backgroundColor: 'hsl(210 40% 96.1%)',
						}}
					>
						<BarChart3
							style={{
								width: '24px',
								height: '24px',
								color: 'hsl(215.4 16.3% 46.9%)',
							}}
						/>
					</div>
					<p style={{ fontWeight: 600, marginBottom: '4px' }}>
						{__('Noch keine Tracking-Daten', 'resa')}
					</p>
					<p style={{ color: 'hsl(215.4 16.3% 46.9%)', fontSize: '14px' }}>
						{__(
							'Daten erscheinen hier, sobald Besucher deine Smart Assets nutzen.',
							'resa',
						)}
					</p>
				</div>
			)}

			{/* KPI Cards */}
			{funnel?.summary && (
				<div className="resa-grid resa-grid-cols-1 md:resa-grid-cols-2 lg:resa-grid-cols-4 resa-gap-4">
					<KpiCard
						label={__('Views', 'resa')}
						value={funnel.summary.views}
						icon={
							<Eye
								style={{
									width: '16px',
									height: '16px',
									color: 'hsl(215.4 16.3% 46.9%)',
								}}
							/>
						}
					/>
					<KpiCard
						label={__('Starts', 'resa')}
						value={funnel.summary.starts}
						rate={funnel.summary.start_rate}
						rateLabel={__('Start-Rate', 'resa')}
						icon={
							<TrendingUp
								style={{
									width: '16px',
									height: '16px',
									color: 'hsl(215.4 16.3% 46.9%)',
								}}
							/>
						}
					/>
					<KpiCard
						label={__('Formular-Ansichten', 'resa')}
						value={funnel.summary.form_views}
						rate={funnel.summary.completion_rate}
						rateLabel={__('Completion-Rate', 'resa')}
						icon={
							<BarChart3
								style={{
									width: '16px',
									height: '16px',
									color: 'hsl(215.4 16.3% 46.9%)',
								}}
							/>
						}
					/>
					<KpiCard
						label={__('Leads', 'resa')}
						value={funnel.summary.form_submits}
						rate={funnel.summary.conversion_rate}
						rateLabel={__('Conversion-Rate', 'resa')}
						icon={
							<Users
								style={{
									width: '16px',
									height: '16px',
									color: 'hsl(215.4 16.3% 46.9%)',
								}}
							/>
						}
					/>
				</div>
			)}

			{/* Funnel Chart */}
			{funnel?.summary && (
				<Card>
					<div style={{ padding: '20px' }}>
						<h3 style={sectionTitleStyles}>{__('Funnel-Übersicht', 'resa')}</h3>
						{isPremium ? (
							funnelBarData.length > 0 ? (
								<Suspense fallback={<ChartPlaceholder />}>
									<div style={{ height: 280 }}>
										<LazyBarChart
											data={funnelBarData}
											keys={['value']}
											indexBy="stage"
											layout="horizontal"
											margin={{ top: 0, right: 40, bottom: 30, left: 90 }}
											padding={0.35}
											colors={[chartColors[0]]}
											borderRadius={4}
											enableLabel
											labelTextColor="#fff"
											axisBottom={{
												tickSize: 0,
												tickPadding: 8,
											}}
											axisLeft={{
												tickSize: 0,
												tickPadding: 12,
											}}
											theme={{
												text: { fontSize: 13, fill: '#6b7280' },
												axis: {
													ticks: { text: { fill: '#6b7280' } },
												},
												grid: {
													line: { stroke: 'hsl(214.3 31.8% 91.4%)' },
												},
											}}
										/>
									</div>
								</Suspense>
							) : (
								<EmptyChartMessage />
							)
						) : (
							<UpgradeCta />
						)}
					</div>
				</Card>
			)}

			{/* Trend Chart */}
			{funnel?.daily && funnel.daily.length > 0 && (
				<Card>
					<div style={{ padding: '20px' }}>
						<h3 style={sectionTitleStyles}>{__('Trend (täglich)', 'resa')}</h3>
						{isPremium ? (
							trendLineData.length > 0 ? (
								<Suspense fallback={<ChartPlaceholder />}>
									<div style={{ height: 350 }}>
										<LazyLineChart
											data={trendLineData}
											colors={chartColors}
											margin={{ top: 20, right: 120, bottom: 80, left: 50 }}
											xScale={{ type: 'point' }}
											yScale={{ type: 'linear', min: 0, stacked: false }}
											curve="monotoneX"
											pointSize={6}
											pointBorderWidth={2}
											pointBorderColor={{ from: 'serieColor' }}
											enableSlices="x"
											useMesh
											legends={[
												{
													anchor: 'bottom-right',
													direction: 'column',
													translateX: 110,
													itemWidth: 100,
													itemHeight: 20,
													symbolSize: 10,
													symbolShape: 'circle',
												},
											]}
											axisBottom={{
												tickRotation: -45,
												tickSize: 0,
												tickPadding: 8,
											}}
											axisLeft={{
												tickSize: 0,
												tickPadding: 8,
											}}
											theme={{
												text: { fontSize: 12, fill: '#6b7280' },
												axis: {
													ticks: { text: { fill: '#6b7280' } },
												},
												grid: {
													line: { stroke: 'hsl(214.3 31.8% 91.4%)' },
												},
											}}
										/>
									</div>
								</Suspense>
							) : (
								<EmptyChartMessage />
							)
						) : (
							<UpgradeCta />
						)}
					</div>
				</Card>
			)}

			{/* Conversion Rates */}
			{funnel?.summary && (
				<Card>
					<div style={{ padding: '20px' }}>
						<h3 style={sectionTitleStyles}>{__('Conversion-Rates', 'resa')}</h3>
						<div className="resa-grid resa-grid-cols-1 md:resa-grid-cols-3 resa-gap-4">
							<RateCard
								label={__('Start-Rate', 'resa')}
								description={__('Views → Starts', 'resa')}
								rate={funnel.summary.start_rate}
							/>
							<RateCard
								label={__('Completion-Rate', 'resa')}
								description={__('Starts → Formular', 'resa')}
								rate={funnel.summary.completion_rate}
							/>
							<RateCard
								label={__('Conversion-Rate', 'resa')}
								description={__('Formular → Lead', 'resa')}
								rate={funnel.summary.conversion_rate}
							/>
						</div>
					</div>
				</Card>
			)}
		</AdminPageLayout>
	);
}

// ─── Sub-Components ─────────────────────────────────────

function ChartPlaceholder() {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				height: 280,
				gap: '8px',
			}}
		>
			<Spinner style={{ width: '20px', height: '20px' }} />
			<span style={{ color: 'hsl(215.4 16.3% 46.9%)', fontSize: '13px' }}>
				{__('Chart wird geladen...', 'resa')}
			</span>
		</div>
	);
}

function EmptyChartMessage() {
	return (
		<p
			style={{
				textAlign: 'center',
				padding: '32px 0',
				color: 'hsl(215.4 16.3% 46.9%)',
				fontSize: '14px',
			}}
		>
			{__('Noch keine Daten vorhanden.', 'resa')}
		</p>
	);
}

function KpiCard({
	label,
	value,
	rate,
	rateLabel,
	icon,
}: {
	label: string;
	value: number;
	rate?: number;
	rateLabel?: string;
	icon: React.ReactNode;
}) {
	return (
		<Card>
			<div style={cardStyles}>
				<div style={cardHeaderStyles}>
					<span style={cardTitleStyles}>{label}</span>
					{icon}
				</div>
				<div style={cardValueStyles}>{value.toLocaleString('de-DE')}</div>
				{rate !== undefined && rateLabel && (
					<div style={cardFooterStyles}>
						{rateLabel}: <strong>{rate.toFixed(1)} %</strong>
					</div>
				)}
			</div>
		</Card>
	);
}

function RateCard({
	label,
	description,
	rate,
}: {
	label: string;
	description: string;
	rate: number;
}) {
	return (
		<div
			style={{
				border: '1px solid hsl(214.3 31.8% 91.4%)',
				borderRadius: '8px',
				padding: '20px',
				textAlign: 'center',
			}}
		>
			<div
				style={{
					fontSize: '28px',
					fontWeight: 600,
					color: '#1e303a',
					lineHeight: 1.2,
				}}
			>
				{rate.toFixed(1)} %
			</div>
			<div
				style={{
					marginTop: '8px',
					fontSize: '14px',
					fontWeight: 500,
					color: '#1e303a',
				}}
			>
				{label}
			</div>
			<div
				style={{
					marginTop: '2px',
					fontSize: '13px',
					color: 'hsl(215.4 16.3% 46.9%)',
				}}
			>
				{description}
			</div>
		</div>
	);
}

function UpgradeCta() {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: '12px',
				padding: '20px',
				backgroundColor: 'hsl(210 40% 96.1%)',
				borderRadius: '8px',
			}}
		>
			<Lock
				style={{
					width: '16px',
					height: '16px',
					color: 'hsl(215.4 16.3% 46.9%)',
					flexShrink: 0,
				}}
			/>
			<span style={{ fontSize: '14px', color: 'hsl(215.4 16.3% 46.9%)' }}>
				{__('Interaktive Charts sind nur im Pro-Plan verfügbar.', 'resa')}
			</span>
			<Button
				variant="outline"
				size="sm"
				style={{ marginLeft: 'auto', flexShrink: 0 }}
				asChild
			>
				<a href={window.resaAdmin?.adminUrl + '?page=resa-settings'}>
					<Crown style={{ width: '14px', height: '14px', marginRight: '6px' }} />
					{__('Upgrade', 'resa')}
				</a>
			</Button>
		</div>
	);
}
