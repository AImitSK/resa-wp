/**
 * Webhooks tab — full CRUD UI for webhook management.
 *
 * Allows creating, editing, testing, toggling, and deleting webhooks.
 * Limited to 5 webhooks. Premium-only (gate is handled at page level).
 *
 * Uses Zod + React Hook Form for validation.
 * @see docs/design-system/patterns/form-validation.md
 */

import { useState, useEffect, type ReactNode } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { __ } from '@wordpress/i18n';
import { Plus, Pencil, Trash2, Send, Copy, Check, RefreshCw, MoreHorizontal } from 'lucide-react';

import {
	useWebhooks,
	useCreateWebhook,
	useUpdateWebhook,
	useDeleteWebhook,
	useTestWebhook,
} from '../../hooks/useWebhooks';
import type { WebhookConfig } from '../../types';
import { webhookSchema, type WebhookFormData } from '../../schemas/webhook';
import { toast } from '../../lib/toast';
import { ConfirmDeleteDialog } from '../ConfirmDeleteDialog';

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

// ─── Styled Button Components ────────────────────────────

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

function OutlineButton({
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
				backgroundColor: isHovered ? 'hsl(210 40% 96.1%)' : 'white',
				color: '#1e303a',
				border: '1px solid #e8e8e8',
				boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
				cursor: disabled ? 'not-allowed' : 'pointer',
				gap: '6px',
			}}
		>
			{children}
		</Button>
	);
}

const MAX_WEBHOOKS = 5;

function generateSecret(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(24));
	const hex = Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
	return `whsec_${hex}`;
}

// ─── Styles ─────────────────────────────────────────────

const inputStyles: React.CSSProperties = {
	height: '36px',
	padding: '0 12px',
	fontSize: '14px',
	border: '1px solid hsl(214.3 31.8% 78%)',
	borderRadius: '6px',
	backgroundColor: 'white',
};

