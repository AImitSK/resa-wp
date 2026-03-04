/**
 * Settings page — agent data, branding, license, GDPR.
 *
 * Tab-based navigation with Maklerdaten form as first active tab.
 */

import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { User, Users, X, Image, Plus, Pencil, Trash2, MapPin, Shield } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

type SettingsTab = 'agent' | 'team' | 'branding' | 'maps' | 'tracking' | 'license' | 'gdpr';

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
						{__('Maklerdaten', 'resa')}
					</TabsTrigger>
					<TabsTrigger value="team" style={tabStyle(activeTab === 'team')}>
						{__('Team', 'resa')}
					</TabsTrigger>
					<TabsTrigger value="branding" style={tabStyle(activeTab === 'branding')}>
						{__('Branding', 'resa')}
					</TabsTrigger>
					<TabsTrigger value="maps" style={tabStyle(activeTab === 'maps')}>
						{__('Karten', 'resa')}
					</TabsTrigger>
					<TabsTrigger value="tracking" style={tabStyle(activeTab === 'tracking')}>
						{__('Tracking', 'resa')}
					</TabsTrigger>
					<TabsTrigger value="license" style={tabStyle(activeTab === 'license')}>
						{__('Lizenz', 'resa')}
					</TabsTrigger>
					<TabsTrigger value="gdpr" style={tabStyle(activeTab === 'gdpr')}>
						{__('Datenschutz', 'resa')}
					</TabsTrigger>
				</TabsList>
			</Tabs>

			{/* Tab Content */}
			{activeTab === 'agent' && <AgentDataTab />}
			{activeTab === 'team' && <TeamTab />}
			{activeTab === 'branding' && <BrandingTab />}
			{activeTab === 'maps' && <MapsTab />}
			{activeTab === 'tracking' && <TrackingTab />}
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
		<form
			onSubmit={handleSubmit}
			style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
		>
			{/* Persönliche Daten */}
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
							{__('Persönliche Daten', 'resa')}
						</h3>
						<div className="resa-grid resa-grid-cols-2 resa-gap-4">
							<div className="resa-space-y-2">
								<Label htmlFor="agent-name">{__('Name', 'resa')} *</Label>
								<Input
									id="agent-name"
									value={form.name}
									onChange={(e) => updateField('name', e.target.value)}
									placeholder={__('Max Mustermann', 'resa')}
									required
								/>
							</div>
							<div className="resa-space-y-2">
								<Label htmlFor="agent-company">{__('Firma', 'resa')}</Label>
								<Input
									id="agent-company"
									value={form.company}
									onChange={(e) => updateField('company', e.target.value)}
									placeholder={__('Mustermann Immobilien GmbH', 'resa')}
								/>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Kontaktdaten */}
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
							{__('Kontaktdaten', 'resa')}
						</h3>
						<div className="resa-grid resa-grid-cols-2 resa-gap-4">
							<div className="resa-space-y-2">
								<Label htmlFor="agent-email">{__('E-Mail', 'resa')} *</Label>
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
								<Label htmlFor="agent-phone">{__('Telefon', 'resa')}</Label>
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
				</CardContent>
			</Card>

			{/* Online-Präsenz */}
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
							{__('Online-Präsenz', 'resa')}
						</h3>
						<div className="resa-grid resa-grid-cols-2 resa-gap-4">
							<div className="resa-space-y-2">
								<Label htmlFor="agent-website">{__('Website', 'resa')}</Label>
								<Input
									id="agent-website"
									type="url"
									value={form.website}
									onChange={(e) => updateField('website', e.target.value)}
									placeholder={__('https://mustermann-immo.de', 'resa')}
								/>
							</div>
							<div className="resa-space-y-2">
								<Label htmlFor="agent-imprint">{__('Impressum-URL', 'resa')}</Label>
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
				</CardContent>
			</Card>

			{/* Info + Save */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<p style={{ margin: 0, fontSize: '12px', color: 'hsl(215.4 16.3% 46.9%)' }}>
					{__(
						'Diese Daten werden in PDF-Dokumenten, E-Mails und auf der Ergebnisseite angezeigt.',
						'resa',
					)}
				</p>
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
		return (
			<div className="resa-flex resa-items-center resa-justify-center resa-gap-2 resa-py-12">
				<Spinner className="resa-size-5" />
				<span className="resa-text-muted-foreground">{__('Lade Team...', 'resa')}</span>
			</div>
		);
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
				<Button
					onClick={() => setView('create')}
					style={{ backgroundColor: '#a9e43f', color: '#1e303a', border: 'none' }}
				>
					<Plus style={{ width: '16px', height: '16px', marginRight: '6px' }} />
					{__('Ansprechpartner hinzufügen', 'resa')}
				</Button>
			</div>

			{/* Team Members List */}
			{!members || members.length === 0 ? (
				<div
					className="resa-py-12 resa-text-center"
					style={{
						border: '2px dashed hsl(214.3 31.8% 91.4%)',
						borderRadius: '8px',
					}}
				>
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
						<Users
							style={{
								width: '24px',
								height: '24px',
								color: 'hsl(215.4 16.3% 46.9%)',
							}}
						/>
					</div>
					<h3 style={{ fontWeight: 600, marginBottom: '8px', color: '#1e303a' }}>
						{__('Noch keine Ansprechpartner', 'resa')}
					</h3>
					<p style={{ color: 'hsl(215.4 16.3% 46.9%)', marginBottom: '16px' }}>
						{__(
							'Füge Ansprechpartner hinzu, die in PDFs und auf Ergebnisseiten angezeigt werden.',
							'resa',
						)}
					</p>
					<Button
						onClick={() => setView('create')}
						style={{ backgroundColor: '#a9e43f', color: '#1e303a', border: 'none' }}
					>
						<Plus style={{ width: '16px', height: '16px', marginRight: '6px' }} />
						{__('Ersten Ansprechpartner anlegen', 'resa')}
					</Button>
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
			{/* Header */}
			<div>
				<h3 className="resa-text-lg resa-font-semibold" style={{ margin: 0 }}>
					{isEditing
						? __('Ansprechpartner bearbeiten', 'resa')
						: __('Neuer Ansprechpartner', 'resa')}
				</h3>
				<p
					className="resa-text-sm resa-text-muted-foreground"
					style={{ margin: 0, marginTop: '2px' }}
				>
					{__('Kontaktdaten und Standort-Zuordnung festlegen.', 'resa')}
				</p>
			</div>

			{/* Person Card — Photo + Name + Position */}
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
							{__('Person', 'resa')}
						</h3>

						{/* Photo */}
						{form.photoUrl ? (
							<div className="resa-flex resa-items-center resa-gap-4">
								<img
									src={form.photoUrl}
									alt={form.name}
									style={{
										width: '64px',
										height: '64px',
										borderRadius: '50%',
										objectFit: 'cover',
										border: '1px solid hsl(214.3 31.8% 91.4%)',
									}}
								/>
								<div className="resa-flex resa-gap-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleSelectPhoto}
									>
										{__('Ändern', 'resa')}
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => updateField('photoUrl', null)}
										style={{ color: 'hsl(0 84.2% 60.2%)' }}
									>
										<X
											style={{
												width: '14px',
												height: '14px',
												marginRight: '4px',
											}}
										/>
										{__('Entfernen', 'resa')}
									</Button>
								</div>
							</div>
						) : (
							<button
								type="button"
								onClick={handleSelectPhoto}
								style={{
									width: '64px',
									height: '64px',
									borderRadius: '50%',
									border: '2px dashed hsl(214.3 31.8% 91.4%)',
									backgroundColor: 'hsl(210 40% 98%)',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									transition: 'border-color 150ms',
								}}
								onMouseEnter={(e) =>
									(e.currentTarget.style.borderColor = 'hsl(215.4 16.3% 46.9%)')
								}
								onMouseLeave={(e) =>
									(e.currentTarget.style.borderColor = 'hsl(214.3 31.8% 91.4%)')
								}
							>
								<Image
									style={{
										width: '20px',
										height: '20px',
										color: 'hsl(215.4 16.3% 46.9%)',
									}}
								/>
							</button>
						)}

						<Separator />

						{/* Name + Position */}
						<div className="resa-grid resa-grid-cols-2 resa-gap-4">
							<div className="resa-space-y-2">
								<Label htmlFor="member-name">{__('Name', 'resa')} *</Label>
								<Input
									id="member-name"
									value={form.name}
									onChange={(e) => updateField('name', e.target.value)}
									placeholder={__('Max Mustermann', 'resa')}
									required
								/>
							</div>
							<div className="resa-space-y-2">
								<Label htmlFor="member-position">
									{__('Position/Funktion', 'resa')}
								</Label>
								<Input
									id="member-position"
									value={form.position}
									onChange={(e) => updateField('position', e.target.value)}
									placeholder={__('Geschäftsführer', 'resa')}
								/>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Kontakt Card */}
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
							{__('Kontaktdaten', 'resa')}
						</h3>
						<div className="resa-grid resa-grid-cols-2 resa-gap-4">
							<div className="resa-space-y-2">
								<Label htmlFor="member-email">{__('E-Mail', 'resa')} *</Label>
								<Input
									id="member-email"
									type="email"
									value={form.email}
									onChange={(e) => updateField('email', e.target.value)}
									placeholder={__('max@mustermann-immo.de', 'resa')}
									required
								/>
							</div>
							<div className="resa-space-y-2">
								<Label htmlFor="member-phone">{__('Telefon', 'resa')}</Label>
								<Input
									id="member-phone"
									type="tel"
									value={form.phone}
									onChange={(e) => updateField('phone', e.target.value)}
									placeholder={__('+49 123 456789', 'resa')}
								/>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Standort-Zuordnung Card */}
			{locations.length > 0 && (
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
								{__('Standort-Zuordnung', 'resa')}
							</h3>
							<div className="resa-space-y-2">
								{locations.map((location) => (
									<label
										key={location.id}
										className="resa-flex resa-items-center resa-gap-3 resa-py-1.5 resa-cursor-pointer"
									>
										<Checkbox
											checked={form.locationIds.includes(location.id)}
											onCheckedChange={() => toggleLocation(location.id)}
										/>
										<span className="resa-flex resa-items-center resa-gap-1.5 resa-text-sm">
											<MapPin
												style={{
													width: '12px',
													height: '12px',
													color: 'hsl(215.4 16.3% 46.9%)',
												}}
											/>
											{location.name}
										</span>
									</label>
								))}
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Actions */}
			<div className="resa-flex resa-justify-end resa-gap-3">
				<Button type="button" variant="outline" onClick={onCancel}>
					{__('Abbrechen', 'resa')}
				</Button>
				<Button
					type="submit"
					disabled={!isValid || isSaving}
					style={{
						backgroundColor: isValid ? '#a9e43f' : 'hsl(210 40% 96.1%)',
						color: '#1e303a',
						border: 'none',
					}}
				>
					{isEditing ? __('Speichern', 'resa') : __('Erstellen', 'resa')}
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
		<form
			onSubmit={handleSubmit}
			style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
		>
			{/* Logo Card */}
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
										<X
											style={{
												width: '14px',
												height: '14px',
												marginRight: '4px',
											}}
										/>
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
				</CardContent>
			</Card>

			{/* Farben Card */}
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
							{__('Farben', 'resa')}
						</h3>
						<div
							className="resa-grid resa-grid-cols-2 resa-gap-4"
							style={{ maxWidth: '400px' }}
						>
							<div className="resa-space-y-2">
								<Label htmlFor="primary-color">{__('Primärfarbe', 'resa')}</Label>
								<div className="resa-flex resa-items-center resa-gap-2">
									<input
										id="primary-color"
										type="color"
										value={form.primaryColor}
										onChange={(e) =>
											updateField('primaryColor', e.target.value)
										}
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
										onChange={(e) =>
											updateField('primaryColor', e.target.value)
										}
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
									{__('Sekundärfarbe', 'resa')}
								</Label>
								<div className="resa-flex resa-items-center resa-gap-2">
									<input
										id="secondary-color"
										type="color"
										value={form.secondaryColor}
										onChange={(e) =>
											updateField('secondaryColor', e.target.value)
										}
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
										onChange={(e) =>
											updateField('secondaryColor', e.target.value)
										}
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
				</CardContent>
			</Card>

			{/* Branding-Hinweis Card */}
			<Card>
				<CardContent style={{ padding: '20px' }}>
					<div className="resa-flex resa-items-center resa-justify-between">
						<div>
							<h3
								style={{
									margin: 0,
									fontSize: '14px',
									fontWeight: 600,
									color: '#1e303a',
								}}
							>
								{__('"Powered by RESA" anzeigen', 'resa')}
							</h3>
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
	);
}

