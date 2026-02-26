/**
 * Setup tab — Configure setup mode (pauschal/individuell) and factors.
 *
 * Note: To reset state when settings change, use a key prop on this component
 * in the parent, e.g. <SetupTab key={settings.updated_at} ... />
 */

import { useState } from 'react';
import { FactorEditor } from '../FactorEditor';
import type {
	ModuleSettingsData,
	RegionPreset,
	LocationValue,
} from '../../hooks/useModuleSettings';

interface SaveSettingsData {
	setup_mode?: 'pauschal' | 'individuell';
	region_preset?: string;
	factors?: Record<string, unknown>;
	location_values?: Record<string, LocationValue>;
}

interface SetupTabProps {
	settings: ModuleSettingsData;
	presets: Record<string, RegionPreset>;
	onSave: (data: SaveSettingsData) => void;
	isSaving: boolean;
}

export function SetupTab({ settings, presets, onSave, isSaving }: SetupTabProps) {
	const [setupMode, setSetupMode] = useState<'pauschal' | 'individuell'>(
		settings.setup_mode ?? 'pauschal',
	);
	const [regionPreset, setRegionPreset] = useState(settings.region_preset ?? 'medium_city');
	const [factors, setFactors] = useState<Record<string, unknown>>(settings.factors ?? {});
	const [hasChanges, setHasChanges] = useState(false);

	const handleModeChange = (mode: 'pauschal' | 'individuell') => {
		if (mode === 'individuell' && setupMode === 'pauschal') {
			// Copy preset values into factors for editing
			const preset = presets[regionPreset];
			if (preset) {
				setFactors({ ...preset });
			}
		}
		setSetupMode(mode);
		setHasChanges(true);
	};

	const handlePresetChange = (preset: string) => {
		setRegionPreset(preset);
		if (setupMode === 'pauschal' && presets[preset]) {
			setFactors({ ...presets[preset] });
		}
		setHasChanges(true);
	};

	const handleFactorChange = (key: string, value: number) => {
		setFactors((prev) => ({ ...prev, [key]: value }));
		setHasChanges(true);
	};

	const handleNestedFactorChange = (group: string, subKey: string, value: number) => {
		setFactors((prev) => {
			const currentGroup = (prev[group] as Record<string, number>) ?? {};
			return {
				...prev,
				[group]: { ...currentGroup, [subKey]: value },
			};
		});
		setHasChanges(true);
	};

	const handleSave = () => {
		onSave({
			setup_mode: setupMode,
			region_preset: regionPreset,
			factors: setupMode === 'individuell' ? factors : (presets[regionPreset] ?? factors),
		});
		setHasChanges(false);
	};

	return (
		<div className="resa-space-y-6">
			{/* Setup mode toggle */}
			<div className="resa-rounded-lg resa-border resa-bg-card resa-p-6">
				<h3 className="resa-font-medium resa-mb-4">Einrichtungsmodus</h3>
				<div className="resa-flex resa-gap-4">
					{(['pauschal', 'individuell'] as const).map((mode) => (
						<label
							key={mode}
							className={`resa-flex resa-items-start resa-gap-3 resa-rounded-lg resa-border-2 resa-p-4 resa-cursor-pointer resa-transition-colors resa-flex-1 ${
								setupMode === mode
									? 'resa-border-primary resa-bg-primary/5'
									: 'resa-border-input hover:resa-border-primary/50'
							}`}
						>
							<input
								type="radio"
								name="setup_mode"
								checked={setupMode === mode}
								onChange={() => handleModeChange(mode)}
								className="resa-mt-1"
							/>
							<div>
								<div className="resa-font-medium resa-capitalize">{mode}</div>
								<div className="resa-text-xs resa-text-muted-foreground resa-mt-1">
									{mode === 'pauschal'
										? 'Verwende vordefinierte Werte fur einen Regionstyp'
										: 'Konfiguriere alle Faktoren manuell'}
								</div>
							</div>
						</label>
					))}
				</div>
			</div>

			{/* Pauschal: Preset selection */}
			{setupMode === 'pauschal' && (
				<div className="resa-rounded-lg resa-border resa-bg-card resa-p-6">
					<h3 className="resa-font-medium resa-mb-4">Regionstyp</h3>
					<div className="resa-grid resa-grid-cols-2 resa-gap-3">
						{Object.entries(presets).map(([key, preset]) => (
							<label
								key={key}
								className={`resa-flex resa-items-center resa-gap-3 resa-rounded-lg resa-border-2 resa-p-3 resa-cursor-pointer resa-transition-colors ${
									regionPreset === key
										? 'resa-border-primary resa-bg-primary/5'
										: 'resa-border-input hover:resa-border-primary/50'
								}`}
							>
								<input
									type="radio"
									name="region_preset"
									checked={regionPreset === key}
									onChange={() => handlePresetChange(key)}
									className="resa-shrink-0"
								/>
								<div>
									<div className="resa-text-sm resa-font-medium">
										{preset.label}
									</div>
									{preset.base_price && (
										<div className="resa-text-xs resa-text-muted-foreground">
											Basispreis: {preset.base_price.toFixed(2)} EUR/m2
										</div>
									)}
								</div>
							</label>
						))}
					</div>

					{/* Preset preview */}
					<details className="resa-mt-4">
						<summary className="resa-text-sm resa-text-muted-foreground resa-cursor-pointer">
							Vorschau der Werte
						</summary>
						<pre className="resa-mt-2 resa-text-xs resa-bg-muted resa-p-3 resa-rounded-md resa-overflow-auto resa-max-h-48">
							{JSON.stringify(presets[regionPreset] ?? {}, null, 2)}
						</pre>
					</details>
				</div>
			)}

			{/* Individuell: Manual factor editing */}
			{setupMode === 'individuell' && (
				<div className="resa-rounded-lg resa-border resa-bg-card resa-p-6">
					<h3 className="resa-font-medium resa-mb-4">Berechnungsfaktoren</h3>
					<FactorEditor
						factors={factors}
						onFactorChange={handleFactorChange}
						onNestedFactorChange={handleNestedFactorChange}
					/>
				</div>
			)}

			{/* Save button */}
			<div className="resa-flex resa-justify-end">
				<button
					type="button"
					onClick={handleSave}
					disabled={isSaving || !hasChanges}
					className="resa-px-4 resa-py-2 resa-text-sm resa-font-medium resa-rounded-md resa-bg-primary resa-text-primary-foreground hover:resa-bg-primary/90 disabled:resa-opacity-50 disabled:resa-cursor-not-allowed"
				>
					{isSaving ? 'Speichern...' : 'Einstellungen speichern'}
				</button>
			</div>
		</div>
	);
}
