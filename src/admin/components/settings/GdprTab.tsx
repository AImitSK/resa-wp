/**
 * GDPR / Privacy settings tab — consent text, retention periods, WP Privacy Tools info.
 *
 * 3 cards:
 * 1. Einwilligung (Privacy URL, consent text, newsletter text)
 * 2. Datenaufbewahrung (lead retention, anonymize toggle, email log retention)
 * 3. WordPress Privacy Tools (read-only info card)
 *
 * Follows the inline-styles pattern from TrackingTab / Settings.tsx.
 */

import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { usePrivacySettings, useSavePrivacySettings } from '../../hooks/usePrivacySettings';
import type { PrivacySettings } from '../../types';

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

const hintStyles: React.CSSProperties = {
	margin: '4px 0 0 0',
	fontSize: '12px',
	color: 'hsl(215.4 16.3% 46.9%)',
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

	const defaults: PrivacySettings = {
		privacy_url: '',
		consent_text:
			'Ich stimme der Verarbeitung meiner Daten gemäß der [Datenschutzerklärung] zu.',
		newsletter_text: 'Ja, ich möchte Markt-Updates per E-Mail erhalten.',
		lead_retention_days: 0,
		email_log_retention_days: 365,
		anonymize_instead_of_delete: false,
	};

	const [form, setForm] = useState<PrivacySettings>(settings ?? defaults);
	const [isDirty, setIsDirty] = useState(false);

	const updateField = <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => {
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
					{__('Lade Datenschutz-Einstellungen...', 'resa')}
				</span>
			</div>
		);
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			{/* Card 1: Einwilligung */}
			<Card>
				<CardContent style={{ padding: '20px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						<div>
							<h3 style={sectionTitleStyles}>{__('Einwilligung', 'resa')}</h3>
							<p style={{ ...sectionDescStyles, marginTop: '4px' }}>
								{__(
									'Konfiguriere die Datenschutzerklärung-URL und die Einwilligungstexte für das Lead-Formular.',
									'resa',
								)}
							</p>
						</div>

						{/* Privacy URL */}
						<div className="resa-space-y-2">
							<Label htmlFor="privacy-url">
								{__('Datenschutzerklärung-URL', 'resa')}
							</Label>
							<Input
								id="privacy-url"
								type="url"
								placeholder="https://example.com/datenschutz"
								value={form.privacy_url}
								onChange={(e) => updateField('privacy_url', e.target.value)}
							/>
							<p style={hintStyles}>
								{__(
									'Leer = WordPress-Datenschutzseite (Einstellungen → Datenschutz)',
									'resa',
								)}
							</p>
						</div>

						{/* Consent Text */}
						<div className="resa-space-y-2">
							<Label htmlFor="consent-text">{__('Einwilligungstext', 'resa')}</Label>
							<Textarea
								id="consent-text"
								rows={3}
								value={form.consent_text}
								onChange={(e) => updateField('consent_text', e.target.value)}
							/>
							<p style={hintStyles}>
								{__(
									'Der Platzhalter [Datenschutzerklärung] wird als klickbarer Link dargestellt.',
									'resa',
								)}
							</p>
						</div>

						{/* Newsletter Text */}
						<div className="resa-space-y-2">
							<Label htmlFor="newsletter-text">
								{__('Newsletter Opt-In Text', 'resa')}
							</Label>
							<Input
								id="newsletter-text"
								value={form.newsletter_text}
								onChange={(e) => updateField('newsletter_text', e.target.value)}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Card 2: Datenaufbewahrung */}
			<Card>
				<CardContent style={{ padding: '20px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						<div>
							<h3 style={sectionTitleStyles}>{__('Datenaufbewahrung', 'resa')}</h3>
							<p style={{ ...sectionDescStyles, marginTop: '4px' }}>
								{__(
									'Lege fest, wie lange abgeschlossene Leads und E-Mail-Protokolle aufbewahrt werden.',
									'resa',
								)}
							</p>
						</div>

						{/* Lead Retention */}
						<div className="resa-space-y-2">
							<Label htmlFor="lead-retention">
								{__('Abgeschlossene Leads automatisch löschen nach', 'resa')}
							</Label>
							<select
								id="lead-retention"
								value={form.lead_retention_days}
								onChange={(e) =>
									updateField('lead_retention_days', parseInt(e.target.value, 10))
								}
								style={{
									display: 'block',
									width: '200px',
									padding: '8px 12px',
									fontSize: '14px',
									borderRadius: '6px',
									border: '1px solid hsl(214.3 31.8% 91.4%)',
									backgroundColor: 'white',
									color: '#1e303a',
								}}
							>
								{leadRetentionOptions.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>

						{/* Anonymize Toggle */}
						<div style={switchRowStyles}>
							<div>
								<p style={switchLabelStyles}>
									{__('Anonymisieren statt Löschen', 'resa')}
								</p>
								<p style={switchDescStyles}>
									{__(
										'Personenbezogene Daten werden entfernt, anonymisierte Eingaben bleiben für die Statistik erhalten.',
										'resa',
									)}
								</p>
							</div>
							<Switch
								checked={form.anonymize_instead_of_delete}
								onCheckedChange={(checked) =>
									updateField('anonymize_instead_of_delete', checked)
								}
							/>
						</div>

						{/* Email Log Retention */}
						<div className="resa-space-y-2">
							<Label htmlFor="email-log-retention">
								{__('E-Mail-Protokoll automatisch löschen nach', 'resa')}
							</Label>
							<select
								id="email-log-retention"
								value={form.email_log_retention_days}
								onChange={(e) =>
									updateField(
										'email_log_retention_days',
										parseInt(e.target.value, 10),
									)
								}
								style={{
									display: 'block',
									width: '200px',
									padding: '8px 12px',
									fontSize: '14px',
									borderRadius: '6px',
									border: '1px solid hsl(214.3 31.8% 91.4%)',
									backgroundColor: 'white',
									color: '#1e303a',
								}}
							>
								{emailLogRetentionOptions.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Card 3: WordPress Privacy Tools (Info Only) */}
			<Card>
				<CardContent style={{ padding: '20px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
							<div
								style={{
									width: '32px',
									height: '32px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									borderRadius: '8px',
									backgroundColor: 'hsl(142 76% 94%)',
									flexShrink: 0,
								}}
							>
								<ShieldCheck
									style={{
										width: '18px',
										height: '18px',
										color: 'hsl(142 76% 36%)',
									}}
								/>
							</div>
							<div>
								<h3 style={sectionTitleStyles}>
									{__('WordPress Privacy Tools', 'resa')}
								</h3>
								<p style={{ ...sectionDescStyles, marginTop: '2px' }}>
									{__(
										'RESA ist in die WordPress-Datenschutzwerkzeuge integriert.',
										'resa',
									)}
								</p>
							</div>
						</div>

						<p style={{ ...sectionDescStyles, margin: 0 }}>
							{__(
								'Unter Werkzeuge → Personenbezogene Daten exportieren und Werkzeuge → Personenbezogene Daten löschen können Sie Anfragen nach Art. 15 und Art. 17 DSGVO bearbeiten.',
								'resa',
							)}
						</p>

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
									display: 'flex',
									flexDirection: 'column',
									gap: '4px',
								}}
							>
								<li>{__('Lead-Stammdaten (Name, E-Mail, Telefon)', 'resa')}</li>
								<li>{__('Einwilligungsinformation (Text, Datum)', 'resa')}</li>
								<li>{__('Berechnungseingaben und -ergebnisse', 'resa')}</li>
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
									display: 'flex',
									flexDirection: 'column',
									gap: '4px',
								}}
							>
								<li>{__('Alle Lead-Datensätze mit der E-Mail-Adresse', 'resa')}</li>
								<li>{__('Zugehörige E-Mail-Protokolleinträge', 'resa')}</li>
								<li>
									{__(
										'Tracking wird nicht gelöscht (anonymisiert, kein PII)',
										'resa',
									)}
								</li>
							</ul>
						</div>
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
					{saveMutation.isSuccess && __('Datenschutz-Einstellungen gespeichert.', 'resa')}
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
