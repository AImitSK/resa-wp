/**
 * reCAPTCHA v3 settings tab — site key, secret key, threshold configuration.
 *
 * Available for both Free and Pro users (no FeatureGate).
 * Uses Zod + React Hook Form for validation.
 * @see docs/design-system/patterns/form-validation.md
 */

import { useState, useEffect, type ReactNode } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { __ } from '@wordpress/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { LoadingState } from '../LoadingState';
import { useRecaptchaSettings, useSaveRecaptchaSettings } from '../../hooks/useRecaptchaSettings';
import { toast } from '../../lib/toast';
import { recaptchaSettingsSchema, type RecaptchaSettingsFormData } from '../../schemas/recaptcha';

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
	fontSize: '16px',
	fontWeight: 600,
	color: '#1e303a',
};

const sectionDescStyles: React.CSSProperties = {
	margin: '4px 0 0 0',
	fontSize: '13px',
	color: 'hsl(215.4 16.3% 46.9%)',
};

const elementTitleStyles: React.CSSProperties = {
	margin: 0,
	fontSize: '14px',
	fontWeight: 500,
	color: '#1e303a',
};

const fieldDescStyles: React.CSSProperties = {
	margin: '2px 0 0 0',
	fontSize: '12px',
	color: 'hsl(215.4 16.3% 46.9%)',
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

const cardStyles: React.CSSProperties = {
	border: '1px solid hsl(214.3 31.8% 91.4%)',
	borderRadius: '8px',
	boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
};

const inputStyles: React.CSSProperties = {
	height: '36px',
	padding: '0 12px',
	fontSize: '14px',
	border: '1px solid hsl(214.3 31.8% 78%)',
	borderRadius: '6px',
	backgroundColor: 'white',
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

	const defaults: RecaptchaSettingsFormData = {
		enabled: false,
		site_key: '',
		secret_key: '',
		threshold: 0.5,
	};

	const form = useForm<RecaptchaSettingsFormData>({
		resolver: zodResolver(recaptchaSettingsSchema),
		defaultValues: defaults,
	});

	// Sync server data when loaded
	useEffect(() => {
		if (settings) {
			form.reset(settings);
		}
	}, [settings, form]);

	const onSubmit = (data: RecaptchaSettingsFormData) => {
		saveMutation.mutate(data, {
			onSuccess: () => {
				form.reset(data);
				toast.success(__('reCAPTCHA-Einstellungen gespeichert.', 'resa'));
			},
			onError: () => {
				toast.error(__('Fehler beim Speichern.', 'resa'));
			},
		});
	};

	if (isLoading) {
		return <LoadingState message={__('Lade reCAPTCHA-Einstellungen...', 'resa')} />;
	}

	const {
		formState: { isDirty, errors },
	} = form;
	const enabled = form.watch('enabled');

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			{/* Card: reCAPTCHA v3 Configuration */}
			<Card style={cardStyles}>
				<CardContent style={{ padding: '20px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{/* Card Header */}
						<div>
							<h2 style={sectionTitleStyles}>{__('Verbindung', 'resa')}</h2>
							<p style={sectionDescStyles}>
								{__(
									'Verbinde RESA mit Google reCAPTCHA v3 für unsichtbaren Spam-Schutz.',
									'resa',
								)}
							</p>
						</div>

						{/* Enable Switch */}
						<div style={toggleBoxStyles}>
							<div>
								<p style={elementTitleStyles}>
									{__('reCAPTCHA aktivieren', 'resa')}
								</p>
								<p style={fieldDescStyles}>
									{__(
										'Bewertet Besucher im Hintergrund ohne Interaktion.',
										'resa',
									)}
								</p>
							</div>
							<Controller
								name="enabled"
								control={form.control}
								render={({ field }) => (
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								)}
							/>
						</div>

						{/* API Keys - nur wenn enabled */}
						{enabled && (
							<>
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
								>
									<Label htmlFor="recaptcha-site-key">
										{__('Site Key', 'resa')}
									</Label>
									<Input
										id="recaptcha-site-key"
										placeholder="6Lc..."
										{...form.register('site_key')}
										style={{
											...inputStyles,
											borderColor: errors.site_key ? '#ef4444' : undefined,
										}}
									/>
									{errors.site_key && (
										<p
											style={{
												fontSize: '13px',
												color: '#ef4444',
												margin: 0,
											}}
										>
											{errors.site_key.message}
										</p>
									)}
								</div>
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
								>
									<Label htmlFor="recaptcha-secret-key">
										{__('Secret Key', 'resa')}
									</Label>
									<Input
										id="recaptcha-secret-key"
										type="password"
										placeholder="6Lc..."
										{...form.register('secret_key')}
										style={{
											...inputStyles,
											borderColor: errors.secret_key ? '#ef4444' : undefined,
										}}
									/>
									{errors.secret_key && (
										<p
											style={{
												fontSize: '13px',
												color: '#ef4444',
												margin: 0,
											}}
										>
											{errors.secret_key.message}
										</p>
									)}
									<p style={fieldDescStyles}>
										{__('Site Key und Secret Key erhältst du in der', 'resa')}{' '}
										<a
											href="https://www.google.com/recaptcha/admin"
											target="_blank"
											rel="noopener noreferrer"
											style={{
												color: '#1e303a',
												textDecoration: 'underline',
											}}
										>
											{__('Google reCAPTCHA Admin Console', 'resa')}
										</a>
										.
									</p>
								</div>

								{/* Threshold */}
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
								>
									<Label htmlFor="recaptcha-threshold">
										{__('Score-Schwellenwert', 'resa')}
									</Label>
									<Controller
										name="threshold"
										control={form.control}
										render={({ field }) => (
											<select
												id="recaptcha-threshold"
												value={String(field.value)}
												onChange={(e) =>
													field.onChange(parseFloat(e.target.value))
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
										)}
									/>
									{errors.threshold && (
										<p
											style={{
												fontSize: '13px',
												color: '#ef4444',
												margin: 0,
											}}
										>
											{errors.threshold.message}
										</p>
									)}
									<p style={fieldDescStyles}>
										{__(
											'Besucher mit einem Score unter diesem Wert werden als Spam eingestuft. 1.0 = sicher menschlich, 0.0 = sicher Bot.',
											'resa',
										)}
									</p>
								</div>
							</>
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
						<Spinner style={{ width: '14px', height: '14px', marginRight: '8px' }} />
					)}
					{__('Speichern', 'resa')}
				</PrimaryButton>
			</div>
		</div>
	);
}
