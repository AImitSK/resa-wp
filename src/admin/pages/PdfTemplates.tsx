/**
 * PDF Templates page — base layout settings with live preview.
 *
 * Uses Zod + React Hook Form for validation.
 * @see docs/design-system/patterns/form-validation.md
 */

import { useState, useEffect, type ReactNode } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { __, sprintf } from '@wordpress/i18n';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { PdfPreview } from '../components/PdfPreview';
import { usePdfSettings, useSavePdfSettings } from '../hooks/usePdfSettings';
import { useBranding } from '../hooks/useBranding';
import { useTeamMembers } from '../hooks/useTeam';
import { pdfTemplateSchema, type PdfTemplateFormData } from '../schemas/pdfTemplate';

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
	initialData: PdfTemplateFormData | undefined;
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

	const defaults: PdfTemplateFormData = {
		headerText: '',
		footerText: '',
		showDate: true,
		showAgents: true,
		logoPosition: 'left',
		logoSize: 36,
		margins: { top: 20, bottom: 25, left: 15, right: 15 },
	};

	const form = useForm<PdfTemplateFormData>({
		resolver: zodResolver(pdfTemplateSchema),
		defaultValues: defaults,
		mode: 'onChange',
	});

	// Sync server data when loaded
	useEffect(() => {
		if (initialData) {
			form.reset(initialData);
		}
	}, [initialData, form]);

	const onSubmit = (data: PdfTemplateFormData) => {
		saveMutation.mutate(data, {
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

	// Watch all values for live preview
	const formValues = watch();

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
			<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
											<Controller
												name="logoPosition"
												control={form.control}
												render={({ field }) => (
													<>
														{(
															[
																['left', __('Links', 'resa')],
																['center', __('Mitte', 'resa')],
																['right', __('Rechts', 'resa')],
															] as [
																PdfTemplateFormData['logoPosition'],
																string,
															][]
														).map(([pos, label]) => (
															<button
																key={pos}
																type="button"
																onClick={() => field.onChange(pos)}
																style={{
																	padding: '6px 12px',
																	fontSize: '13px',
																	fontWeight: 500,
																	border: 'none',
																	cursor: 'pointer',
																	backgroundColor:
																		field.value === pos
																			? '#1e303a'
																			: 'white',
																	color:
																		field.value === pos
																			? '#a9e43f'
																			: 'hsl(215.4 16.3% 46.9%)',
																	transition: 'all 150ms',
																}}
															>
																{label}
															</button>
														))}
													</>
												)}
											/>
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
											<Controller
												name="logoSize"
												control={form.control}
												render={({ field }) => (
													<>
														<Slider
															value={field.value}
															min={16}
															max={80}
															step={2}
															onChange={field.onChange}
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
															{field.value}px
														</span>
													</>
												)}
											/>
										</div>
									</div>
								</div>
							</div>

							{/* Header Text */}
							<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
								<Label htmlFor="header-text">{__('Header-Text', 'resa')}</Label>
								<Input
									id="header-text"
									{...form.register('headerText')}
									placeholder={__('z.B. Firmenname oder Slogan', 'resa')}
									style={{
										...inputStyles,
										borderColor: errors.headerText ? '#ef4444' : undefined,
									}}
								/>
								{errors.headerText && (
									<p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>
										{errors.headerText.message}
									</p>
								)}
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
									{...form.register('footerText')}
									placeholder={__('z.B. © 2026 Mustermann Immobilien', 'resa')}
									style={{
										...inputStyles,
										borderColor: errors.footerText ? '#ef4444' : undefined,
									}}
								/>
								{errors.footerText && (
									<p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>
										{errors.footerText.message}
									</p>
								)}
							</div>

							{/* Show Date Toggle */}
							<div style={toggleBoxStyles}>
								<div>
									<p style={boxTitleStyles}>{__('Datum anzeigen', 'resa')}</p>
									<p style={fieldDescStyles}>
										{__('Erstellungsdatum in Header und Footer.', 'resa')}
									</p>
								</div>
								<Controller
									name="showDate"
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
								<Controller
									name="showAgents"
									control={form.control}
									render={({ field }) => (
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									)}
								/>
							</div>

							{formValues.showAgents && teamMembers.length === 0 && (
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
										] as [keyof PdfTemplateFormData['margins'], string][]
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
											<Controller
												name={`margins.${side}`}
												control={form.control}
												render={({ field }) => (
													<Input
														id={`margin-${side}`}
														type="number"
														min={0}
														max={50}
														value={field.value}
														onChange={(e) =>
															field.onChange(
																parseInt(e.target.value, 10) || 0,
															)
														}
														style={{
															...inputStyles,
															textAlign: 'center',
															padding: '0 8px',
															borderColor: errors.margins?.[side]
																? '#ef4444'
																: undefined,
														}}
													/>
												)}
											/>
											{errors.margins?.[side] && (
												<p
													style={{
														fontSize: '12px',
														color: '#ef4444',
														margin: 0,
													}}
												>
													{errors.margins[side]?.message}
												</p>
											)}
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

			{/* Preview Panel (right) */}
			<div style={{ position: 'sticky', top: '80px' }}>
				<Card style={cardStyles}>
					<CardContent style={{ padding: 0 }}>
						<PdfPreview settings={formValues} logoUrl={logoUrl} agents={teamMembers} />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