/**
 * Maps Tab — map provider and tile style settings.
 */
function MapsTab() {
	const { data: mapSettings, isLoading, error } = useMapSettings();

	if (isLoading) {
		return (
			<div className="resa-flex resa-items-center resa-justify-center resa-gap-2 resa-py-12">
				<Spinner className="resa-size-5" />
				<span className="resa-text-muted-foreground">
					{__('Lade Karteneinstellungen...', 'resa')}
				</span>
			</div>
		);
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
			{/* Kartenanbieter Card */}
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
							{__('Kartenanbieter', 'resa')}
						</h3>
						<div className="resa-space-y-3" style={{ maxWidth: '400px' }}>
							{/* OSM Option */}
							<label
								className="resa-flex resa-items-start resa-gap-3 resa-p-3 resa-rounded-lg resa-cursor-pointer"
								style={{
									border:
										form.provider === 'osm'
											? '2px solid #a9e43f'
											: '1px solid hsl(214.3 31.8% 91.4%)',
									backgroundColor:
										form.provider === 'osm'
											? 'hsl(210 40% 98%)'
											: 'transparent',
								}}
							>
								<input
									type="radio"
									name="provider"
									value="osm"
									checked={form.provider === 'osm'}
									onChange={() => updateField('provider', 'osm')}
									className="resa-mt-1"
								/>
								<div>
									<span className="resa-font-medium">
										{__('OpenStreetMap', 'resa')}
									</span>
									<p
										className="resa-text-sm resa-text-muted-foreground"
										style={{ margin: 0, marginTop: '2px' }}
									>
										{__(
											'Kostenlos, kein API-Key nötig, DSGVO-freundlich.',
											'resa',
										)}
									</p>
								</div>
							</label>

							{/* Google Maps Option */}
							<label
								className="resa-flex resa-items-start resa-gap-3 resa-p-3 resa-rounded-lg"
								style={{
									border:
										form.provider === 'google'
											? '2px solid #a9e43f'
											: '1px solid hsl(214.3 31.8% 91.4%)',
									backgroundColor:
										form.provider === 'google'
											? 'hsl(210 40% 98%)'
											: 'transparent',
									opacity: form.canUseGoogle ? 1 : 0.6,
									cursor: form.canUseGoogle ? 'pointer' : 'not-allowed',
								}}
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
									className="resa-mt-1"
								/>
								<div className="resa-flex-1">
									<div className="resa-flex resa-items-center resa-gap-2">
										<span className="resa-font-medium">
											{__('Google Maps', 'resa')}
										</span>
										{!form.canUseGoogle && (
											<Badge variant="secondary" style={{ fontSize: '10px' }}>
												PRO
											</Badge>
										)}
									</div>
									<p
										className="resa-text-sm resa-text-muted-foreground"
										style={{ margin: 0, marginTop: '2px' }}
									>
										{__('Google Maps API mit Places Autocomplete.', 'resa')}
									</p>
								</div>
							</label>
						</div>

						{/* Google API Key (conditional) */}
						{form.provider === 'google' && form.canUseGoogle && (
							<>
								<Separator />
								<div className="resa-space-y-2" style={{ maxWidth: '400px' }}>
									<Label htmlFor="google-api-key">{__('API-Key', 'resa')}</Label>
									<Input
										id="google-api-key"
										type="password"
										value={form.googleApiKey}
										onChange={(e) =>
											updateField('googleApiKey', e.target.value)
										}
										placeholder="AIzaSy..."
									/>
									<p
										className="resa-text-xs resa-text-muted-foreground"
										style={{ margin: 0 }}
									>
										{__(
											'Google Cloud Console → APIs & Services → Credentials',
											'resa',
										)}
									</p>
								</div>
							</>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Darstellung Card */}
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
							{__('Darstellung', 'resa')}
						</h3>

						{/* Tile Style + Zoom side by side */}
						<div
							className="resa-grid resa-grid-cols-2 resa-gap-4"
							style={{ maxWidth: '400px' }}
						>
							<div className="resa-space-y-2">
								<Label htmlFor="tile-style">
									<span className="resa-flex resa-items-center resa-gap-1.5">
										{__('Kachel-Stil', 'resa')}
										{!form.canSelectStyle && (
											<Badge variant="secondary" style={{ fontSize: '10px' }}>
												PRO
											</Badge>
										)}
									</span>
								</Label>
								<select
									id="tile-style"
									className="resa-flex resa-h-9 resa-w-full resa-rounded-md resa-border resa-border-input resa-bg-transparent resa-px-3 resa-py-1 resa-text-sm resa-shadow-sm resa-transition-colors focus:resa-outline-none focus:resa-ring-1 focus:resa-ring-ring"
									value={form.tileStyle}
									onChange={(e) =>
										updateField('tileStyle', e.target.value as TileStyle)
									}
									disabled={!form.canSelectStyle}
								>
									{TILE_STYLE_OPTIONS.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label} — {option.description}
										</option>
									))}
								</select>
								{!form.canSelectStyle && (
									<p
										className="resa-text-xs resa-text-muted-foreground"
										style={{ margin: 0 }}
									>
										{__(
											'Im Free-Plan wird der minimale Stil verwendet.',
											'resa',
										)}
									</p>
								)}
							</div>
							<div className="resa-space-y-2">
								<Label htmlFor="default-zoom">{__('Standard-Zoom', 'resa')}</Label>
								<select
									id="default-zoom"
									className="resa-flex resa-h-9 resa-w-full resa-rounded-md resa-border resa-border-input resa-bg-transparent resa-px-3 resa-py-1 resa-text-sm resa-shadow-sm resa-transition-colors focus:resa-outline-none focus:resa-ring-1 focus:resa-ring-ring"
									value={form.defaultZoom}
									onChange={(e) =>
										updateField('defaultZoom', parseInt(e.target.value, 10))
									}
								>
									{ZOOM_OPTIONS.map((option) => (
										<option key={option.value} value={option.value}>
											{option.value} — {option.label}
										</option>
									))}
								</select>
							</div>
						</div>

						<Separator />

						{/* Scroll Zoom Toggle */}
						<div
							className="resa-flex resa-items-center resa-justify-between"
							style={{
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
									{__('Scroll-Zoom aktivieren', 'resa')}
								</p>
								<p
									style={{
										margin: '2px 0 0',
										fontSize: '12px',
										color: 'hsl(215.4 16.3% 46.9%)',
									}}
								>
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
	);
}

