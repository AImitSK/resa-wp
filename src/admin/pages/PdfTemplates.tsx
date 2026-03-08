/**
 * PDF Templates page — base layout settings with live preview.
 *
 * Follows the AgentDataForm inline-styles pattern from Settings.tsx.
 */

import { useState, type ReactNode } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { PdfPreview } from '../components/PdfPreview';
import { usePdfSettings, useSavePdfSettings, type PdfSettings } from '../hooks/usePdfSettings';
import { useBranding } from '../hooks/useBranding';
import { useTeamMembers } from '../hooks/useTeam';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingState } from '../components/LoadingState';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from '../lib/toast';

// ─── Styled Button Component ────────────────────────────

function PrimaryButton({
	children,
	onClick,
	disabled,
	type = 'button',
}: {
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	type?: 'button' | 'submit';
}) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<Button
			type={type}
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

// ─── Main Component ─────────────────────────────────────

export function PdfTemplates() {
	const { data: pdfSettings, isLoading, error } = usePdfSettings();
	const { data: branding } = useBranding();
	const { data: teamMembers } = useTeamMembers();

	if (isLoading) {
		return (
			<AdminPageLayout
				variant="overview"
				title={__('PDF-Vorlagen', 'resa')}
				description={__(
					'Basis-Layout und Asset-spezifische PDF-Vorlagen konfigurieren.',
					'resa',
				)}
			>
				<LoadingState message={__('Lade PDF-Einstellungen...', 'resa')} />
			</AdminPageLayout>
		);
	}

	if (error) {
		return (
			<AdminPageLayout
				variant="overview"
				title={__('PDF-Vorlagen', 'resa')}
				description={__(
					'Basis-Layout und Asset-spezifische PDF-Vorlagen konfigurieren.',
					'resa',
				)}
			>
				<Alert variant="destructive">
					<AlertTitle>{__('Fehler beim Laden', 'resa')}</AlertTitle>
					<AlertDescription>
						{__('Die PDF-Einstellungen konnten nicht geladen werden.', 'resa')}
					</AlertDescription>
				</Alert>
			</AdminPageLayout>
		);
	}

	return (
		<AdminPageLayout
			variant="overview"
			title={__('PDF-Vorlagen', 'resa')}
			description={__(
				'Basis-Layout und Asset-spezifische PDF-Vorlagen konfigurieren.',
				'resa',
			)}
		>
			<BaseLayoutTab
				initialData={pdfSettings}
				logoUrl={branding?.logoUrl}
				teamMembers={teamMembers ?? []}
			/>
		</AdminPageLayout>
	);
}

/**
 * Base Layout Tab — settings + live preview side by side.
 */
