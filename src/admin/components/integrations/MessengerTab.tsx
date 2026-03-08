/**
 * Messenger tab — CRUD UI for messenger notification connections.
 *
 * Allows creating, editing, testing, toggling, and deleting messenger
 * connections for Slack, Microsoft Teams, and Discord.
 * Limited to 5 connections. Premium-only (gate is handled at page level).
 */

import { useState, type ReactNode } from 'react';
import { __ } from '@wordpress/i18n';
import { Plus, Pencil, Trash2, Send, MoreHorizontal } from 'lucide-react';

import {
	useMessengers,
	useCreateMessenger,
	useUpdateMessenger,
	useDeleteMessenger,
	useTestMessenger,
} from '../../hooks/useMessengers';
import type { MessengerConfig, MessengerFormData, MessengerPlatform } from '../../types';

import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '../LoadingState';
import { toast } from '../../lib/toast';

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

function OutlineButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<Button
			type="button"
			size="sm"
			onClick={onClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				backgroundColor: isHovered ? 'hsl(210 40% 96.1%)' : 'white',
				color: '#1e303a',
				border: '1px solid #e8e8e8',
				boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
				gap: '6px',
			}}
		>
			{children}
		</Button>
	);
}

const MAX_MESSENGERS = 5;

const PLATFORMS: { value: MessengerPlatform; label: string }[] = [
	{ value: 'slack', label: 'Slack' },
	{ value: 'teams', label: 'Teams' },
	{ value: 'discord', label: 'Discord' },
];

const PLATFORM_PLACEHOLDERS: Record<MessengerPlatform, string> = {
	slack: 'https://hooks.slack.com/services/T.../B.../xxx',
	teams: 'https://xxx.webhook.office.com/webhookb2/...',
	discord: 'https://discord.com/api/webhooks/123/abc...',
};

const PLATFORM_HELP: Record<MessengerPlatform, string> = {
	slack: 'Apps & Integrationen \u2192 Incoming Webhooks \u2192 Add to Slack',
	teams: 'Kanal \u2192 \u22EF \u2192 Connectors \u2192 Incoming Webhook konfigurieren',
	discord: 'Kanal-Einstellungen \u2192 Integrationen \u2192 Webhooks \u2192 Neuer Webhook',
};

function platformBadgeStyle(platform: MessengerPlatform): React.CSSProperties {
	const colors: Record<MessengerPlatform, string> = {
		slack: '#611f69',
		teams: '#464EB8',
		discord: '#5865F2',
	};
	return {
		borderColor: colors[platform],
		color: colors[platform],
	};
}

