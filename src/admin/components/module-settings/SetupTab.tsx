/**
 * Setup tab — Configure setup mode (pauschal/individuell) and factors.
 *
 * Uses Zod + React Hook Form for validation.
 * @see docs/design-system/patterns/form-validation.md
 *
 * Note: To reset state when settings change, use a key prop on this component
 * in the parent, e.g. <SetupTab key={settings.updated_at} ... />
 */

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { __ } from '@wordpress/i18n';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { FactorEditor } from '../FactorEditor';
import { moduleSetupSchema, type ModuleSetupFormData } from '../../schemas/moduleSetup';
import { defaultFactors } from '../../schemas/factor';
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
	const [saveHover, setSaveHover] = useState(false);
	const [previewHover, setPreviewHover] = useState(false);
	const [resetHover, setResetHover] = useState(false);

	const defaults: ModuleSetupFormData = {
		setup_mode: settings.setup_mode ?? 'pauschal',
		region_preset: settings.region_preset ?? 'medium_city',
		factors: settings.factors ?? {},
	};

	const form = useForm<ModuleSetupFormData>({
		resolver: zodResolver(moduleSetupSchema),
		defaultValues: defaults,
		mode: 'onChange',
	});

	// Sync server data when settings prop changes
	useEffect(() => {
		form.reset({
			setup_mode: settings.setup_mode ?? 'pauschal',
			region_preset: settings.region_preset ?? 'medium_city',
			factors: settings.factors ?? {},
		});
	}, [settings, form]);

	const {
		formState: { isDirty, errors },
		watch,
		setValue,
	} = form;

	const setupMode = watch('setup_mode');
	const regionPreset = watch('region_preset');

	const handleModeChange = (mode: 'pauschal' | 'individuell') => {
		if (mode === 'individuell' && setupMode === 'pauschal') {
			const preset = presets[regionPreset];
			if (preset) {
				setValue('factors', { ...preset }, { shouldDirty: true });
			}
		}
		setValue('setup_mode', mode, { shouldDirty: true });
	};

	const handlePresetChange = (preset: string) => {
		setValue('region_preset', preset, { shouldDirty: true });
		if (setupMode === 'pauschal' && presets[preset]) {
			setValue('factors', { ...presets[preset] }, { shouldDirty: true });
		}
	};

	const onSubmit = (data: ModuleSetupFormData) => {
		onSave({
			setup_mode: data.setup_mode,
			region_preset: data.region_preset,
			factors:
				data.setup_mode === 'individuell'
					? data.factors
					: (presets[data.region_preset] ?? data.factors),
		});
		form.reset(data);
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
			{/* Page header */}
			<div>
				<h3
					style={{
						fontSize: '18px',
						fontWeight: 600,
						color: '#1e303a',
						margin: 0,
					}}
				>
					{__('Einrichtung', 'resa')}
				</h3>
				<p
					style={{
						fontSize: '14px',
						color: '#1e303a',
						margin: '4px 0 0 0',
					}}
				>
					{__('Konfiguriere den Berechnungsmodus und die Faktoren.', 'resa')}
				</p>
			</div>

			{/* Setup mode toggle */}
			<div style={sectionStyle}>
				<h3 style={sectionTitleStyle}>{__('Einrichtungsmodus', 'resa')}</h3>
				<Controller
					name="setup_mode"
					control={form.control}
					render={({ field }) => (
						<div style={{ display: 'flex', gap: '16px' }}>
							{(['pauschal', 'individuell'] as const).map((mode) => (
								<label key={mode} style={modeCardStyle(field.value === mode)}>
									<input
										type="radio"
										name="setup_mode"
										checked={field.value === mode}
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
												color: '#1e303a',
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
					)}
				/>
				{errors.setup_mode && (
					<p style={{ fontSize: '13px', color: '#ef4444', margin: '8px 0 0 0' }}>
						{errors.setup_mode.message}
					</p>
				)}
			</div>

			{/* Pauschal: Preset selection */}
			{setupMode === 'pauschal' && (
				<div style={sectionStyle}>
					<h3 style={sectionTitleStyle}>{__('Regionstyp', 'resa')}</h3>
					<Controller
						name="region_preset"
						control={form.control}
						render={({ field }) => (
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(2, 1fr)',
									gap: '12px',
								}}
							>
								{Object.entries(presets).map(([key, preset]) => (
									<label key={key} style={presetCardStyle(field.value === key)}>
										<input
											type="radio"
											name="region_preset"
											checked={field.value === key}
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
														color: '#1e303a',
													}}
												>
													{__('Basispreis:', 'resa')}{' '}
													{preset.base_price.toLocaleString('de-DE', {
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
													})}{' '}
													EUR/m2
												</div>
											)}
										</div>
									</label>
								))}
							</div>
						)}
					/>
					{errors.region_preset && (
						<p style={{ fontSize: '13px', color: '#ef4444', margin: '8px 0 0 0' }}>
							{errors.region_preset.message}
						</p>
					)}

					{/* Preset preview */}
					<details style={{ marginTop: '16px' }}>
						<summary
							onMouseEnter={() => setPreviewHover(true)}
							onMouseLeave={() => setPreviewHover(false)}
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								padding: '6px 12px',
								borderRadius: '6px',
								fontSize: '13px',
								fontWeight: 500,
								color: '#1e303a',
								backgroundColor: previewHover ? 'hsl(210 40% 88%)' : 'transparent',
								cursor: 'pointer',
								transition: 'background-color 150ms',
								listStyle: 'none',
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
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '16px',
						}}
					>
						<h3 style={{ ...sectionTitleStyle, marginBottom: 0 }}>
							{__('Berechnungsfaktoren', 'resa')}
						</h3>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								setValue('factors', { ...defaultFactors }, { shouldDirty: true });
							}}
							onMouseEnter={() => setResetHover(true)}
							onMouseLeave={() => setResetHover(false)}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '6px',
								backgroundColor: resetHover ? 'hsl(210 40% 94%)' : 'white',
								border: '1px solid hsl(214.3 31.8% 78%)',
								color: '#1e303a',
								fontSize: '13px',
							}}
						>
							<RotateCcw style={{ width: '14px', height: '14px' }} />
							{__('Auf Standardwerte zurücksetzen', 'resa')}
						</Button>
					</div>
					<FactorEditor form={form} />
				</div>
			)}

			{/* Save button */}
			<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
				<Button
					onClick={form.handleSubmit(onSubmit)}
					disabled={isSaving || !isDirty}
					onMouseEnter={() => setSaveHover(true)}
					onMouseLeave={() => setSaveHover(false)}
					style={{
						backgroundColor: !isDirty
							? 'hsl(210 40% 96.1%)'
							: saveHover
								? '#98d438'
								: '#a9e43f',
						color: isDirty ? '#1e303a' : 'hsl(215.4 16.3% 46.9%)',
						border: 'none',
						fontWeight: 500,
						cursor: isDirty ? 'pointer' : 'not-allowed',
					}}
				>
					{isSaving && <Spinner style={{ marginRight: '8px' }} />}
					{isSaving ? __('Speichern...', 'resa') : __('Einstellungen speichern', 'resa')}
				</Button>
			</div>
		</div>
	);
}
