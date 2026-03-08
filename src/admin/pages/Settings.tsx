/**
 * Settings page — agent data, templates, tracking, GDPR.
 *
 * Tab-based navigation with Maklerdaten form as first active tab.
 * Branding (logo, colors, powered-by) is integrated into the agent data tab.
 * PDF and email templates are available as dedicated tabs.
 */

import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { User, X, Image, Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { useAgentData, useSaveAgentData, type AgentData } from '../hooks/useAgentData';
import { useBranding, useSaveBranding, type BrandingSettings } from '../hooks/useBranding';
import {
	useMapSettings,
	useSaveMapSettings,
	type MapSettings,
	type TileStyle,
} from '../hooks/useMapSettings';
import {
	useTeamMembers,
	useCreateTeamMember,
	useUpdateTeamMember,
	useDeleteTeamMember,
	type TeamMember,
} from '../hooks/useTeam';
import { useLocations, type LocationAdmin } from '../hooks/useLocations';
import { TrackingTab } from '../components/settings/TrackingTab';
import { GdprTab } from '../components/settings/GdprTab';
import { TemplatesTab } from '../components/communication/TemplatesTab';
import { TemplateEditor } from '../components/communication/TemplateEditor';
import { BaseLayoutTab } from './PdfTemplates';
import { usePdfSettings } from '../hooks/usePdfSettings';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingState } from '../components/LoadingState';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

type SettingsTab = 'agent' | 'team' | 'maps' | 'tracking' | 'gdpr' | 'pdf' | 'email';

export function Settings() {
	const [activeTab, setActiveTab] = useState<SettingsTab>('agent');
	const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

	// Editor view replaces the entire page.
	if (editingTemplateId) {
		return (
			<TemplateEditor
				templateId={editingTemplateId}
				onBack={() => setEditingTemplateId(null)}
			/>
		);
	}

	const tabStyle = (isActive: boolean): React.CSSProperties => ({
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		whiteSpace: 'nowrap',
		borderRadius: '6px',
		padding: '6px 12px',
		fontSize: '14px',
		fontWeight: 500,
		gap: '6px',
		transition: 'all 150ms',
		backgroundColor: isActive ? 'white' : 'transparent',
		color: isActive ? '#1e303a' : 'hsl(215.4 16.3% 46.9%)',
		boxShadow: isActive ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none',
		cursor: 'pointer',
	});

	return (
		<AdminPageLayout
			variant="overview"
			title={__('Einstellungen', 'resa')}
			description={__('Maklerdaten, Vorlagen, Tracking und weitere Einstellungen.', 'resa')}
		>
			{/* Tab Navigation */}
			<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SettingsTab)}>
				<TabsList
					style={{
						display: 'inline-flex',
						height: '40px',
						alignItems: 'center',
						justifyContent: 'center',
						borderRadius: '8px',
						backgroundColor: 'hsl(210 40% 96.1%)',
						padding: '4px',
					}}
				>
					<TabsTrigger value="agent" style={tabStyle(activeTab === 'agent')}>
						{__('Maklerdaten', 'resa')}
					</TabsTrigger>
					<TabsTrigger value="team" style={tabStyle(activeTab === 'team')}>
						{__('Team', 'resa')}
					</TabsTrigger>
					<TabsTrigger value="maps" style={tabStyle(activeTab === 'maps')}>
						{__('Karten', 'resa')}
					</TabsTrigger>
					<TabsTrigger value="tracking" style={tabStyle(activeTab === 'tracking')}>
						{__('Tracking', 'resa')}
					</TabsTrigger>
					<TabsTrigger value="gdpr" style={tabStyle(activeTab === 'gdpr')}>
						{__('Datenschutz', 'resa')}
					</TabsTrigger>
					<TabsTrigger value="pdf" style={tabStyle(activeTab === 'pdf')}>
						{__('PDF-Vorlagen', 'resa')}
					</TabsTrigger>
					<TabsTrigger value="email" style={tabStyle(activeTab === 'email')}>
						{__('E-Mail-Vorlagen', 'resa')}
					</TabsTrigger>
				</TabsList>
			</Tabs>

			{/* Tab Content */}
			{activeTab === 'agent' && <AgentDataTab />}
			{activeTab === 'team' && <TeamTab />}
			{activeTab === 'maps' && <MapsTab />}
			{activeTab === 'tracking' && <TrackingTab />}
			{activeTab === 'gdpr' && <GdprTab />}
			{activeTab === 'pdf' && <PdfTab />}
			{activeTab === 'email' && <EmailTab onEditTemplate={setEditingTemplateId} />}
		</AdminPageLayout>
	);
}

/**
 * Agent Data Tab — form for broker/agent information.
 */
function AgentDataTab() {
	const { data: agentData, isLoading, error } = useAgentData();

	if (isLoading) {
		return <LoadingState message={__('Lade Maklerdaten...', 'resa')} />;
	}

	if (error) {
		return (
			<Alert variant="destructive">
				<AlertTitle>{__('Fehler beim Laden', 'resa')}</AlertTitle>
				<AlertDescription>
					{__('Die Maklerdaten konnten nicht geladen werden.', 'resa')}
				</AlertDescription>
			</Alert>
		);
	}

	return <AgentDataForm initialData={agentData} />;
}

// ─── Styled Button Components ────────────────────────────

