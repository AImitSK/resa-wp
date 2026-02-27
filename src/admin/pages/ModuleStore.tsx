/**
 * Smart Assets page — module store with card grid and settings sheet.
 *
 * Shows all available modules with their flag (free/pro/paid),
 * activation toggle, and inline settings panel.
 */

import { useState, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import {
	Settings,
	Search,
	Zap,
	Lock,
	ChevronRight,
	BarChart3,
	Home,
	Calculator,
	CheckCircle2,
	XCircle,
} from 'lucide-react';
import { useModules, useToggleModule } from '../hooks/useModules';
import type { ModuleSummary } from '../types';

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
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

type FilterOption = 'all' | 'free' | 'premium';

/** Module icons by slug */
const MODULE_ICONS: Record<string, React.ElementType> = {
	'rent-calculator': Calculator,
	'value-calculator': Home,
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
	const [selectedModule, setSelectedModule] = useState<ModuleSummary | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);

	const { data: modules, isLoading, error } = useModules();
	const toggleMutation = useToggleModule();

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

	const openModuleSheet = (module: ModuleSummary) => {
		setSelectedModule(module);
		setSheetOpen(true);
	};

	if (isLoading) {
		return (
			<div className="resa-flex resa-items-center resa-justify-center resa-py-12 resa-gap-2">
				<Spinner className="resa-size-5" />
				<span className="resa-text-muted-foreground">
					{__('Module werden geladen...', 'resa')}
				</span>
			</div>
		);
	}

	if (error) {
		return (
			<Alert variant="destructive">
				<AlertTitle>{__('Fehler beim Laden', 'resa')}</AlertTitle>
				<AlertDescription>
					{__('Die Module konnten nicht geladen werden.', 'resa')}
				</AlertDescription>
			</Alert>
		);
	}

	// Inline styles as fallback for WordPress admin CSS conflicts
	const tabListStyle: React.CSSProperties = {
		display: 'inline-flex',
		height: '36px',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: '8px',
		backgroundColor: 'hsl(210 40% 96.1%)',
		padding: '4px',
		gap: '4px',
	};

	const tabStyle = (isActive: boolean): React.CSSProperties => ({
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		whiteSpace: 'nowrap',
		borderRadius: '6px',
		padding: '6px 12px',
		fontSize: '14px',
		fontWeight: 500,
		cursor: 'pointer',
		border: 'none',
		backgroundColor: isActive ? 'white' : 'transparent',
		boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
		color: isActive ? '#1e303a' : 'hsl(215.4 16.3% 46.9%)',
	});

	const gridStyle: React.CSSProperties = {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
		gap: '16px',
	};

	const counterStyle: React.CSSProperties = {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		height: '20px',
		minWidth: '20px',
		padding: '0 6px',
		marginLeft: '6px',
		borderRadius: '9999px',
		backgroundColor: '#94a3b8',
		color: 'white',
		fontSize: '11px',
		fontFamily: 'monospace',
		fontWeight: 500,
	};

	const pluginUrl = window.resaAdmin?.pluginUrl ?? '';
	const logoUrl = `${pluginUrl}assets/images/resa-smart-assets.png`;

	return (
		<>
			<Card>
				{/* Header with logo */}
				<div
					style={{
						display: 'flex',
						alignItems: 'flex-start',
						justifyContent: 'space-between',
						padding: '24px',
						paddingBottom: '30px',
					}}
				>
					<div>
						<h2
							style={{
								fontSize: '24px',
								fontWeight: 600,
								lineHeight: 1.2,
								margin: 0,
							}}
						>
							{__('Smart Assets', 'resa')}
						</h2>
						<p
							style={{
								fontSize: '14px',
								color: 'hsl(215.4 16.3% 46.9%)',
								marginTop: '4px',
								marginBottom: 0,
							}}
						>
							{__('Aktiviere und konfiguriere deine Lead-Tools.', 'resa')}
						</p>
					</div>
					<img
						src={logoUrl}
						alt="RESA Smart Assets"
						style={{ height: '64px', width: 'auto' }}
					/>
				</div>

				<CardContent className="resa-space-y-6">
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
						<div style={tabListStyle}>
							<button
								style={tabStyle(filter === 'all')}
								onClick={() => setFilter('all')}
							>
								{__('alle', 'resa')}
								<span style={counterStyle}>{totalCount}</span>
							</button>
							<button
								style={tabStyle(filter === 'free')}
								onClick={() => setFilter('free')}
							>
								{__('free', 'resa')}
								<span style={counterStyle}>{freeCount}</span>
							</button>
							<button
								style={tabStyle(filter === 'premium')}
								onClick={() => setFilter('premium')}
							>
								{__('premium', 'resa')}
								<span style={counterStyle}>{premiumCount}</span>
							</button>
						</div>

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
									color: 'hsl(215.4 16.3% 46.9%)',
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
									onOpenSettings={() => openModuleSheet(module)}
									isToggling={toggleMutation.isPending}
								/>
							))}
						</div>
					)}
				</CardContent>

				{/* Footer */}
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
			</Card>

			{/* Module Settings Sheet */}
			<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
				<SheetContent className="sm:resa-max-w-lg">
					{selectedModule && (
						<ModuleSettingsSheet
							module={selectedModule}
							onToggle={handleToggle}
							isToggling={toggleMutation.isPending}
						/>
					)}
				</SheetContent>
			</Sheet>
		</>
	);
}

