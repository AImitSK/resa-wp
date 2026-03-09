/**
 * Dashboard page — KPIs, recent leads, quick actions.
 */

import { useState, useMemo } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { TrendingUp, TrendingDown, Users, CalendarIcon, ArrowRight } from 'lucide-react';
import {
	format,
	startOfDay,
	endOfDay,
	subDays,
	startOfMonth,
	endOfMonth,
	subMonths,
} from 'date-fns';
import { de } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';

import { AdminPageLayout } from '../components/AdminPageLayout';
import { useLeads, useLeadStats, type LeadStatus } from '../hooks/useLeads';
import { useLocations } from '../hooks/useLocations';
import { useFeatures } from '../hooks/useFeatures';
import { useModules } from '../hooks/useModules';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// ─── Types ──────────────────────────────────────────────

type TimeRange =
	| 'today'
	| 'yesterday'
	| 'last7days'
	| 'thisMonth'
	| 'lastMonth'
	| 'allTime'
	| 'custom';

// ─── Constants ──────────────────────────────────────────

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
	new: { label: __('Neu', 'resa'), color: '#22c55e' },
	contacted: { label: __('Kontaktiert', 'resa'), color: '#6b7280' },
	qualified: { label: __('Qualifiziert', 'resa'), color: '#3b82f6' },
	completed: { label: __('Abgeschlossen', 'resa'), color: '#1e303a' },
	lost: { label: __('Verloren', 'resa'), color: '#ef4444' },
};

const MODULE_NAMES: Record<string, string> = {
	'rent-calculator': __('Mietpreis-Kalkulator', 'resa'),
	'purchase-costs': __('Kaufnebenkosten-Rechner', 'resa'),
	'budget-calculator': __('Budgetrechner', 'resa'),
	'roi-calculator': __('Renditerechner', 'resa'),
	'energy-check': __('Energieeffizienz-Check', 'resa'),
	'seller-checklist': __('Verkäufer-Checkliste', 'resa'),
	'buyer-checklist': __('Käufer-Checkliste', 'resa'),
};

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
	{ value: 'today', label: __('Heute', 'resa') },
	{ value: 'yesterday', label: __('Gestern', 'resa') },
	{ value: 'last7days', label: __('Letzten 7 Tage', 'resa') },
	{ value: 'thisMonth', label: __('Dieser Monat', 'resa') },
	{ value: 'lastMonth', label: __('Letzter Monat', 'resa') },
	{ value: 'allTime', label: __('Gesamte Zeit', 'resa') },
	{ value: 'custom', label: __('Benutzerdefiniert', 'resa') },
];

// ─── Styles ─────────────────────────────────────────────

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
	fontWeight: 600,
	color: '#1e303a',
	margin: 0,
};

const cardValueStyles: React.CSSProperties = {
	fontSize: '32px',
	fontWeight: 600,
	color: '#1e303a',
	lineHeight: 1.2,
	marginBottom: '16px',
};

const cardFooterStyles: React.CSSProperties = {
	marginTop: 'auto',
	display: 'flex',
	flexDirection: 'column',
	gap: '8px',
};

const trendLineStyles: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: '6px',
	fontSize: '13px',
	color: '#1e303a',
	fontWeight: 400,
};

// ─── Helper Functions ───────────────────────────────────

function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

function getDateRangeFromPreset(preset: TimeRange): {
	from: Date | undefined;
	to: Date | undefined;
} {
	const now = new Date();
	const today = startOfDay(now);

	switch (preset) {
		case 'today':
			return { from: today, to: endOfDay(now) };
		case 'yesterday': {
			const yesterday = subDays(today, 1);
			return { from: yesterday, to: endOfDay(yesterday) };
		}
		case 'last7days':
			return { from: subDays(today, 6), to: endOfDay(now) };
		case 'thisMonth':
			return { from: startOfMonth(now), to: endOfDay(now) };
		case 'lastMonth': {
			const lastMonth = subMonths(now, 1);
			return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
		}
		case 'allTime':
		default:
			return { from: undefined, to: undefined };
	}
}

