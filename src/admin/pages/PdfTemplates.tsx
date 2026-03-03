/**
 * PDF Templates page — base layout settings with live preview.
 */

import { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';

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
			<form
				onSubmit={handleSubmit}
				style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
			>
				{/* Header Card */}
				<Card>
					<CardContent style={{ padding: '20px' }}>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
							<h3
								style={{
									margin: 0,
									fontSize: '14px',
									fontWeight: 600,
									color: '#1e303a',
								}}
							>
								{__('Header', 'resa')}
							</h3>

							{/* Logo info */}
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: '10px 12px',
									backgroundColor: 'hsl(210 40% 98%)',
									borderRadius: '6px',
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
										{__('Logo', 'resa')}
									</p>
									<p
										style={{
											margin: '2px 0 0',
											fontSize: '12px',
											color: 'hsl(215.4 16.3% 46.9%)',
										}}
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

							{/* Logo Position + Size — side by side */}
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
													padding: '5px 12px',
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
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
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
												minWidth: '36px',
												textAlign: 'right',
											}}
										>
											{form.logoSize}px
										</span>
									</div>
								</div>
							</div>

							<Separator />

							{/* Header Text */}
							<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
								<Label htmlFor="header-text">{__('Text', 'resa')}</Label>
								<Input
									id="header-text"
									value={form.headerText}
									onChange={(e) => updateField('headerText', e.target.value)}
									placeholder={__('z.B. Firmenname oder Slogan', 'resa')}
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Footer Card */}
				<Card>
					<CardContent style={{ padding: '20px' }}>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
							<h3
								style={{
									margin: 0,
									fontSize: '14px',
									fontWeight: 600,
									color: '#1e303a',
								}}
							>
								{__('Footer', 'resa')}
							</h3>

							<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
								<Label htmlFor="footer-text">{__('Text', 'resa')}</Label>
								<Input
									id="footer-text"
									value={form.footerText}
									onChange={(e) => updateField('footerText', e.target.value)}
									placeholder={__('z.B. © 2026 Mustermann Immobilien', 'resa')}
								/>
							</div>

							{/* Show Date Toggle */}
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: '10px 12px',
									backgroundColor: 'hsl(210 40% 98%)',
									borderRadius: '6px',
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
										style={{
											margin: '2px 0 0',
											fontSize: '12px',
											color: 'hsl(215.4 16.3% 46.9%)',
										}}
									>
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

				{/* Options Card */}
				<Card>
					<CardContent style={{ padding: '20px' }}>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
							<h3
								style={{
									margin: 0,
									fontSize: '14px',
									fontWeight: 600,
									color: '#1e303a',
								}}
							>
								{__('Optionen', 'resa')}
							</h3>

							{/* Show Agents Toggle */}
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: '10px 12px',
									backgroundColor: 'hsl(210 40% 98%)',
									borderRadius: '6px',
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
										style={{
											margin: '2px 0 0',
											fontSize: '12px',
											color: 'hsl(215.4 16.3% 46.9%)',
										}}
									>
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

							<Separator />

							{/* Margins */}
							<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
								<Label>{__('Seitenränder (mm)', 'resa')}</Label>
								<div
									style={{
										display: 'grid',
										gridTemplateColumns: 'repeat(4, 1fr)',
										gap: '10px',
										maxWidth: '320px',
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
													fontSize: '11px',
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
												style={{ textAlign: 'center' }}
											/>
										</div>
									))}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Save Button */}
				<div className="resa-flex resa-justify-end">
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
