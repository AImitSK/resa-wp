/**
 * reCAPTCHA v3 settings tab — site key, secret key, threshold configuration.
 *
 * Available for both Free and Pro users (no FeatureGate).
 * Follows the TrackingTab inline-styles + isDirty pattern.
 */

import { useState, type ReactNode } from 'react';
import { __ } from '@wordpress/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { useRecaptchaSettings, useSaveRecaptchaSettings } from '../../hooks/useRecaptchaSettings';
import type { RecaptchaSettings } from '../../types';

// ─── Styled Button Components ────────────────────────────

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

// ─── Threshold Options ─────────────────────────────────

const THRESHOLD_OPTIONS = [
	{ value: '0.3', label: '0.3 — Tolerant' },
	{ value: '0.5', label: '0.5 — Standard' },
	{ value: '0.7', label: '0.7 — Streng' },
	{ value: '0.9', label: '0.9 — Sehr streng' },
];

// ─── Component ──────────────────────────────────────────

export function RecaptchaTab() {
	const { data: settings, isLoading } = useRecaptchaSettings();
	const saveMutation = useSaveRecaptchaSettings();

	const defaults: RecaptchaSettings = {
		enabled: false,
		site_key: '',
		secret_key: '',
		threshold: 0.5,
	};

	const [form, setForm] = useState<RecaptchaSettings>(settings ?? defaults);
	const [isDirty, setIsDirty] = useState(false);

	const updateField = <K extends keyof RecaptchaSettings>(
		key: K,
		value: RecaptchaSettings[K],
	) => {
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
					{__('Lade reCAPTCHA-Einstellungen...', 'resa')}
				</span>
			</div>
		);
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			{/* Card: reCAPTCHA v3 Configuration */}
			<Card>
				<CardContent style={{ padding: '20px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{/* Header + Switch */}
						<div style={switchRowStyles}>
							<div>
								<h3 style={sectionTitleStyles}>
									{__('Google reCAPTCHA v3', 'resa')}
								</h3>
								<p style={{ ...sectionDescStyles, marginTop: '4px' }}>
									{__(
										'Unsichtbarer Spam-Schutz. Bewertet Besucher im Hintergrund ohne Interaktion.',
										'resa',
									)}
								</p>
							</div>
							<Switch
								checked={form.enabled}
								onCheckedChange={(checked) => updateField('enabled', checked)}
							/>
						</div>

						{/* API Keys */}
						<div className="resa-grid resa-grid-cols-1 resa-gap-4">
							<div className="resa-space-y-2">
								<Label htmlFor="recaptcha-site-key">{__('Site Key', 'resa')}</Label>
								<Input
									id="recaptcha-site-key"
									placeholder="6Lc..."
									value={form.site_key}
									onChange={(e) => updateField('site_key', e.target.value)}
									style={{ backgroundColor: 'white' }}
								/>
							</div>
							<div className="resa-space-y-2">
								<Label htmlFor="recaptcha-secret-key">
									{__('Secret Key', 'resa')}
								</Label>
								<Input
									id="recaptcha-secret-key"
									type="password"
									placeholder="6Lc..."
									value={form.secret_key}
									onChange={(e) => updateField('secret_key', e.target.value)}
									style={{ backgroundColor: 'white' }}
								/>
							</div>
						</div>

						{/* Threshold */}
						<div className="resa-space-y-2">
							<Label htmlFor="recaptcha-threshold">
								{__('Score-Schwellenwert', 'resa')}
							</Label>
							<select
								id="recaptcha-threshold"
								value={String(form.threshold)}
								onChange={(e) =>
									updateField('threshold', parseFloat(e.target.value))
								}
								style={{
									display: 'block',
									width: '100%',
									maxWidth: '280px',
									height: '36px',
									padding: '0 12px',
									fontSize: '14px',
									borderRadius: '6px',
									border: '1px solid hsl(214.3 31.8% 78%)',
									backgroundColor: 'white',
									color: '#1e303a',
									boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
								}}
							>
								{THRESHOLD_OPTIONS.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
							<p
								style={{
									margin: '4px 0 0 0',
									fontSize: '12px',
									color: 'hsl(215.4 16.3% 46.9%)',
								}}
							>
								{__(
									'Besucher mit einem Score unter diesem Wert werden als Spam eingestuft. 1.0 = sicher menschlich, 0.0 = sicher Bot.',
									'resa',
								)}
							</p>
						</div>

						{/* Info box */}
						<div
							style={{
								border: '1px solid hsl(214.3 31.8% 91.4%)',
								borderRadius: '8px',
								padding: '16px',
								fontSize: '13px',
								color: 'hsl(215.4 16.3% 46.9%)',
							}}
						>
							<p style={{ margin: '0 0 8px 0', fontWeight: 500, color: '#1e303a' }}>
								{__('Hinweis', 'resa')}
							</p>
							<p style={{ margin: 0 }}>
								{__(
									'reCAPTCHA v3 arbeitet unsichtbar im Hintergrund. Site Key und Secret Key erhältst du in der',
									'resa',
								)}{' '}
								<a
									href="https://www.google.com/recaptcha/admin"
									target="_blank"
									rel="noopener noreferrer"
									style={{ color: '#1e303a', textDecoration: 'underline' }}
								>
									{__('Google reCAPTCHA Admin Console', 'resa')}
								</a>
								. {__('Wähle dort „reCAPTCHA v3" als Typ.', 'resa')}
							</p>
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
					{saveMutation.isSuccess && __('reCAPTCHA-Einstellungen gespeichert.', 'resa')}
				</p>
				<PrimaryButton onClick={handleSave} disabled={!isDirty || saveMutation.isPending}>
					{saveMutation.isPending && (
						<Spinner style={{ width: '14px', height: '14px', marginRight: '8px' }} />
					)}
					{__('Speichern', 'resa')}
				</PrimaryButton>
			</div>
		</div>
	);
}