export function MessengerTab() {
	const { data: messengers, isLoading } = useMessengers();
	const createMutation = useCreateMessenger();
	const updateMutation = useUpdateMessenger();
	const deleteMutation = useDeleteMessenger();
	const testMutation = useTestMessenger();

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingMessenger, setEditingMessenger] = useState<MessengerConfig | null>(null);

	// Form state.
	const [formName, setFormName] = useState('');
	const [formPlatform, setFormPlatform] = useState<MessengerPlatform>('slack');
	const [formUrl, setFormUrl] = useState('');
	const [formActive, setFormActive] = useState(true);

	const openCreateDialog = () => {
		setEditingMessenger(null);
		setFormName('');
		setFormPlatform('slack');
		setFormUrl('');
		setFormActive(true);
		setDialogOpen(true);
	};

	const openEditDialog = (messenger: MessengerConfig) => {
		setEditingMessenger(messenger);
		setFormName(messenger.name);
		setFormPlatform(messenger.platform);
		setFormUrl(messenger.webhookUrl);
		setFormActive(messenger.isActive);
		setDialogOpen(true);
	};

	const handleSave = async () => {
		try {
			if (editingMessenger) {
				await updateMutation.mutateAsync({
					id: editingMessenger.id,
					data: {
						name: formName,
						webhookUrl: formUrl,
						isActive: formActive,
					},
				});
				toast.success(__('Verbindung aktualisiert.', 'resa'));
			} else {
				const data: MessengerFormData = {
					name: formName,
					platform: formPlatform,
					webhookUrl: formUrl,
					isActive: formActive,
				};
				await createMutation.mutateAsync(data);
				toast.success(__('Verbindung erstellt.', 'resa'));
			}
			setDialogOpen(false);
		} catch {
			toast.error(__('Fehler beim Speichern der Verbindung.', 'resa'));
		}
	};

	const handleToggle = async (messenger: MessengerConfig) => {
		try {
			await updateMutation.mutateAsync({
				id: messenger.id,
				data: { isActive: !messenger.isActive },
			});
		} catch {
			toast.error(__('Fehler beim Ändern des Status.', 'resa'));
		}
	};

	const handleDelete = async (id: number) => {
		try {
			await deleteMutation.mutateAsync(id);
			toast.success(__('Verbindung gelöscht.', 'resa'));
		} catch {
			toast.error(__('Fehler beim Löschen der Verbindung.', 'resa'));
		}
	};

	const handleTest = async (id: number) => {
		try {
			const result = await testMutation.mutateAsync(id);
			if (result.success) {
				toast.success(`${__('Test erfolgreich', 'resa')} (HTTP ${result.statusCode})`);
			} else {
				toast.error(
					result.error
						? `${__('Test fehlgeschlagen', 'resa')}: ${result.error}`
						: `${__('Test fehlgeschlagen', 'resa')} (HTTP ${result.statusCode})`,
				);
			}
		} catch {
			toast.error(__('Fehler beim Senden des Tests.', 'resa'));
		}
	};

	const isFormValid = formName.trim() !== '' && formUrl.trim() !== '';
	const isSaving = createMutation.isPending || updateMutation.isPending;
	const count = messengers?.length ?? 0;
	const isAtLimit = count >= MAX_MESSENGERS;

	// Styles
	const headerStyle: React.CSSProperties = {
		display: 'flex',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		marginBottom: '16px',
	};

	const headlineStyle: React.CSSProperties = {
		fontSize: '15px',
		fontWeight: 600,
		color: '#1e303a',
		margin: 0,
	};

	const sublineStyle: React.CSSProperties = {
		fontSize: '13px',
		color: '#1e303a',
		margin: '4px 0 0 0',
	};

	// Loading state.
	if (isLoading) {
		return <LoadingState message={__('Lade Messenger-Verbindungen...', 'resa')} />;
	}

	return (
		<>
			{/* Header */}
			<div style={headerStyle}>
				<div>
					<h4 style={headlineStyle}>{__('Messenger-Benachrichtigungen', 'resa')}</h4>
					<p style={sublineStyle}>
						{__(
							'Erhalten Sie sofortige Benachrichtigungen in Slack, Teams oder Discord.',
							'resa',
						)}
					</p>
				</div>
				<PrimaryButton onClick={openCreateDialog} disabled={isAtLimit}>
					<Plus style={{ width: '16px', height: '16px' }} />
					{__('Verbindung hinzufügen', 'resa')}
				</PrimaryButton>
			</div>

			{isAtLimit && (
				<p style={{ fontSize: '13px', color: '#dc2626', margin: '0 0 16px 0' }}>
					{__('Maximal 5 Verbindungen erlaubt.', 'resa')}
				</p>
			)}

			{/* Empty state */}
			{(!messengers || messengers.length === 0) && (
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
						{__('Noch keine Messenger-Verbindungen', 'resa')}
					</p>
					<p
						style={{
							fontSize: '14px',
							color: '#1e303a',
							margin: '0 0 16px 0',
						}}
					>
						{__(
							'Benachrichtigungen bei neuen Leads direkt in Ihrem Team-Chat.',
							'resa',
						)}
					</p>
					<OutlineButton onClick={openCreateDialog}>
						<Plus style={{ width: '16px', height: '16px' }} />
						{__('Erste Verbindung einrichten', 'resa')}
					</OutlineButton>
				</div>
			)}

			{/* Messenger Table */}
			{messengers && messengers.length > 0 && (
				<div
					style={{
						border: '1px solid hsl(214.3 31.8% 91.4%)',
						borderRadius: '8px',
						overflow: 'hidden',
						backgroundColor: 'white',
					}}
				>
					<Table>
						<TableHeader>
							<TableRow style={{ backgroundColor: 'hsl(210 40% 96.1%)' }}>
								<TableHead
									style={{
										paddingTop: '12px',
										paddingBottom: '12px',
										paddingLeft: '16px',
										borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
										color: '#1e303a',
										fontWeight: 500,
									}}
								>
									{__('Name', 'resa')}
								</TableHead>
								<TableHead
									style={{
										paddingTop: '12px',
										paddingBottom: '12px',
										borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
										color: '#1e303a',
										fontWeight: 500,
									}}
								>
									{__('Plattform', 'resa')}
								</TableHead>
								<TableHead
									style={{
										paddingTop: '12px',
										paddingBottom: '12px',
										borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
										color: '#1e303a',
										fontWeight: 500,
									}}
								>
									{__('Webhook-URL', 'resa')}
								</TableHead>
								<TableHead
									style={{
										paddingTop: '12px',
										paddingBottom: '12px',
										borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
										color: '#1e303a',
										fontWeight: 500,
										textAlign: 'center',
										width: '80px',
									}}
								>
									{__('Aktiv', 'resa')}
								</TableHead>
								<TableHead
									style={{
										paddingTop: '12px',
										paddingBottom: '12px',
										paddingRight: '16px',
										borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
										width: '48px',
									}}
								>
									<span className="resa-sr-only">{__('Aktionen', 'resa')}</span>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{messengers.map((messenger, idx) => (
								<TableRow key={messenger.id}>
									<TableCell
										style={{
											paddingLeft: '16px',
											paddingTop: '12px',
											paddingBottom: '12px',
											fontWeight: 500,
											color: '#1e303a',
											borderBottom:
												idx === messengers.length - 1
													? 'none'
													: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										{messenger.name}
									</TableCell>
									<TableCell
										style={{
											paddingTop: '12px',
											paddingBottom: '12px',
											borderBottom:
												idx === messengers.length - 1
													? 'none'
													: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										<Badge
											variant="outline"
											style={{
												...platformBadgeStyle(messenger.platform),
												fontSize: '11px',
											}}
										>
											{messenger.platform === 'teams'
												? 'Teams'
												: messenger.platform.charAt(0).toUpperCase() +
													messenger.platform.slice(1)}
										</Badge>
									</TableCell>
									<TableCell
										style={{
											paddingTop: '12px',
											paddingBottom: '12px',
											color: '#1e303a',
											fontSize: '13px',
											maxWidth: '200px',
											borderBottom:
												idx === messengers.length - 1
													? 'none'
													: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										<span
											style={{
												display: 'block',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
											}}
											title={messenger.webhookUrl}
										>
											{messenger.webhookUrl}
										</span>
									</TableCell>
									<TableCell
										style={{
											paddingTop: '12px',
											paddingBottom: '12px',
											textAlign: 'center',
											borderBottom:
												idx === messengers.length - 1
													? 'none'
													: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										<Switch
											checked={messenger.isActive}
											onCheckedChange={() => handleToggle(messenger)}
										/>
									</TableCell>
									<TableCell
										style={{
											paddingTop: '12px',
											paddingBottom: '12px',
											paddingRight: '16px',
											borderBottom:
												idx === messengers.length - 1
													? 'none'
													: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="sm"
													style={{ padding: '4px' }}
												>
													<MoreHorizontal
														style={{ width: '16px', height: '16px' }}
													/>
													<span className="resa-sr-only">
														{__('Menü öffnen', 'resa')}
													</span>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent
												align="end"
												style={{ backgroundColor: 'white', padding: '4px' }}
											>
												<DropdownMenuItem
													onClick={() => openEditDialog(messenger)}
												>
													<Pencil
														style={{
															width: '14px',
															height: '14px',
															marginRight: '8px',
														}}
													/>
													{__('Bearbeiten', 'resa')}
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleTest(messenger.id)}
													disabled={testMutation.isPending}
												>
													<Send
														style={{
															width: '14px',
															height: '14px',
															marginRight: '8px',
														}}
													/>
													{__('Test senden', 'resa')}
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													onClick={() => handleDelete(messenger.id)}
													disabled={deleteMutation.isPending}
													style={{ color: '#dc2626' }}
												>
													<Trash2
														style={{
															width: '14px',
															height: '14px',
															marginRight: '8px',
														}}
													/>
													{__('Löschen', 'resa')}
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Setup Help Box */}
			<div
				style={{
					marginTop: '24px',
					border: '1px solid hsl(214.3 31.8% 91.4%)',
					borderRadius: '8px',
					padding: '16px',
					boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
				}}
			>
				<div style={{ marginBottom: '12px' }}>
					<h4 style={headlineStyle}>{__('Einrichtungs-Hilfe', 'resa')}</h4>
					<p style={sublineStyle}>
						{__(
							'Nachrichten werden automatisch bei jedem neuen Lead an alle aktiven Verbindungen gesendet.',
							'resa',
						)}
					</p>
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					{PLATFORMS.map((p) => (
						<div
							key={p.value}
							style={{
								display: 'flex',
								alignItems: 'flex-start',
								gap: '8px',
								fontSize: '13px',
							}}
						>
							<Badge
								variant="outline"
								style={{
									...platformBadgeStyle(p.value),
									fontSize: '11px',
									flexShrink: 0,
									marginTop: '2px',
								}}
							>
								{p.label}
							</Badge>
							<span style={{ color: '#64748b' }}>{PLATFORM_HELP[p.value]}</span>
						</div>
					))}
				</div>
			</div>

			{/* Create / Edit Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingMessenger
								? __('Verbindung bearbeiten', 'resa')
								: __('Verbindung erstellen', 'resa')}
						</DialogTitle>
					</DialogHeader>

					<div className="resa-space-y-4 resa-py-4">
						{/* Platform selector (only on create) */}
						{!editingMessenger && (
							<div className="resa-space-y-2">
								<Label>{__('Plattform', 'resa')}</Label>
								<div className="resa-flex resa-gap-2">
									{PLATFORMS.map((p) => (
										<Button
											key={p.value}
											variant={
												formPlatform === p.value ? 'default' : 'outline'
											}
											size="sm"
											onClick={() => {
												setFormPlatform(p.value);
												setFormUrl('');
											}}
										>
											{p.label}
										</Button>
									))}
								</div>
							</div>
						)}

						{/* Show platform badge when editing */}
						{editingMessenger && (
							<div className="resa-space-y-2">
								<Label>{__('Plattform', 'resa')}</Label>
								<div>
									<Badge
										variant="outline"
										style={platformBadgeStyle(editingMessenger.platform)}
									>
										{editingMessenger.platform === 'teams'
											? 'Microsoft Teams'
											: editingMessenger.platform.charAt(0).toUpperCase() +
												editingMessenger.platform.slice(1)}
									</Badge>
								</div>
							</div>
						)}

						{/* Name */}
						<div className="resa-space-y-2">
							<Label htmlFor="messenger-name">{__('Name', 'resa')}</Label>
							<Input
								id="messenger-name"
								value={formName}
								onChange={(e) => setFormName(e.target.value)}
								placeholder={__('z.B. Lead-Kanal Berlin', 'resa')}
							/>
						</div>

						{/* Webhook URL */}
						<div className="resa-space-y-2">
							<Label htmlFor="messenger-url">{__('Webhook-URL', 'resa')}</Label>
							<Input
								id="messenger-url"
								type="url"
								value={formUrl}
								onChange={(e) => setFormUrl(e.target.value)}
								placeholder={
									PLATFORM_PLACEHOLDERS[
										editingMessenger?.platform ?? formPlatform
									]
								}
							/>
							<p className="resa-text-xs resa-text-muted-foreground">
								{PLATFORM_HELP[editingMessenger?.platform ?? formPlatform]}
							</p>
						</div>

						{/* Active toggle */}
						<div className="resa-flex resa-items-center resa-justify-between">
							<Label htmlFor="messenger-active">{__('Aktiv', 'resa')}</Label>
							<Switch
								id="messenger-active"
								checked={formActive}
								onCheckedChange={setFormActive}
							/>
						</div>
					</div>

					<DialogFooter>
						<OutlineButton onClick={() => setDialogOpen(false)}>
							{__('Abbrechen', 'resa')}
						</OutlineButton>
						<PrimaryButton onClick={handleSave} disabled={!isFormValid || isSaving}>
							{isSaving ? __('Speichern...', 'resa') : __('Speichern', 'resa')}
						</PrimaryButton>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
