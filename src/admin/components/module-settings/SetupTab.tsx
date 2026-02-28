/**
 * Setup tab — Configure setup mode (pauschal/individuell) and factors.
 *
 * Note: To reset state when settings change, use a key prop on this component
 * in the parent, e.g. <SetupTab key={settings.updated_at} ... />
 */

import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
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

	const sectionStyle: React.CSSProperties = {
		backgroundColor: 'hsl(210 40% 96.1%)',
		borderRadius: '8px',
		padding: '20px',
	};

	const sectionTitleStyle: React.CSSProperties = {
		fontSize: '14px',
		fontWeight: 600,
		color: '#1e303a',
		margin: 0,
		marginBottom: '16px',
	};

	const modeCardStyle = (isActive: boolean): React.CSSProperties => ({
		flex: 1,
		display: 'flex',
		alignItems: 'flex-start',
		gap: '12px',
		borderRadius: '8px',
		border: `2px solid ${isActive ? '#a9e43f' : 'hsl(214.3 31.8% 91.4%)'}`,
		backgroundColor: isActive ? 'rgba(169, 228, 63, 0.1)' : 'white',
		padding: '16px',
		cursor: 'pointer',
		transition: 'all 150ms',
	});

	const presetCardStyle = (isActive: boolean): React.CSSProperties => ({
		display: 'flex',
		alignItems: 'center',
		gap: '12px',
		borderRadius: '8px',
		border: `2px solid ${isActive ? '#a9e43f' : 'hsl(214.3 31.8% 91.4%)'}`,
		backgroundColor: isActive ? 'rgba(169, 228, 63, 0.1)' : 'white',
		padding: '12px',
		cursor: 'pointer',
		transition: 'all 150ms',
	});

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
			{/* Setup mode toggle */}
			<div style={sectionStyle}>
				<h3 style={sectionTitleStyle}>{__('Einrichtungsmodus', 'resa')}</h3>
				<div style={{ display: 'flex', gap: '16px' }}>
					{(['pauschal', 'individuell'] as const).map((mode) => (
						<label key={mode} style={modeCardStyle(setupMode === mode)}>
							<input
								type="radio"
								name="setup_mode"
								checked={setupMode === mode}
								onChange={() => handleModeChange(mode)}
								style={{ marginTop: '2px', accentColor: '#a9e43f' }}
							/>
							<div>
								<div style={{ fontWeight: 500, color: '#1e303a' }}>
									{mode === 'pauschal'
										? __('Pauschal', 'resa')
										: __('Individuell', 'resa')}
								</div>
								<div
									style={{
										fontSize: '12px',
										color: 'hsl(215.4 16.3% 46.9%)',
										marginTop: '4px',
									}}
								>
									{mode === 'pauschal'
										? __(
												'Verwende vordefinierte Werte für einen Regionstyp',
												'resa',
											)
										: __('Konfiguriere alle Faktoren manuell', 'resa')}
								</div>
							</div>
						</label>
					))}
				</div>
			</div>

			{/* Pauschal: Preset selection */}
			{setupMode === 'pauschal' && (
				<div style={sectionStyle}>
					<h3 style={sectionTitleStyle}>{__('Regionstyp', 'resa')}</h3>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(2, 1fr)',
							gap: '12px',
						}}
					>
						{Object.entries(presets).map(([key, preset]) => (
							<label key={key} style={presetCardStyle(regionPreset === key)}>
								<input
									type="radio"
									name="region_preset"
									checked={regionPreset === key}
									onChange={() => handlePresetChange(key)}
									style={{ accentColor: '#a9e43f' }}
								/>
								<div>
									<div
										style={{
											fontSize: '14px',
											fontWeight: 500,
											color: '#1e303a',
										}}
									>
										{preset.label}
									</div>
									{preset.base_price && (
										<div
											style={{
												fontSize: '12px',
												color: 'hsl(215.4 16.3% 46.9%)',
											}}
										>
											{__('Basispreis:', 'resa')}{' '}
											{preset.base_price.toLocaleString('de-DE', {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}{' '}
											€/m²
										</div>
									)}
								</div>
							</label>
						))}
					</div>

					{/* Preset preview */}
					<details style={{ marginTop: '16px' }}>
						<summary
							style={{
								fontSize: '13px',
								color: 'hsl(215.4 16.3% 46.9%)',
								cursor: 'pointer',
							}}
						>
							{__('Vorschau der Werte', 'resa')}
						</summary>
						<pre
							style={{
								marginTop: '8px',
								fontSize: '12px',
								backgroundColor: 'white',
								padding: '12px',
								borderRadius: '6px',
								overflow: 'auto',
								maxHeight: '200px',
								color: '#1e303a',
							}}
						>
							{JSON.stringify(presets[regionPreset] ?? {}, null, 2)}
						</pre>
					</details>
				</div>
			)}

			{/* Individuell: Manual factor editing */}
			{setupMode === 'individuell' && (
				<div style={sectionStyle}>
					<h3 style={sectionTitleStyle}>{__('Berechnungsfaktoren', 'resa')}</h3>
					<FactorEditor
						factors={factors}
						onFactorChange={handleFactorChange}
						onNestedFactorChange={handleNestedFactorChange}
					/>
				</div>
			)}

			{/* Save button */}
			<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
				<Button
					onClick={handleSave}
					disabled={isSaving || !hasChanges}
					style={{
						backgroundColor: hasChanges ? '#a9e43f' : 'hsl(210 40% 96.1%)',
						color: hasChanges ? '#1e303a' : 'hsl(215.4 16.3% 46.9%)',
						border: 'none',
						fontWeight: 500,
					}}
				>
					{isSaving && <Spinner style={{ marginRight: '8px' }} />}
					{isSaving ? __('Speichern...', 'resa') : __('Einstellungen speichern', 'resa')}
				</Button>
			</div>
		</div>
	);
}
