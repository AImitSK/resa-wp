/**
 * Tracking settings tab — Google Ads conversions, dataLayer, advanced options.
 *
 * 3 cards:
 * 1. Google Ads Conversions (Free + Pro)
 * 2. dataLayer / GTM Events (Free + Pro)
 * 3. Erweitert (Pro only — Enhanced Conversions, GCLID, UTM, Partial Leads)
 *
 * Follows the AgentDataForm inline-styles pattern from Settings.tsx.
 */

import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Lock, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { useTrackingSettings, useSaveTrackingSettings } from '../../hooks/useTrackingSettings';
import { useFeatures } from '../../hooks/useFeatures';
import type { TrackingSettings } from '../../types';

// ─── Styles ─────────────────────────────────────────────

const sectionTitleStyles: React.CSSProperties = {
	margin: 0,
	fontSize: '14px',
	fontWeight: 600,
	color: '#1e303a',
};

const sectionDescStyles: React.CSSProperties = {
	margin: 0,
	fontSize: '13px',
	color: 'hsl(215.4 16.3% 46.9%)',
};

const switchRowStyles: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: '16px',
};

const switchLabelStyles: React.CSSProperties = {
	fontSize: '14px',
	fontWeight: 500,
	color: '#1e303a',
	margin: 0,
};

const switchDescStyles: React.CSSProperties = {
	fontSize: '13px',
	color: 'hsl(215.4 16.3% 46.9%)',
	margin: '2px 0 0 0',
};

// ─── Component ──────────────────────────────────────────

