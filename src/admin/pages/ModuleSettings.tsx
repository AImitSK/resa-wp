/**
 * Module settings page — Configure a specific module.
 *
 * Route: /modules/:slug/settings
 * Tabs: Overview, Setup, Location Values
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { __ } from '@wordpress/i18n';
import { ArrowLeft, Calculator, Home, BarChart3, Zap, CheckCircle2 } from 'lucide-react';
import {
	useModuleSettings,
	useModulePresets,
	useSaveModuleSettings,
	useSaveLocationValue,
	useDeleteLocationValue,
	type LocationValue,
} from '../hooks/useModuleSettings';
import { OverviewTab } from '../components/module-settings/OverviewTab';
import { SetupTab } from '../components/module-settings/SetupTab';
import { LocationValuesTab } from '../components/module-settings/LocationValuesTab';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

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

type SettingsTab = 'overview' | 'setup' | 'locations';

export function ModuleSettings() {
	const { slug } = useParams<{ slug: string }>();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<SettingsTab>('overview');

	const { data: settings, isLoading, error } = useModuleSettings(slug);
	const { data: presets } = useModulePresets(slug);
	const saveSettings = useSaveModuleSettings(slug ?? '');
	const saveLocationValue = useSaveLocationValue(slug ?? '');
	const deleteLocationValue = useDeleteLocationValue(slug ?? '');

	if (isLoading) {
		return (
			<Card>
				<div style={{ padding: '24px' }}>
					<Skeleton className="resa-h-4 resa-w-48" />
					<Skeleton className="resa-h-8 resa-w-64 resa-mt-4" />
					<div className="resa-flex resa-items-center resa-gap-2 resa-mt-6">
						<Spinner className="resa-size-5" />
						<span className="resa-text-muted-foreground">
							{__('Einstellungen werden geladen...', 'resa')}
						</span>
					</div>
				</div>
			</Card>
		);
	}

	if (error || !settings) {
		return (
			<Card>
				<div style={{ padding: '24px' }}>
					<Alert variant="destructive">
						<AlertTitle>{__('Fehler beim Laden', 'resa')}</AlertTitle>
						<AlertDescription>
							{__(
								'Das Modul konnte nicht gefunden werden oder es ist ein Fehler aufgetreten.',
								'resa',
							)}
						</AlertDescription>
					</Alert>
					<Button
						variant="link"
						onClick={() => navigate('/modules')}
						style={{ marginTop: '16px' }}
					>
						<ArrowLeft />
						{__('Zurück zu Smart Assets', 'resa')}
					</Button>
				</div>
			</Card>
		);
	}

	const module = settings.module;
	const IconComponent = MODULE_ICONS[slug ?? ''] ?? Zap;

	const handleSaveSettings = (data: {
		setup_mode?: 'pauschal' | 'individuell';
		region_preset?: string;
		factors?: Record<string, unknown>;
		location_values?: Record<string, LocationValue>;
	}) => {
		saveSettings.mutate(data);
	};

	const handleSaveLocationValue = (locationId: number, values: LocationValue) => {
		saveLocationValue.mutate({ locationId, values });
	};

	const handleDeleteLocationValue = (locationId: number) => {
		deleteLocationValue.mutate(locationId);
	};

	const tabTriggerStyle = (isActive: boolean): React.CSSProperties => ({
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		whiteSpace: 'nowrap',
		borderRadius: '6px',
		padding: '6px 12px',
		fontSize: '14px',
		fontWeight: 500,
		transition: 'all 150ms',
		backgroundColor: isActive ? 'white' : 'transparent',
		color: isActive ? '#1e303a' : 'hsl(215.4 16.3% 46.9%)',
		boxShadow: isActive ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none',
		cursor: 'pointer',
	});

	return (
		<Card>
			{/* Header with breadcrumb and module info */}
			<div
				style={{
					padding: '24px',
					paddingBottom: '20px',
					borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
				}}
			>
				{/* Top row: Breadcrumb + Back button */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
					}}
				>
					<nav aria-label="breadcrumb">
						<ol
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								fontSize: '14px',
								margin: 0,
								padding: 0,
								listStyle: 'none',
							}}
						>
							<li>
								<span
									onClick={() => navigate('/modules')}
									style={{
										cursor: 'pointer',
										color: 'hsl(215.4 16.3% 46.9%)',
										transition: 'color 150ms',
									}}
									onMouseEnter={(e) => (e.currentTarget.style.color = '#1e303a')}
									onMouseLeave={(e) =>
										(e.currentTarget.style.color = 'hsl(215.4 16.3% 46.9%)')
									}
								>
									{__('Smart Assets', 'resa')}
								</span>
							</li>
							<li style={{ color: 'hsl(215.4 16.3% 46.9%)' }}>
								<ChevronRight style={{ width: '14px', height: '14px' }} />
							</li>
							<li>
								<span style={{ color: '#1e303a', fontWeight: 500 }}>
									{module?.name ?? slug}
								</span>
							</li>
						</ol>
					</nav>

					<Button
						variant="ghost"
						size="sm"
						onClick={() => navigate('/modules')}
						style={{ color: 'hsl(215.4 16.3% 46.9%)' }}
					>
						<ArrowLeft style={{ width: '16px', height: '16px', marginRight: '4px' }} />
						{__('Zurück', 'resa')}
					</Button>
				</div>

				{/* Module info */}
				<div
					style={{
						display: 'flex',
						alignItems: 'flex-start',
						gap: '12px',
						marginTop: '16px',
					}}
				>
					<div
						style={{
							display: 'flex',
							width: '48px',
							height: '48px',
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: '8px',
							backgroundColor: module?.active ? '#a9e43f' : 'hsl(210 40% 96.1%)',
							color: module?.active ? '#1e303a' : 'inherit',
						}}
					>
						<IconComponent style={{ width: '24px', height: '24px' }} />
					</div>
					<div>
						<h1
							style={{
								fontSize: '24px',
								fontWeight: 600,
								lineHeight: 1.2,
								margin: 0,
								color: '#1e303a',
							}}
						>
							{module?.name ?? __('Modul-Einstellungen', 'resa')}
						</h1>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								marginTop: '1px',
							}}
						>
							<Badge
								style={{
									fontSize: '10px',
									padding: '0 8px 2px 8px',
									backgroundColor: '#1e303a',
									color: module?.flag === 'free' ? '#ffffff' : '#a9e43f',
								}}
							>
								{module?.flag === 'free'
									? __('free', 'resa')
									: module?.flag === 'pro'
										? __('Premium', 'resa')
										: __('Add-on', 'resa')}
							</Badge>
							<span
								style={{
									fontSize: '13px',
									color: module?.active ? '#a9e43f' : 'hsl(215.4 16.3% 46.9%)',
									fontWeight: 500,
								}}
							>
								{module?.active ? __('Aktiv', 'resa') : __('Inaktiv', 'resa')}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Tabs */}
			<CardContent style={{ padding: '24px' }}>
				<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SettingsTab)}>
					<TabsList
						style={{
							display: 'inline-flex',
							height: '36px',
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: '8px',
							backgroundColor: 'hsl(210 40% 96.1%)',
							padding: '4px',
							marginBottom: '24px',
						}}
					>
						<TabsTrigger
							value="overview"
							style={tabTriggerStyle(activeTab === 'overview')}
						>
							{__('Übersicht', 'resa')}
						</TabsTrigger>
						<TabsTrigger value="setup" style={tabTriggerStyle(activeTab === 'setup')}>
							{__('Einrichtung', 'resa')}
						</TabsTrigger>
						<TabsTrigger
							value="locations"
							style={tabTriggerStyle(activeTab === 'locations')}
						>
							{__('Standort-Werte', 'resa')}
						</TabsTrigger>
					</TabsList>

					<TabsContent value="overview">
						{module && <OverviewTab module={module} />}
					</TabsContent>

					<TabsContent value="setup">
						<SetupTab
							key={settings.updated_at ?? settings.module_slug}
							settings={settings}
							presets={presets ?? {}}
							onSave={handleSaveSettings}
							isSaving={saveSettings.isPending}
						/>
					</TabsContent>

					<TabsContent value="locations">
						<LocationValuesTab
							settings={settings}
							onSaveLocationValue={handleSaveLocationValue}
							onDeleteLocationValue={handleDeleteLocationValue}
							isSaving={saveLocationValue.isPending || deleteLocationValue.isPending}
						/>
					</TabsContent>
				</Tabs>
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
	);
}
