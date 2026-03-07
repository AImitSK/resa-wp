/**
 * Messenger tab — CRUD UI for messenger notification connections.
 *
 * Allows creating, editing, testing, toggling, and deleting messenger
 * connections for Slack, Microsoft Teams, and Discord.
 * Limited to 5 connections. Premium-only (gate is handled at page level).
 */

import { useState, type ReactNode } from 'react';
import { __ } from '@wordpress/i18n';
import { Plus, Pencil, Trash2, Send, Info, MoreHorizontal } from 'lucide-react';

import {
	useMessengers,
	useCreateMessenger,
	useUpdateMessenger,
	useDeleteMessenger,
	useTestMessenger,
} from '../../hooks/useMessengers';
import type { MessengerConfig, MessengerFormData, MessengerPlatform } from '../../types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

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
	const [feedback, setFeedback] = useState<{
		type: 'success' | 'error';
		message: string;
	} | null>(null);

	// Form state.
	const [formName, setFormName] = useState('');
	const [formPlatform, setFormPlatform] = useState<MessengerPlatform>('slack');
	const [formUrl, setFormUrl] = useState('');
	const [formActive, setFormActive] = useState(true);

	const clearFeedback = () => {
		setTimeout(() => setFeedback(null), 5000);
	};

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
				setFeedback({
					type: 'success',
					message: __('Verbindung aktualisiert.', 'resa'),
				});
			} else {
				const data: MessengerFormData = {
					name: formName,
					platform: formPlatform,
					webhookUrl: formUrl,
					isActive: formActive,
				};
				await createMutation.mutateAsync(data);
				setFeedback({
					type: 'success',
					message: __('Verbindung erstellt.', 'resa'),
				});
			}
			setDialogOpen(false);
		} catch {
			setFeedback({
				type: 'error',
				message: __('Fehler beim Speichern der Verbindung.', 'resa'),
			});
		}
		clearFeedback();
	};

	const handleToggle = async (messenger: MessengerConfig) => {
		try {
			await updateMutation.mutateAsync({
				id: messenger.id,
				data: { isActive: !messenger.isActive },
			});
		} catch {
			setFeedback({
				type: 'error',
				message: __('Fehler beim Ändern des Status.', 'resa'),
			});
			clearFeedback();
		}
	};

	const handleDelete = async (id: number) => {
		try {
			await deleteMutation.mutateAsync(id);
			setFeedback({
				type: 'success',
				message: __('Verbindung gelöscht.', 'resa'),
			});
		} catch {
			setFeedback({
				type: 'error',
				message: __('Fehler beim Löschen der Verbindung.', 'resa'),
			});
		}
		clearFeedback();
	};

	const handleTest = async (id: number) => {
		try {
			const result = await testMutation.mutateAsync(id);
			if (result.success) {
				setFeedback({
					type: 'success',
					message: `${__('Test erfolgreich', 'resa')} (HTTP ${result.statusCode})`,
				});
			} else {
				setFeedback({
					type: 'error',
					message: result.error
						? `${__('Test fehlgeschlagen', 'resa')}: ${result.error}`
						: `${__('Test fehlgeschlagen', 'resa')} (HTTP ${result.statusCode})`,
				});
			}
		} catch {
			setFeedback({
				type: 'error',
				message: __('Fehler beim Senden des Tests.', 'resa'),
			});
		}
		clearFeedback();
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
		return (
			<div>
				<Skeleton className="resa-h-6 resa-w-48 resa-mb-4" />
				<Skeleton className="resa-h-10 resa-w-full resa-mb-2" />
				<Skeleton className="resa-h-10 resa-w-full resa-mb-2" />
				<Skeleton className="resa-h-10 resa-w-full" />
			</div>
		);
	}

	return (
		<>
			{/* Feedback Alert */}
			{feedback && (
				<Alert
					variant={feedback.type === 'error' ? 'destructive' : 'default'}
					style={{ marginBottom: '16px' }}
				>
					<AlertDescription>{feedback.message}</AlertDescription>
				</Alert>
			)}

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

			{/* Setup Help Card */}
			<Card style={{ marginTop: '16px' }}>
				<CardHeader>
					<CardTitle className="resa-flex resa-items-center resa-gap-2 resa-text-base">
						<Info className="resa-h-4 resa-w-4" />
						{__('Einrichtungs-Hilfe', 'resa')}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="resa-text-sm resa-text-muted-foreground resa-mb-3">
						{__(
							'Nachrichten werden automatisch bei jedem neuen Lead an alle aktiven Verbindungen gesendet. Erstellen Sie eine Incoming-Webhook-URL in Ihrer Plattform:',
							'resa',
						)}
					</p>
					<div className="resa-space-y-2">
						{PLATFORMS.map((p) => (
							<div
								key={p.value}
								className="resa-flex resa-items-start resa-gap-2 resa-text-sm"
							>
								<Badge
									variant="outline"
									className="resa-text-xs resa-shrink-0 resa-mt-0.5"
									style={platformBadgeStyle(p.value)}
								>
									{p.label}
								</Badge>
								<span className="resa-text-muted-foreground">
									{PLATFORM_HELP[p.value]}
								</span>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

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