export function TrackingTab() {
	const { data: settings, isLoading } = useTrackingSettings();
	const saveMutation = useSaveTrackingSettings();
	const features = useFeatures();
	const isPremium = features.can_use_advanced_tracking;

	const defaults: TrackingSettings = {
		funnel_tracking_enabled: true,
		partial_leads_enabled: true,
		partial_lead_ttl_days: 30,
		datalayer_enabled: false,
		google_ads_fv_id: '',
		google_ads_fv_label: '',
		google_ads_fs_id: '',
		google_ads_fs_label: '',
		enhanced_conversions_enabled: false,
		gclid_capture_enabled: true,
		utm_capture_enabled: true,
	};

	const [form, setForm] = useState<TrackingSettings>(settings ?? defaults);
	const [isDirty, setIsDirty] = useState(false);

	const updateField = <K extends keyof TrackingSettings>(key: K, value: TrackingSettings[K]) => {
		setForm((prev) => ({ ...prev, [key]: value }));
		setIsDirty(true);
	};

	const handleSave = () => {
		saveMutation.mutate(form, {
			onSuccess: () => setIsDirty(false),
		});
	};

	if (isLoading) {
		return (
			<div className="resa-flex resa-items-center resa-justify-center resa-gap-2 resa-py-12">
				<Spinner className="resa-size-5" />
				<span className="resa-text-muted-foreground">
					{__('Lade Tracking-Einstellungen...', 'resa')}
				</span>
			</div>
		);
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			{/* Card 1: Google Ads Conversions */}
			<Card>
				<CardContent style={{ padding: '20px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						<div>
							<h3 style={sectionTitleStyles}>
								{__('Google Ads Conversions', 'resa')}
							</h3>
							<p style={{ ...sectionDescStyles, marginTop: '4px' }}>
								{__(
									'Conversion-Tracking für Google Ads. Trage die Conversion-ID und das Label aus deinem Google Ads Konto ein.',
									'resa',
								)}
							</p>
						</div>

						{/* Formular-Ansicht */}
						<div>
							<p
								style={{
									margin: '0 0 8px 0',
									fontSize: '13px',
									fontWeight: 500,
									color: 'hsl(215.4 16.3% 46.9%)',
								}}
							>
								{__('Formular-Ansicht (form_view)', 'resa')}
							</p>
							<div className="resa-grid resa-grid-cols-2 resa-gap-4">
								<div className="resa-space-y-2">
									<Label htmlFor="fv-id">{__('Conversion-ID', 'resa')}</Label>
									<Input
										id="fv-id"
										placeholder="AW-123456789"
										value={form.google_ads_fv_id}
										onChange={(e) =>
											updateField('google_ads_fv_id', e.target.value)
										}
									/>
								</div>
								<div className="resa-space-y-2">
									<Label htmlFor="fv-label">
										{__('Conversion-Label', 'resa')}
									</Label>
									<Input
										id="fv-label"
										placeholder="AbCdEf..."
										value={form.google_ads_fv_label}
										onChange={(e) =>
											updateField('google_ads_fv_label', e.target.value)
										}
									/>
								</div>
							</div>
						</div>

						{/* Formular-Absendung */}
						<div>
							<p
								style={{
									margin: '0 0 8px 0',
									fontSize: '13px',
									fontWeight: 500,
									color: 'hsl(215.4 16.3% 46.9%)',
								}}
							>
								{__('Formular-Absendung (form_submit)', 'resa')}
							</p>
							<div className="resa-grid resa-grid-cols-2 resa-gap-4">
								<div className="resa-space-y-2">
									<Label htmlFor="fs-id">{__('Conversion-ID', 'resa')}</Label>
									<Input
										id="fs-id"
										placeholder="AW-123456789"
										value={form.google_ads_fs_id}
										onChange={(e) =>
											updateField('google_ads_fs_id', e.target.value)
										}
									/>
								</div>
								<div className="resa-space-y-2">
									<Label htmlFor="fs-label">
										{__('Conversion-Label', 'resa')}
									</Label>
									<Input
										id="fs-label"
										placeholder="AbCdEf..."
										value={form.google_ads_fs_label}
										onChange={(e) =>
											updateField('google_ads_fs_label', e.target.value)
										}
									/>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Card 2: dataLayer / GTM */}
			<Card>
				<CardContent style={{ padding: '20px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						<div style={switchRowStyles}>
							<div>
								<h3 style={sectionTitleStyles}>
									{__('dataLayer / GTM Events', 'resa')}
								</h3>
								<p style={{ ...sectionDescStyles, marginTop: '4px' }}>
									{__(
										'Pusht RESA-Events an window.dataLayer für Google Tag Manager.',
										'resa',
									)}
								</p>
							</div>
							<Switch
								checked={form.datalayer_enabled}
								onCheckedChange={(checked) =>
									updateField('datalayer_enabled', checked)
								}
							/>
						</div>

						{form.datalayer_enabled && (
							<div
								style={{
									border: '1px solid hsl(214.3 31.8% 91.4%)',
									borderRadius: '8px',
									padding: '16px',
								}}
							>
								<p
									style={{
										margin: '0 0 8px 0',
										fontSize: '13px',
										fontWeight: 500,
										color: '#1e303a',
									}}
								>
									{__('Verfügbare Events', 'resa')}
								</p>
								<div
									style={{
										display: 'grid',
										gap: '4px',
										fontSize: '13px',
										fontFamily: 'ui-monospace, monospace',
										color: 'hsl(215.4 16.3% 46.9%)',
									}}
								>
									<div>resa_asset_view</div>
									<div>resa_asset_start</div>
									<div>resa_step_complete</div>
									<div>resa_form_view</div>
									<div>resa_form_interact</div>
									<div>resa_form_submit</div>
									<div>resa_result_view</div>
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Card 3: Erweitert (Pro) */}
			<Card style={!isPremium ? { opacity: 0.75 } : undefined}>
				<CardContent style={{ padding: '20px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<h3 style={sectionTitleStyles}>{__('Erweiterte Optionen', 'resa')}</h3>
							{!isPremium && (
								<Badge
									style={{
										backgroundColor: '#1e303a',
										color: 'white',
										border: 'none',
										padding: '2px 8px',
										fontSize: '11px',
										display: 'inline-flex',
										alignItems: 'center',
										gap: '4px',
									}}
								>
									<Lock style={{ width: '10px', height: '10px' }} />
									Pro
								</Badge>
							)}
						</div>

						{!isPremium && (
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '12px',
									padding: '12px 16px',
									backgroundColor: 'hsl(210 40% 96.1%)',
									borderRadius: '8px',
									fontSize: '13px',
									color: 'hsl(215.4 16.3% 46.9%)',
								}}
							>
								<Crown
									style={{
										width: '16px',
										height: '16px',
										flexShrink: 0,
									}}
								/>
								{__(
									'Erweiterte Tracking-Optionen sind nur mit dem Pro-Plan verfügbar.',
									'resa',
								)}
							</div>
						)}

						{/* Enhanced Conversions */}
						<div style={switchRowStyles}>
							<div>
								<p style={switchLabelStyles}>
									{__('Enhanced Conversions', 'resa')}
								</p>
								<p style={switchDescStyles}>
									{__(
										'SHA-256-gehashte E-Mail an Google Ads senden für bessere Attribution.',
										'resa',
									)}
								</p>
							</div>
							<Switch
								disabled={!isPremium}
								checked={form.enhanced_conversions_enabled}
								onCheckedChange={(checked) =>
									updateField('enhanced_conversions_enabled', checked)
								}
							/>
						</div>

						{/* GCLID */}
						<div style={switchRowStyles}>
							<div>
								<p style={switchLabelStyles}>{__('GCLID erfassen', 'resa')}</p>
								<p style={switchDescStyles}>
									{__(
										'Google Click ID aus der URL speichern für Offline-Conversions.',
										'resa',
									)}
								</p>
							</div>
							<Switch
								disabled={!isPremium}
								checked={form.gclid_capture_enabled}
								onCheckedChange={(checked) =>
									updateField('gclid_capture_enabled', checked)
								}
							/>
						</div>

						{/* UTM */}
						<div style={switchRowStyles}>
							<div>
								<p style={switchLabelStyles}>
									{__('UTM-Parameter erfassen', 'resa')}
								</p>
								<p style={switchDescStyles}>
									{__('UTM-Parameter aus der URL im Lead speichern.', 'resa')}
								</p>
							</div>
							<Switch
								disabled={!isPremium}
								checked={form.utm_capture_enabled}
								onCheckedChange={(checked) =>
									updateField('utm_capture_enabled', checked)
								}
							/>
						</div>

						{/* Partial Leads */}
						<div style={switchRowStyles}>
							<div>
								<p style={switchLabelStyles}>{__('Partial Leads', 'resa')}</p>
								<p style={switchDescStyles}>
									{__(
										'Unvollständige Leads speichern (Two-Phase Capture).',
										'resa',
									)}
								</p>
							</div>
							<Switch
								disabled={!isPremium}
								checked={form.partial_leads_enabled}
								onCheckedChange={(checked) =>
									updateField('partial_leads_enabled', checked)
								}
							/>
						</div>

						{form.partial_leads_enabled && isPremium && (
							<div className="resa-space-y-2">
								<Label htmlFor="ttl">
									{__('Partial Lead Aufbewahrung (Tage)', 'resa')}
								</Label>
								<Input
									id="ttl"
									type="number"
									min={7}
									max={365}
									value={form.partial_lead_ttl_days}
									onChange={(e) =>
										updateField(
											'partial_lead_ttl_days',
											parseInt(e.target.value, 10) || 30,
										)
									}
									style={{ width: '120px' }}
								/>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Save Footer */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<p
					style={{
						margin: 0,
						fontSize: '12px',
						color: 'hsl(215.4 16.3% 46.9%)',
					}}
				>
					{saveMutation.isSuccess && __('Tracking-Einstellungen gespeichert.', 'resa')}
				</p>
				<Button
					onClick={handleSave}
					disabled={!isDirty || saveMutation.isPending}
					style={{
						backgroundColor: isDirty ? '#a9e43f' : 'hsl(210 40% 96.1%)',
						color: '#1e303a',
						border: 'none',
					}}
				>
					{saveMutation.isPending && (
						<Spinner style={{ width: '14px', height: '14px', marginRight: '8px' }} />
					)}
					{__('Speichern', 'resa')}
				</Button>
			</div>
		</div>
	);
}