function PrimaryButton({
	children,
	onClick,
	disabled,
	type = 'button',
}: {
	children: React.ReactNode;
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

function OutlineButton({
	children,
	onClick,
	disabled,
	style,
}: {
	children: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	style?: React.CSSProperties;
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
						? 'hsl(210 40% 96.1%)'
						: 'white',
				color: disabled ? 'hsl(215.4 16.3% 46.9%)' : '#1e303a',
				border: '1px solid hsl(214.3 31.8% 78%)',
				cursor: disabled ? 'not-allowed' : 'pointer',
				boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
				gap: '6px',
				...style,
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

const boxTitleStyles: React.CSSProperties = {
	margin: 0,
	fontSize: '14px',
	fontWeight: 500,
	color: '#1e303a',
};

const grayBoxStyles: React.CSSProperties = {
	padding: '16px',
	border: '1px solid hsl(214.3 31.8% 91.4%)',
	borderRadius: '8px',
	backgroundColor: 'hsl(210 40% 96.1%)',
};

const inputStyles: React.CSSProperties = {
	height: '36px',
	padding: '0 12px',
	fontSize: '14px',
	border: '1px solid hsl(214.3 31.8% 78%)',
	borderRadius: '6px',
	backgroundColor: 'white',
};

function AgentDataForm({ initialData }: { initialData: AgentData | undefined }) {
	const saveMutation = useSaveAgentData();
	const { data: brandingData } = useBranding();
	const saveBrandingMutation = useSaveBranding();

	const [form, setForm] = useState<AgentData>(
		initialData ?? {
			id: null,
			name: '',
			company: '',
			email: '',
			phone: '',
			address: '',
			website: '',
			imprintUrl: '',
			photoUrl: null,
		},
	);

	const [branding, setBranding] = useState<BrandingSettings>(
		brandingData ?? {
			logoUrl: '',
			logoId: 0,
			primaryColor: '#a9e43f',
			secondaryColor: '#1e303a',
			showPoweredBy: true,
		},
	);

	// Sync branding state when data loads.
	const [brandingSynced, setBrandingSynced] = useState(false);
	if (brandingData && !brandingSynced) {
		setBranding(brandingData);
		setBrandingSynced(true);
	}

	const [agentDirty, setAgentDirty] = useState(false);
	const [brandingDirty, setBrandingDirty] = useState(false);
	const isDirty = agentDirty || brandingDirty;

	// Free plan cannot disable "Powered by RESA".
	const isPremium = window.resaAdmin?.features?.plan !== 'free';

	const updateField = <K extends keyof AgentData>(key: K, value: AgentData[K]) => {
		setForm((prev) => ({ ...prev, [key]: value }));
		setAgentDirty(true);
	};

	const updateBrandingField = <K extends keyof BrandingSettings>(
		key: K,
		value: BrandingSettings[K],
	) => {
		setBranding((prev) => ({ ...prev, [key]: value }));
		setBrandingDirty(true);
	};

	const handleSelectLogo = async () => {
		const result = await openMediaLibrary(
			__('Logo auswählen', 'resa'),
			__('Als Logo verwenden', 'resa'),
		);
		if (result) {
			setBranding((prev) => ({ ...prev, logoUrl: result.url, logoId: result.id }));
			setBrandingDirty(true);
		}
	};

	const handleRemoveLogo = () => {
		setBranding((prev) => ({ ...prev, logoUrl: '', logoId: 0 }));
		setBrandingDirty(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const promises: Promise<unknown>[] = [];

		if (agentDirty) {
			promises.push(
				saveMutation.mutateAsync({
					name: form.name,
					email: form.email,
					phone: form.phone,
					company: form.company,
					address: form.address,
					website: form.website,
					imprint_url: form.imprintUrl,
				}),
			);
		}

		if (brandingDirty) {
			promises.push(
				saveBrandingMutation.mutateAsync({
					logoUrl: branding.logoUrl,
					logoId: branding.logoId,
					primaryColor: branding.primaryColor,
					secondaryColor: branding.secondaryColor,
					showPoweredBy: branding.showPoweredBy,
				}),
			);
		}

		await Promise.all(promises);
		setAgentDirty(false);
		setBrandingDirty(false);
	};

	const isValid = form.name.trim() !== '' && form.email.trim() !== '';
	const isSaving = saveMutation.isPending || saveBrandingMutation.isPending;

	return (
		<form
			onSubmit={handleSubmit}
			style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
		>
			{/* Card 1: Maklerdaten (Persönliche Daten + Kontaktdaten + Online-Präsenz) */}
			<Card style={cardStyles}>
				<CardContent style={{ padding: '20px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{/* Card Header */}
						<div>
							<h2 style={sectionTitleStyles}>{__('Maklerdaten', 'resa')}</h2>
							<p style={sectionDescStyles}>
								{__(
									'Diese Daten werden in PDF-Dokumenten, E-Mails und auf der Ergebnisseite angezeigt.',
									'resa',
								)}
							</p>
						</div>

						{/* Persönliche Daten Box */}
						<div style={grayBoxStyles}>
							<p style={{ ...boxTitleStyles, marginBottom: '12px' }}>
								{__('Persönliche Daten', 'resa')}
							</p>
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
									<Label htmlFor="agent-name">{__('Name', 'resa')} *</Label>
									<Input
										id="agent-name"
										value={form.name}
										onChange={(e) => updateField('name', e.target.value)}
										placeholder={__('Max Mustermann', 'resa')}
										required
										style={inputStyles}
									/>
								</div>
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
								>
									<Label htmlFor="agent-company">{__('Firma', 'resa')}</Label>
									<Input
										id="agent-company"
										value={form.company}
										onChange={(e) => updateField('company', e.target.value)}
										placeholder={__('Mustermann Immobilien GmbH', 'resa')}
										style={inputStyles}
									/>
								</div>
							</div>
						</div>

						{/* Kontaktdaten Box */}
						<div style={grayBoxStyles}>
							<p style={{ ...boxTitleStyles, marginBottom: '12px' }}>
								{__('Kontaktdaten', 'resa')}
							</p>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
								<div
									style={{
										display: 'grid',
										gridTemplateColumns: '1fr 1fr',
										gap: '16px',
									}}
								>
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: '6px',
										}}
									>
										<Label htmlFor="agent-email">
											{__('E-Mail', 'resa')} *
										</Label>
										<Input
											id="agent-email"
											type="email"
											value={form.email}
											onChange={(e) => updateField('email', e.target.value)}
											placeholder={__('max@mustermann-immo.de', 'resa')}
											required
											style={inputStyles}
										/>
									</div>
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: '6px',
										}}
									>
										<Label htmlFor="agent-phone">{__('Telefon', 'resa')}</Label>
										<Input
											id="agent-phone"
											type="tel"
											value={form.phone}
											onChange={(e) => updateField('phone', e.target.value)}
											placeholder={__('+49 123 456789', 'resa')}
											style={inputStyles}
										/>
									</div>
								</div>
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
								>
									<Label htmlFor="agent-address">{__('Adresse', 'resa')}</Label>
									<Textarea
										id="agent-address"
										value={form.address}
										onChange={(e) => updateField('address', e.target.value)}
										placeholder={__(
											'Musterstraße 1\n12345 Musterstadt',
											'resa',
										)}
										rows={3}
										style={{
											...inputStyles,
											height: 'auto',
											padding: '8px 12px',
										}}
									/>
								</div>
							</div>
						</div>

						{/* Online-Präsenz Box */}
						<div style={grayBoxStyles}>
							<p style={{ ...boxTitleStyles, marginBottom: '12px' }}>
								{__('Online-Präsenz', 'resa')}
							</p>
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
									<Label htmlFor="agent-website">{__('Website', 'resa')}</Label>
									<Input
										id="agent-website"
										type="url"
										value={form.website}
										onChange={(e) => updateField('website', e.target.value)}
										placeholder={__('https://mustermann-immo.de', 'resa')}
										style={inputStyles}
									/>
								</div>
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
								>
									<Label htmlFor="agent-imprint">
										{__('Impressum-URL', 'resa')}
									</Label>
									<Input
										id="agent-imprint"
										type="url"
										value={form.imprintUrl}
										onChange={(e) => updateField('imprintUrl', e.target.value)}
										placeholder={__(
											'https://mustermann-immo.de/impressum',
											'resa',
										)}
										style={inputStyles}
									/>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Card 2: Branding (Logo + Farben + Powered By) */}
			<Card style={cardStyles}>
				<CardContent style={{ padding: '20px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{/* Card Header */}
						<div>
							<h2 style={sectionTitleStyles}>{__('Branding', 'resa')}</h2>
							<p style={sectionDescStyles}>
								{__('Logo und Farben für deine Smart Assets.', 'resa')}
							</p>
						</div>

						{/* Logo + Farben side by side */}
						<div
							style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}
						>
							{/* Logo Box */}
							<div style={grayBoxStyles}>
								<p style={{ ...boxTitleStyles, marginBottom: '12px' }}>
									{__('Logo', 'resa')}
								</p>
								{branding.logoUrl ? (
									<div
										style={{
											display: 'flex',
											alignItems: 'flex-start',
											gap: '12px',
										}}
									>
										<div
											style={{
												width: '100px',
												height: '70px',
												borderRadius: '6px',
												border: '1px solid hsl(214.3 31.8% 91.4%)',
												backgroundColor: '#fff',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												overflow: 'hidden',
											}}
										>
											<img
												src={branding.logoUrl}
												alt={__('Logo', 'resa')}
												style={{
													maxWidth: '100%',
													maxHeight: '100%',
													objectFit: 'contain',
												}}
											/>
										</div>
										<div
											style={{
												display: 'flex',
												flexDirection: 'column',
												gap: '6px',
											}}
										>
											<OutlineButton onClick={handleSelectLogo}>
												{__('Ändern', 'resa')}
											</OutlineButton>
											<OutlineButton
												onClick={handleRemoveLogo}
												style={{ color: '#dc2626' }}
											>
												<X style={{ width: '14px', height: '14px' }} />
												{__('Entfernen', 'resa')}
											</OutlineButton>
										</div>
									</div>
								) : (
									<button
										type="button"
										onClick={handleSelectLogo}
										style={{
											width: '100%',
											padding: '20px',
											border: '2px dashed hsl(214.3 31.8% 78%)',
											borderRadius: '8px',
											backgroundColor: 'white',
											cursor: 'pointer',
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											gap: '6px',
											transition: 'border-color 150ms',
										}}
										onMouseEnter={(e) =>
											(e.currentTarget.style.borderColor = '#1e303a')
										}
										onMouseLeave={(e) =>
											(e.currentTarget.style.borderColor =
												'hsl(214.3 31.8% 78%)')
										}
									>
										<Image
											style={{
												width: '24px',
												height: '24px',
												color: 'hsl(215.4 16.3% 46.9%)',
											}}
										/>
										<span
											style={{
												fontSize: '13px',
												fontWeight: 500,
												color: '#1e303a',
											}}
										>
											{__('Logo auswählen', 'resa')}
										</span>
										<span
											style={{
												fontSize: '11px',
												color: 'hsl(215.4 16.3% 46.9%)',
											}}
										>
											{__('PNG, JPG, SVG', 'resa')}
										</span>
									</button>
								)}
							</div>

							{/* Farben Box */}
							<div style={grayBoxStyles}>
								<p style={{ ...boxTitleStyles, marginBottom: '12px' }}>
									{__('Farben', 'resa')}
								</p>
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										gap: '12px',
									}}
								>
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: '6px',
										}}
									>
										<Label htmlFor="primary-color">
											{__('Primärfarbe', 'resa')}
										</Label>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
											}}
										>
											<input
												id="primary-color"
												type="color"
												value={branding.primaryColor}
												onChange={(e) =>
													updateBrandingField(
														'primaryColor',
														e.target.value,
													)
												}
												style={{
													width: '36px',
													height: '36px',
													padding: 0,
													border: '1px solid hsl(214.3 31.8% 91.4%)',
													borderRadius: '6px',
													cursor: 'pointer',
													backgroundColor: 'transparent',
												}}
											/>
											<Input
												type="text"
												value={branding.primaryColor}
												onChange={(e) =>
													updateBrandingField(
														'primaryColor',
														e.target.value,
													)
												}
												style={{
													...inputStyles,
													width: '90px',
													fontFamily: 'monospace',
													fontSize: '12px',
												}}
												maxLength={7}
											/>
										</div>
									</div>
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: '6px',
										}}
									>
										<Label htmlFor="secondary-color">
											{__('Sekundärfarbe', 'resa')}
										</Label>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
											}}
										>
											<input
												id="secondary-color"
												type="color"
												value={branding.secondaryColor}
												onChange={(e) =>
													updateBrandingField(
														'secondaryColor',
														e.target.value,
													)
												}
												style={{
													width: '36px',
													height: '36px',
													padding: 0,
													border: '1px solid hsl(214.3 31.8% 91.4%)',
													borderRadius: '6px',
													cursor: 'pointer',
													backgroundColor: 'transparent',
												}}
											/>
											<Input
												type="text"
												value={branding.secondaryColor}
												onChange={(e) =>
													updateBrandingField(
														'secondaryColor',
														e.target.value,
													)
												}
												style={{
													...inputStyles,
													width: '90px',
													fontFamily: 'monospace',
													fontSize: '12px',
												}}
												maxLength={7}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Powered By Toggle */}
						<div
							style={{
								...grayBoxStyles,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
							}}
						>
							<div>
								<p style={boxTitleStyles}>
									{__('"Powered by RESA" anzeigen', 'resa')}
								</p>
								<p
									style={{
										margin: '2px 0 0 0',
										fontSize: '12px',
										color: 'hsl(215.4 16.3% 46.9%)',
									}}
								>
									{isPremium
										? __(
												'Zeigt den RESA-Hinweis in deinen Smart Assets.',
												'resa',
											)
										: __(
												'Im Free-Plan ist der Hinweis immer sichtbar.',
												'resa',
											)}
								</p>
							</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								{!isPremium && (
									<Badge variant="secondary" style={{ fontSize: '10px' }}>
										PRO
									</Badge>
								)}
								<Switch
									checked={branding.showPoweredBy}
									onCheckedChange={(checked) =>
										updateBrandingField('showPoweredBy', checked)
									}
									disabled={!isPremium}
								/>
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
				<PrimaryButton type="submit" disabled={!isDirty || !isValid || isSaving}>
					{isSaving && <Spinner style={{ width: '14px', height: '14px' }} />}
					{__('Speichern', 'resa')}
				</PrimaryButton>
			</div>
		</form>
	);
}

