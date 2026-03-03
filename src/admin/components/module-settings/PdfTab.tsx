/**
 * PDF tab — Configure which sections appear in the module's PDF output.
 */

import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { BarChart3, Table2, Map, MessageSquare, AlertTriangle, Save } from 'lucide-react';
import {
	useModulePdfSettings,
	useSaveModulePdfSettings,
	type ModulePdfSettings,
} from '../../hooks/useModulePdfSettings';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PdfTabProps {
	slug: string;
}

interface SectionToggle {
	key: keyof ModulePdfSettings;
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
		return (
			<div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '20px' }}>
				<Spinner className="resa-size-5" />
				<span style={{ color: 'hsl(215.4 16.3% 46.9%)', fontSize: '14px' }}>
					{__('PDF-Einstellungen werden geladen...', 'resa')}
				</span>
			</div>
		);
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

function PdfTabInner({ settings, slug }: { settings: ModulePdfSettings; slug: string }) {
	const saveSettings = useSaveModulePdfSettings(slug);
	const [local, setLocal] = useState<ModulePdfSettings>(settings);
	const [hasChanges, setHasChanges] = useState(false);

	const toggleSection = (key: keyof ModulePdfSettings) => {
		setLocal((prev) => ({ ...prev, [key]: !prev[key] }));
		setHasChanges(true);
	};

	const updateField = (key: keyof ModulePdfSettings, value: string) => {
		setLocal((prev) => ({ ...prev, [key]: value }));
		setHasChanges(true);
	};

	const handleSave = () => {
		saveSettings.mutate(local, {
			onSuccess: () => setHasChanges(false),
		});
	};

	const cardStyle: React.CSSProperties = {
		backgroundColor: 'white',
		borderRadius: '8px',
		border: '1px solid hsl(214.3 31.8% 91.4%)',
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
						color: 'hsl(215.4 16.3% 46.9%)',
						margin: '0 0 8px 0',
					}}
				>
					{__('Wähle aus, welche Abschnitte im PDF angezeigt werden.', 'resa')}
				</p>

				{SECTIONS.map((section, index) => {
					const Icon = section.icon;
					const checked = local[section.key] as boolean;
					return (
						<div
							key={section.key}
							style={{
								...toggleRowStyle,
								...(index === SECTIONS.length - 1 ? { borderBottom: 'none' } : {}),
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
										backgroundColor: checked ? '#a9e43f' : 'hsl(210 40% 96.1%)',
										color: checked ? '#1e303a' : 'hsl(215.4 16.3% 46.9%)',
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
											color: 'hsl(215.4 16.3% 46.9%)',
											marginTop: '2px',
										}}
									>
										{section.description}
									</div>
								</div>
							</div>
							<button
								onClick={() => toggleSection(section.key)}
								style={switchStyle(checked)}
								type="button"
								aria-label={section.label}
							>
								<span style={switchKnobStyle(checked)} />
							</button>
						</div>
					);
				})}
			</div>

			{/* CTA customization (only visible when CTA is enabled) */}
			{local.showCta && (
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
							color: 'hsl(215.4 16.3% 46.9%)',
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
								value={local.ctaTitle}
								onChange={(e) => updateField('ctaTitle', e.target.value)}
								placeholder={__(
									'Interesse an einer persönlichen Beratung?',
									'resa',
								)}
								style={inputStyle}
							/>
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
								value={local.ctaText}
								onChange={(e) => updateField('ctaText', e.target.value)}
								placeholder={__(
									'Kontaktieren Sie {name} für eine unverbindliche Einschätzung.',
									'resa',
								)}
								style={inputStyle}
							/>
							<p
								style={{
									fontSize: '11px',
									color: 'hsl(215.4 16.3% 46.9%)',
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
					onClick={handleSave}
					disabled={!hasChanges || saveSettings.isPending}
					style={{
						backgroundColor: hasChanges ? '#a9e43f' : 'hsl(210 40% 96.1%)',
						color: '#1e303a',
						border: 'none',
					}}
				>
					{saveSettings.isPending ? (
						<>
							<Spinner className="resa-size-4" />
							{__('Speichern...', 'resa')}
						</>
					) : (
						<>
							<Save style={{ width: '16px', height: '16px' }} />
							{__('Speichern', 'resa')}
						</>
					)}
				</Button>
			</div>

			{saveSettings.isSuccess && !hasChanges && (
				<p
					style={{
						fontSize: '13px',
						color: '#059669',
						textAlign: 'right',
						margin: '-12px 0 0 0',
					}}
				>
					{__('PDF-Einstellungen gespeichert.', 'resa')}
				</p>
			)}
		</div>
	);
}
