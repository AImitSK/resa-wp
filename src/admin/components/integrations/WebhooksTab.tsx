/**
 * Webhooks tab — full CRUD UI for webhook management.
 *
 * Allows creating, editing, testing, toggling, and deleting webhooks.
 * Limited to 5 webhooks. Premium-only (gate is handled at page level).
 */

import { useState, type ReactNode } from 'react';
import { __ } from '@wordpress/i18n';
import { Plus, Pencil, Trash2, Send, Copy, Check, RefreshCw, MoreHorizontal } from 'lucide-react';

import {
	useWebhooks,
	useCreateWebhook,
	useUpdateWebhook,
	useDeleteWebhook,
	useTestWebhook,
} from '../../hooks/useWebhooks';
import type { WebhookConfig, WebhookFormData } from '../../types';

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

export function WebhooksTab() {
	const { data: webhooks, isLoading } = useWebhooks();
	const createMutation = useCreateWebhook();
	const updateMutation = useUpdateWebhook();
	const deleteMutation = useDeleteWebhook();
	const testMutation = useTestWebhook();

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
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
													onClick={() => handleDelete(webhook.id)}
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