function getTrendLabel(timeRange: TimeRange): string {
	switch (timeRange) {
		case 'today':
			return __('Trend heute', 'resa');
		case 'yesterday':
			return __('Trend gestern', 'resa');
		case 'last7days':
			return __('Trend diese Woche', 'resa');
		case 'thisMonth':
			return __('Trend diesen Monat', 'resa');
		case 'lastMonth':
			return __('Trend letzten Monat', 'resa');
		default:
			return __('Gesamter Trend', 'resa');
	}
}

// ─── Trend Badge Component ──────────────────────────────

function TrendBadge({ value, isLoading }: { value: number | null; isLoading: boolean }) {
	if (isLoading) {
		return (
			<Badge
				style={{
					backgroundColor: '#1e303a',
					color: 'white',
					border: 'none',
					padding: '4px 8px',
				}}
			>
				<Spinner style={{ width: '12px', height: '12px' }} />
			</Badge>
		);
	}

	if (value === null) {
		return (
			<Badge
				style={{
					backgroundColor: '#1e303a',
					color: 'white',
					border: 'none',
					padding: '4px 8px',
				}}
			>
				—
			</Badge>
		);
	}

	const isPositive = value >= 0;
	const Icon = isPositive ? TrendingUp : TrendingDown;
	const bgColor = isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
	const color = isPositive ? '#22c55e' : '#ef4444';

	return (
		<Badge
			style={{
				backgroundColor: bgColor,
				color: color,
				border: 'none',
				padding: '4px 8px',
				fontWeight: 500,
				display: 'flex',
				alignItems: 'center',
				gap: '4px',
			}}
		>
			<Icon style={{ width: '12px', height: '12px' }} />
			{isPositive ? '+' : ''}
			{value.toFixed(1)}%
		</Badge>
	);
}

// ─── Main Component ─────────────────────────────────────