export function BaseLayoutTab({
	initialData,
	logoUrl,
	teamMembers,
}: {
	initialData: PdfSettings | undefined;
	logoUrl?: string;
	teamMembers: Array<{
		id: number | null;
		name: string;
		position: string;
		email: string;
		phone: string;
		photoUrl: string | null;
		locationIds: number[];
	}>;
}) {
	const saveMutation = useSavePdfSettings();

	const [form, setForm] = useState<PdfSettings>(
		initialData ?? {
			headerText: '',
			footerText: '',
			showDate: true,
			showAgents: true,
			logoPosition: 'left',
			logoSize: 36,
			margins: { top: 20, bottom: 25, left: 15, right: 15 },
		},
	);
	const [isDirty, setIsDirty] = useState(false);

	const updateField = <K extends keyof PdfSettings>(key: K, value: PdfSettings[K]) => {
		setForm((prev) => ({ ...prev, [key]: value }));
		setIsDirty(true);
	};

	const updateMargin = (side: keyof PdfSettings['margins'], value: number) => {
		setForm((prev) => ({
			...prev,
			margins: { ...prev.margins, [side]: value },
		}));
		setIsDirty(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await saveMutation.mutateAsync(form);
			setIsDirty(false);
			toast.success(__('PDF-Einstellungen gespeichert.', 'resa'));
		} catch {
			toast.error(__('Fehler beim Speichern.', 'resa'));
		}
	};

	return (
		<div
			style={{
				display: 'grid',
				gridTemplateColumns: '1fr 340px',
				gap: '24px',
				alignItems: 'start',
			}}
		>
			{/* Settings Panel (left) */}
			<form
				onSubmit={handleSubmit}
				style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
			>
				{/* Card 1: Header */}
				<Card style={cardStyles}>
					<CardContent style={{ padding: '20px' }}>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
							{/* Card Header */}
							<div>
								<h2 style={sectionTitleStyles}>{__('Header', 'resa')}</h2>
								<p style={sectionDescStyles}>
									{__(
										'Logo und Text für den Kopfbereich des PDF-Dokuments.',
										'resa',
									)}
								</p>
							</div>

							{/* Logo Info Box */}
							<div style={grayBoxStyles}>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
									}}
								>
									<div>
										<p style={boxTitleStyles}>{__('Logo', 'resa')}</p>
										<p style={fieldDescStyles}>
											{logoUrl
												? __('Synced von Branding-Einstellungen.', 'resa')
												: __('Kein Logo konfiguriert.', 'resa')}
										</p>
									</div>
									{logoUrl && (
										<img
											src={logoUrl}
											alt="Logo"
											style={{
												maxHeight: '32px',
												maxWidth: '80px',
												objectFit: 'contain',
											}}
										/>
									)}
								</div>
							</div>

							{/* Logo Position + Size Box */}
							<div style={grayBoxStyles}>
								<p style={{ ...boxTitleStyles, marginBottom: '12px' }}>
									{__('Logo-Einstellungen', 'resa')}
								</p>
								<div
									style={{
										display: 'grid',
										gridTemplateColumns: '1fr 1fr',
										gap: '16px',
									}}
								>
									{/* Position */}
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: '6px',
										}}
									>
										<Label>{__('Position', 'resa')}</Label>
										<div
											style={{
												display: 'inline-flex',
												borderRadius: '6px',
												border: '1px solid hsl(214.3 31.8% 91.4%)',
												overflow: 'hidden',
												alignSelf: 'flex-start',
											}}
										>
											{(
												[
													['left', __('Links', 'resa')],
													['center', __('Mitte', 'resa')],
													['right', __('Rechts', 'resa')],
												] as [PdfSettings['logoPosition'], string][]
											).map(([pos, label]) => (
												<button
													key={pos}
													type="button"
													onClick={() => updateField('logoPosition', pos)}
													style={{
														padding: '6px 12px',
														fontSize: '13px',
														fontWeight: 500,
														border: 'none',
														cursor: 'pointer',
														backgroundColor:
															form.logoPosition === pos
																? '#1e303a'
																: 'white',
														color:
															form.logoPosition === pos
																? '#a9e43f'
																: 'hsl(215.4 16.3% 46.9%)',
														transition: 'all 150ms',
													}}
												>
													{label}
												</button>
											))}
										</div>
									</div>

									{/* Size */}
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: '6px',
										}}
									>
										<Label>{__('Größe', 'resa')}</Label>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '10px',
											}}
										>
											<Slider
												value={form.logoSize}
												min={16}
												max={80}
												step={2}
												onChange={(v) => updateField('logoSize', v)}
											/>
											<span
												style={{
													fontSize: '13px',
													fontWeight: 500,
													color: '#1e303a',
													minWidth: '40px',
													textAlign: 'right',
												}}
											>
												{form.logoSize}px
											</span>
										</div>
									</div>
								</div>
							</div>

							{/* Header Text */}
							<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
								<Label htmlFor="header-text">{__('Header-Text', 'resa')}</Label>
								<Input
									id="header-text"
									value={form.headerText}
									onChange={(e) => updateField('headerText', e.target.value)}
									placeholder={__('z.B. Firmenname oder Slogan', 'resa')}
									style={inputStyles}
								/>
								<p style={fieldDescStyles}>
									{__('Wird neben oder unter dem Logo angezeigt.', 'resa')}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Card 2: Footer */}
				<Card style={cardStyles}>
					<CardContent style={{ padding: '20px' }}>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
							{/* Card Header */}
							<div>
								<h2 style={sectionTitleStyles}>{__('Footer', 'resa')}</h2>
								<p style={sectionDescStyles}>
									{__(
										'Text und Optionen für den Fußbereich des PDF-Dokuments.',
										'resa',
									)}
								</p>
							</div>

							{/* Footer Text */}
							<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
								<Label htmlFor="footer-text">{__('Footer-Text', 'resa')}</Label>
								<Input
									id="footer-text"
									value={form.footerText}
									onChange={(e) => updateField('footerText', e.target.value)}
									placeholder={__('z.B. © 2026 Mustermann Immobilien', 'resa')}
									style={inputStyles}
								/>
							</div>

							{/* Show Date Toggle */}
							<div style={toggleBoxStyles}>
								<div>
									<p style={boxTitleStyles}>{__('Datum anzeigen', 'resa')}</p>
									<p style={fieldDescStyles}>
										{__('Erstellungsdatum in Header und Footer.', 'resa')}
									</p>
								</div>
								<Switch
									checked={form.showDate}
									onCheckedChange={(checked) => updateField('showDate', checked)}
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Card 3: Optionen */}
				<Card style={cardStyles}>
					<CardContent style={{ padding: '20px' }}>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
							{/* Card Header */}
							<div>
								<h2 style={sectionTitleStyles}>{__('Optionen', 'resa')}</h2>
								<p style={sectionDescStyles}>
									{__('Weitere Einstellungen für das PDF-Layout.', 'resa')}
								</p>
							</div>

							{/* Show Agents Toggle */}
							<div style={toggleBoxStyles}>
								<div>
									<p style={boxTitleStyles}>
										{__('Ansprechpartner anzeigen', 'resa')}
									</p>
									<p style={fieldDescStyles}>
										{__('Automatisch dem Standort zugeordnet.', 'resa')}
									</p>
								</div>
								<Switch
									checked={form.showAgents}
									onCheckedChange={(checked) =>
										updateField('showAgents', checked)
									}
								/>
							</div>

							{form.showAgents && teamMembers.length === 0 && (
								<p
									style={{
										margin: 0,
										fontSize: '12px',
										fontStyle: 'italic',
										color: 'hsl(215.4 16.3% 46.9%)',
									}}
								>
									{sprintf(
										/* translators: %s: path to team settings */
										__(
											'Noch keine Ansprechpartner angelegt. Verwalte dein Team unter Einstellungen → Team.',
											'resa',
										),
									)}
								</p>
							)}

							{/* Margins Box */}
							<div style={grayBoxStyles}>
								<p style={{ ...boxTitleStyles, marginBottom: '12px' }}>
									{__('Seitenränder (mm)', 'resa')}
								</p>
								<div
									style={{
										display: 'grid',
										gridTemplateColumns: 'repeat(4, 1fr)',
										gap: '12px',
									}}
								>
									{(
										[
											['top', __('Oben', 'resa')],
											['bottom', __('Unten', 'resa')],
											['left', __('Links', 'resa')],
											['right', __('Rechts', 'resa')],
										] as [keyof PdfSettings['margins'], string][]
									).map(([side, label]) => (
										<div
											key={side}
											style={{
												display: 'flex',
												flexDirection: 'column',
												gap: '4px',
											}}
										>
											<Label
												htmlFor={`margin-${side}`}
												style={{
													fontSize: '12px',
													color: 'hsl(215.4 16.3% 46.9%)',
												}}
											>
												{label}
											</Label>
											<Input
												id={`margin-${side}`}
												type="number"
												min={0}
												max={50}
												value={form.margins[side]}
												onChange={(e) =>
													updateMargin(
														side,
														parseInt(e.target.value, 10) || 0,
													)
												}
												style={{
													...inputStyles,
													textAlign: 'center',
													padding: '0 8px',
												}}
											/>
										</div>
									))}
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
					<PrimaryButton type="submit" disabled={!isDirty || saveMutation.isPending}>
						{saveMutation.isPending && (
							<Spinner style={{ width: '14px', height: '14px' }} />
						)}
						{__('Speichern', 'resa')}
					</PrimaryButton>
				</div>
			</form>

			{/* Preview Panel (right) */}
			<div style={{ position: 'sticky', top: '80px' }}>
				<Card style={cardStyles}>
					<CardContent style={{ padding: 0 }}>
						<PdfPreview settings={form} logoUrl={logoUrl} agents={teamMembers} />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