/**
 * Team Tab — manage multiple contact persons (agents).
 */
type TeamView = 'list' | 'create' | 'edit';

function TeamTab() {
	const { data: members, isLoading, error } = useTeamMembers();
	const { data: locations } = useLocations();
	const createMutation = useCreateTeamMember();
	const updateMutation = useUpdateTeamMember();
	const deleteMutation = useDeleteTeamMember();

	const [view, setView] = useState<TeamView>('list');
	const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

	const handleCreate = async (data: Omit<TeamMember, 'id'>) => {
		await createMutation.mutateAsync(data);
		setView('list');
	};

	const handleUpdate = async (data: Omit<TeamMember, 'id'> & { id: number }) => {
		await updateMutation.mutateAsync(data);
		setView('list');
		setEditingMember(null);
	};

	const handleDelete = async (id: number) => {
		await deleteMutation.mutateAsync(id);
	};

	const handleEdit = (member: TeamMember) => {
		setEditingMember(member);
		setView('edit');
	};

	if (isLoading) {
		return <LoadingState message={__('Lade Team...', 'resa')} />;
	}

	if (error) {
		return (
			<Alert variant="destructive">
				<AlertTitle>{__('Fehler beim Laden', 'resa')}</AlertTitle>
				<AlertDescription>
					{__('Das Team konnte nicht geladen werden.', 'resa')}
				</AlertDescription>
			</Alert>
		);
	}

	if (view === 'create') {
		return (
			<TeamMemberForm
				locations={locations ?? []}
				isSaving={createMutation.isPending}
				onSave={handleCreate}
				onCancel={() => setView('list')}
			/>
		);
	}

	if (view === 'edit' && editingMember) {
		return (
			<TeamMemberForm
				initialData={editingMember}
				locations={locations ?? []}
				isSaving={updateMutation.isPending}
				onSave={(data) => handleUpdate({ ...data, id: editingMember.id! })}
				onCancel={() => {
					setView('list');
					setEditingMember(null);
				}}
			/>
		);
	}

	return (
		<div className="resa-space-y-6">
			{/* Header */}
			<div className="resa-flex resa-items-center resa-justify-between">
				<div>
					<h3 className="resa-text-lg resa-font-semibold" style={{ margin: 0 }}>
						{__('Team', 'resa')}
					</h3>
					<p
						className="resa-text-sm resa-text-muted-foreground"
						style={{ margin: 0, marginTop: '2px' }}
					>
						{__('Ansprechpartner für Standorte und PDF-Dokumente verwalten.', 'resa')}
					</p>
				</div>
				<PrimaryButton onClick={() => setView('create')}>
					<Plus style={{ width: '16px', height: '16px' }} />
					{__('Ansprechpartner hinzufügen', 'resa')}
				</PrimaryButton>
			</div>

			{/* Team Members List */}
			{!members || members.length === 0 ? (
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						padding: '48px 24px',
						textAlign: 'center',
						border: '2px dashed hsl(214.3 31.8% 78%)',
						borderRadius: '16px',
					}}
				>
					<p
						style={{
							fontSize: '16px',
							fontWeight: 500,
							color: '#1e303a',
							margin: '0 0 4px 0',
						}}
					>
						{__('Noch keine Ansprechpartner', 'resa')}
					</p>
					<p
						style={{
							fontSize: '14px',
							color: '#1e303a',
							margin: '0 0 16px 0',
						}}
					>
						{__(
							'Füge Ansprechpartner hinzu, die in PDFs und auf Ergebnisseiten angezeigt werden.',
							'resa',
						)}
					</p>
					<OutlineButton onClick={() => setView('create')}>
						<Plus style={{ width: '16px', height: '16px' }} />
						{__('Ersten Ansprechpartner anlegen', 'resa')}
					</OutlineButton>
				</div>
			) : (
				<div
					style={{
						border: '1px solid hsl(214.3 31.8% 91.4%)',
						borderRadius: '8px',
						overflow: 'hidden',
					}}
				>
					<table style={{ width: '100%', borderCollapse: 'collapse' }}>
						<thead>
							<tr style={{ backgroundColor: 'hsl(210 40% 98%)' }}>
								<th
									style={{
										padding: '12px 16px',
										textAlign: 'left',
										fontSize: '12px',
										fontWeight: 600,
										color: 'hsl(215.4 16.3% 46.9%)',
										width: '48px',
									}}
								/>
								<th
									style={{
										padding: '12px 16px',
										textAlign: 'left',
										fontSize: '12px',
										fontWeight: 600,
										color: 'hsl(215.4 16.3% 46.9%)',
									}}
								>
									{__('Name & Position', 'resa')}
								</th>
								<th
									style={{
										padding: '12px 16px',
										textAlign: 'left',
										fontSize: '12px',
										fontWeight: 600,
										color: 'hsl(215.4 16.3% 46.9%)',
									}}
								>
									{__('Standort(e)', 'resa')}
								</th>
								<th
									style={{
										padding: '12px 16px',
										textAlign: 'right',
										fontSize: '12px',
										fontWeight: 600,
										color: 'hsl(215.4 16.3% 46.9%)',
										width: '100px',
									}}
								>
									{__('Aktionen', 'resa')}
								</th>
							</tr>
						</thead>
						<tbody>
							{members.map((member) => (
								<tr
									key={member.id}
									style={{ borderTop: '1px solid hsl(214.3 31.8% 91.4%)' }}
								>
									<td style={{ padding: '12px 16px' }}>
										{member.photoUrl ? (
											<img
												src={member.photoUrl}
												alt={member.name}
												style={{
													width: '36px',
													height: '36px',
													borderRadius: '50%',
													objectFit: 'cover',
												}}
											/>
										) : (
											<div
												style={{
													width: '36px',
													height: '36px',
													borderRadius: '50%',
													backgroundColor: 'hsl(210 40% 96.1%)',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
												}}
											>
												<User
													style={{
														width: '18px',
														height: '18px',
														color: 'hsl(215.4 16.3% 46.9%)',
													}}
												/>
											</div>
										)}
									</td>
									<td style={{ padding: '12px 16px' }}>
										<div style={{ fontWeight: 500, color: '#1e303a' }}>
											{member.name}
										</div>
										{member.position && (
											<div
												className="resa-text-sm resa-text-muted-foreground"
												style={{ marginTop: '2px' }}
											>
												{member.position}
											</div>
										)}
									</td>
									<td style={{ padding: '12px 16px' }}>
										<div className="resa-flex resa-flex-wrap resa-gap-1">
											{member.locationIds.length > 0 ? (
												member.locationIds.map((locId) => {
													const loc = locations?.find(
														(l) => l.id === locId,
													);
													return (
														<Badge
															key={locId}
															variant="secondary"
															style={{ fontSize: '11px' }}
														>
															<MapPin
																style={{
																	width: '10px',
																	height: '10px',
																	marginRight: '3px',
																}}
															/>
															{loc?.name ?? `#${locId}`}
														</Badge>
													);
												})
											) : (
												<span className="resa-text-sm resa-text-muted-foreground">
													{__('Keine Zuordnung', 'resa')}
												</span>
											)}
										</div>
									</td>
									<td style={{ padding: '12px 16px', textAlign: 'right' }}>
										<div className="resa-flex resa-justify-end resa-gap-1">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleEdit(member)}
												style={{ padding: '6px' }}
											>
												<Pencil style={{ width: '14px', height: '14px' }} />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => member.id && handleDelete(member.id)}
												style={{
													padding: '6px',
													color: 'hsl(0 84.2% 60.2%)',
												}}
											>
												<Trash2 style={{ width: '14px', height: '14px' }} />
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

/**
 * Team member create/edit form.
 */
function TeamMemberForm({
	initialData,
	locations,
	isSaving,
	onSave,
	onCancel,
}: {
	initialData?: TeamMember;
	locations: LocationAdmin[];
	isSaving: boolean;
	onSave: (data: Omit<TeamMember, 'id'>) => Promise<void>;
	onCancel: () => void;
}) {
	const [form, setForm] = useState<Omit<TeamMember, 'id'>>({
		name: initialData?.name ?? '',
		position: initialData?.position ?? '',
		email: initialData?.email ?? '',
		phone: initialData?.phone ?? '',
		photoUrl: initialData?.photoUrl ?? null,
		locationIds: initialData?.locationIds ?? [],
	});

	const updateField = <K extends keyof Omit<TeamMember, 'id'>>(
		key: K,
		value: Omit<TeamMember, 'id'>[K],
	) => {
		setForm((prev) => ({ ...prev, [key]: value }));
	};

	const toggleLocation = (locationId: number) => {
		setForm((prev) => ({
			...prev,
			locationIds: prev.locationIds.includes(locationId)
				? prev.locationIds.filter((id) => id !== locationId)
				: [...prev.locationIds, locationId],
		}));
	};

	const handleSelectPhoto = async () => {
		const result = await openMediaLibrary(
			__('Foto auswählen', 'resa'),
			__('Als Foto verwenden', 'resa'),
		);
		if (result) {
			updateField('photoUrl', result.url);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await onSave(form);
	};

	const isValid = form.name.trim() !== '' && form.email.trim() !== '';
	const isEditing = !!initialData;

	return (
		<form
			onSubmit={handleSubmit}
			style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
		>
			{/* Card: Ansprechpartner */}
			<Card style={cardStyles}>
				<CardContent style={{ padding: '20px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{/* Card Header */}
						<div>
							<h2 style={sectionTitleStyles}>
								{isEditing
									? __('Ansprechpartner bearbeiten', 'resa')
									: __('Neuer Ansprechpartner', 'resa')}
							</h2>
							<p style={sectionDescStyles}>
								{__('Kontaktdaten und Standort-Zuordnung festlegen.', 'resa')}
							</p>
						</div>

						{/* Person Box (Photo + Name + Position) */}
						<div style={grayBoxStyles}>
							<p style={{ ...boxTitleStyles, marginBottom: '12px' }}>
								{__('Person', 'resa')}
							</p>

							{/* Photo + Name/Position side by side */}
							<div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
								{/* Photo */}
								<div>
									{form.photoUrl ? (
										<div
											style={{
												display: 'flex',
												flexDirection: 'column',
												alignItems: 'center',
												gap: '8px',
											}}
										>
											<img
												src={form.photoUrl}
												alt={form.name}
												style={{
													width: '80px',
													height: '80px',
													borderRadius: '50%',
													objectFit: 'cover',
													border: '1px solid hsl(214.3 31.8% 91.4%)',
												}}
											/>
											<div style={{ display: 'flex', gap: '4px' }}>
												<OutlineButton onClick={handleSelectPhoto}>
													{__('Ändern', 'resa')}
												</OutlineButton>
												<OutlineButton
													onClick={() => updateField('photoUrl', null)}
													style={{ color: '#dc2626' }}
												>
													<X style={{ width: '14px', height: '14px' }} />
												</OutlineButton>
											</div>
										</div>
									) : (
										<button
											type="button"
											onClick={handleSelectPhoto}
											style={{
												width: '80px',
												height: '80px',
												borderRadius: '50%',
												border: '2px dashed hsl(214.3 31.8% 78%)',
												backgroundColor: 'white',
												cursor: 'pointer',
												display: 'flex',
												flexDirection: 'column',
												alignItems: 'center',
												justifyContent: 'center',
												gap: '4px',
												transition: 'border-color 150ms',
											}}
											onMouseEnter={(e) =>
												(e.currentTarget.style.borderColor = '#1e303a')
											}
											onMouseLeave={(e) =>
												(e.currentTarget.style.borderColor =
													'hsl(214.3 31.8% 78%)')
											}
										>
											<Image
												style={{
													width: '20px',
													height: '20px',
													color: 'hsl(215.4 16.3% 46.9%)',
												}}
											/>
											<span
												style={{
													fontSize: '10px',
													color: 'hsl(215.4 16.3% 46.9%)',
												}}
											>
												{__('Foto', 'resa')}
											</span>
										</button>
									)}
								</div>

								{/* Name + Position */}
								<div
									style={{
										flex: 1,
										display: 'flex',
										flexDirection: 'column',
										gap: '12px',
									}}
								>
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: '6px',
										}}
									>
										<Label htmlFor="member-name">{__('Name', 'resa')} *</Label>
										<Input
											id="member-name"
											value={form.name}
											onChange={(e) => updateField('name', e.target.value)}
											placeholder={__('Max Mustermann', 'resa')}
											required
											style={inputStyles}
										/>
									</div>
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: '6px',
										}}
									>
										<Label htmlFor="member-position">
											{__('Position/Funktion', 'resa')}
										</Label>
										<Input
											id="member-position"
											value={form.position}
											onChange={(e) =>
												updateField('position', e.target.value)
											}
											placeholder={__('Geschäftsführer', 'resa')}
											style={inputStyles}
										/>
									</div>
								</div>
							</div>
						</div>

						{/* Kontaktdaten Box */}
						<div style={grayBoxStyles}>
							<p style={{ ...boxTitleStyles, marginBottom: '12px' }}>
								{__('Kontaktdaten', 'resa')}
							</p>
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
									<Label htmlFor="member-email">{__('E-Mail', 'resa')} *</Label>
									<Input
										id="member-email"
										type="email"
										value={form.email}
										onChange={(e) => updateField('email', e.target.value)}
										placeholder={__('max@mustermann-immo.de', 'resa')}
										required
										style={inputStyles}
									/>
								</div>
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
								>
									<Label htmlFor="member-phone">{__('Telefon', 'resa')}</Label>
									<Input
										id="member-phone"
										type="tel"
										value={form.phone}
										onChange={(e) => updateField('phone', e.target.value)}
										placeholder={__('+49 123 456789', 'resa')}
										style={inputStyles}
									/>
								</div>
							</div>
						</div>

						{/* Standort-Zuordnung Box */}
						{locations.length > 0 && (
							<div style={grayBoxStyles}>
								<p style={{ ...boxTitleStyles, marginBottom: '12px' }}>
									{__('Standort-Zuordnung', 'resa')}
								</p>
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
								>
									{locations.map((location) => (
										<label
											key={location.id}
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '10px',
												padding: '8px 12px',
												backgroundColor: form.locationIds.includes(
													location.id,
												)
													? 'white'
													: 'transparent',
												border: form.locationIds.includes(location.id)
													? '1px solid hsl(214.3 31.8% 91.4%)'
													: '1px solid transparent',
												borderRadius: '6px',
												cursor: 'pointer',
												transition: 'all 150ms',
											}}
										>
											<Checkbox
												checked={form.locationIds.includes(location.id)}
												onCheckedChange={() => toggleLocation(location.id)}
											/>
											<span
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '6px',
													fontSize: '14px',
													color: '#1e303a',
												}}
											>
												<MapPin
													style={{
														width: '14px',
														height: '14px',
														color: 'hsl(215.4 16.3% 46.9%)',
													}}
												/>
												{location.name}
											</span>
										</label>
									))}
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Actions */}
			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
				<OutlineButton onClick={onCancel}>{__('Abbrechen', 'resa')}</OutlineButton>
				<PrimaryButton type="submit" disabled={!isValid || isSaving}>
					{isSaving && <Spinner style={{ width: '14px', height: '14px' }} />}
					{isEditing ? __('Speichern', 'resa') : __('Erstellen', 'resa')}
				</PrimaryButton>
			</div>
		</form>
	);
}

