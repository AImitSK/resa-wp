/**
 * Messenger tab — CRUD UI for messenger notification connections.
 *
 * Allows creating, editing, testing, toggling, and deleting messenger
 * connections for Slack, Microsoft Teams, and Discord.
 * Limited to 5 connections. Premium-only (gate is handled at page level).
 */

import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { MessageSquare, Plus, Pencil, Trash2, Send, Info } from 'lucide-react';

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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

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
	const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
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
			setDeleteConfirmId(null);
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

	// Loading state.
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="resa-h-6 resa-w-48" />
				</CardHeader>
				<CardContent className="resa-space-y-3">
					<Skeleton className="resa-h-10 resa-w-full" />
					<Skeleton className="resa-h-10 resa-w-full" />
					<Skeleton className="resa-h-10 resa-w-full" />
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			{/* Feedback Alert */}
			{feedback && (
				<Alert
					variant={feedback.type === 'error' ? 'destructive' : 'default'}
					className="resa-mb-4"
				>
					<AlertDescription>{feedback.message}</AlertDescription>
				</Alert>
			)}

			{/* Connections Card */}
			<Card>
				<CardHeader>
					<div className="resa-flex resa-items-center resa-justify-between">
						<CardTitle className="resa-flex resa-items-center resa-gap-2">
							<MessageSquare className="resa-h-5 resa-w-5" />
							{__('Messenger-Benachrichtigungen', 'resa')}
							{count > 0 && (
								<Badge variant="secondary">
									{count}/{MAX_MESSENGERS}
								</Badge>
							)}
						</CardTitle>
						<Button size="sm" onClick={openCreateDialog} disabled={isAtLimit}>
							<Plus className="resa-h-4 resa-w-4 resa-mr-1" />
							{__('Verbindung hinzufügen', 'resa')}
						</Button>
					</div>
					{isAtLimit && (
						<p className="resa-text-sm resa-text-muted-foreground">
							{__('Maximal 5 Verbindungen erlaubt.', 'resa')}
						</p>
					)}
				</CardHeader>

				<CardContent>
					{/* Empty state */}
					{(!messengers || messengers.length === 0) && (
						<div className="resa-flex resa-flex-col resa-items-center resa-justify-center resa-py-12 resa-text-center">
							<MessageSquare className="resa-h-12 resa-w-12 resa-text-muted-foreground resa-mb-4" />
							<p className="resa-text-lg resa-font-medium resa-mb-1">
								{__('Noch keine Messenger-Verbindungen', 'resa')}
							</p>
							<p className="resa-text-sm resa-text-muted-foreground resa-mb-4">
								{__(
									'Erhalten Sie sofortige Benachrichtigungen in Slack, Microsoft Teams oder Discord, wenn ein neuer Lead eingeht.',
									'resa',
								)}
							</p>
							<Button size="sm" onClick={openCreateDialog}>
								<Plus className="resa-h-4 resa-w-4 resa-mr-1" />
								{__('Erste Verbindung einrichten', 'resa')}
							</Button>
						</div>
					)}

					{/* Messenger list */}
					{messengers && messengers.length > 0 && (
						<div className="resa-space-y-3">
							{messengers.map((messenger, index) => (
								<div key={messenger.id}>
									{index > 0 && <Separator className="resa-mb-3" />}
									<div className="resa-flex resa-items-center resa-justify-between resa-gap-4">
										<div className="resa-flex-1 resa-min-w-0">
											<div className="resa-flex resa-items-center resa-gap-2 resa-mb-1">
												<span className="resa-font-medium resa-text-sm">
													{messenger.name}
												</span>
												<Badge
													variant="outline"
													className="resa-text-xs"
													style={platformBadgeStyle(messenger.platform)}
												>
													{messenger.platform === 'teams'
														? 'Teams'
														: messenger.platform
																.charAt(0)
																.toUpperCase() +
															messenger.platform.slice(1)}
												</Badge>
											</div>
											<p
												className="resa-text-xs resa-text-muted-foreground resa-truncate"
												title={messenger.webhookUrl}
											>
												{messenger.webhookUrl}
											</p>
										</div>

										<div className="resa-flex resa-items-center resa-gap-2 resa-shrink-0">
											<Switch
												checked={messenger.isActive}
												onCheckedChange={() => handleToggle(messenger)}
											/>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => openEditDialog(messenger)}
												title={__('Bearbeiten', 'resa')}
											>
												<Pencil className="resa-h-4 resa-w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleTest(messenger.id)}
												disabled={testMutation.isPending}
												title={__('Test senden', 'resa')}
											>
												<Send className="resa-h-4 resa-w-4" />
											</Button>
											{deleteConfirmId === messenger.id ? (
												<div className="resa-flex resa-items-center resa-gap-1">
													<Button
														variant="destructive"
														size="sm"
														onClick={() => handleDelete(messenger.id)}
														disabled={deleteMutation.isPending}
													>
														{__('Ja', 'resa')}
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => setDeleteConfirmId(null)}
													>
														{__('Nein', 'resa')}
													</Button>
												</div>
											) : (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setDeleteConfirmId(messenger.id)}
													title={__('Löschen', 'resa')}
												>
													<Trash2 className="resa-h-4 resa-w-4" />
												</Button>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Setup Help Card */}
			<Card className="resa-mt-4">
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
						<Button variant="outline" onClick={() => setDialogOpen(false)}>
							{__('Abbrechen', 'resa')}
						</Button>
						<Button onClick={handleSave} disabled={!isFormValid || isSaving}>
							{isSaving ? __('Speichern...', 'resa') : __('Speichern', 'resa')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
