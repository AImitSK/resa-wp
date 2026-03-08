/**
 * Module settings page — Configure a specific module.
 *
 * Route: /modules/:slug/settings
 * Tabs: Overview, Setup, Location Values
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { __ } from '@wordpress/i18n';
import { Calculator, BarChart3, Zap, CheckCircle2, ArrowLeft } from 'lucide-react';
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
import { PdfTab } from '../components/module-settings/PdfTab';
import { AdminPageLayout } from '../components/AdminPageLayout';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingState } from '../components/LoadingState';

/** Module icons by slug */
const MODULE_ICONS: Record<string, React.ElementType> = {
	'rent-calculator': Calculator,
	'purchase-costs': BarChart3,
	'budget-calculator': Calculator,
	'roi-calculator': BarChart3,
	'energy-check': Zap,
	'seller-checklist': CheckCircle2,
	'buyer-checklist': CheckCircle2,
};

type SettingsTab = 'overview' | 'setup' | 'locations' | 'pdf';

export function ModuleSettings() {
	const { slug } = useParams<{ slug: string }>();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<SettingsTab>('overview');

	const { data: settings, isLoading, error } = useModuleSettings(slug);
	const { data: presets } = useModulePresets(slug);
	const saveSettings = useSaveModuleSettings(slug ?? '');
	const saveLocationValue = useSaveLocationValue(slug ?? '');
	const deleteLocationValue = useDeleteLocationValue(slug ?? '');

	const module = settings?.module;
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
		color: '#1e303a',
		boxShadow: isActive ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none',
		cursor: 'pointer',
	});

	const breadcrumbs = [
		{ label: __('Smart Assets', 'resa'), onClick: () => navigate('/modules') },
		{ label: module?.name ?? slug ?? '' },
	];

	// Loading state
	if (isLoading) {
		return (
			<AdminPageLayout
				variant="detail"
				breadcrumbs={breadcrumbs}
				onBack={() => navigate('/modules')}
			>
				<LoadingState message={__('Lade Modul-Einstellungen...', 'resa')} />
			</AdminPageLayout>
		);
	}

	// Error state
	if (error || !settings) {
		return (
			<AdminPageLayout
				variant="detail"
				breadcrumbs={breadcrumbs}
				onBack={() => navigate('/modules')}
			>
				<Alert variant="destructive">
					<AlertTitle>{__('Fehler beim Laden', 'resa')}</AlertTitle>
					<AlertDescription>
						{__(
							'Das Modul konnte nicht gefunden werden oder es ist ein Fehler aufgetreten.',
							'resa',
						)}
					</AlertDescription>
				</Alert>
				<button
					onClick={() => navigate('/modules')}
					style={{
						marginTop: '16px',
						display: 'inline-flex',
						alignItems: 'center',
						gap: '6px',
						color: '#1e303a',
						fontSize: '14px',
						fontWeight: 500,
						background: 'none',
						border: 'none',
						cursor: 'pointer',
						padding: 0,
					}}
				>
					<ArrowLeft style={{ width: '16px', height: '16px' }} />
					{__('Zurück zu Smart Assets', 'resa')}
				</button>
			</AdminPageLayout>
		);
	}

	return (
		<AdminPageLayout
			variant="detail"
			breadcrumbs={breadcrumbs}
			onBack={() => navigate('/modules')}
		>
			{/* Module info */}
			<div
				style={{
					display: 'flex',
					alignItems: 'flex-start',
					gap: '12px',
					marginBottom: '24px',
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
							lineHeight: 1,
							margin: 0,
							padding: 0,
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
							marginTop: '5px',
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
								color: module?.active ? '#a9e43f' : '#1e303a',
								fontWeight: 500,
							}}
						>
							{module?.active ? __('Aktiv', 'resa') : __('Inaktiv', 'resa')}
						</span>
					</div>
				</div>
			</div>

			{/* Tabs */}
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
					<TabsTrigger value="overview" style={tabTriggerStyle(activeTab === 'overview')}>
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
					<TabsTrigger value="pdf" style={tabTriggerStyle(activeTab === 'pdf')}>
						{__('PDF', 'resa')}
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

				<TabsContent value="pdf">{slug && <PdfTab slug={slug} />}</TabsContent>
			</Tabs>
		</AdminPageLayout>
	);
}
