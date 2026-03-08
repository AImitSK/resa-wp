/**
 * PDF tab — Configure which sections appear in the module's PDF output.
 *
 * Uses Zod + React Hook Form for validation.
 * @see docs/design-system/patterns/form-validation.md
 */

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { __ } from '@wordpress/i18n';
import { BarChart3, Table2, Map, MessageSquare, AlertTriangle } from 'lucide-react';
import { useModulePdfSettings, useSaveModulePdfSettings } from '../../hooks/useModulePdfSettings';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingState } from '../LoadingState';
import { toast } from '../../lib/toast';
import { pdfSettingsSchema, type PdfSettingsFormData } from '../../schemas/pdfSettings';

interface PdfTabProps {
	slug: string;
}

interface SectionToggle {
	key: keyof PdfSettingsFormData;
	label: string;
	description: string;
	icon: React.ElementType;
}

const SECTIONS: SectionToggle[] = [
	{
		key: 'showChart',
		label: __('Marktvergleich-Diagramm', 'resa'),
		description: __(
			'Balkendiagramm mit Vergleichswerten (Ihr Objekt, Stadt, Landkreis).',
			'resa',
		),
		icon: BarChart3,
	},
	{
		key: 'showFactors',
		label: __('Einflussfaktoren', 'resa'),
		description: __('Tabelle mit Faktoren und deren Einfluss auf den Preis.', 'resa'),
		icon: Table2,
	},
	{
		key: 'showMap',
		label: __('Standort-Karte', 'resa'),
		description: __('Interaktive Karte mit Marker an der Objektadresse.', 'resa'),
		icon: Map,
	},
	{
		key: 'showCta',
		label: __('Kontakt-CTA', 'resa'),
		description: __(
			'Aufforderung zur Kontaktaufnahme mit Ansprechpartner und Telefonnummer.',
			'resa',
		),
		icon: MessageSquare,
	},
	{
		key: 'showDisclaimer',
		label: __('Hinweis / Disclaimer', 'resa'),
		description: __('Rechtlicher Hinweis zur Genauigkeit der Analyse.', 'resa'),
		icon: AlertTriangle,
	},
];

export function PdfTab({ slug }: PdfTabProps) {
	const { data: settings, isLoading, error } = useModulePdfSettings(slug);

	if (isLoading) {
		return <LoadingState message={__('Lade PDF-Einstellungen...', 'resa')} size="compact" />;
	}

	if (error || !settings) {
		return (
			<Alert variant="destructive">
				<AlertTitle>{__('Fehler beim Laden', 'resa')}</AlertTitle>
				<AlertDescription>
					{__('Die PDF-Einstellungen konnten nicht geladen werden.', 'resa')}
				</AlertDescription>
			</Alert>
		);
	}

	return <PdfTabInner key={slug} settings={settings} slug={slug} />;
}