export function WebhooksTab() {
	const { data: webhooks, isLoading } = useWebhooks();
	const createMutation = useCreateWebhook();
	const updateMutation = useUpdateWebhook();
	const deleteMutation = useDeleteWebhook();
	const testMutation = useTestWebhook();

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [webhookToDelete, setWebhookToDelete] = useState<WebhookConfig | null>(null);
	const [copied, setCopied] = useState(false);

	// Form defaults
	const defaults: WebhookFormData = {
		name: '',
		url: '',
		secret: generateSecret(),
		events: ['lead.created'],
		isActive: true,
	};

	const form = useForm<WebhookFormData>({
		resolver: zodResolver(webhookSchema),
		defaultValues: defaults,
	});

	const {
		formState: { errors },
	} = form;

	// Reset form when dialog opens/closes
	useEffect(() => {
		if (dialogOpen) {
			if (editingWebhook) {
				// Edit mode: populate with existing data
				form.reset({
					name: editingWebhook.name,
					url: editingWebhook.url,
					secret: editingWebhook.secret,
					events: editingWebhook.events,
					isActive: editingWebhook.isActive,
				});
			} else {
				// Create mode: fresh defaults
				form.reset({
					name: '',
					url: '',
					secret: generateSecret(),
					events: ['lead.created'],
					isActive: true,
				});
			}
		}
	}, [dialogOpen, editingWebhook, form]);

	const openCreateDialog = () => {
		setEditingWebhook(null);
		setDialogOpen(true);
	};

	const openEditDialog = (webhook: WebhookConfig) => {
		setEditingWebhook(webhook);
		setDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setDialogOpen(false);
		setEditingWebhook(null);
		form.reset(defaults);
	};

	const onSubmit = async (data: WebhookFormData) => {
		try {
			if (editingWebhook) {
				await updateMutation.mutateAsync({ id: editingWebhook.id, data });
				toast.success(__('Webhook aktualisiert.', 'resa'));
			} else {
				await createMutation.mutateAsync(data);
				toast.success(__('Webhook erstellt.', 'resa'));
			}
			handleCloseDialog();
		} catch {
			toast.error(__('Fehler beim Speichern des Webhooks.', 'resa'));
		}
	};

	const handleToggle = async (webhook: WebhookConfig) => {
		try {
			await updateMutation.mutateAsync({
				id: webhook.id,
				data: { isActive: !webhook.isActive },
			});
		} catch {
			toast.error(__('Fehler beim Ändern des Status.', 'resa'));
		}
	};

	const handleDeleteClick = (webhook: WebhookConfig) => {
		setWebhookToDelete(webhook);
		setDeleteDialogOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!webhookToDelete) return;
		try {
			await deleteMutation.mutateAsync(webhookToDelete.id);
			toast.success(__('Webhook gelöscht.', 'resa'));
			setDeleteDialogOpen(false);
		} catch {
			toast.error(__('Fehler beim Löschen des Webhooks.', 'resa'));
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

	const copySecret = () => {
		const secret = form.getValues('secret');
		navigator.clipboard.writeText(secret);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const regenerateSecret = () => {
		form.setValue('secret', generateSecret(), { shouldDirty: true });
	};

	const isSaving = createMutation.isPending || updateMutation.isPending;
	const count = webhooks?.length ?? 0;
	const isAtLimit = count >= MAX_WEBHOOKS;

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
		return <LoadingState message={__('Lade Webhooks...', 'resa')} />;
	}

	return (
		<>
			{/* Header */}
			<div style={headerStyle}>
				<div>
					<h4 style={headlineStyle}>{__('Webhooks', 'resa')}</h4>
					<p style={sublineStyle}>
						{__(
							'Senden Sie automatisch Lead-Daten an Zapier, Make oder Ihre eigene API.',
							'resa',
						)}
					</p>
				</div>
				<PrimaryButton onClick={openCreateDialog} disabled={isAtLimit}>
					<Plus style={{ width: '16px', height: '16px' }} />
					{__('Webhook hinzufügen', 'resa')}
				</PrimaryButton>
			</div>

			{isAtLimit && (
				<p style={{ fontSize: '13px', color: '#dc2626', margin: '0 0 16px 0' }}>
					{__('Maximal 5 Webhooks erlaubt.', 'resa')}
				</p>
			)}

			{/* Empty state */}
			{(!webhooks || webhooks.length === 0) && (
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
						{__('Noch keine Webhooks', 'resa')}
					</p>
					<p
						style={{
							fontSize: '14px',
							color: '#1e303a',
							margin: '0 0 16px 0',
						}}
					>
						{__('Versenden Sie Lead-Daten in Echtzeit an externe Systeme.', 'resa')}
					</p>
					<OutlineButton onClick={openCreateDialog}>
						<Plus style={{ width: '16px', height: '16px' }} />
						{__('Ersten Webhook erstellen', 'resa')}
					</OutlineButton>
				</div>
			)}

			{/* Webhook Table */}
			{webhooks && webhooks.length > 0 && (
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
									{__('URL', 'resa')}
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
									{__('Events', 'resa')}
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
							{webhooks.map((webhook, idx) => (
								<TableRow key={webhook.id}>
									<TableCell
										style={{
											paddingLeft: '16px',
											paddingTop: '12px',
											paddingBottom: '12px',
											fontWeight: 500,
											color: '#1e303a',
											borderBottom:
												idx === webhooks.length - 1
													? 'none'
													: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										{webhook.name}
									</TableCell>
									<TableCell
										style={{
											paddingTop: '12px',
											paddingBottom: '12px',
											color: '#1e303a',
											fontSize: '13px',
											maxWidth: '200px',
											borderBottom:
												idx === webhooks.length - 1
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
											title={webhook.url}
										>
											{webhook.url}
										</span>
									</TableCell>
									<TableCell
										style={{
											paddingTop: '12px',
											paddingBottom: '12px',
											borderBottom:
												idx === webhooks.length - 1
													? 'none'
													: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										<div style={{ display: 'flex', gap: '4px' }}>
											{webhook.events.map((event) => (
												<Badge
													key={event}
													variant="outline"
													style={{ fontSize: '11px' }}
												>
													{event}
												</Badge>
											))}
										</div>
									</TableCell>
									<TableCell
										style={{
											paddingTop: '12px',
											paddingBottom: '12px',
											textAlign: 'center',
											borderBottom:
												idx === webhooks.length - 1
													? 'none'
													: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										<Switch
											checked={webhook.isActive}
											onCheckedChange={() => handleToggle(webhook)}
										/>
									</TableCell>
									<TableCell
										style={{
											paddingTop: '12px',
											paddingBottom: '12px',
											paddingRight: '16px',
											borderBottom:
												idx === webhooks.length - 1
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
												style={{
													backgroundColor: 'white',
													padding: '4px',
												}}
											>
												<DropdownMenuItem
													onClick={() => openEditDialog(webhook)}
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
													onClick={() => handleTest(webhook.id)}
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
													onClick={() => handleDeleteClick(webhook)}
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

			{/* Create / Edit Dialog */}
			<Dialog open={dialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
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
								placeholder={__('z.B. Zapier Lead-Sync', 'resa')}
								{...form.register('name')}
								style={{
									...inputStyles,
									borderColor: errors.name ? '#ef4444' : undefined,
								}}
							/>
							{errors.name && (
								<p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>
									{errors.name.message}
								</p>
							)}
						</div>

						{/* URL */}
						<div className="resa-space-y-2">
							<Label htmlFor="webhook-url">{__('URL', 'resa')}</Label>
							<Input
								id="webhook-url"
								type="url"
								placeholder="https://hooks.zapier.com/..."
								{...form.register('url')}
								style={{
									...inputStyles,
									borderColor: errors.url ? '#ef4444' : undefined,
								}}
							/>
							{errors.url && (
								<p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>
									{errors.url.message}
								</p>
							)}
						</div>

						{/* Secret */}
						<div className="resa-space-y-2">
							<Label>{__('Secret (HMAC-SHA256)', 'resa')}</Label>
							<div className="resa-flex resa-gap-2">
								<Input
									readOnly
									className="resa-font-mono resa-text-xs"
									{...form.register('secret')}
									style={inputStyles}
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
							<Controller
								name="events"
								control={form.control}
								render={({ field }) => (
									<div className="resa-flex resa-items-center resa-gap-2">
										<input
											type="checkbox"
											id="event-lead-created"
											checked={field.value.includes('lead.created')}
											onChange={(e) => {
												if (e.target.checked) {
													field.onChange([
														...field.value,
														'lead.created',
													]);
												} else {
													field.onChange(
														field.value.filter(
															(ev) => ev !== 'lead.created',
														),
													);
												}
											}}
										/>
										<Label
											htmlFor="event-lead-created"
											className="resa-font-normal"
										>
											lead.created
										</Label>
									</div>
								)}
							/>
							{errors.events && (
								<p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>
									{errors.events.message}
								</p>
							)}
						</div>

						{/* Active toggle */}
						<div className="resa-flex resa-items-center resa-justify-between">
							<Label htmlFor="webhook-active">{__('Aktiv', 'resa')}</Label>
							<Controller
								name="isActive"
								control={form.control}
								render={({ field }) => (
									<Switch
										id="webhook-active"
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								)}
							/>
						</div>
					</div>

					<DialogFooter>
						<OutlineButton onClick={handleCloseDialog}>
							{__('Abbrechen', 'resa')}
						</OutlineButton>
						<PrimaryButton onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
							{isSaving ? __('Speichern...', 'resa') : __('Speichern', 'resa')}
						</PrimaryButton>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<ConfirmDeleteDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				title={__('Webhook löschen?', 'resa')}
				description={__(
					'Der Webhook wird unwiderruflich gelöscht und kann nicht wiederhergestellt werden.',
					'resa',
				)}
				onConfirm={handleConfirmDelete}
				isLoading={deleteMutation.isPending}
				itemName={webhookToDelete?.name}
			/>
		</>
	);
}
