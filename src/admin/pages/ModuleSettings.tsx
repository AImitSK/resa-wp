/**
 * Module settings page — Configure a specific module.
 *
 * Route: /modules/:slug/settings
 * Tabs: Overview, Setup, Location Values
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

type TabId = 'overview' | 'setup' | 'locations';

const TABS: { id: TabId; label: string }[] = [
	{ id: 'overview', label: 'Ubersicht' },
	{ id: 'setup', label: 'Einrichtung' },
	{ id: 'locations', label: 'Standort-Werte' },
];

export function ModuleSettings() {
	const { slug } = useParams<{ slug: string }>();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<TabId>('overview');

	const { data: settings, isLoading, error } = useModuleSettings(slug);
	const { data: presets } = useModulePresets(slug);
	const saveSettings = useSaveModuleSettings(slug ?? '');
	const saveLocationValue = useSaveLocationValue(slug ?? '');
	const deleteLocationValue = useDeleteLocationValue(slug ?? '');

	if (isLoading) {
		return (
			<div className="resa-flex resa-items-center resa-justify-center resa-py-12">
				<div className="resa-text-muted-foreground">Einstellungen werden geladen...</div>
			</div>
		);
	}

	if (error || !settings) {
		return (
			<div className="resa-rounded-lg resa-border resa-border-destructive/50 resa-bg-destructive/10 resa-p-6">
				<h2 className="resa-text-lg resa-font-semibold resa-text-destructive">
					Fehler beim Laden
				</h2>
				<p className="resa-text-sm resa-text-muted-foreground resa-mt-2">
					Das Modul konnte nicht gefunden werden oder es ist ein Fehler aufgetreten.
				</p>
				<button
					type="button"
					onClick={() => navigate('/modules')}
					className="resa-mt-4 resa-text-sm resa-text-primary hover:resa-underline"
				>
					Zuruck zu Smart Assets
				</button>
			</div>
		);
	}

	const module = settings.module;

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

	return (
		<div>
			{/* Breadcrumb */}
			<nav className="resa-text-sm resa-text-muted-foreground resa-mb-4">
				<button
					type="button"
					onClick={() => navigate('/modules')}
					className="hover:resa-text-foreground"
				>
					Smart Assets
				</button>
				<span className="resa-mx-2">/</span>
				<span className="resa-text-foreground">{module?.name ?? slug}</span>
			</nav>

			{/* Header */}
			<div className="resa-flex resa-items-center resa-justify-between resa-mb-6">
				<h1 className="resa-text-2xl resa-font-bold">
					{module?.name ?? 'Modul-Einstellungen'}
				</h1>
				<button
					type="button"
					onClick={() => navigate('/modules')}
					className="resa-text-sm resa-text-muted-foreground hover:resa-text-foreground"
				>
					Zuruck
				</button>
			</div>

			{/* Tabs */}
			<div className="resa-border-b resa-mb-6">
				<div className="resa-flex resa-gap-6">
					{TABS.map((tab) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => setActiveTab(tab.id)}
							className={`resa-pb-3 resa-text-sm resa-font-medium resa-border-b-2 resa-transition-colors ${
								activeTab === tab.id
									? 'resa-border-primary resa-text-foreground'
									: 'resa-border-transparent resa-text-muted-foreground hover:resa-text-foreground'
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>
			</div>

			{/* Tab content */}
			{activeTab === 'overview' && module && <OverviewTab module={module} />}

			{activeTab === 'setup' && (
				<SetupTab
					key={settings.updated_at ?? settings.module_slug}
					settings={settings}
					presets={presets ?? {}}
					onSave={handleSaveSettings}
					isSaving={saveSettings.isPending}
				/>
			)}

			{activeTab === 'locations' && (
				<LocationValuesTab
					settings={settings}
					onSaveLocationValue={handleSaveLocationValue}
					onDeleteLocationValue={handleDeleteLocationValue}
					isSaving={saveLocationValue.isPending || deleteLocationValue.isPending}
				/>
			)}
		</div>
	);
}
