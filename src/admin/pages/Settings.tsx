/**
 * Settings page — agent data, branding, license, GDPR.
 *
 * Tab-based navigation with Maklerdaten form as first active tab.
 */

import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import {
	User,
	Palette,
	Key,
	Shield,
	Building2,
	Mail,
	Phone,
	Globe,
	FileText,
	X,
	Image,
} from 'lucide-react';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { useAgentData, useSaveAgentData, type AgentData } from '../hooks/useAgentData';
import { useBranding, useSaveBranding, type BrandingSettings } from '../hooks/useBranding';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

type SettingsTab = 'agent' | 'branding' | 'license' | 'gdpr';

export function Settings() {
	const [activeTab, setActiveTab] = useState<SettingsTab>('agent');

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
			description={__('Maklerdaten, Branding, Lizenz und Datenschutz-Einstellungen.', 'resa')}
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
						<User style={{ width: '16px', height: '16px' }} />
						{__('Maklerdaten', 'resa')}
					</TabsTrigger>
					<TabsTrigger value="branding" style={tabStyle(activeTab === 'branding')}>
						<Palette style={{ width: '16px', height: '16px' }} />
						{__('Branding', 'resa')}
					</TabsTrigger>
					<TabsTrigger value="license" style={tabStyle(activeTab === 'license')}>
						<Key style={{ width: '16px', height: '16px' }} />
						{__('Lizenz', 'resa')}
					</TabsTrigger>
					<TabsTrigger value="gdpr" style={tabStyle(activeTab === 'gdpr')}>
						<Shield style={{ width: '16px', height: '16px' }} />
						{__('Datenschutz', 'resa')}
					</TabsTrigger>
				</TabsList>
			</Tabs>

			{/* Tab Content */}
			{activeTab === 'agent' && <AgentDataTab />}
			{activeTab === 'branding' && <BrandingTab />}
			{activeTab === 'license' && <LicenseTab />}
			{activeTab === 'gdpr' && <GdprTab />}
		</AdminPageLayout>
	);
}

/**
 * Agent Data Tab — form for broker/agent information.
 */
