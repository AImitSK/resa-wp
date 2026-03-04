/**
 * Webhooks tab — full CRUD UI for webhook management.
 *
 * Allows creating, editing, testing, toggling, and deleting webhooks.
 * Limited to 5 webhooks. Premium-only (gate is handled at page level).
 */

import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Webhook, Plus, Pencil, Trash2, Send, Copy, Check, RefreshCw, Globe } from 'lucide-react';

import {
	useWebhooks,
	useCreateWebhook,
	useUpdateWebhook,
	useDeleteWebhook,
	useTestWebhook,
} from '../../hooks/useWebhooks';
import type { WebhookConfig, WebhookFormData } from '../../types';

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

const MAX_WEBHOOKS = 5;

function generateSecret(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(24));
	const hex = Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
	return `whsec_${hex}`;
}

export function WebhooksTab() {
	const { data: webhooks, isLoading } = useWebhooks();
	const createMutation = useCreateWebhook();
	const updateMutation = useUpdateWebhook();
	const deleteMutation = useDeleteWebhook();
	const testMutation = useTestWebhook();

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
	const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
	const [feedback, setFeedback] = useState<{
		type: 'success' | 'error';
		message: string;
	} | null>(null);

	// Form state.
	const [formName, setFormName] = useState('');
	const [formUrl, setFormUrl] = useState('');
	const [formSecret, setFormSecret] = useState('');
	const [formEvents, setFormEvents] = useState<string[]>(['lead.created']);
	const [formActive, setFormActive] = useState(true);
	const [copied, setCopied] = useState(false);

	const clearFeedback = () => {
		setTimeout(() => setFeedback(null), 5000);
	};

	const openCreateDialog = () => {
		setEditingWebhook(null);
		setFormName('');
		setFormUrl('');
		setFormSecret(generateSecret());
		setFormEvents(['lead.created']);
		setFormActive(true);
		setDialogOpen(true);
	};

	const openEditDialog = (webhook: WebhookConfig) => {
		setEditingWebhook(webhook);
		setFormName(webhook.name);
		setFormUrl(webhook.url);
		setFormSecret(webhook.secret);
		setFormEvents(webhook.events);
		setFormActive(webhook.isActive);
		setDialogOpen(true);
	};

	const handleSave = async () => {
		const data: WebhookFormData = {
			name: formName,
			url: formUrl,
			secret: formSecret,
			events: formEvents,
			isActive: formActive,
		};

		try {
			if (editingWebhook) {
				await updateMutation.mutateAsync({ id: editingWebhook.id, data });
				setFeedback({
					type: 'success',
					message: __('Webhook aktualisiert.', 'resa'),
				});
			} else {
				await createMutation.mutateAsync(data);
				setFeedback({
					type: 'success',
					message: __('Webhook erstellt.', 'resa'),
				});
			}
			setDialogOpen(false);
		} catch {
			setFeedback({
				type: 'error',
				message: __('Fehler beim Speichern des Webhooks.', 'resa'),
			});
		}
		clearFeedback();
	};

	const handleToggle = async (webhook: WebhookConfig) => {
		try {
			await updateMutation.mutateAsync({
				id: webhook.id,
				data: { isActive: !webhook.isActive },
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
				message: __('Webhook gelöscht.', 'resa'),
			});
		} catch {
			setFeedback({
				type: 'error',
				message: __('Fehler beim Löschen des Webhooks.', 'resa'),
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

	const copySecret = () => {
		navigator.clipboard.writeText(formSecret);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const regenerateSecret = () => {
		setFormSecret(generateSecret());
	};

	const isFormValid = formName.trim() !== '' && formUrl.trim() !== '';
	const isSaving = createMutation.isPending || updateMutation.isPending;
	const count = webhooks?.length ?? 0;
	const isAtLimit = count >= MAX_WEBHOOKS;

	// Loading state.
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="resa-h-6 resa-w-32" />
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

			<Card>
				<CardHeader>
					<div className="resa-flex resa-items-center resa-justify-between">
						<CardTitle className="resa-flex resa-items-center resa-gap-2">
							<Webhook className="resa-h-5 resa-w-5" />
							{__('Webhooks', 'resa')}
							{count > 0 && (
								<Badge variant="secondary">
									{count}/{MAX_WEBHOOKS}
								</Badge>
							)}
						</CardTitle>
						<Button size="sm" onClick={openCreateDialog} disabled={isAtLimit}>
							<Plus className="resa-h-4 resa-w-4 resa-mr-1" />
							{__('Webhook hinzufügen', 'resa')}
						</Button>
					</div>
					{isAtLimit && (
						<p className="resa-text-sm resa-text-muted-foreground">
							{__('Maximal 5 Webhooks erlaubt.', 'resa')}
						</p>
					)}
				</CardHeader>

				<CardContent>
					{/* Empty state */}
					{(!webhooks || webhooks.length === 0) && (
						<div className="resa-flex resa-flex-col resa-items-center resa-justify-center resa-py-12 resa-text-center">
							<Globe className="resa-h-12 resa-w-12 resa-text-muted-foreground resa-mb-4" />
							<p className="resa-text-lg resa-font-medium resa-mb-1">
								{__('Noch keine Webhooks', 'resa')}
							</p>
							<p className="resa-text-sm resa-text-muted-foreground resa-mb-4">
								{__(
									'Senden Sie automatisch Lead-Daten an Zapier, Make oder Ihre eigene API.',
									'resa',
								)}
							</p>
							<Button size="sm" onClick={openCreateDialog}>
								<Plus className="resa-h-4 resa-w-4 resa-mr-1" />
								{__('Ersten Webhook erstellen', 'resa')}
							</Button>
						</div>
					)}

					{/* Webhook list */}
					{webhooks && webhooks.length > 0 && (
						<div className="resa-space-y-3">
							{webhooks.map((webhook, index) => (
								<div key={webhook.id}>
									{index > 0 && <Separator className="resa-mb-3" />}
									<div className="resa-flex resa-items-center resa-justify-between resa-gap-4">
										<div className="resa-flex-1 resa-min-w-0">
											<div className="resa-flex resa-items-center resa-gap-2 resa-mb-1">
												<span className="resa-font-medium resa-text-sm">
													{webhook.name}
												</span>
												{webhook.events.map((event) => (
													<Badge
														key={event}
														variant="outline"
														className="resa-text-xs"
													>
														{event}
													</Badge>
												))}
											</div>
											<p
												className="resa-text-xs resa-text-muted-foreground resa-truncate"
												title={webhook.url}
											>
												{webhook.url}
											</p>
										</div>

										<div className="resa-flex resa-items-center resa-gap-2 resa-shrink-0">
											<Switch
												checked={webhook.isActive}
												onCheckedChange={() => handleToggle(webhook)}
											/>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => openEditDialog(webhook)}
												title={__('Bearbeiten', 'resa')}
											>
												<Pencil className="resa-h-4 resa-w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleTest(webhook.id)}
												disabled={testMutation.isPending}
												title={__('Test senden', 'resa')}
											>
												<Send className="resa-h-4 resa-w-4" />
											</Button>
											{deleteConfirmId === webhook.id ? (
												<div className="resa-flex resa-items-center resa-gap-1">
													<Button
														variant="destructive"
														size="sm"
														onClick={() => handleDelete(webhook.id)}
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
													onClick={() => setDeleteConfirmId(webhook.id)}
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

			{/* Create / Edit Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingWebhook
								? __('Webhook bearbeiten', 'resa')
								: __('Webhook erstellen', 'resa')}
						</DialogTitle>
					</DialogHeader>

					<div className="resa-space-y-4 resa-py-4">
						{/* Name */}
						<div className="resa-space-y-2">
							<Label htmlFor="webhook-name">{__('Name', 'resa')}</Label>
							<Input
								id="webhook-name"
								value={formName}
								onChange={(e) => setFormName(e.target.value)}
								placeholder={__('z.B. Zapier Lead-Sync', 'resa')}
							/>
						</div>

						{/* URL */}
						<div className="resa-space-y-2">
							<Label htmlFor="webhook-url">{__('URL', 'resa')}</Label>
							<Input
								id="webhook-url"
								type="url"
								value={formUrl}
								onChange={(e) => setFormUrl(e.target.value)}
								placeholder="https://hooks.zapier.com/..."
							/>
						</div>

						{/* Secret */}
						<div className="resa-space-y-2">
							<Label>{__('Secret (HMAC-SHA256)', 'resa')}</Label>
							<div className="resa-flex resa-gap-2">
								<Input
									value={formSecret}
									readOnly
									className="resa-font-mono resa-text-xs"
								/>
								<Button
									variant="outline"
									size="sm"
									onClick={copySecret}
									title={copied ? __('Kopiert!', 'resa') : __('Kopieren', 'resa')}
								>
									{copied ? (
										<Check className="resa-h-4 resa-w-4" />
									) : (
										<Copy className="resa-h-4 resa-w-4" />
									)}
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={regenerateSecret}
									title={__('Neu generieren', 'resa')}
								>
									<RefreshCw className="resa-h-4 resa-w-4" />
								</Button>
							</div>
						</div>

						{/* Events */}
						<div className="resa-space-y-2">
							<Label>{__('Events', 'resa')}</Label>
							<div className="resa-flex resa-items-center resa-gap-2">
								<input
									type="checkbox"
									id="event-lead-created"
									checked={formEvents.includes('lead.created')}
									onChange={(e) => {
										if (e.target.checked) {
											setFormEvents([...formEvents, 'lead.created']);
										} else {
											setFormEvents(
												formEvents.filter((ev) => ev !== 'lead.created'),
											);
										}
									}}
								/>
								<Label htmlFor="event-lead-created" className="resa-font-normal">
									lead.created
								</Label>
							</div>
						</div>

						{/* Active toggle */}
						<div className="resa-flex resa-items-center resa-justify-between">
							<Label htmlFor="webhook-active">{__('Aktiv', 'resa')}</Label>
							<Switch
								id="webhook-active"
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