export function Dashboard() {
	// State for time range
	const [timeRange, setTimeRange] = useState<TimeRange>('thisMonth');
	const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
	const [datePickerOpen, setDatePickerOpen] = useState(false);

	// Temporary state for picker (before applying)
	const [tempTimeRange, setTempTimeRange] = useState<TimeRange>('thisMonth');
	const [tempCustomRange, setTempCustomRange] = useState<DateRange | undefined>();

	// Compute date filters for current period
	const dateFilters = useMemo(() => {
		if (timeRange === 'custom' && customDateRange?.from) {
			return {
				dateFrom: format(customDateRange.from, 'yyyy-MM-dd'),
				dateTo: customDateRange.to
					? format(customDateRange.to, 'yyyy-MM-dd')
					: format(customDateRange.from, 'yyyy-MM-dd'),
			};
		}
		const range = getDateRangeFromPreset(timeRange);
		if (range.from) {
			return {
				dateFrom: format(range.from, 'yyyy-MM-dd'),
				dateTo: range.to ? format(range.to, 'yyyy-MM-dd') : undefined,
			};
		}
		return {};
	}, [timeRange, customDateRange]);

	// Compute date filters for previous period (for trend calculation)
	const previousDateFilters = useMemo(() => {
		if (timeRange === 'custom' && customDateRange?.from && customDateRange?.to) {
			const duration = customDateRange.to.getTime() - customDateRange.from.getTime();
			const prevEnd = new Date(customDateRange.from.getTime() - 1);
			const prevStart = new Date(prevEnd.getTime() - duration);
			return {
				dateFrom: format(prevStart, 'yyyy-MM-dd'),
				dateTo: format(prevEnd, 'yyyy-MM-dd'),
			};
		}

		const range = getDateRangeFromPreset(timeRange);
		if (range.from && range.to) {
			const duration = range.to.getTime() - range.from.getTime();
			const prevEnd = new Date(range.from.getTime() - 1);
			const prevStart = new Date(prevEnd.getTime() - duration);
			return {
				dateFrom: format(prevStart, 'yyyy-MM-dd'),
				dateTo: format(prevEnd, 'yyyy-MM-dd'),
			};
		}
		return {};
	}, [timeRange, customDateRange]);

	// Fetch data
	const { data: stats, isLoading: statsLoading, error: statsError } = useLeadStats();

	// Fetch leads for KPI (with date filter)
	const { data: filteredLeadsData, isLoading: filteredLeadsLoading } = useLeads({
		perPage: 1,
		page: 1,
		...dateFilters,
	});

	// Fetch recent leads for table (no date filter - always show latest 5)
	const {
		data: recentLeadsData,
		isLoading: recentLeadsLoading,
		error: leadsError,
	} = useLeads({
		perPage: 5,
		page: 1,
	});

	// Fetch previous period data for trend
	const { data: prevLeadsData, isLoading: prevLeadsLoading } = useLeads({
		perPage: 1,
		page: 1,
		...previousDateFilters,
	});

	// Fetch new leads today vs yesterday for trend
	const todayStr = format(startOfDay(new Date()), 'yyyy-MM-dd');
	const yesterdayStr = format(subDays(startOfDay(new Date()), 1), 'yyyy-MM-dd');

	const { data: newLeadsToday, isLoading: newLeadsTodayLoading } = useLeads({
		perPage: 1,
		page: 1,
		status: 'new',
		dateFrom: todayStr,
		dateTo: todayStr,
	});

	const { data: newLeadsYesterday, isLoading: newLeadsYesterdayLoading } = useLeads({
		perPage: 1,
		page: 1,
		status: 'new',
		dateFrom: yesterdayStr,
		dateTo: yesterdayStr,
	});

	// Fetch locations
	const { data: locations } = useLocations();
	const features = useFeatures();

	// Fetch modules
	const { data: modules } = useModules();

	const error = statsError || leadsError;

	// Count leads in time range (from filtered data)
	const leadsInRange = filteredLeadsData?.total ?? 0;
	const prevLeadsInRange = prevLeadsData?.total ?? 0;

	// Calculate trend percentage for leads
	const leadsTrend = useMemo(() => {
		if (filteredLeadsLoading || prevLeadsLoading) return null;
		if (prevLeadsInRange === 0) return leadsInRange > 0 ? 100 : 0;
		return ((leadsInRange - prevLeadsInRange) / prevLeadsInRange) * 100;
	}, [leadsInRange, prevLeadsInRange, filteredLeadsLoading, prevLeadsLoading]);

	// Calculate trend for new leads (today vs yesterday)
	const newLeadsTrend = useMemo(() => {
		if (newLeadsTodayLoading || newLeadsYesterdayLoading) return null;
		const today = newLeadsToday?.total ?? 0;
		const yesterday = newLeadsYesterday?.total ?? 0;
		if (yesterday === 0) return today > 0 ? 100 : 0;
		return ((today - yesterday) / yesterday) * 100;
	}, [newLeadsToday, newLeadsYesterday, newLeadsTodayLoading, newLeadsYesterdayLoading]);

	// Location counts
	const activeLocations = locations?.length ?? 0;
	const maxLocations = features.plan === 'premium' ? 999 : 1;

	// Asset counts from modules data
	const activeAssets = modules?.filter((m) => m.active).length ?? 0;
	const maxAssets = features.max_modules ?? (features.plan === 'premium' ? 10 : 2);
	const planLabel = features.plan === 'premium' ? __('Premium', 'resa') : __('Free', 'resa');

	// Open picker with current values
	const handleOpenPicker = (open: boolean) => {
		if (open) {
			setTempTimeRange(timeRange);
			setTempCustomRange(customDateRange);
		}
		setDatePickerOpen(open);
	};

	// Handle preset selection in picker
	const handlePresetSelect = (preset: TimeRange) => {
		setTempTimeRange(preset);
		if (preset !== 'custom') {
			setTempCustomRange(undefined);
		}
	};

	// Handle custom date selection in picker
	const handleCustomDateSelect = (range: DateRange | undefined) => {
		setTempCustomRange(range);
		if (range?.from) {
			setTempTimeRange('custom');
		}
	};

	// Apply selection
	const handleApply = () => {
		setTimeRange(tempTimeRange);
		setCustomDateRange(tempCustomRange);
		setDatePickerOpen(false);
	};

	// Cancel selection
	const handleCancel = () => {
		setDatePickerOpen(false);
	};

	// Navigation handlers
	const handleViewAllLeads = () => {
		window.location.href = '?page=resa-leads';
	};

	const handleRowClick = () => {
		window.location.href = '?page=resa-leads';
	};

	const handleLocationsSettings = () => {
		window.location.href = '?page=resa-locations';
	};

	const handleAssetsSettings = () => {
		window.location.href = '?page=resa-smart-assets';
	};

	// Format date range for display
	const getDisplayLabel = useMemo(() => {
		if (timeRange === 'custom' && customDateRange?.from) {
			if (customDateRange.to) {
				return `${format(customDateRange.from, 'dd.MM.yy', { locale: de })} – ${format(customDateRange.to, 'dd.MM.yy', { locale: de })}`;
			}
			return format(customDateRange.from, 'dd.MM.yyyy', { locale: de });
		}
		const option = TIME_RANGE_OPTIONS.find((o) => o.value === timeRange);
		return option?.label ?? __('Zeitraum wählen', 'resa');
	}, [timeRange, customDateRange]);

	return (
		<AdminPageLayout
			variant="overview"
			title={__('Dashboard', 'resa')}
			description={__('Übersicht über Leads, Standorte und aktive Assets.', 'resa')}
		>
			{/* Error state */}
			{error && (
				<Alert variant="destructive">
					<AlertTitle>{__('Fehler beim Laden', 'resa')}</AlertTitle>
					<AlertDescription>
						{__('Die Dashboard-Daten konnten nicht geladen werden.', 'resa')}
					</AlertDescription>
				</Alert>
			)}

			{/* KPI Cards */}
			<div className="resa-grid resa-grid-cols-1 md:resa-grid-cols-2 lg:resa-grid-cols-4 resa-gap-4">
				{/* Card 1: Leads gesamt */}
				<Card
					style={{
						border: '1px solid hsl(214.3 31.8% 91.4%)',
						boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
					}}
				>
					<div style={cardStyles}>
						<div style={cardHeaderStyles}>
							<span style={cardTitleStyles}>{__('Leads gesamt', 'resa')}</span>
							<TrendBadge
								value={leadsTrend}
								isLoading={filteredLeadsLoading || prevLeadsLoading}
							/>
						</div>
						<div style={cardValueStyles}>
							{filteredLeadsLoading ? (
								<Spinner className="resa-size-8" />
							) : (
								leadsInRange
							)}
						</div>
						<div style={cardFooterStyles}>
							<div style={trendLineStyles}>
								{getTrendLabel(timeRange)}
								{leadsTrend !== null && leadsTrend >= 0 && (
									<TrendingUp
										style={{ width: '14px', height: '14px', color: '#22c55e' }}
									/>
								)}
								{leadsTrend !== null && leadsTrend < 0 && (
									<TrendingDown
										style={{ width: '14px', height: '14px', color: '#ef4444' }}
									/>
								)}
							</div>
							<Popover open={datePickerOpen} onOpenChange={handleOpenPicker}>
								<PopoverTrigger asChild>
									<button
										style={{
											display: 'inline-flex',
											alignItems: 'center',
											justifyContent: 'center',
											gap: '8px',
											height: '32px',
											width: 'fit-content',
											padding: '0 12px',
											fontSize: '13px',
											fontWeight: 500,
											whiteSpace: 'nowrap',
											borderRadius: '6px',
											border: '1px solid #e8e8e8',
											backgroundColor: 'white',
											boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
											color: '#1e303a',
											cursor: 'pointer',
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.backgroundColor =
												'hsl(210 40% 96.1%)';
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.backgroundColor = 'white';
										}}
									>
										<CalendarIcon
											style={{
												width: '16px',
												height: '16px',
												strokeWidth: 1.5,
											}}
										/>
										{getDisplayLabel}
									</button>
								</PopoverTrigger>
								<PopoverContent
									className="resa-w-auto resa-p-0"
									align="start"
									style={{
										backgroundColor: 'white',
										width: 'auto',
										minWidth: '620px',
										maxWidth: 'none',
										border: '1px solid hsl(214.3 31.8% 91.4%)',
										boxShadow:
											'0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
										borderRadius: '8px',
									}}
								>
									<div style={{ display: 'flex' }}>
										{/* Presets sidebar */}
										<div
											style={{
												borderRight: '1px solid hsl(214.3 31.8% 91.4%)',
												padding: '8px 0',
												minWidth: '160px',
											}}
										>
											{TIME_RANGE_OPTIONS.map((option) => (
												<button
													key={option.value}
													onClick={() => handlePresetSelect(option.value)}
													style={{
														display: 'block',
														width: '100%',
														padding: '8px 16px',
														fontSize: '13px',
														textAlign: 'left',
														border: 'none',
														backgroundColor:
															tempTimeRange === option.value
																? 'hsl(210 40% 96.1%)'
																: 'transparent',
														color:
															tempTimeRange === option.value
																? '#1e303a'
																: 'hsl(215.4 16.3% 46.9%)',
														fontWeight:
															tempTimeRange === option.value
																? 500
																: 400,
														cursor: 'pointer',
													}}
												>
													{option.label}
												</button>
											))}
										</div>

										{/* Calendar */}
										<div style={{ padding: '8px', flex: 1 }}>
											<Calendar
												mode="range"
												selected={tempCustomRange}
												onSelect={handleCustomDateSelect}
												numberOfMonths={2}
												locale={de}
											/>
										</div>
									</div>

									{/* Footer with buttons */}
									<div
										style={{
											display: 'flex',
											justifyContent: 'flex-end',
											gap: '8px',
											padding: '12px 16px',
											borderTop: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										<Button variant="outline" size="sm" onClick={handleCancel}>
											{__('Abbrechen', 'resa')}
										</Button>
										<Button
											size="sm"
											onClick={handleApply}
											style={{ backgroundColor: '#a9e43f', color: '#1e303a' }}
										>
											{__('Anwenden', 'resa')}
										</Button>
									</div>
								</PopoverContent>
							</Popover>
						</div>
					</div>
				</Card>

				{/* Card 2: Neue Leads */}
				<Card
					style={{
						border: '1px solid hsl(214.3 31.8% 91.4%)',
						boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
					}}
				>
					<div style={cardStyles}>
						<div style={cardHeaderStyles}>
							<span style={cardTitleStyles}>{__('Neue Leads', 'resa')}</span>
							<TrendBadge
								value={newLeadsTrend}
								isLoading={newLeadsTodayLoading || newLeadsYesterdayLoading}
							/>
						</div>
						<div style={cardValueStyles}>
							{statsLoading ? <Spinner className="resa-size-8" /> : (stats?.new ?? 0)}
						</div>
						<div style={cardFooterStyles}>
							<div style={trendLineStyles}>
								{__('Unbearbeitete Anfragen', 'resa')}
							</div>
							<button
								onClick={handleViewAllLeads}
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									justifyContent: 'center',
									gap: '8px',
									height: '32px',
									width: 'fit-content',
									padding: '0 12px',
									fontSize: '13px',
									fontWeight: 500,
									whiteSpace: 'nowrap',
									borderRadius: '6px',
									border: '1px solid #e8e8e8',
									backgroundColor: 'white',
									boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
									color: '#1e303a',
									cursor: 'pointer',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.backgroundColor = 'hsl(210 40% 96.1%)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.backgroundColor = 'white';
								}}
							>
								{__('Alle Leads anzeigen', 'resa')}
								<ArrowRight
									style={{ width: '16px', height: '16px', strokeWidth: 1.5 }}
								/>
							</button>
						</div>
					</div>
				</Card>

				{/* Card 3: Standorte */}
				<Card
					style={{
						border: '1px solid hsl(214.3 31.8% 91.4%)',
						boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
					}}
				>
					<div style={cardStyles}>
						<div style={cardHeaderStyles}>
							<span style={cardTitleStyles}>{__('Standorte', 'resa')}</span>
							<Badge
								style={{
									backgroundColor: 'white',
									color: '#1e303a',
									border: '1px solid #1e303a',
								}}
							>
								{planLabel}
							</Badge>
						</div>
						<div style={cardValueStyles}>{activeLocations}</div>
						<div style={cardFooterStyles}>
							<div style={trendLineStyles}>
								{sprintf(
									__('Sie haben %1$d / %2$d aktive Städte', 'resa'),
									activeLocations,
									maxLocations,
								)}
							</div>
							<button
								onClick={handleLocationsSettings}
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									justifyContent: 'center',
									gap: '8px',
									height: '32px',
									width: 'fit-content',
									padding: '0 12px',
									fontSize: '13px',
									fontWeight: 500,
									whiteSpace: 'nowrap',
									borderRadius: '6px',
									border: '1px solid #e8e8e8',
									backgroundColor: 'white',
									boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
									color: '#1e303a',
									cursor: 'pointer',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.backgroundColor = 'hsl(210 40% 96.1%)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.backgroundColor = 'white';
								}}
							>
								{__('Einstellungen', 'resa')}
								<ArrowRight
									style={{ width: '16px', height: '16px', strokeWidth: 1.5 }}
								/>
							</button>
						</div>
					</div>
				</Card>

				{/* Card 4: Smart Assets */}
				<Card
					style={{
						border: '1px solid hsl(214.3 31.8% 91.4%)',
						boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
					}}
				>
					<div style={cardStyles}>
						<div style={cardHeaderStyles}>
							<span style={cardTitleStyles}>{__('Smart Assets', 'resa')}</span>
							<Badge
								style={{
									backgroundColor: 'white',
									color: '#1e303a',
									border: '1px solid #1e303a',
								}}
							>
								{planLabel}
							</Badge>
						</div>
						<div style={cardValueStyles}>{activeAssets}</div>
						<div style={cardFooterStyles}>
							<div style={trendLineStyles}>
								{sprintf(
									__('Sie haben %1$d / %2$d aktiv', 'resa'),
									activeAssets,
									maxAssets,
								)}
							</div>
							<button
								onClick={handleAssetsSettings}
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									justifyContent: 'center',
									gap: '8px',
									height: '32px',
									width: 'fit-content',
									padding: '0 12px',
									fontSize: '13px',
									fontWeight: 500,
									whiteSpace: 'nowrap',
									borderRadius: '6px',
									border: '1px solid #e8e8e8',
									backgroundColor: 'white',
									boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
									color: '#1e303a',
									cursor: 'pointer',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.backgroundColor = 'hsl(210 40% 96.1%)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.backgroundColor = 'white';
								}}
							>
								{__('Einstellungen', 'resa')}
								<ArrowRight
									style={{ width: '16px', height: '16px', strokeWidth: 1.5 }}
								/>
							</button>
						</div>
					</div>
				</Card>
			</div>

			{/* Recent Leads Table */}
			<div>
				<div style={{ marginBottom: '16px' }}>
					<h3
						style={{
							fontSize: '18px',
							fontWeight: 600,
							color: '#1e303a',
							margin: 0,
						}}
					>
						{__('Neueste Leads', 'resa')}
					</h3>
					<p
						style={{
							fontSize: '14px',
							color: '#1e303a',
							margin: '4px 0 0 0',
						}}
					>
						{__('Die letzten eingegangenen Anfragen', 'resa')}
					</p>
				</div>
				<div>
					{/* Loading state */}
					{recentLeadsLoading && (
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
								{__('Lade Leads...', 'resa')}
							</span>
						</div>
					)}

					{/* Empty state */}
					{!recentLeadsLoading &&
						recentLeadsData &&
						recentLeadsData.items.length === 0 && (
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
									<Users
										style={{
											width: '24px',
											height: '24px',
											color: 'hsl(215.4 16.3% 46.9%)',
										}}
									/>
								</div>
								<p style={{ fontWeight: 600, marginBottom: '4px' }}>
									{__('Noch keine Leads', 'resa')}
								</p>
								<p style={{ color: 'hsl(215.4 16.3% 46.9%)', fontSize: '14px' }}>
									{__(
										'Leads erscheinen hier, sobald Besucher die Formulare ausfüllen.',
										'resa',
									)}
								</p>
							</div>
						)}

					{/* Leads table */}
					{!recentLeadsLoading && recentLeadsData && recentLeadsData.items.length > 0 && (
						<div
							style={{
								border: '1px solid hsl(214.3 31.8% 91.4%)',
								borderRadius: '8px',
							}}
						>
							<Table>
								<TableHeader>
									<TableRow style={{ backgroundColor: 'hsl(210 40% 96.1%)' }}>
										<TableHead
											style={{
												paddingTop: '12px',
												paddingBottom: '12px',
												paddingLeft: '16px',
												borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
											}}
										>
											{__('Name', 'resa')}
										</TableHead>
										<TableHead
											style={{
												paddingTop: '12px',
												paddingBottom: '12px',
												borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
											}}
										>
											{__('E-Mail', 'resa')}
										</TableHead>
										<TableHead
											style={{
												paddingTop: '12px',
												paddingBottom: '12px',
												borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
											}}
										>
											{__('Modul', 'resa')}
										</TableHead>
										<TableHead
											style={{
												paddingTop: '12px',
												paddingBottom: '12px',
												borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
											}}
										>
											{__('Datum', 'resa')}
										</TableHead>
										<TableHead
											style={{
												paddingTop: '12px',
												paddingBottom: '12px',
												paddingRight: '16px',
												borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
											}}
										>
											{__('Status', 'resa')}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{recentLeadsData.items.map((lead) => {
										const fullName = [lead.firstName, lead.lastName]
											.filter(Boolean)
											.join(' ');
										const statusConfig =
											STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
										const moduleName =
											MODULE_NAMES[lead.assetType] || lead.assetType;

										return (
											<TableRow
												key={lead.id}
												onClick={handleRowClick}
												style={{ cursor: 'pointer' }}
											>
												<TableCell
													style={{
														fontWeight: 500,
														paddingTop: '12px',
														paddingBottom: '12px',
														paddingLeft: '16px',
														borderBottom:
															'1px solid hsl(214.3 31.8% 91.4%)',
													}}
												>
													{fullName}
												</TableCell>
												<TableCell
													style={{
														color: 'hsl(215.4 16.3% 46.9%)',
														paddingTop: '12px',
														paddingBottom: '12px',
														borderBottom:
															'1px solid hsl(214.3 31.8% 91.4%)',
													}}
												>
													{lead.email}
												</TableCell>
												<TableCell
													style={{
														paddingTop: '12px',
														paddingBottom: '12px',
														borderBottom:
															'1px solid hsl(214.3 31.8% 91.4%)',
													}}
												>
													{moduleName}
												</TableCell>
												<TableCell
													style={{
														color: 'hsl(215.4 16.3% 46.9%)',
														paddingTop: '12px',
														paddingBottom: '12px',
														borderBottom:
															'1px solid hsl(214.3 31.8% 91.4%)',
													}}
												>
													{formatDate(lead.createdAt)}
												</TableCell>
												<TableCell
													style={{
														paddingTop: '12px',
														paddingBottom: '12px',
														paddingRight: '16px',
														borderBottom:
															'1px solid hsl(214.3 31.8% 91.4%)',
													}}
												>
													<Badge
														style={{
															backgroundColor: statusConfig.color,
															color: 'white',
															fontSize: '11px',
															padding: '2px 8px',
														}}
													>
														{statusConfig.label}
													</Badge>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}
				</div>
				<div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
					<button
						onClick={handleViewAllLeads}
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '8px',
							height: '32px',
							width: 'fit-content',
							padding: '0 12px',
							fontSize: '13px',
							fontWeight: 500,
							whiteSpace: 'nowrap',
							borderRadius: '6px',
							border: '1px solid #e8e8e8',
							backgroundColor: 'white',
							boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
							color: '#1e303a',
							cursor: 'pointer',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.backgroundColor = 'hsl(210 40% 96.1%)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.backgroundColor = 'white';
						}}
					>
						{__('Alle Leads anzeigen', 'resa')}
						<ArrowRight style={{ width: '16px', height: '16px', strokeWidth: 1.5 }} />
					</button>
				</div>
			</div>
		</AdminPageLayout>
	);
}