/**
 * WordPress Media Library frame type.
 */
interface WpMediaFrame {
	open: () => void;
	on: (event: string, callback: () => void) => void;
	state: () => {
		get: (key: string) => {
			first: () => {
				toJSON: () => { id: number; url: string };
			};
		};
	};
}

/**
 * Open WordPress Media Library and return selected image.
 */
function openMediaLibrary(
	title: string,
	buttonText: string,
): Promise<{ id: number; url: string } | null> {
	return new Promise((resolve) => {
		let resolved = false;

		// @ts-expect-error wp.media is available via wp_enqueue_media()
		const frame: WpMediaFrame = wp.media({
			title,
			button: { text: buttonText },
			multiple: false,
			library: { type: 'image' },
		});

		frame.on('select', () => {
			if (resolved) return;
			resolved = true;
			const attachment = frame.state().get('selection').first().toJSON();
			resolve({ id: attachment.id, url: attachment.url });
		});

		// close fires BEFORE select in WP Media, so we need a small delay
		frame.on('close', () => {
			setTimeout(() => {
				if (resolved) return;
				resolved = true;
				resolve(null);
			}, 100);
		});

		frame.open();
	});
}

/**
 * PDF tab — loads settings and renders BaseLayoutTab.
 */
function PdfTab() {
	const { data: pdfSettings, isLoading, error } = usePdfSettings();
	const { data: brandingData } = useBranding();
	const { data: teamMembers } = useTeamMembers();

	if (isLoading) {
		return <LoadingState message={__('Lade PDF-Einstellungen...', 'resa')} />;
	}

	if (error) {
		return (
			<Alert variant="destructive">
				<AlertTitle>{__('Fehler beim Laden', 'resa')}</AlertTitle>
				<AlertDescription>
					{__('Die PDF-Einstellungen konnten nicht geladen werden.', 'resa')}
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<BaseLayoutTab
			initialData={pdfSettings}
			logoUrl={brandingData?.logoUrl}
			teamMembers={teamMembers ?? []}
		/>
	);
}

/**
 * Email tab — template list with editor view.
 */
function EmailTab({ onEditTemplate }: { onEditTemplate: (id: string) => void }) {
	return <TemplatesTab onEdit={onEditTemplate} />;
}

/**
 * Maps Tab — map provider and tile style settings.
 */
function MapsTab() {
	const { data: mapSettings, isLoading, error } = useMapSettings();

	if (isLoading) {
		return <LoadingState message={__('Lade Karteneinstellungen...', 'resa')} />;
	}

	if (error) {
		return (
			<Alert variant="destructive">
				<AlertTitle>{__('Fehler beim Laden', 'resa')}</AlertTitle>
				<AlertDescription>
					{__('Die Karteneinstellungen konnten nicht geladen werden.', 'resa')}
				</AlertDescription>
			</Alert>
		);
	}

	return <MapsForm initialData={mapSettings} />;
}

/** Tile style options with labels. */
const TILE_STYLE_OPTIONS: { value: TileStyle; label: string; description: string }[] = [
	{
		value: 'standard',
		label: __('Standard', 'resa'),
		description: __('OpenStreetMap Standard-Kacheln', 'resa'),
	},
	{
		value: 'minimal',
		label: __('Minimal', 'resa'),
		description: __('Helle, dezente CartoDB Positron Kacheln', 'resa'),
	},
	{
		value: 'dark',
		label: __('Dunkel', 'resa'),
		description: __('Dunkle CartoDB Dark Matter Kacheln', 'resa'),
	},
];

/** Zoom level options. */
const ZOOM_OPTIONS = [
	{ value: 5, label: __('Land', 'resa') },
	{ value: 8, label: __('Region', 'resa') },
	{ value: 10, label: __('Großraum', 'resa') },
	{ value: 12, label: __('Stadt', 'resa') },
	{ value: 13, label: __('Stadtteil', 'resa') },
	{ value: 15, label: __('Viertel', 'resa') },
	{ value: 17, label: __('Straße', 'resa') },
];

/** Styles for provider radio options */
const providerOptionStyles = (isSelected: boolean, isDisabled: boolean): React.CSSProperties => ({
	display: 'flex',
	alignItems: 'flex-start',
	gap: '12px',
	padding: '12px',
	borderRadius: '8px',
	cursor: isDisabled ? 'not-allowed' : 'pointer',
	border: isSelected ? '2px solid #a9e43f' : '1px solid hsl(214.3 31.8% 91.4%)',
	backgroundColor: isSelected ? 'white' : 'transparent',
	opacity: isDisabled ? 0.6 : 1,
	transition: 'all 150ms',
});

const selectStyles: React.CSSProperties = {
	display: 'block',
	width: '100%',
	height: '36px',
	padding: '0 12px',
	fontSize: '14px',
	borderRadius: '6px',
	border: '1px solid hsl(214.3 31.8% 78%)',
	backgroundColor: 'white',
	color: '#1e303a',
	boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
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

function MapsForm({ initialData }: { initialData: MapSettings | undefined }) {
	const saveMutation = useSaveMapSettings();

	const [form, setForm] = useState<MapSettings>(
		initialData ?? {
			provider: 'osm',
			tileStyle: 'minimal',
			defaultZoom: 13,
			googleApiKey: '',
			scrollZoom: false,
			canUseGoogle: false,
			canSelectStyle: false,
		},
	);
	const [isDirty, setIsDirty] = useState(false);

	const updateField = <K extends keyof MapSettings>(key: K, value: MapSettings[K]) => {
		setForm((prev) => ({ ...prev, [key]: value }));
		setIsDirty(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		await saveMutation.mutateAsync({
			provider: form.provider,
			tileStyle: form.tileStyle,
			defaultZoom: form.defaultZoom,
			googleApiKey: form.googleApiKey,
			scrollZoom: form.scrollZoom,
		});

		setIsDirty(false);
	};

	return (
		<form
			onSubmit={handleSubmit}
			style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
		>
			{/* Card 1: Kartenanbieter */}
			<Card style={cardStyles}>
				<CardContent style={{ padding: '20px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{/* Card Header */}
						<div>
							<h2 style={sectionTitleStyles}>{__('Kartenanbieter', 'resa')}</h2>
							<p style={sectionDescStyles}>
								{__(
									'Wähle den Kartendienst für die Standort-Anzeige in deinen Smart Assets.',
									'resa',
								)}
							</p>
						</div>

						{/* Provider Options Box */}
						<div style={grayBoxStyles}>
							<p style={{ ...boxTitleStyles, marginBottom: '12px' }}>
								{__('Anbieter auswählen', 'resa')}
							</p>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
								{/* OSM Option */}
								<label style={providerOptionStyles(form.provider === 'osm', false)}>
									<input
										type="radio"
										name="provider"
										value="osm"
										checked={form.provider === 'osm'}
										onChange={() => updateField('provider', 'osm')}
										style={{ marginTop: '2px' }}
									/>
									<div style={{ flex: 1 }}>
										<p
											style={{
												margin: 0,
												fontSize: '14px',
												fontWeight: 500,
												color: '#1e303a',
											}}
										>
											{__('OpenStreetMap', 'resa')}
										</p>
										<p style={fieldDescStyles}>
											{__(
												'Kostenlos, kein API-Key nötig, DSGVO-freundlich.',
												'resa',
											)}
										</p>
									</div>
								</label>

								{/* Google Maps Option */}
								<label
									style={providerOptionStyles(
										form.provider === 'google',
										!form.canUseGoogle,
									)}
								>
									<input
										type="radio"
										name="provider"
										value="google"
										checked={form.provider === 'google'}
										onChange={() =>
											form.canUseGoogle && updateField('provider', 'google')
										}
										disabled={!form.canUseGoogle}
										style={{ marginTop: '2px' }}
									/>
									<div style={{ flex: 1 }}>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
											}}
										>
											<p
												style={{
													margin: 0,
													fontSize: '14px',
													fontWeight: 500,
													color: '#1e303a',
												}}
											>
												{__('Google Maps', 'resa')}
											</p>
											{!form.canUseGoogle && (
												<Badge
													variant="secondary"
													style={{ fontSize: '10px' }}
												>
													PRO
												</Badge>
											)}
										</div>
										<p style={fieldDescStyles}>
											{__('Google Maps API mit Places Autocomplete.', 'resa')}
										</p>
									</div>
								</label>
							</div>
						</div>

						{/* Google API Key (conditional) */}
						{form.provider === 'google' && form.canUseGoogle && (
							<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
								<Label htmlFor="google-api-key">
									{__('Google API-Key', 'resa')}
								</Label>
								<Input
									id="google-api-key"
									type="password"
									value={form.googleApiKey}
									onChange={(e) => updateField('googleApiKey', e.target.value)}
									placeholder="AIzaSy..."
									style={inputStyles}
								/>
								<p style={fieldDescStyles}>
									{__(
										'Google Cloud Console → APIs & Services → Credentials',
										'resa',
									)}
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Card 2: Darstellung */}
			<Card style={cardStyles}>
				<CardContent style={{ padding: '20px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{/* Card Header */}
						<div>
							<h2 style={sectionTitleStyles}>{__('Darstellung', 'resa')}</h2>
							<p style={sectionDescStyles}>
								{__('Passe das Aussehen und Verhalten der Karten an.', 'resa')}
							</p>
						</div>

						{/* Kachel-Stil + Zoom Box */}
						<div style={grayBoxStyles}>
							<p style={{ ...boxTitleStyles, marginBottom: '12px' }}>
								{__('Karten-Einstellungen', 'resa')}
							</p>
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
									<Label htmlFor="tile-style">
										<span
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '6px',
											}}
										>
											{__('Kachel-Stil', 'resa')}
											{!form.canSelectStyle && (
												<Badge
													variant="secondary"
													style={{ fontSize: '10px' }}
												>
													PRO
												</Badge>
											)}
										</span>
									</Label>
									<select
										id="tile-style"
										value={form.tileStyle}
										onChange={(e) =>
											updateField('tileStyle', e.target.value as TileStyle)
										}
										disabled={!form.canSelectStyle}
										style={{
											...selectStyles,
											opacity: form.canSelectStyle ? 1 : 0.6,
											cursor: form.canSelectStyle ? 'pointer' : 'not-allowed',
										}}
									>
										{TILE_STYLE_OPTIONS.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
									{!form.canSelectStyle && (
										<p style={fieldDescStyles}>
											{__(
												'Im Free-Plan wird der minimale Stil verwendet.',
												'resa',
											)}
										</p>
									)}
								</div>
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
								>
									<Label htmlFor="default-zoom">
										{__('Standard-Zoom', 'resa')}
									</Label>
									<select
										id="default-zoom"
										value={form.defaultZoom}
										onChange={(e) =>
											updateField('defaultZoom', parseInt(e.target.value, 10))
										}
										style={selectStyles}
									>
										{ZOOM_OPTIONS.map((option) => (
											<option key={option.value} value={option.value}>
												{option.value} — {option.label}
											</option>
										))}
									</select>
								</div>
							</div>
						</div>

						{/* Scroll Zoom Toggle */}
						<div style={toggleBoxStyles}>
							<div>
								<p style={boxTitleStyles}>{__('Scroll-Zoom aktivieren', 'resa')}</p>
								<p style={fieldDescStyles}>
									{__('Erlaubt Zoomen mit dem Mausrad auf der Karte.', 'resa')}
								</p>
							</div>
							<Switch
								checked={form.scrollZoom}
								onCheckedChange={(checked) => updateField('scrollZoom', checked)}
							/>
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
	);
}