function ModuleCard({
	module,
	onToggle,
	onOpenSettings,
	isToggling,
}: {
	module: ModuleSummary;
	onToggle: (slug: string) => void;
	onOpenSettings: () => void;
	isToggling: boolean;
}) {
	const isPro = module.flag === 'pro' && !module.active;
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
										backgroundColor: '#1e303a',
										color: module.flag === 'free' ? '#ffffff' : '#a9e43f',
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
					<ChevronRight
						style={{ width: '16px', height: '16px', color: 'hsl(215.4 16.3% 46.9%)' }}
					/>
				</div>
			</CardHeader>

			<CardContent className="resa-pb-3">
				<CardDescription className="resa-line-clamp-2">
					{module.description}
				</CardDescription>
			</CardContent>

			<CardFooter style={{ paddingTop: 0, display: 'flex', justifyContent: 'space-between' }}>
				{isPro ? (
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
						<span style={{ fontSize: '14px', color: 'hsl(215.4 16.3% 46.9%)' }}>
							{module.active ? __('Aktiv', 'resa') : __('Inaktiv', 'resa')}
						</span>
					</div>
				)}
				<Button
					variant="ghost"
					size="sm"
					style={{
						gap: '4px',
						visibility: module.active ? 'visible' : 'hidden',
					}}
				>
					<Settings style={{ width: '12px', height: '12px' }} />
					{__('Einstellungen', 'resa')}
				</Button>
			</CardFooter>
		</Card>
	);
}

