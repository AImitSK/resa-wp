/**
 * Smart Assets page — module store with card grid.
 *
 * Shows all available modules with their flag (free/pro/paid),
 * activation toggle. Click on a card navigates to the settings page.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { __ } from '@wordpress/i18n';
import {
	Settings,
	Search,
	Zap,
	Lock,
	ChevronRight,
	BarChart3,
	Calculator,
	CheckCircle2,
} from 'lucide-react';
import { useModules, useToggleModule } from '../hooks/useModules';
import { useIsPremium } from '../hooks/useFeatures';
import type { ModuleSummary } from '../types';
import { AdminPageLayout } from '../components/AdminPageLayout';

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingState } from '../components/LoadingState';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type FilterOption = 'all' | 'free' | 'premium';

// ─── Styled Button Components ────────────────────────────

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<Button
			type="button"
			size="sm"
			onClick={onClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				backgroundColor: isHovered ? 'hsl(210 40% 88%)' : 'transparent',
				color: '#1e303a',
				border: 'none',
				boxShadow: 'none',
				gap: '4px',
			}}
		>
			{children}
		</Button>
	);
}

/** Module icons by slug */
const MODULE_ICONS: Record<string, React.ElementType> = {
	'rent-calculator': Calculator,
	'property-value': Calculator,
	'purchase-costs': BarChart3,
	'budget-calculator': Calculator,
	'roi-calculator': BarChart3,
	'energy-check': Zap,
	'seller-checklist': CheckCircle2,
	'buyer-checklist': CheckCircle2,
};

export function ModuleStore() {
	const [filter, setFilter] = useState<FilterOption>('all');
	const [searchQuery, setSearchQuery] = useState('');
	const navigate = useNavigate();

	const { data: modules, isLoading, error } = useModules();
	const toggleMutation = useToggleModule();
	const isPremiumUser = useIsPremium();

	// Sort: active modules first, then by name
	const filteredModules = useMemo(() => {
		if (!modules) return [];

		let result = [...modules];

		// Apply filter
		if (filter === 'free') {
			result = result.filter((m) => m.flag === 'free');
		} else if (filter === 'premium') {
			result = result.filter((m) => m.flag === 'pro' || m.flag === 'paid');
		}

		// Apply search
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(m) =>
					m.name.toLowerCase().includes(query) ||
					m.description.toLowerCase().includes(query),
			);
		}

		// Sort: active first, then alphabetically
		result.sort((a, b) => {
			if (a.active !== b.active) {
				return a.active ? -1 : 1;
			}
			return a.name.localeCompare(b.name, 'de');
		});

		return result;
	}, [modules, filter, searchQuery]);

	const freeCount = modules?.filter((m) => m.flag === 'free').length ?? 0;
	const premiumCount = modules?.filter((m) => m.flag === 'pro' || m.flag === 'paid').length ?? 0;
	const totalCount = modules?.length ?? 0;

	const handleToggle = (slug: string) => {
		toggleMutation.mutate(slug);
	};

	const openModuleSettings = (slug: string) => {
		navigate(`/modules/${slug}/settings`);
	};

	const gridStyle: React.CSSProperties = {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
		gap: '16px',
	};

	const counterBadgeStyle: React.CSSProperties = {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		height: '18px',
		minWidth: '18px',
		padding: '0 5px',
		marginLeft: '6px',
		borderRadius: '9999px',
		backgroundColor: 'hsl(210 40% 90%)',
		color: '#1e303a',
		fontSize: '11px',
		fontFamily: 'ui-monospace, monospace',
		fontWeight: 500,
	};

	// Loading state
	if (isLoading) {
		return (
			<AdminPageLayout
				variant="overview"
				title={__('Smart Assets', 'resa')}
				description={__('Aktiviere und konfiguriere deine Lead-Tools.', 'resa')}
			>
				<LoadingState message={__('Module werden geladen...', 'resa')} />
			</AdminPageLayout>
		);
	}

	// Error state
	if (error) {
		return (
			<AdminPageLayout
				variant="overview"
				title={__('Smart Assets', 'resa')}
				description={__('Aktiviere und konfiguriere deine Lead-Tools.', 'resa')}
			>
				<Alert variant="destructive">
					<AlertTitle>{__('Fehler beim Laden', 'resa')}</AlertTitle>
					<AlertDescription>
						{__('Die Module konnten nicht geladen werden.', 'resa')}
					</AlertDescription>
				</Alert>
			</AdminPageLayout>
		);
	}

	return (
		<AdminPageLayout
			variant="overview"
			title={__('Smart Assets', 'resa')}
			description={__('Aktiviere und konfiguriere deine Lead-Tools.', 'resa')}
		>
			{/* Filter bar */}
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					alignItems: 'center',
					gap: '16px',
				}}
			>
				{/* Filter tabs */}
				<Tabs value={filter} onValueChange={(v) => setFilter(v as FilterOption)}>
					<TabsList
						style={{
							display: 'inline-flex',
							height: '36px',
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: '8px',
							backgroundColor: 'hsl(210 40% 96.1%)',
							padding: '4px',
						}}
					>
						<TabsTrigger
							value="all"
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								whiteSpace: 'nowrap',
								borderRadius: '6px',
								padding: '6px 12px',
								fontSize: '14px',
								fontWeight: 500,
								transition: 'all 150ms',
								backgroundColor: filter === 'all' ? 'white' : 'transparent',
								color: filter === 'all' ? '#1e303a' : '#1e303a',
								boxShadow:
									filter === 'all' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none',
							}}
						>
							{__('alle', 'resa')}
							<span style={counterBadgeStyle}>{totalCount}</span>
						</TabsTrigger>
						<TabsTrigger
							value="free"
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								whiteSpace: 'nowrap',
								borderRadius: '6px',
								padding: '6px 12px',
								fontSize: '14px',
								fontWeight: 500,
								transition: 'all 150ms',
								backgroundColor: filter === 'free' ? 'white' : 'transparent',
								color: filter === 'free' ? '#1e303a' : '#1e303a',
								boxShadow:
									filter === 'free' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none',
							}}
						>
							{__('free', 'resa')}
							<span style={counterBadgeStyle}>{freeCount}</span>
						</TabsTrigger>
						<TabsTrigger
							value="premium"
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								whiteSpace: 'nowrap',
								borderRadius: '6px',
								padding: '6px 12px',
								fontSize: '14px',
								fontWeight: 500,
								transition: 'all 150ms',
								backgroundColor: filter === 'premium' ? 'white' : 'transparent',
								color: filter === 'premium' ? '#1e303a' : '#1e303a',
								boxShadow:
									filter === 'premium' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none',
							}}
						>
							{__('premium', 'resa')}
							<span style={counterBadgeStyle}>{premiumCount}</span>
						</TabsTrigger>
					</TabsList>
				</Tabs>

				{/* Search */}
				<div style={{ position: 'relative', width: '512px' }}>
					<Search
						style={{
							position: 'absolute',
							left: '12px',
							top: '50%',
							transform: 'translateY(-50%)',
							width: '16px',
							height: '16px',
							color: '#1e303a',
						}}
					/>
					<Input
						type="search"
						placeholder={__('Suchen...', 'resa')}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						style={{ paddingLeft: '40px' }}
					/>
				</div>
			</div>

			{/* Module grid */}
			{filteredModules.length === 0 ? (
				<div className="resa-py-12 resa-text-center resa-text-muted-foreground">
					{modules?.length === 0
						? __('Keine Module registriert.', 'resa')
						: __('Keine Module gefunden.', 'resa')}
				</div>
			) : (
				<div style={gridStyle}>
					{filteredModules.map((module) => (
						<ModuleCard
							key={module.slug}
							module={module}
							onToggle={handleToggle}
							onOpenSettings={() => openModuleSettings(module.slug)}
							isToggling={toggleMutation.isPending}
							isPremiumUser={isPremiumUser}
						/>
					))}
				</div>
			)}
		</AdminPageLayout>
	);
}