/**
 * License Tab — shows current plan info with placeholder for account management.
 */
function LicenseTab() {
	return (
		<Card>
			<CardContent style={{ padding: '20px' }}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
					<h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1e303a' }}>
						{__('Lizenzinformationen', 'resa')}
					</h3>
					<div className="resa-grid resa-grid-cols-2 md:resa-grid-cols-4 resa-gap-4">
						<div className="resa-space-y-1">
							<p
								className="resa-text-sm resa-text-muted-foreground"
								style={{ margin: 0 }}
							>
								{__('Version', 'resa')}
							</p>
							<p className="resa-font-medium" style={{ margin: 0 }}>
								{window.resaAdmin?.version ?? '—'}
							</p>
						</div>
						<div className="resa-space-y-1">
							<p
								className="resa-text-sm resa-text-muted-foreground"
								style={{ margin: 0 }}
							>
								{__('Plan', 'resa')}
							</p>
							<div className="resa-flex resa-items-center resa-gap-2">
								<p className="resa-font-medium" style={{ margin: 0 }}>
									{__('Free', 'resa')}
								</p>
								<Badge variant="secondary">{__('Aktiv', 'resa')}</Badge>
							</div>
						</div>
						<div className="resa-space-y-1">
							<p
								className="resa-text-sm resa-text-muted-foreground"
								style={{ margin: 0 }}
							>
								{__('Aktive Module', 'resa')}
							</p>
							<p className="resa-font-medium" style={{ margin: 0 }}>
								2 / 2
							</p>
						</div>
						<div className="resa-space-y-1">
							<p
								className="resa-text-sm resa-text-muted-foreground"
								style={{ margin: 0 }}
							>
								{__('Leads diesen Monat', 'resa')}
							</p>
							<p className="resa-font-medium" style={{ margin: 0 }}>
								24 / 50
							</p>
						</div>
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
			<CardContent style={{ padding: '20px' }}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
					<h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1e303a' }}>
						{__('Datenschutz (DSGVO)', 'resa')}
					</h3>
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
						<p style={{ color: 'hsl(215.4 16.3% 46.9%)', margin: 0 }}>
							{__(
								'Datenschutz-Einstellungen werden in einer zukünftigen Version verfügbar sein.',
								'resa',
							)}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