function ModuleSettingsSheet({
	module,
	onToggle,
	isToggling,
}: {
	module: ModuleSummary;
	onToggle: (slug: string) => void;
	isToggling: boolean;
}) {
	const IconComponent = MODULE_ICONS[module.slug] ?? Zap;
	const isPro = module.flag === 'pro' && !module.active;

	return (
		<ScrollArea className="resa-h-full">
			<SheetHeader className="resa-pb-4">
				<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
					<div
						style={{
							display: 'flex',
							width: '48px',
							height: '48px',
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: '8px',
							backgroundColor: module.active ? '#a9e43f' : 'hsl(210 40% 96.1%)',
							color: module.active ? '#1e303a' : 'inherit',
						}}
					>
						<IconComponent style={{ width: '24px', height: '24px' }} />
					</div>
					<div>
						<SheetTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							{module.name}
							<Badge
								style={{
									backgroundColor: '#1e303a',
									color: module.flag === 'free' ? '#ffffff' : '#a9e43f',
								}}
							>
								{module.flag === 'free'
									? __('free', 'resa')
									: module.flag === 'pro'
										? __('Premium', 'resa')
										: __('Add-on', 'resa')}
							</Badge>
						</SheetTitle>
						<SheetDescription>{module.description}</SheetDescription>
					</div>
				</div>
			</SheetHeader>

			<Separator className="resa-my-4" />

			{/* Status Section */}
			<div className="resa-space-y-4">
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						padding: '16px',
						borderRadius: '8px',
						border: '1px solid hsl(214.3 31.8% 91.4%)',
						backgroundColor: 'hsl(210 40% 96.1% / 0.3)',
					}}
				>
					<div>
						<p style={{ fontWeight: 500 }}>{__('Status', 'resa')}</p>
						<p style={{ fontSize: '14px', color: 'hsl(215.4 16.3% 46.9%)' }}>
							{module.active
								? __('Das Modul ist aktiv und kann verwendet werden.', 'resa')
								: __('Das Modul ist deaktiviert.', 'resa')}
						</p>
					</div>
					{isPro ? (
						<Button variant="outline" size="sm" disabled>
							<Lock className="resa-mr-1 resa-size-3" />
							{__('Pro', 'resa')}
						</Button>
					) : (
						<Switch
							checked={module.active}
							onCheckedChange={() => onToggle(module.slug)}
							disabled={isToggling}
						/>
					)}
				</div>

				{/* Status indicator */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						padding: '12px',
						borderRadius: '8px',
						border: '1px solid hsl(214.3 31.8% 91.4%)',
					}}
				>
					{module.active ? (
						<>
							<CheckCircle2
								style={{ width: '20px', height: '20px', color: '#a9e43f' }}
							/>
							<div>
								<p style={{ fontWeight: 500, color: '#7ab32a' }}>
									{__('Modul aktiv', 'resa')}
								</p>
								<p style={{ fontSize: '14px', color: 'hsl(215.4 16.3% 46.9%)' }}>
									{__('Shortcode verfügbar: ', 'resa')}
									<code
										style={{
											backgroundColor: 'hsl(210 40% 96.1%)',
											padding: '0 4px',
											borderRadius: '4px',
											fontSize: '12px',
										}}
									>
										{`[resa module="${module.slug}"]`}
									</code>
								</p>
							</div>
						</>
					) : (
						<>
							<XCircle
								style={{
									width: '20px',
									height: '20px',
									color: 'hsl(215.4 16.3% 46.9%)',
								}}
							/>
							<div>
								<p style={{ fontWeight: 500 }}>{__('Modul inaktiv', 'resa')}</p>
								<p style={{ fontSize: '14px', color: 'hsl(215.4 16.3% 46.9%)' }}>
									{__('Aktiviere das Modul, um es zu verwenden.', 'resa')}
								</p>
							</div>
						</>
					)}
				</div>

				{/* Quick Actions */}
				{module.active && (
					<>
						<Separator className="resa-my-4" />
						<div className="resa-space-y-2">
							<p
								style={{
									fontSize: '14px',
									fontWeight: 500,
									color: 'hsl(215.4 16.3% 46.9%)',
								}}
							>
								{__('Schnellaktionen', 'resa')}
							</p>
							<div style={{ display: 'grid', gap: '8px' }}>
								<Button
									variant="outline"
									style={{ justifyContent: 'flex-start', gap: '8px' }}
								>
									<Settings style={{ width: '16px', height: '16px' }} />
									{__('Erweiterte Einstellungen', 'resa')}
								</Button>
								<Button
									variant="outline"
									style={{ justifyContent: 'flex-start', gap: '8px' }}
								>
									<BarChart3 style={{ width: '16px', height: '16px' }} />
									{__('Statistiken anzeigen', 'resa')}
								</Button>
							</div>
						</div>
					</>
				)}

				{/* Pro Upgrade Hint */}
				{isPro && (
					<Alert className="resa-mt-4">
						<Lock className="resa-size-4" />
						<AlertTitle>{__('Pro-Feature', 'resa')}</AlertTitle>
						<AlertDescription>
							{__(
								'Dieses Modul ist Teil des Pro-Plans. Upgrade jetzt für Zugriff auf alle Features.',
								'resa',
							)}
						</AlertDescription>
					</Alert>
				)}
			</div>
		</ScrollArea>
	);
}