function ModuleCard({
	module,
	onToggle,
	onOpenSettings,
	isToggling,
	isPremiumUser,
}: {
	module: ModuleSummary;
	onToggle: (slug: string) => void;
	onOpenSettings: () => void;
	isToggling: boolean;
	isPremiumUser: boolean;
}) {
	// Show lock only for pro modules when user is NOT premium.
	const isLocked = module.flag === 'pro' && !isPremiumUser;
	const IconComponent = MODULE_ICONS[module.slug] ?? Zap;

	return (
		<Card
			onClick={onOpenSettings}
			style={{
				cursor: 'pointer',
				backgroundColor: module.active ? 'hsl(210 40% 96.1%)' : 'white',
				borderColor: module.active ? '#a9e43f' : undefined,
			}}
		>
			<CardHeader className="resa-pb-3">
				<div
					style={{
						display: 'flex',
						alignItems: 'flex-start',
						justifyContent: 'space-between',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
						<div
							style={{
								display: 'flex',
								width: '40px',
								height: '40px',
								alignItems: 'center',
								justifyContent: 'center',
								borderRadius: '8px',
								backgroundColor: module.active ? '#a9e43f' : 'hsl(210 40% 96.1%)',
								color: module.active ? '#1e303a' : 'inherit',
							}}
						>
							<IconComponent style={{ width: '20px', height: '20px' }} />
						</div>
						<div>
							<CardTitle
								className="resa-text-base"
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									margin: 0,
									lineHeight: 1,
								}}
							>
								{module.name}
							</CardTitle>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '6px',
									marginTop: '5px',
								}}
							>
								<Badge
									style={{
										fontSize: '10px',
										padding: '0 8px 2px 8px',
										backgroundColor:
											module.flag === 'free' ? '#1e303a' : '#a9e43f',
										color: module.flag === 'free' ? '#ffffff' : '#1e303a',
										border: 'none',
									}}
								>
									{module.flag === 'free'
										? __('free', 'resa')
										: module.flag === 'pro'
											? __('Premium', 'resa')
											: __('Add-on', 'resa')}
								</Badge>
							</div>
						</div>
					</div>
					<ChevronRight style={{ width: '16px', height: '16px', color: '#1e303a' }} />
				</div>
			</CardHeader>

			<CardContent className="resa-pb-3">
				<CardDescription className="resa-line-clamp-2">
					{module.description}
				</CardDescription>
			</CardContent>

			<CardFooter style={{ paddingTop: 0, display: 'flex', justifyContent: 'space-between' }}>
				{isLocked ? (
					<Button variant="outline" size="sm" disabled style={{ gap: '4px' }}>
						<Lock style={{ width: '12px', height: '12px' }} />
						{__('Premium erforderlich', 'resa')}
					</Button>
				) : (
					<div
						style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
						onClick={(e) => e.stopPropagation()}
					>
						<Switch
							checked={module.active}
							onCheckedChange={() => onToggle(module.slug)}
							disabled={isToggling}
						/>
						<span style={{ fontSize: '14px', color: '#1e303a' }}>
							{module.active ? __('Aktiv', 'resa') : __('Inaktiv', 'resa')}
						</span>
					</div>
				)}
				<div style={{ visibility: module.active ? 'visible' : 'hidden' }}>
					<GhostButton>
						<Settings style={{ width: '12px', height: '12px' }} />
						{__('Einstellungen', 'resa')}
					</GhostButton>
				</div>
			</CardFooter>
		</Card>
	);
}