function PdfTabInner({ settings, slug }: { settings: PdfSettingsFormData; slug: string }) {
	const saveSettings = useSaveModulePdfSettings(slug);
	const [saveHover, setSaveHover] = useState(false);

	const defaults: PdfSettingsFormData = {
		showChart: true,
		showFactors: true,
		showMap: true,
		showCta: true,
		showDisclaimer: true,
		ctaTitle: '',
		ctaText: '',
	};

	const form = useForm<PdfSettingsFormData>({
		resolver: zodResolver(pdfSettingsSchema),
		defaultValues: defaults,
		mode: 'onChange',
	});

	// Sync server data when loaded
	useEffect(() => {
		if (settings) {
			form.reset(settings);
		}
	}, [settings, form]);

	const onSubmit = (data: PdfSettingsFormData) => {
		saveSettings.mutate(data, {
			onSuccess: () => {
				form.reset(data);
				toast.success(__('PDF-Einstellungen gespeichert.', 'resa'));
			},
			onError: () => {
				toast.error(__('Fehler beim Speichern.', 'resa'));
			},
		});
	};

	const {
		formState: { isDirty, errors },
		watch,
	} = form;

	const showCta = watch('showCta');

	const cardStyle: React.CSSProperties = {
		backgroundColor: 'hsl(210 40% 96.1%)',
		borderRadius: '8px',
		padding: '20px',
	};

	const toggleRowStyle: React.CSSProperties = {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '14px 0',
		borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
	};

	const switchStyle = (checked: boolean): React.CSSProperties => ({
		position: 'relative',
		width: '36px',
		height: '20px',
		borderRadius: '10px',
		backgroundColor: checked ? '#a9e43f' : 'hsl(214.3 31.8% 91.4%)',
		cursor: 'pointer',
		transition: 'background-color 150ms',
		border: 'none',
		padding: 0,
		flexShrink: 0,
	});

	const switchKnobStyle = (checked: boolean): React.CSSProperties => ({
		position: 'absolute',
		top: '2px',
		left: checked ? '18px' : '2px',
		width: '16px',
		height: '16px',
		borderRadius: '50%',
		backgroundColor: 'white',
		transition: 'left 150ms',
		boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
	});

	const inputStyle: React.CSSProperties = {
		width: '100%',
		padding: '8px 12px',
		borderRadius: '6px',
		border: '1px solid hsl(214.3 31.8% 91.4%)',
		fontSize: '14px',
		color: '#1e303a',
		backgroundColor: 'white',
		outline: 'none',
	};

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
					{__('PDF-Ausgabe', 'resa')}
				</h3>
				<p
					style={{
						fontSize: '14px',
						color: '#1e303a',
						margin: '4px 0 0 0',
					}}
				>
					{__('Konfiguriere welche Abschnitte im PDF-Report erscheinen.', 'resa')}
				</p>
			</div>

			{/* Section toggles */}
			<div style={cardStyle}>
				<h3
					style={{
						fontSize: '14px',
						fontWeight: 600,
						color: '#1e303a',
						margin: '0 0 4px 0',
					}}
				>
					{__('PDF-Sektionen', 'resa')}
				</h3>
				<p
					style={{
						fontSize: '13px',
						color: '#1e303a',
						margin: '0 0 8px 0',
					}}
				>
					{__('Wähle aus, welche Abschnitte im PDF angezeigt werden.', 'resa')}
				</p>

				{SECTIONS.map((section, index) => {
					const Icon = section.icon;
					return (
						<Controller
							key={section.key}
							name={
								section.key as
									| 'showChart'
									| 'showFactors'
									| 'showMap'
									| 'showCta'
									| 'showDisclaimer'
							}
							control={form.control}
							render={({ field }) => {
								const checked = field.value as boolean;
								return (
									<div
										style={{
											...toggleRowStyle,
											...(index === SECTIONS.length - 1
												? { borderBottom: 'none' }
												: {}),
										}}
									>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '12px',
												flex: 1,
											}}
										>
											<div
												style={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													width: '32px',
													height: '32px',
													borderRadius: '6px',
													backgroundColor: checked
														? '#a9e43f'
														: 'hsl(210 40% 96.1%)',
													color: '#1e303a',
													flexShrink: 0,
												}}
											>
												<Icon style={{ width: '16px', height: '16px' }} />
											</div>
											<div>
												<div
													style={{
														fontSize: '14px',
														fontWeight: 500,
														color: '#1e303a',
													}}
												>
													{section.label}
												</div>
												<div
													style={{
														fontSize: '12px',
														color: '#1e303a',
														marginTop: '2px',
													}}
												>
													{section.description}
												</div>
											</div>
										</div>
										<button
											onClick={() => field.onChange(!checked)}
											style={switchStyle(checked)}
											type="button"
											aria-label={section.label}
										>
											<span style={switchKnobStyle(checked)} />
										</button>
									</div>
								);
							}}
						/>
					);
				})}
			</div>

			{/* CTA customization (only visible when CTA is enabled) */}
			{showCta && (
				<div style={cardStyle}>
					<h3
						style={{
							fontSize: '14px',
							fontWeight: 600,
							color: '#1e303a',
							margin: '0 0 4px 0',
						}}
					>
						{__('CTA anpassen', 'resa')}
					</h3>
					<p
						style={{
							fontSize: '13px',
							color: '#1e303a',
							margin: '0 0 16px 0',
						}}
					>
						{__(
							'Optional: Passe den Kontakt-CTA-Text an. Leer lassen für die Standardtexte.',
							'resa',
						)}
					</p>

					<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
						<div>
							<label
								style={{
									display: 'block',
									fontSize: '13px',
									fontWeight: 500,
									color: '#1e303a',
									marginBottom: '4px',
								}}
							>
								{__('Titel', 'resa')}
							</label>
							<input
								type="text"
								{...form.register('ctaTitle')}
								placeholder={__(
									'Interesse an einer persönlichen Beratung?',
									'resa',
								)}
								style={{
									...inputStyle,
									borderColor: errors.ctaTitle ? '#ef4444' : undefined,
								}}
							/>
							{errors.ctaTitle && (
								<p
									style={{
										fontSize: '13px',
										color: '#ef4444',
										margin: '4px 0 0 0',
									}}
								>
									{errors.ctaTitle.message}
								</p>
							)}
						</div>
						<div>
							<label
								style={{
									display: 'block',
									fontSize: '13px',
									fontWeight: 500,
									color: '#1e303a',
									marginBottom: '4px',
								}}
							>
								{__('Text', 'resa')}
							</label>
							<input
								type="text"
								{...form.register('ctaText')}
								placeholder={__(
									'Kontaktieren Sie {name} für eine unverbindliche Einschätzung.',
									'resa',
								)}
								style={{
									...inputStyle,
									borderColor: errors.ctaText ? '#ef4444' : undefined,
								}}
							/>
							{errors.ctaText && (
								<p
									style={{
										fontSize: '13px',
										color: '#ef4444',
										margin: '4px 0 0 0',
									}}
								>
									{errors.ctaText.message}
								</p>
							)}
							<p
								style={{
									fontSize: '11px',
									color: '#1e303a',
									marginTop: '4px',
									marginBottom: 0,
								}}
							>
								{__(
									'Verwende {name} als Platzhalter für den Ansprechpartner-Namen.',
									'resa',
								)}
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Save button */}
			<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
				<Button
					onClick={form.handleSubmit(onSubmit)}
					disabled={!isDirty || saveSettings.isPending}
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
						cursor: isDirty ? 'pointer' : 'not-allowed',
					}}
				>
					{saveSettings.isPending ? (
						<>
							<Spinner className="resa-size-4" />
							{__('Speichern...', 'resa')}
						</>
					) : (
						__('Speichern', 'resa')
					)}
				</Button>
			</div>
		</div>
	);
}
