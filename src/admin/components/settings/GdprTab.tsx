/**
 * GDPR / Privacy settings tab — consent text, retention periods, WP Privacy Tools info.
 *
 * 3 cards:
 * 1. Einwilligung (Privacy URL, consent text, newsletter text)
 * 2. Datenaufbewahrung (lead retention, anonymize toggle, email log retention)
 * 3. WordPress Privacy Tools (read-only info card)
 *
 * Uses Zod + React Hook Form for validation.
 * @see docs/design-system/patterns/form-validation.md
 */

import { useState, useEffect, type ReactNode } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { __ } from '@wordpress/i18n';
import { ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { LoadingState } from '../LoadingState';
import { usePrivacySettings, useSavePrivacySettings } from '../../hooks/usePrivacySettings';
import { toast } from '../../lib/toast';
import { gdprSettingsSchema, type GdprSettingsFormData } from '../../schemas/gdpr';

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

const selectStyles: React.CSSProperties = {
	display: 'block',
	width: '200px',
	height: '36px',
	padding: '0 12px',
	fontSize: '14px',
	borderRadius: '6px',
	border: '1px solid hsl(214.3 31.8% 78%)',
	backgroundColor: 'white',
	color: '#1e303a',
	boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
};

// ─── Retention Options ──────────────────────────────────

const leadRetentionOptions = [
	{ value: 0, label: __('Unbegrenzt', 'resa') },
	{ value: 90, label: __('90 Tage', 'resa') },
	{ value: 180, label: __('180 Tage', 'resa') },
	{ value: 365, label: __('365 Tage', 'resa') },
	{ value: 730, label: __('730 Tage', 'resa') },
];

const emailLogRetentionOptions = [
	{ value: 0, label: __('Unbegrenzt', 'resa') },
	{ value: 90, label: __('90 Tage', 'resa') },
	{ value: 180, label: __('180 Tage', 'resa') },
	{ value: 365, label: __('365 Tage', 'resa') },
];

// ─── Component ──────────────────────────────────────────

export function GdprTab() {
	const { data: settings, isLoading } = usePrivacySettings();
	const saveMutation = useSavePrivacySettings();

	const defaults: GdprSettingsFormData = {
		privacy_url: '',
		consent_text:
			'Ich stimme der Verarbeitung meiner Daten gemäß der [Datenschutzerklärung] zu.',
		newsletter_text: 'Ja, ich möchte Markt-Updates per E-Mail erhalten.',
		lead_retention_days: 0,
		email_log_retention_days: 365,
		anonymize_instead_of_delete: false,
	};

	const form = useForm<GdprSettingsFormData>({
		resolver: zodResolver(gdprSettingsSchema),
		defaultValues: defaults,
	});

	// Sync server data when loaded
	useEffect(() => {
		if (settings) {
			form.reset(settings);
		}
	}, [settings, form]);

	const onSubmit = (data: GdprSettingsFormData) => {
		saveMutation.mutate(data, {
			onSuccess: () => {
				form.reset(data);
				toast.success(__('Datenschutz-Einstellungen gespeichert.', 'resa'));
			},
			onError: () => {
				toast.error(__('Fehler beim Speichern.', 'resa'));
			},
		});
	};

	if (isLoading) {
		return <LoadingState message={__('Lade Datenschutz-Einstellungen...', 'resa')} />;
	}

	const {
		formState: { isDirty, errors },
	} = form;

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			{/* Card 1: Einwilligung */}
			<Card style={cardStyles}>
				<CardContent style={{ padding: '20px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{/* Card Header */}
						<div>
							<h2 style={sectionTitleStyles}>{__('Einwilligung', 'resa')}</h2>
							<p style={sectionDescStyles}>
								{__(
									'Konfiguriere die Datenschutzerklärung-URL und die Einwilligungstexte für das Lead-Formular.',
									'resa',
								)}
							</p>
						</div>

						{/* Texte Box */}
						<div style={grayBoxStyles}>
							<p style={{ ...boxTitleStyles, marginBottom: '12px' }}>
								{__('Formulartexte', 'resa')}
							</p>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
								{/* Privacy URL */}
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
								>
									<Label htmlFor="privacy-url">
										{__('Datenschutzerklärung-URL', 'resa')}
									</Label>
									<Input
										id="privacy-url"
										type="url"
										placeholder="https://example.com/datenschutz"
										{...form.register('privacy_url')}
										style={{
											...inputStyles,
											borderColor: errors.privacy_url ? '#ef4444' : undefined,
										}}
									/>
									{errors.privacy_url && (
										<p
											style={{
												fontSize: '13px',
												color: '#ef4444',
												margin: 0,
											}}
										>
											{errors.privacy_url.message}
										</p>
									)}
									<p style={fieldDescStyles}>
										{__(
											'Leer = WordPress-Datenschutzseite (Einstellungen → Datenschutz)',
											'resa',
										)}
									</p>
								</div>

								{/* Consent Text */}
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
								>
									<Label htmlFor="consent-text">
										{__('Einwilligungstext', 'resa')}
									</Label>
									<Textarea
										id="consent-text"
										rows={3}
										{...form.register('consent_text')}
										style={{
											...inputStyles,
											height: 'auto',
											padding: '8px 12px',
											borderColor: errors.consent_text
												? '#ef4444'
												: undefined,
										}}
									/>
									{errors.consent_text && (
										<p
											style={{
												fontSize: '13px',
												color: '#ef4444',
												margin: 0,
											}}
										>
											{errors.consent_text.message}
										</p>
									)}
									<p style={fieldDescStyles}>
										{__(
											'Der Platzhalter [Datenschutzerklärung] wird als klickbarer Link dargestellt.',
											'resa',
										)}
									</p>
								</div>

								{/* Newsletter Text */}
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
								>
									<Label htmlFor="newsletter-text">
										{__('Newsletter Opt-In Text', 'resa')}
									</Label>
									<Input
										id="newsletter-text"
										{...form.register('newsletter_text')}
										style={{
											...inputStyles,
											borderColor: errors.newsletter_text
												? '#ef4444'
												: undefined,
										}}
									/>
									{errors.newsletter_text && (
										<p
											style={{
												fontSize: '13px',
												color: '#ef4444',
												margin: 0,
											}}
										>
											{errors.newsletter_text.message}
										</p>
									)}
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Card 2: Datenaufbewahrung */}
			<Card style={cardStyles}>
				<CardContent style={{ padding: '20px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{/* Card Header */}
						<div>
							<h2 style={sectionTitleStyles}>{__('Datenaufbewahrung', 'resa')}</h2>
							<p style={sectionDescStyles}>
								{__(
									'Lege fest, wie lange abgeschlossene Leads und E-Mail-Protokolle aufbewahrt werden.',
									'resa',
								)}
							</p>
						</div>

						{/* Retention Settings Box */}
						<div style={grayBoxStyles}>
							<p style={{ ...boxTitleStyles, marginBottom: '12px' }}>
								{__('Automatische Löschung', 'resa')}
							</p>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: '1fr 1fr',
									gap: '16px',
								}}
							>
								{/* Lead Retention */}
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
								>
									<Label htmlFor="lead-retention">
										{__('Leads löschen nach', 'resa')}
									</Label>
									<Controller
										name="lead_retention_days"
										control={form.control}
										render={({ field }) => (
											<select
												id="lead-retention"
												value={field.value}
												onChange={(e) =>
													field.onChange(parseInt(e.target.value, 10))
												}
												style={selectStyles}
											>
												{leadRetentionOptions.map((opt) => (
													<option key={opt.value} value={opt.value}>
														{opt.label}
													</option>
												))}
											</select>
										)}
									/>
								</div>

								{/* Email Log Retention */}
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
								>
									<Label htmlFor="email-log-retention">
										{__('E-Mail-Protokoll löschen nach', 'resa')}
									</Label>
									<Controller
										name="email_log_retention_days"
										control={form.control}
										render={({ field }) => (
											<select
												id="email-log-retention"
												value={field.value}
												onChange={(e) =>
													field.onChange(parseInt(e.target.value, 10))
												}
												style={selectStyles}
											>
												{emailLogRetentionOptions.map((opt) => (
													<option key={opt.value} value={opt.value}>
														{opt.label}
													</option>
												))}
											</select>
										)}
									/>
								</div>
							</div>
						</div>

						{/* Anonymize Toggle */}
						<div style={toggleBoxStyles}>
							<div>
								<p style={boxTitleStyles}>
									{__('Anonymisieren statt Löschen', 'resa')}
								</p>
								<p style={fieldDescStyles}>
									{__(
										'Personenbezogene Daten werden entfernt, anonymisierte Eingaben bleiben für die Statistik erhalten.',
										'resa',
									)}
								</p>
							</div>
							<Controller
								name="anonymize_instead_of_delete"
								control={form.control}
								render={({ field }) => (
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								)}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Card 3: WordPress Privacy Tools (Info Only) */}
			<Card style={cardStyles}>
				<CardContent style={{ padding: '20px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{/* Card Header with Icon */}
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
							<div
								style={{
									width: '40px',
									height: '40px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									borderRadius: '10px',
									backgroundColor: 'hsl(142 76% 94%)',
									flexShrink: 0,
								}}
							>
								<ShieldCheck
									style={{
										width: '20px',
										height: '20px',
										color: 'hsl(142 76% 36%)',
									}}
								/>
							</div>
							<div>
								<h2 style={sectionTitleStyles}>
									{__('WordPress Privacy Tools', 'resa')}
								</h2>
								<p style={sectionDescStyles}>
									{__(
										'RESA ist in die WordPress-Datenschutzwerkzeuge integriert.',
										'resa',
									)}
								</p>
							</div>
						</div>

						{/* Info Box */}
						<div style={grayBoxStyles}>
							<p style={{ ...boxTitleStyles, marginBottom: '8px' }}>
								{__('DSGVO-Werkzeuge', 'resa')}
							</p>
							<p
								style={{
									...fieldDescStyles,
									margin: '0 0 16px 0',
									fontSize: '13px',
								}}
							>
								{__(
									'Unter Werkzeuge → Personenbezogene Daten exportieren und Werkzeuge → Personenbezogene Daten löschen können Sie Anfragen nach Art. 15 und Art. 17 DSGVO bearbeiten.',
									'resa',
								)}
							</p>

							<div
								style={{
									display: 'grid',
									gridTemplateColumns: '1fr 1fr',
									gap: '16px',
								}}
							>
								{/* Exported data list */}
								<div>
									<p
										style={{
											margin: '0 0 8px 0',
											fontSize: '13px',
											fontWeight: 500,
											color: '#1e303a',
										}}
									>
										{__('Exportierte Daten:', 'resa')}
									</p>
									<ul
										style={{
											margin: 0,
											paddingLeft: '20px',
											fontSize: '13px',
											color: 'hsl(215.4 16.3% 46.9%)',
											listStyleType: 'disc',
										}}
									>
										<li style={{ marginBottom: '4px' }}>
											{__('Lead-Stammdaten (Name, E-Mail, Telefon)', 'resa')}
										</li>
										<li style={{ marginBottom: '4px' }}>
											{__('Einwilligungsinformation (Text, Datum)', 'resa')}
										</li>
										<li style={{ marginBottom: '4px' }}>
											{__('Berechnungseingaben und -ergebnisse', 'resa')}
										</li>
										<li>{__('E-Mail-Protokoll', 'resa')}</li>
									</ul>
								</div>

								{/* Erased data list */}
								<div>
									<p
										style={{
											margin: '0 0 8px 0',
											fontSize: '13px',
											fontWeight: 500,
											color: '#1e303a',
										}}
									>
										{__('Bei Löschung werden entfernt:', 'resa')}
									</p>
									<ul
										style={{
											margin: 0,
											paddingLeft: '20px',
											fontSize: '13px',
											color: 'hsl(215.4 16.3% 46.9%)',
											listStyleType: 'disc',
										}}
									>
										<li style={{ marginBottom: '4px' }}>
											{__(
												'Alle Lead-Datensätze mit der E-Mail-Adresse',
												'resa',
											)}
										</li>
										<li style={{ marginBottom: '4px' }}>
											{__('Zugehörige E-Mail-Protokolleinträge', 'resa')}
										</li>
										<li>
											{__(
												'Tracking wird nicht gelöscht (anonymisiert, kein PII)',
												'resa',
											)}
										</li>
									</ul>
								</div>
							</div>
						</div>
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