function AgentDataTab() {
	const { data: agentData, isLoading, error } = useAgentData();

	if (isLoading) {
		return (
			<div className="resa-flex resa-items-center resa-justify-center resa-gap-2 resa-py-12">
				<Spinner className="resa-size-5" />
				<span className="resa-text-muted-foreground">
					{__('Lade Maklerdaten...', 'resa')}
				</span>
			</div>
		);
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

function AgentDataForm({ initialData }: { initialData: AgentData | undefined }) {
	const saveMutation = useSaveAgentData();

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
	const [isDirty, setIsDirty] = useState(false);

	const updateField = <K extends keyof AgentData>(key: K, value: AgentData[K]) => {
		setForm((prev) => ({ ...prev, [key]: value }));
		setIsDirty(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		await saveMutation.mutateAsync({
			name: form.name,
			email: form.email,
			phone: form.phone,
			company: form.company,
			address: form.address,
			website: form.website,
			imprint_url: form.imprintUrl,
		});

		setIsDirty(false);
	};

	const isValid = form.name.trim() !== '' && form.email.trim() !== '';

	return (
		<form onSubmit={handleSubmit} className="resa-space-y-6">
			{/* Header */}
			<div style={{ marginBottom: '24px' }}>
				<h3 className="resa-text-lg resa-font-semibold" style={{ margin: 0 }}>
					{__('Maklerdaten', 'resa')}
				</h3>
				<p
					className="resa-text-sm resa-text-muted-foreground"
					style={{ margin: 0, marginTop: '2px' }}
				>
					{__(
						'Diese Daten werden in PDF-Dokumenten, E-Mails und auf der Ergebnisseite angezeigt.',
						'resa',
					)}
				</p>
			</div>

			{/* Personal Info */}
			<div className="resa-space-y-4" style={{ marginTop: 0 }}>
				<h3 className="resa-text-sm resa-font-medium resa-text-muted-foreground">
					{__('Persönliche Daten', 'resa')}
				</h3>
				<div className="resa-grid resa-grid-cols-2 resa-gap-4">
					<div className="resa-space-y-2">
						<Label htmlFor="agent-name">
							<span className="resa-flex resa-items-center resa-gap-1.5">
								<User
									style={{
										width: '14px',
										height: '14px',
										color: 'hsl(215.4 16.3% 46.9%)',
									}}
								/>
								{__('Name', 'resa')} *
							</span>
						</Label>
						<Input
							id="agent-name"
							value={form.name}
							onChange={(e) => updateField('name', e.target.value)}
							placeholder={__('Max Mustermann', 'resa')}
							required
						/>
					</div>
					<div className="resa-space-y-2">
						<Label htmlFor="agent-company">
							<span className="resa-flex resa-items-center resa-gap-1.5">
								<Building2
									style={{
										width: '14px',
										height: '14px',
										color: 'hsl(215.4 16.3% 46.9%)',
									}}
								/>
								{__('Firma', 'resa')}
							</span>
						</Label>
						<Input
							id="agent-company"
							value={form.company}
							onChange={(e) => updateField('company', e.target.value)}
							placeholder={__('Mustermann Immobilien GmbH', 'resa')}
						/>
					</div>
				</div>
			</div>

			{/* Contact Info */}
			<div className="resa-space-y-4">
				<h3 className="resa-text-sm resa-font-medium resa-text-muted-foreground">
					{__('Kontaktdaten', 'resa')}
				</h3>
				<div className="resa-grid resa-grid-cols-2 resa-gap-4">
					<div className="resa-space-y-2">
						<Label htmlFor="agent-email">
							<span className="resa-flex resa-items-center resa-gap-1.5">
								<Mail
									style={{
										width: '14px',
										height: '14px',
										color: 'hsl(215.4 16.3% 46.9%)',
									}}
								/>
								{__('E-Mail', 'resa')} *
							</span>
						</Label>
						<Input
							id="agent-email"
							type="email"
							value={form.email}
							onChange={(e) => updateField('email', e.target.value)}
							placeholder={__('max@mustermann-immo.de', 'resa')}
							required
						/>
					</div>
					<div className="resa-space-y-2">
						<Label htmlFor="agent-phone">
							<span className="resa-flex resa-items-center resa-gap-1.5">
								<Phone
									style={{
										width: '14px',
										height: '14px',
										color: 'hsl(215.4 16.3% 46.9%)',
									}}
								/>
								{__('Telefon', 'resa')}
							</span>
						</Label>
						<Input
							id="agent-phone"
							type="tel"
							value={form.phone}
							onChange={(e) => updateField('phone', e.target.value)}
							placeholder={__('+49 123 456789', 'resa')}
						/>
					</div>
				</div>
				<div className="resa-space-y-2">
					<Label htmlFor="agent-address">{__('Adresse', 'resa')}</Label>
					<Textarea
						id="agent-address"
						value={form.address}
						onChange={(e) => updateField('address', e.target.value)}
						placeholder={__('Musterstraße 1\n12345 Musterstadt', 'resa')}
						rows={3}
					/>
				</div>
			</div>

			{/* Online Presence */}
			<div className="resa-space-y-4">
				<h3 className="resa-text-sm resa-font-medium resa-text-muted-foreground">
					{__('Online-Präsenz', 'resa')}
				</h3>
				<div className="resa-grid resa-grid-cols-2 resa-gap-4">
					<div className="resa-space-y-2">
						<Label htmlFor="agent-website">
							<span className="resa-flex resa-items-center resa-gap-1.5">
								<Globe
									style={{
										width: '14px',
										height: '14px',
										color: 'hsl(215.4 16.3% 46.9%)',
									}}
								/>
								{__('Website', 'resa')}
							</span>
						</Label>
						<Input
							id="agent-website"
							type="url"
							value={form.website}
							onChange={(e) => updateField('website', e.target.value)}
							placeholder={__('https://mustermann-immo.de', 'resa')}
						/>
					</div>
					<div className="resa-space-y-2">
						<Label htmlFor="agent-imprint">
							<span className="resa-flex resa-items-center resa-gap-1.5">
								<FileText
									style={{
										width: '14px',
										height: '14px',
										color: 'hsl(215.4 16.3% 46.9%)',
									}}
								/>
								{__('Impressum-URL', 'resa')}
							</span>
						</Label>
						<Input
							id="agent-imprint"
							type="url"
							value={form.imprintUrl}
							onChange={(e) => updateField('imprintUrl', e.target.value)}
							placeholder={__('https://mustermann-immo.de/impressum', 'resa')}
						/>
					</div>
				</div>
			</div>

			{/* Save Button */}
			<div className="resa-flex resa-justify-end resa-pt-4">
				<Button
					type="submit"
					disabled={!isDirty || !isValid || saveMutation.isPending}
					style={{
						backgroundColor: isDirty && isValid ? '#a9e43f' : 'hsl(210 40% 96.1%)',
						color: '#1e303a',
						border: 'none',
					}}
				>
					{__('Speichern', 'resa')}
				</Button>
			</div>
		</form>
	);
}

/**
 * Branding Tab — logo, colors, and powered-by toggle.
 */
function BrandingTab() {
	const { data: branding, isLoading, error } = useBranding();

	if (isLoading) {
		return (
			<div className="resa-flex resa-items-center resa-justify-center resa-gap-2 resa-py-12">
				<Spinner className="resa-size-5" />
				<span className="resa-text-muted-foreground">
					{__('Lade Branding-Einstellungen...', 'resa')}
				</span>
			</div>
		);
	}

	if (error) {
		return (
			<Alert variant="destructive">
				<AlertTitle>{__('Fehler beim Laden', 'resa')}</AlertTitle>
				<AlertDescription>
					{__('Die Branding-Einstellungen konnten nicht geladen werden.', 'resa')}
				</AlertDescription>
			</Alert>
		);
	}

	return <BrandingForm initialData={branding} />;
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

function BrandingForm({ initialData }: { initialData: BrandingSettings | undefined }) {
	const saveMutation = useSaveBranding();

	const [form, setForm] = useState<BrandingSettings>(
		initialData ?? {
			logoUrl: '',
			logoId: 0,
			primaryColor: '#a9e43f',
			secondaryColor: '#1e303a',
			showPoweredBy: true,
		},
	);
	const [isDirty, setIsDirty] = useState(false);

	// Free plan cannot disable "Powered by RESA".
	const isPremium = window.resaAdmin?.features?.plan !== 'free';

	const updateField = <K extends keyof BrandingSettings>(key: K, value: BrandingSettings[K]) => {
		setForm((prev) => ({ ...prev, [key]: value }));
		setIsDirty(true);
	};

	const handleSelectLogo = async () => {
		const result = await openMediaLibrary(
			__('Logo auswählen', 'resa'),
			__('Als Logo verwenden', 'resa'),
		);
		if (result) {
			setForm((prev) => ({ ...prev, logoUrl: result.url, logoId: result.id }));
			setIsDirty(true);
		}
	};

	const handleRemoveLogo = () => {
		setForm((prev) => ({ ...prev, logoUrl: '', logoId: 0 }));
		setIsDirty(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		await saveMutation.mutateAsync({
			logoUrl: form.logoUrl,
			logoId: form.logoId,
			primaryColor: form.primaryColor,
			secondaryColor: form.secondaryColor,
			showPoweredBy: form.showPoweredBy,
		});

		setIsDirty(false);
	};

	return (
		<form onSubmit={handleSubmit} className="resa-space-y-6">
			{/* Header */}
			<div style={{ marginBottom: '24px' }}>
				<h3 className="resa-text-lg resa-font-semibold" style={{ margin: 0 }}>
					{__('Branding & Design', 'resa')}
				</h3>
				<p
					className="resa-text-sm resa-text-muted-foreground"
					style={{ margin: 0, marginTop: '2px' }}
				>
					{__('Logo und Farben für deine Smart Assets.', 'resa')}
				</p>
			</div>

			{/* Logo Section */}
			<div className="resa-space-y-4" style={{ marginTop: 0 }}>
				<h3 className="resa-text-sm resa-font-medium resa-text-muted-foreground">
					{__('Logo', 'resa')}
				</h3>

				{form.logoUrl ? (
					<div className="resa-flex resa-items-start resa-gap-4">
						<div
							style={{
								width: '120px',
								height: '80px',
								borderRadius: '8px',
								border: '1px solid hsl(214.3 31.8% 91.4%)',
								backgroundColor: '#fff',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								overflow: 'hidden',
							}}
						>
							<img
								src={form.logoUrl}
								alt={__('Logo', 'resa')}
								style={{
									maxWidth: '100%',
									maxHeight: '100%',
									objectFit: 'contain',
								}}
							/>
						</div>
						<div className="resa-flex resa-gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleSelectLogo}
							>
								{__('Ändern', 'resa')}
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleRemoveLogo}
								style={{ color: 'hsl(0 84.2% 60.2%)' }}
							>
								<X style={{ width: '14px', height: '14px', marginRight: '4px' }} />
								{__('Entfernen', 'resa')}
							</Button>
						</div>
					</div>
				) : (
					<button
						type="button"
						onClick={handleSelectLogo}
						style={{
							width: '100%',
							maxWidth: '400px',
							padding: '24px',
							border: '2px dashed hsl(214.3 31.8% 91.4%)',
							borderRadius: '8px',
							backgroundColor: 'hsl(210 40% 98%)',
							cursor: 'pointer',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '8px',
							transition: 'border-color 150ms',
						}}
						onMouseEnter={(e) =>
							(e.currentTarget.style.borderColor = 'hsl(215.4 16.3% 46.9%)')
						}
						onMouseLeave={(e) =>
							(e.currentTarget.style.borderColor = 'hsl(214.3 31.8% 91.4%)')
						}
					>
						<div
							style={{
								width: '40px',
								height: '40px',
								borderRadius: '50%',
								backgroundColor: 'hsl(210 40% 96.1%)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<Image
								style={{
									width: '20px',
									height: '20px',
									color: 'hsl(215.4 16.3% 46.9%)',
								}}
							/>
						</div>
						<span style={{ fontWeight: 500, color: '#1e303a' }}>
							{__('Logo auswählen', 'resa')}
						</span>
						<span style={{ fontSize: '12px', color: 'hsl(215.4 16.3% 46.9%)' }}>
							{__('PNG, JPG oder SVG empfohlen', 'resa')}
						</span>
					</button>
				)}
			</div>

			{/* Colors Section */}
			<div className="resa-space-y-4">
				<h3 className="resa-text-sm resa-font-medium resa-text-muted-foreground">
					{__('Farben', 'resa')}
				</h3>
				<div
					className="resa-grid resa-grid-cols-2 resa-gap-4"
					style={{ maxWidth: '400px' }}
				>
					<div className="resa-space-y-2">
						<Label htmlFor="primary-color">
							<span className="resa-flex resa-items-center resa-gap-1.5">
								<Palette
									style={{
										width: '14px',
										height: '14px',
										color: 'hsl(215.4 16.3% 46.9%)',
									}}
								/>
								{__('Primärfarbe', 'resa')}
							</span>
						</Label>
						<div className="resa-flex resa-items-center resa-gap-2">
							<input
								id="primary-color"
								type="color"
								value={form.primaryColor}
								onChange={(e) => updateField('primaryColor', e.target.value)}
								style={{
									width: '40px',
									height: '40px',
									padding: 0,
									border: '1px solid hsl(214.3 31.8% 91.4%)',
									borderRadius: '6px',
									cursor: 'pointer',
									backgroundColor: 'transparent',
								}}
							/>
							<Input
								type="text"
								value={form.primaryColor}
								onChange={(e) => updateField('primaryColor', e.target.value)}
								style={{ width: '100px', fontFamily: 'monospace' }}
								maxLength={7}
							/>
						</div>
						<p
							className="resa-text-xs resa-text-muted-foreground"
							style={{ margin: 0 }}
						>
							{__('Buttons, Akzente, Progress-Bar', 'resa')}
						</p>
					</div>
					<div className="resa-space-y-2">
						<Label htmlFor="secondary-color">
							<span className="resa-flex resa-items-center resa-gap-1.5">
								<Palette
									style={{
										width: '14px',
										height: '14px',
										color: 'hsl(215.4 16.3% 46.9%)',
									}}
								/>
								{__('Sekundärfarbe', 'resa')}
							</span>
						</Label>
						<div className="resa-flex resa-items-center resa-gap-2">
							<input
								id="secondary-color"
								type="color"
								value={form.secondaryColor}
								onChange={(e) => updateField('secondaryColor', e.target.value)}
								style={{
									width: '40px',
									height: '40px',
									padding: 0,
									border: '1px solid hsl(214.3 31.8% 91.4%)',
									borderRadius: '6px',
									cursor: 'pointer',
									backgroundColor: 'transparent',
								}}
							/>
							<Input
								type="text"
								value={form.secondaryColor}
								onChange={(e) => updateField('secondaryColor', e.target.value)}
								style={{ width: '100px', fontFamily: 'monospace' }}
								maxLength={7}
							/>
						</div>
						<p
							className="resa-text-xs resa-text-muted-foreground"
							style={{ margin: 0 }}
						>
							{__('Texte, Hover-States', 'resa')}
						</p>
					</div>
				</div>
			</div>

			{/* Powered by RESA Section */}
			<div className="resa-space-y-4">
				<h3 className="resa-text-sm resa-font-medium resa-text-muted-foreground">
					{__('Branding-Hinweis', 'resa')}
				</h3>
				<div
					className="resa-flex resa-items-center resa-justify-between"
					style={{
						padding: '16px',
						backgroundColor: 'hsl(210 40% 98%)',
						borderRadius: '8px',
						maxWidth: '400px',
					}}
				>
					<div>
						<p style={{ margin: 0, fontWeight: 500, color: '#1e303a' }}>
							{__('"Powered by RESA" anzeigen', 'resa')}
						</p>
						<p
							className="resa-text-sm resa-text-muted-foreground"
							style={{ margin: 0, marginTop: '2px' }}
						>
							{isPremium
								? __('Zeigt den RESA-Hinweis in deinen Smart Assets.', 'resa')
								: __('Im Free-Plan ist der Hinweis immer sichtbar.', 'resa')}
						</p>
					</div>
					<div className="resa-flex resa-items-center resa-gap-2">
						{!isPremium && (
							<Badge variant="secondary" style={{ fontSize: '10px' }}>
								PRO
							</Badge>
						)}
						<Switch
							checked={form.showPoweredBy}
							onCheckedChange={(checked) => updateField('showPoweredBy', checked)}
							disabled={!isPremium}
						/>
					</div>
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
	);
}

/**
 * License Tab — shows current plan info with placeholder for account management.
 */
function LicenseTab() {
	return (
		<Card>
			<div style={{ padding: '24px', paddingBottom: '16px' }}>
				<h3 className="resa-text-lg resa-font-semibold" style={{ margin: 0 }}>
					{__('Lizenzinformationen', 'resa')}
				</h3>
				<p
					className="resa-text-sm resa-text-muted-foreground"
					style={{ margin: 0, marginTop: '2px' }}
				>
					{__('Details zu deinem aktuellen Plan und deiner Installation.', 'resa')}
				</p>
			</div>
			<CardContent>
				<div className="resa-grid resa-grid-cols-2 md:resa-grid-cols-4 resa-gap-4">
					<div className="resa-space-y-1">
						<p className="resa-text-sm resa-text-muted-foreground">
							{__('Version', 'resa')}
						</p>
						<p className="resa-font-medium">{window.resaAdmin?.version ?? '—'}</p>
					</div>
					<div className="resa-space-y-1">
						<p className="resa-text-sm resa-text-muted-foreground">
							{__('Plan', 'resa')}
						</p>
						<div className="resa-flex resa-items-center resa-gap-2">
							<p className="resa-font-medium">{__('Free', 'resa')}</p>
							<Badge variant="secondary">{__('Aktiv', 'resa')}</Badge>
						</div>
					</div>
					<div className="resa-space-y-1">
						<p className="resa-text-sm resa-text-muted-foreground">
							{__('Aktive Module', 'resa')}
						</p>
						<p className="resa-font-medium">2 / 2</p>
					</div>
					<div className="resa-space-y-1">
						<p className="resa-text-sm resa-text-muted-foreground">
							{__('Leads diesen Monat', 'resa')}
						</p>
						<p className="resa-font-medium">24 / 50</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * GDPR Tab — placeholder for privacy settings.
 */
function GdprTab() {
	return (
		<Card>
			<div style={{ padding: '24px', paddingBottom: '16px' }}>
				<h3 className="resa-text-lg resa-font-semibold" style={{ margin: 0 }}>
					{__('Datenschutz (DSGVO)', 'resa')}
				</h3>
				<p
					className="resa-text-sm resa-text-muted-foreground"
					style={{ margin: 0, marginTop: '2px' }}
				>
					{__('Einwilligungstexte, Aufbewahrungsfristen und Datenlöschung.', 'resa')}
				</p>
			</div>
			<CardContent>
				<div className="resa-py-12 resa-text-center">
					<div
						style={{
							width: '48px',
							height: '48px',
							margin: '0 auto 16px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: '50%',
							backgroundColor: 'hsl(210 40% 96.1%)',
						}}
					>
						<Shield
							style={{
								width: '24px',
								height: '24px',
								color: 'hsl(215.4 16.3% 46.9%)',
							}}
						/>
					</div>
					<h3 style={{ fontWeight: 600, marginBottom: '8px', color: '#1e303a' }}>
						{__('Kommt bald', 'resa')}
					</h3>
					<p style={{ color: 'hsl(215.4 16.3% 46.9%)' }}>
						{__(
							'Datenschutz-Einstellungen werden in einer zukünftigen Version verfügbar sein.',
							'resa',
						)}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
