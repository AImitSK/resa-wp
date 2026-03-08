/**
 * Tracking settings tab — Google Ads conversions, dataLayer, advanced options.
 *
 * 3 cards:
 * 1. Google Ads Conversions (Free + Pro)
 * 2. dataLayer / GTM Events (Free + Pro)
 * 3. Erweitert (Pro only — Enhanced Conversions, GCLID, UTM, Partial Leads)
 *
 * Uses Zod + React Hook Form for validation.
 * @see docs/design-system/patterns/form-validation.md
 */

import { useState, useEffect, type ReactNode } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { __ } from '@wordpress/i18n';
import { Lock, Crown, Copy, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '../LoadingState';
import { useTrackingSettings, useSaveTrackingSettings } from '../../hooks/useTrackingSettings';
import { toast } from '../../lib/toast';
import { useFeatures } from '../../hooks/useFeatures';
import { trackingSettingsSchema, type TrackingSettingsFormData } from '../../schemas/tracking';

// ─── Styled Button Component ────────────────────────────

function PrimaryButton({
	children,
	onClick,
	disabled,
}: {
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
}) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<Button
			type="button"
			size="sm"
			onClick={onClick}
			disabled={disabled}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				backgroundColor: disabled
					? 'hsl(210 40% 96.1%)'
					: isHovered
						? '#98d438'
						: '#a9e43f',
				color: disabled ? 'hsl(215.4 16.3% 46.9%)' : '#1e303a',
				border: 'none',
				cursor: disabled ? 'not-allowed' : 'pointer',
				opacity: 1,
				gap: '6px',
			}}
		>
			{children}
		</Button>
	);
}

// ─── Styles ─────────────────────────────────────────────

const cardStyles: React.CSSProperties = {
	border: '1px solid hsl(214.3 31.8% 91.4%)',
	borderRadius: '8px',
	boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
};

const sectionTitleStyles: React.CSSProperties = {
	margin: 0,
	fontSize: '16px',
	fontWeight: 600,
	color: '#1e303a',
};

const sectionDescStyles: React.CSSProperties = {
	margin: '4px 0 0 0',
	fontSize: '13px',
	color: 'hsl(215.4 16.3% 46.9%)',
};

const grayBoxStyles: React.CSSProperties = {
	padding: '16px',
	border: '1px solid hsl(214.3 31.8% 91.4%)',
	borderRadius: '8px',
	backgroundColor: 'hsl(210 40% 96.1%)',
};

const boxTitleStyles: React.CSSProperties = {
	margin: 0,
	fontSize: '14px',
	fontWeight: 500,
	color: '#1e303a',
};

const toggleBoxStyles: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	padding: '16px',
	border: '1px solid hsl(214.3 31.8% 91.4%)',
	borderRadius: '8px',
	backgroundColor: 'hsl(210 40% 96.1%)',
};

const fieldDescStyles: React.CSSProperties = {
	margin: '2px 0 0 0',
	fontSize: '12px',
	color: 'hsl(215.4 16.3% 46.9%)',
};

const inputStyles: React.CSSProperties = {
	height: '36px',
	padding: '0 12px',
	fontSize: '14px',
	border: '1px solid hsl(214.3 31.8% 78%)',
	borderRadius: '6px',
	backgroundColor: 'white',
};

// ─── dataLayer Events ───────────────────────────────────

const DATALAYER_EVENTS = [
	{
		name: 'resa_asset_view',
		description: __('Besucher sieht das Smart Asset (Widget geladen)', 'resa'),
	},
	{
		name: 'resa_asset_start',
		description: __('Benutzer startet die Interaktion (erster Klick)', 'resa'),
	},
	{
		name: 'resa_step_complete',
		description: __('Ein Schritt im Wizard wurde abgeschlossen', 'resa'),
	},
	{
		name: 'resa_form_view',
		description: __('Lead-Formular wird angezeigt', 'resa'),
	},
	{
		name: 'resa_form_interact',
		description: __('Benutzer beginnt Formular auszufüllen', 'resa'),
	},
	{
		name: 'resa_form_submit',
		description: __('Formular erfolgreich abgesendet (Lead erfasst)', 'resa'),
	},
	{
		name: 'resa_result_view',
		description: __('Ergebnisseite wird angezeigt', 'resa'),
	},
];

