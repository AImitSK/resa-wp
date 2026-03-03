/**
 * PDF Templates page — base layout settings with live preview.
 */

import { useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import {
	FileText,
	Settings2,
	Type,
	AlignVerticalSpaceAround,
	AlignLeft,
	AlignCenter,
	AlignRight,
	Image,
} from 'lucide-react';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { PdfPreview } from '../components/PdfPreview';
import { usePdfSettings, useSavePdfSettings, type PdfSettings } from '../hooks/usePdfSettings';
import { useBranding } from '../hooks/useBranding';
import { useTeamMembers } from '../hooks/useTeam';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

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
				<div className="resa-flex resa-items-center resa-justify-center resa-gap-2 resa-py-12">
					<Spinner className="resa-size-5" />
					<span className="resa-text-muted-foreground">
						{__('Lade PDF-Einstellungen...', 'resa')}
					</span>
				</div>
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
function BaseLayoutTab({
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
		await saveMutation.mutateAsync(form);
		setIsDirty(false);
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
			<form onSubmit={handleSubmit} className="resa-space-y-6">
				{/* Header Section */}
				<div className="resa-space-y-4">
					<h3 className="resa-text-sm resa-font-medium resa-text-muted-foreground">
						<span className="resa-flex resa-items-center resa-gap-1.5">
							<Type
								style={{
									width: '14px',
									height: '14px',
									color: 'hsl(215.4 16.3% 46.9%)',
								}}
							/>
							{__('Header', 'resa')}
						</span>
					</h3>

					{/* Logo info */}
					<div
						style={{
							padding: '12px',
							backgroundColor: 'hsl(210 40% 98%)',
							borderRadius: '8px',
						}}
					>
						<div className="resa-flex resa-items-center resa-justify-between">
							<div>
								<p
									style={{
										margin: 0,
										fontSize: '13px',
										fontWeight: 500,
										color: '#1e303a',
									}}
								>
									{__('Logo', 'resa')}
								</p>
								<p
									className="resa-text-xs resa-text-muted-foreground"
									style={{ margin: 0, marginTop: '2px' }}
								>
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
										maxHeight: '28px',
										maxWidth: '80px',
										objectFit: 'contain',
									}}
								/>
							)}
						</div>
					</div>

					{/* Logo Position */}
					<div className="resa-space-y-2">
						<Label>
							<span className="resa-flex resa-items-center resa-gap-1.5">
								<Image
									style={{
										width: '14px',
										height: '14px',
										color: 'hsl(215.4 16.3% 46.9%)',
									}}
								/>
								{__('Logo-Position', 'resa')}
							</span>
						</Label>
						<div
							style={{
								display: 'inline-flex',
								borderRadius: '8px',
								border: '1px solid hsl(214.3 31.8% 91.4%)',
								overflow: 'hidden',
							}}
						>
							{(
								[
									['left', __('Links', 'resa'), AlignLeft],
									['center', __('Mitte', 'resa'), AlignCenter],
									['right', __('Rechts', 'resa'), AlignRight],
								] as [PdfSettings['logoPosition'], string, React.ElementType][]
							).map(([pos, label, Icon]) => (
								<button
									key={pos}
									type="button"
									onClick={() => updateField('logoPosition', pos)}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '6px',
										padding: '6px 14px',
										fontSize: '13px',
										fontWeight: 500,
										border: 'none',
										cursor: 'pointer',
										backgroundColor:
											form.logoPosition === pos ? '#1e303a' : 'white',
										color:
											form.logoPosition === pos
												? '#a9e43f'
												: 'hsl(215.4 16.3% 46.9%)',
										transition: 'all 150ms',
									}}
									title={label}
								>
									<Icon style={{ width: '14px', height: '14px' }} />
									{label}
								</button>
							))}
						</div>
					</div>

					{/* Logo Size */}
					<div className="resa-space-y-2">
						<Label htmlFor="logo-size">{__('Logo-Größe (Höhe in px)', 'resa')}</Label>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '12px',
								maxWidth: '280px',
							}}
						>
							<input
								id="logo-size"
								type="range"
								min={16}
								max={80}
								step={2}
								value={form.logoSize}
								onChange={(e) =>
									updateField('logoSize', parseInt(e.target.value, 10))
								}
								style={{ flex: 1 }}
							/>
							<span
								style={{
									fontSize: '13px',
									fontWeight: 500,
									color: '#1e303a',
									minWidth: '36px',
									textAlign: 'right',
								}}
							>
								{form.logoSize}px
							</span>
						</div>
					</div>

					{/* Header Text */}
					<div className="resa-space-y-2">
						<Label htmlFor="header-text">{__('Header-Text', 'resa')}</Label>
						<Input
							id="header-text"
							value={form.headerText}
							onChange={(e) => updateField('headerText', e.target.value)}
							placeholder={__('z.B. Firmenname oder Slogan', 'resa')}
						/>
						<p
							className="resa-text-xs resa-text-muted-foreground"
							style={{ margin: 0 }}
						>
							{__(
								'Wird im Header neben dem Logo angezeigt (z.B. Firmenname oder Slogan).',
								'resa',
							)}
						</p>
					</div>
				</div>

				{/* Footer Section */}
				<div className="resa-space-y-4">
					<h3 className="resa-text-sm resa-font-medium resa-text-muted-foreground">
						<span className="resa-flex resa-items-center resa-gap-1.5">
							<FileText
								style={{
									width: '14px',
									height: '14px',
									color: 'hsl(215.4 16.3% 46.9%)',
								}}
							/>
							{__('Footer', 'resa')}
						</span>
					</h3>

					<div className="resa-space-y-2">
						<Label htmlFor="footer-text">{__('Footer-Text', 'resa')}</Label>
						<Input
							id="footer-text"
							value={form.footerText}
							onChange={(e) => updateField('footerText', e.target.value)}
							placeholder={__('z.B. © 2026 Mustermann Immobilien', 'resa')}
						/>
					</div>

					{/* Show Date Toggle */}
					<div
						className="resa-flex resa-items-center resa-justify-between"
						style={{
							padding: '12px',
							backgroundColor: 'hsl(210 40% 98%)',
							borderRadius: '8px',
						}}
					>
						<div>
							<p
								style={{
									margin: 0,
									fontSize: '13px',
									fontWeight: 500,
									color: '#1e303a',
								}}
							>
								{__('Datum anzeigen', 'resa')}
							</p>
							<p
								className="resa-text-xs resa-text-muted-foreground"
								style={{ margin: 0, marginTop: '2px' }}
							>
								{__('Zeigt das Erstellungsdatum in Header und Footer.', 'resa')}
							</p>
						</div>
						<Switch
							checked={form.showDate}
							onCheckedChange={(checked) => updateField('showDate', checked)}
						/>
					</div>
				</div>

				{/* Agents Section */}
				<div className="resa-space-y-4">
					<h3 className="resa-text-sm resa-font-medium resa-text-muted-foreground">
						<span className="resa-flex resa-items-center resa-gap-1.5">
							<Settings2
								style={{
									width: '14px',
									height: '14px',
									color: 'hsl(215.4 16.3% 46.9%)',
								}}
							/>
							{__('Ansprechpartner', 'resa')}
						</span>
					</h3>

					<div
						className="resa-flex resa-items-center resa-justify-between"
						style={{
							padding: '12px',
							backgroundColor: 'hsl(210 40% 98%)',
							borderRadius: '8px',
						}}
					>
						<div>
							<p
								style={{
									margin: 0,
									fontSize: '13px',
									fontWeight: 500,
									color: '#1e303a',
								}}
							>
								{__('Ansprechpartner anzeigen', 'resa')}
							</p>
							<p
								className="resa-text-xs resa-text-muted-foreground"
								style={{ margin: 0, marginTop: '2px' }}
							>
								{__(
									'Ansprechpartner werden automatisch dem Standort zugeordnet.',
									'resa',
								)}
							</p>
						</div>
						<Switch
							checked={form.showAgents}
							onCheckedChange={(checked) => updateField('showAgents', checked)}
						/>
					</div>

					{form.showAgents && teamMembers.length === 0 && (
						<p
							className="resa-text-xs resa-text-muted-foreground"
							style={{ margin: 0, fontStyle: 'italic' }}
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
				</div>

				{/* Margins Section */}
				<div className="resa-space-y-4">
					<h3 className="resa-text-sm resa-font-medium resa-text-muted-foreground">
						<span className="resa-flex resa-items-center resa-gap-1.5">
							<AlignVerticalSpaceAround
								style={{
									width: '14px',
									height: '14px',
									color: 'hsl(215.4 16.3% 46.9%)',
								}}
							/>
							{__('Seitenränder (mm)', 'resa')}
						</span>
					</h3>
					<div
						className="resa-grid resa-gap-4"
						style={{ gridTemplateColumns: 'repeat(4, 1fr)', maxWidth: '400px' }}
					>
						{(
							[
								['top', __('Oben', 'resa')],
								['bottom', __('Unten', 'resa')],
								['left', __('Links', 'resa')],
								['right', __('Rechts', 'resa')],
							] as [keyof PdfSettings['margins'], string][]
						).map(([side, label]) => (
							<div key={side} className="resa-space-y-1">
								<Label htmlFor={`margin-${side}`} style={{ fontSize: '12px' }}>
									{label}
								</Label>
								<Input
									id={`margin-${side}`}
									type="number"
									min={0}
									max={50}
									value={form.margins[side]}
									onChange={(e) =>
										updateMargin(side, parseInt(e.target.value, 10) || 0)
									}
									style={{ textAlign: 'center' }}
								/>
							</div>
						))}
					</div>
				</div>

				{/* Save Button */}
				<div className="resa-flex resa-justify-end resa-pt-4">
					<Button
						type="submit"
						disabled={!isDirty || saveMutation.isPending}
						style={{
							backgroundColor: isDirty ? '#a9e43f' : 'hsl(210 40% 96.1%)',
							color: '#1e303a',
							border: 'none',
						}}
					>
						{__('Speichern', 'resa')}
					</Button>
				</div>
			</form>

			{/* Preview Panel (right) */}
			<div style={{ position: 'sticky', top: '80px' }}>
				<PdfPreview settings={form} logoUrl={logoUrl} agents={teamMembers} />
			</div>
		</div>
	);
}