// ─── Copyable Event Cell ────────────────────────────────

function CopyableEventCell({ eventName }: { eventName: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(eventName);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<button
			type="button"
			onClick={handleCopy}
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: '6px',
				padding: '4px 8px',
				fontSize: '13px',
				fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
				color: '#1e303a',
				backgroundColor: 'white',
				border: '1px solid hsl(214.3 31.8% 91.4%)',
				borderRadius: '4px',
				cursor: 'pointer',
				transition: 'all 150ms',
			}}
			onMouseEnter={(e) => {
				e.currentTarget.style.backgroundColor = 'hsl(210 40% 98%)';
				e.currentTarget.style.borderColor = 'hsl(214.3 31.8% 78%)';
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.backgroundColor = 'white';
				e.currentTarget.style.borderColor = 'hsl(214.3 31.8% 91.4%)';
			}}
		>
			{eventName}
			{copied ? (
				<Check style={{ width: '12px', height: '12px', color: 'hsl(142 76% 36%)' }} />
			) : (
				<Copy style={{ width: '12px', height: '12px', color: 'hsl(215.4 16.3% 46.9%)' }} />
			)}
		</button>
	);
}

// ─── Component ──────────────────────────────────────────

export function TrackingTab() {
	const { data: settings, isLoading } = useTrackingSettings();
	const saveMutation = useSaveTrackingSettings();
	const features = useFeatures();
	const isPremium = features.can_use_advanced_tracking;

	const defaults: TrackingSettingsFormData = {
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

	const form = useForm<TrackingSettingsFormData>({
		resolver: zodResolver(trackingSettingsSchema),
		defaultValues: defaults,
		mode: 'onChange',
	});

	// Sync server data when loaded
	useEffect(() => {
		if (settings) {
			form.reset(settings);
		}
	}, [settings, form]);

	const onSubmit = (data: TrackingSettingsFormData) => {
		saveMutation.mutate(data, {
			onSuccess: () => {
				form.reset(data);
				toast.success(__('Tracking-Einstellungen gespeichert.', 'resa'));
			},
			onError: () => {
				toast.error(__('Fehler beim Speichern.', 'resa'));
			},
		});
	};

	if (isLoading) {
		return <LoadingState message={__('Lade Tracking-Einstellungen...', 'resa')} />;
	}

	const {
		formState: { isDirty, errors },
		watch,
	} = form;

	// Watch values for conditional rendering
	const datalayerEnabled = watch('datalayer_enabled');
	const partialLeadsEnabled = watch('partial_leads_enabled');

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			{/* Card 1: Google Ads Conversions */}
			<Card style={cardStyles}>
				<CardContent style={{ padding: '20px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{/* Card Header */}
						<div>
							<h2 style={sectionTitleStyles}>
								{__('Google Ads Conversions', 'resa')}
							</h2>
							<p style={sectionDescStyles}>
								{__(
									'Conversion-Tracking für Google Ads. Trage die Conversion-ID und das Label aus deinem Google Ads Konto ein.',
									'resa',
								)}
							</p>
						</div>

						{/* Formular-Ansicht Box */}
						<div style={grayBoxStyles}>
							<p style={{ ...boxTitleStyles, marginBottom: '12px' }}>
								{__('Formular-Ansicht (form_view)', 'resa')}
							</p>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: '1fr 1fr',
									gap: '16px',
								}}
							>
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
								>
									<Label htmlFor="fv-id">{__('Conversion-ID', 'resa')}</Label>
									<Input
										id="fv-id"
										placeholder="AW-123456789"
										{...form.register('google_ads_fv_id')}
										style={inputStyles}
									/>
								</div>
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
								>
									<Label htmlFor="fv-label">
										{__('Conversion-Label', 'resa')}
									</Label>
									<Input
										id="fv-label"
										placeholder="AbCdEf..."
										{...form.register('google_ads_fv_label')}
										style={inputStyles}
									/>
								</div>
							</div>
						</div>

						{/* Formular-Absendung Box */}
						<div style={grayBoxStyles}>
							<p style={{ ...boxTitleStyles, marginBottom: '12px' }}>
								{__('Formular-Absendung (form_submit)', 'resa')}
							</p>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: '1fr 1fr',
									gap: '16px',
								}}
							>
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
								>
									<Label htmlFor="fs-id">{__('Conversion-ID', 'resa')}</Label>
									<Input
										id="fs-id"
										placeholder="AW-123456789"
										{...form.register('google_ads_fs_id')}
										style={inputStyles}
									/>
								</div>
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
								>
									<Label htmlFor="fs-label">
										{__('Conversion-Label', 'resa')}
									</Label>
									<Input
										id="fs-label"
										placeholder="AbCdEf..."
										{...form.register('google_ads_fs_label')}
										style={inputStyles}
									/>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Card 2: dataLayer / GTM */}
			<Card style={cardStyles}>
				<CardContent style={{ padding: '20px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{/* Card Header */}
						<div>
							<h2 style={sectionTitleStyles}>
								{__('dataLayer / GTM Events', 'resa')}
							</h2>
							<p style={sectionDescStyles}>
								{__(
									'Pusht RESA-Events an window.dataLayer für Google Tag Manager.',
									'resa',
								)}
							</p>
						</div>

						{/* Enable Toggle */}
						<div style={toggleBoxStyles}>
							<div>
								<p style={boxTitleStyles}>{__('dataLayer aktivieren', 'resa')}</p>
								<p style={fieldDescStyles}>
									{__(
										'Events werden automatisch an window.dataLayer gepusht.',
										'resa',
									)}
								</p>
							</div>
							<Controller
								name="datalayer_enabled"
								control={form.control}
								render={({ field }) => (
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								)}
							/>
						</div>

						{/* Events Table (conditional) */}
						{datalayerEnabled && (
							<div style={grayBoxStyles}>
								<p style={{ ...boxTitleStyles, marginBottom: '12px' }}>
									{__('Verfügbare Events', 'resa')}
								</p>
								<div
									style={{
										border: '1px solid hsl(214.3 31.8% 91.4%)',
										borderRadius: '6px',
										overflow: 'hidden',
										backgroundColor: 'white',
									}}
								>
									<table style={{ width: '100%', borderCollapse: 'collapse' }}>
										<thead>
											<tr style={{ backgroundColor: 'hsl(210 40% 98%)' }}>
												<th
													style={{
														padding: '10px 12px',
														textAlign: 'left',
														fontSize: '12px',
														fontWeight: 600,
														color: 'hsl(215.4 16.3% 46.9%)',
														borderBottom:
															'1px solid hsl(214.3 31.8% 91.4%)',
													}}
												>
													{__('Event', 'resa')}
												</th>
												<th
													style={{
														padding: '10px 12px',
														textAlign: 'left',
														fontSize: '12px',
														fontWeight: 600,
														color: 'hsl(215.4 16.3% 46.9%)',
														borderBottom:
															'1px solid hsl(214.3 31.8% 91.4%)',
													}}
												>
													{__('Beschreibung', 'resa')}
												</th>
											</tr>
										</thead>
										<tbody>
											{DATALAYER_EVENTS.map((event, index) => (
												<tr
													key={event.name}
													style={{
														borderBottom:
															index < DATALAYER_EVENTS.length - 1
																? '1px solid hsl(214.3 31.8% 91.4%)'
																: 'none',
													}}
												>
													<td style={{ padding: '10px 12px' }}>
														<CopyableEventCell eventName={event.name} />
													</td>
													<td
														style={{
															padding: '10px 12px',
															fontSize: '13px',
															color: 'hsl(215.4 16.3% 46.9%)',
														}}
													>
														{event.description}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
								<p style={{ ...fieldDescStyles, marginTop: '8px' }}>
									{__('Klicke auf einen Event-Namen um ihn zu kopieren.', 'resa')}
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Card 3: Erweitert (Pro) */}
			<Card style={{ ...cardStyles, opacity: !isPremium ? 0.75 : 1 }}>
				<CardContent style={{ padding: '20px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{/* Card Header */}
						<div>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								<h2 style={sectionTitleStyles}>
									{__('Erweiterte Optionen', 'resa')}
								</h2>
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
							<p style={sectionDescStyles}>
								{__(
									'Erweitertes Tracking für bessere Attribution und Conversion-Messung.',
									'resa',
								)}
							</p>
						</div>

						{/* Pro Upgrade Hint */}
						{!isPremium && (
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '12px',
									padding: '12px 16px',
									backgroundColor: 'hsl(210 40% 96.1%)',
									border: '1px solid hsl(214.3 31.8% 91.4%)',
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

						{/* Enhanced Conversions Toggle */}
						<div style={toggleBoxStyles}>
							<div>
								<p style={boxTitleStyles}>{__('Enhanced Conversions', 'resa')}</p>
								<p style={fieldDescStyles}>
									{__(
										'SHA-256-gehashte E-Mail an Google Ads senden für bessere Attribution.',
										'resa',
									)}
								</p>
							</div>
							<Controller
								name="enhanced_conversions_enabled"
								control={form.control}
								render={({ field }) => (
									<Switch
										disabled={!isPremium}
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								)}
							/>
						</div>

						{/* GCLID Toggle */}
						<div style={toggleBoxStyles}>
							<div>
								<p style={boxTitleStyles}>{__('GCLID erfassen', 'resa')}</p>
								<p style={fieldDescStyles}>
									{__(
										'Google Click ID aus der URL speichern für Offline-Conversions.',
										'resa',
									)}
								</p>
							</div>
							<Controller
								name="gclid_capture_enabled"
								control={form.control}
								render={({ field }) => (
									<Switch
										disabled={!isPremium}
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								)}
							/>
						</div>

						{/* UTM Toggle */}
						<div style={toggleBoxStyles}>
							<div>
								<p style={boxTitleStyles}>{__('UTM-Parameter erfassen', 'resa')}</p>
								<p style={fieldDescStyles}>
									{__('UTM-Parameter aus der URL im Lead speichern.', 'resa')}
								</p>
							</div>
							<Controller
								name="utm_capture_enabled"
								control={form.control}
								render={({ field }) => (
									<Switch
										disabled={!isPremium}
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								)}
							/>
						</div>

						{/* Partial Leads Toggle */}
						<div style={toggleBoxStyles}>
							<div>
								<p style={boxTitleStyles}>{__('Partial Leads', 'resa')}</p>
								<p style={fieldDescStyles}>
									{__(
										'Unvollständige Leads speichern (Two-Phase Capture).',
										'resa',
									)}
								</p>
							</div>
							<Controller
								name="partial_leads_enabled"
								control={form.control}
								render={({ field }) => (
									<Switch
										disabled={!isPremium}
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								)}
							/>
						</div>

						{/* Partial Lead TTL (conditional) */}
						{partialLeadsEnabled && isPremium && (
							<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
								<Label htmlFor="ttl">
									{__('Partial Lead Aufbewahrung (Tage)', 'resa')}
								</Label>
								<Controller
									name="partial_lead_ttl_days"
									control={form.control}
									render={({ field }) => (
										<Input
											id="ttl"
											type="number"
											min={7}
											max={365}
											value={field.value}
											onChange={(e) =>
												field.onChange(parseInt(e.target.value, 10) || 30)
											}
											style={{
												...inputStyles,
												width: '120px',
												borderColor: errors.partial_lead_ttl_days
													? '#ef4444'
													: undefined,
											}}
										/>
									)}
								/>
								{errors.partial_lead_ttl_days && (
									<p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>
										{errors.partial_lead_ttl_days.message}
									</p>
								)}
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
					justifyContent: 'flex-end',
				}}
			>
				<PrimaryButton
					onClick={form.handleSubmit(onSubmit)}
					disabled={!isDirty || saveMutation.isPending}
				>
					{saveMutation.isPending && (
						<Spinner style={{ width: '14px', height: '14px' }} />
					)}
					{__('Speichern', 'resa')}
				</PrimaryButton>
			</div>
		</div>
	);
}
