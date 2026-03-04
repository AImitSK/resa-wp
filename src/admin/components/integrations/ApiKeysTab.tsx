/**
 * API Keys tab — key management + endpoint documentation.
 *
 * Allows creating, toggling, and deleting API keys for external read-only access.
 * Keys are shown only once on creation. Limited to 5 keys. Premium-only.
 */

import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Key, Plus, Trash2, Copy, Check, BookOpen, AlertTriangle } from 'lucide-react';

import {
	useApiKeys,
	useCreateApiKey,
	useUpdateApiKey,
	useDeleteApiKey,
} from '../../hooks/useApiKeys';
import type { ApiKeyConfig, ApiKeyCreateResponse } from '../../types';

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

const MAX_API_KEYS = 5;

export function ApiKeysTab() {
	const { data: apiKeys, isLoading } = useApiKeys();
	const createMutation = useCreateApiKey();
	const updateMutation = useUpdateApiKey();
	const deleteMutation = useDeleteApiKey();

	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [revealDialogOpen, setRevealDialogOpen] = useState(false);
	const [createdKey, setCreatedKey] = useState<ApiKeyCreateResponse | null>(null);
	const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
	const [formName, setFormName] = useState('');
	const [copied, setCopied] = useState(false);
	const [feedback, setFeedback] = useState<{
		type: 'success' | 'error';
		message: string;
	} | null>(null);

	const clearFeedback = () => {
		setTimeout(() => setFeedback(null), 5000);
	};

	const openCreateDialog = () => {
		setFormName('');
		setCreateDialogOpen(true);
	};

	const handleCreate = async () => {
		try {
			const result = await createMutation.mutateAsync({ name: formName });
			setCreateDialogOpen(false);
			setCreatedKey(result);
			setRevealDialogOpen(true);
		} catch {
			setFeedback({
				type: 'error',
				message: __('Fehler beim Erstellen des API-Schlüssels.', 'resa'),
			});
			clearFeedback();
		}
	};

	const handleToggle = async (apiKey: ApiKeyConfig) => {
		try {
			await updateMutation.mutateAsync({
				id: apiKey.id,
				data: { isActive: !apiKey.isActive },
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
				message: __('API-Schlüssel gelöscht.', 'resa'),
			});
		} catch {
			setFeedback({
				type: 'error',
				message: __('Fehler beim Löschen des API-Schlüssels.', 'resa'),
			});
		}
		clearFeedback();
	};

	const copyKey = () => {
		if (createdKey?.key) {
			navigator.clipboard.writeText(createdKey.key);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleRevealClose = () => {
		setRevealDialogOpen(false);
		setCreatedKey(null);
		setCopied(false);
	};

	const count = apiKeys?.length ?? 0;
	const isAtLimit = count >= MAX_API_KEYS;

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="resa-h-6 resa-w-32" />
				</CardHeader>
				<CardContent className="resa-space-y-3">
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

			{/* Key Management Card */}
			<Card>
				<CardHeader>
					<div className="resa-flex resa-items-center resa-justify-between">
						<CardTitle className="resa-flex resa-items-center resa-gap-2">
							<Key className="resa-h-5 resa-w-5" />
							{__('API-Schlüssel', 'resa')}
							{count > 0 && (
								<Badge variant="secondary">
									{count}/{MAX_API_KEYS}
								</Badge>
							)}
						</CardTitle>
						<Button size="sm" onClick={openCreateDialog} disabled={isAtLimit}>
							<Plus className="resa-h-4 resa-w-4 resa-mr-1" />
							{__('API-Schlüssel erstellen', 'resa')}
						</Button>
					</div>
					{isAtLimit && (
						<p className="resa-text-sm resa-text-muted-foreground">
							{__('Maximal 5 API-Schlüssel erlaubt.', 'resa')}
						</p>
					)}
				</CardHeader>

				<CardContent>
					{/* Empty state */}
					{(!apiKeys || apiKeys.length === 0) && (
						<div className="resa-flex resa-flex-col resa-items-center resa-justify-center resa-py-12 resa-text-center">
							<Key className="resa-h-12 resa-w-12 resa-text-muted-foreground resa-mb-4" />
							<p className="resa-text-lg resa-font-medium resa-mb-1">
								{__('Noch keine API-Schlüssel', 'resa')}
							</p>
							<p className="resa-text-sm resa-text-muted-foreground resa-mb-4">
								{__(
									'Erstellen Sie API-Schlüssel für den externen Zugriff auf Leads und Standorte.',
									'resa',
								)}
							</p>
							<Button size="sm" onClick={openCreateDialog}>
								<Plus className="resa-h-4 resa-w-4 resa-mr-1" />
								{__('Ersten API-Schlüssel erstellen', 'resa')}
							</Button>
						</div>
					)}

					{/* Key list */}
					{apiKeys && apiKeys.length > 0 && (
						<div className="resa-space-y-3">
							{apiKeys.map((apiKey, index) => (
								<div key={apiKey.id}>
									{index > 0 && <Separator className="resa-mb-3" />}
									<div className="resa-flex resa-items-center resa-justify-between resa-gap-4">
										<div className="resa-flex-1 resa-min-w-0">
											<div className="resa-flex resa-items-center resa-gap-2 resa-mb-1">
												<span className="resa-font-medium resa-text-sm">
													{apiKey.name}
												</span>
												<Badge
													variant="outline"
													className="resa-font-mono resa-text-xs"
												>
													{apiKey.keyPrefix}...
												</Badge>
											</div>
											<p className="resa-text-xs resa-text-muted-foreground">
												{apiKey.lastUsedAt
													? `${__('Letzte Nutzung:', 'resa')} ${new Date(apiKey.lastUsedAt).toLocaleDateString('de-DE')}`
													: __('Noch nicht verwendet', 'resa')}
												{' · '}
												{__('Erstellt:', 'resa')}{' '}
												{new Date(apiKey.createdAt).toLocaleDateString(
													'de-DE',
												)}
											</p>
										</div>

										<div className="resa-flex resa-items-center resa-gap-2 resa-shrink-0">
											<Switch
												checked={apiKey.isActive}
												onCheckedChange={() => handleToggle(apiKey)}
											/>
											{deleteConfirmId === apiKey.id ? (
												<div className="resa-flex resa-items-center resa-gap-1">
													<Button
														variant="destructive"
														size="sm"
														onClick={() => handleDelete(apiKey.id)}
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
													onClick={() => setDeleteConfirmId(apiKey.id)}
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

			{/* Endpoint Documentation Card */}
			<EndpointDocs />

			{/* Create Dialog */}
			<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{__('API-Schlüssel erstellen', 'resa')}</DialogTitle>
					</DialogHeader>

					<div className="resa-space-y-4 resa-py-4">
						<div className="resa-space-y-2">
							<Label htmlFor="api-key-name">{__('Name', 'resa')}</Label>
							<Input
								id="api-key-name"
								value={formName}
								onChange={(e) => setFormName(e.target.value)}
								placeholder={__('z.B. Mein Dashboard', 'resa')}
							/>
							<p className="resa-text-xs resa-text-muted-foreground">
								{__(
									'Ein Name zur Identifikation des Schlüssels (z.B. App-Name oder Zweck).',
									'resa',
								)}
							</p>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
							{__('Abbrechen', 'resa')}
						</Button>
						<Button
							onClick={handleCreate}
							disabled={formName.trim() === '' || createMutation.isPending}
						>
							{createMutation.isPending
								? __('Erstellen...', 'resa')
								: __('Erstellen', 'resa')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Reveal Dialog (shown after creation) */}
			<Dialog open={revealDialogOpen} onOpenChange={handleRevealClose}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{__('API-Schlüssel erstellt', 'resa')}</DialogTitle>
					</DialogHeader>

					<div className="resa-space-y-4 resa-py-4">
						<Alert>
							<AlertTriangle className="resa-h-4 resa-w-4" />
							<AlertDescription>
								{__(
									'Kopieren Sie diesen Schlüssel jetzt! Er wird nach dem Schließen dieses Dialogs nicht mehr angezeigt.',
									'resa',
								)}
							</AlertDescription>
						</Alert>

						<div className="resa-flex resa-gap-2">
							<Input
								value={createdKey?.key ?? ''}
								readOnly
								className="resa-font-mono resa-text-xs"
							/>
							<Button
								variant="outline"
								size="sm"
								onClick={copyKey}
								title={copied ? __('Kopiert!', 'resa') : __('Kopieren', 'resa')}
							>
								{copied ? (
									<Check className="resa-h-4 resa-w-4" />
								) : (
									<Copy className="resa-h-4 resa-w-4" />
								)}
							</Button>
						</div>
					</div>

					<DialogFooter>
						<Button onClick={handleRevealClose}>{__('Verstanden', 'resa')}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

/**
 * Endpoint documentation section.
 */
function EndpointDocs() {
	const restUrl = window.resaAdmin?.restUrl ?? '/wp-json/resa/v1/';
	const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

	const endpoints = [
		{
			method: 'GET',
			path: 'external/leads',
			description: __(
				'Paginierte Lead-Liste (Query: page, perPage, status, assetType)',
				'resa',
			),
		},
		{
			method: 'GET',
			path: 'external/leads/{id}',
			description: __('Lead-Detail (ohne interne Felder)', 'resa'),
		},
		{
			method: 'GET',
			path: 'external/locations',
			description: __('Alle aktiven Standorte', 'resa'),
		},
	];

	const copyCurl = (path: string) => {
		const url = `${window.location.origin}${restUrl}${path}`;
		const curl = `curl -H "Authorization: Bearer resa_YOUR_KEY" "${url}"`;
		navigator.clipboard.writeText(curl);
		setCopiedEndpoint(path);
		setTimeout(() => setCopiedEndpoint(null), 2000);
	};

	return (
		<Card className="resa-mt-4">
			<CardHeader>
				<CardTitle className="resa-flex resa-items-center resa-gap-2">
					<BookOpen className="resa-h-5 resa-w-5" />
					{__('API-Endpunkte', 'resa')}
				</CardTitle>
				<p className="resa-text-sm resa-text-muted-foreground">
					{__('Authentifizierung via Bearer-Token im Authorization-Header.', 'resa')}
				</p>
			</CardHeader>
			<CardContent>
				<div className="resa-space-y-3">
					{endpoints.map((endpoint) => (
						<div
							key={endpoint.path}
							className="resa-flex resa-items-center resa-justify-between resa-gap-4"
						>
							<div className="resa-flex resa-items-center resa-gap-2 resa-flex-1 resa-min-w-0">
								<Badge variant="secondary" className="resa-shrink-0">
									{endpoint.method}
								</Badge>
								<code className="resa-text-xs resa-font-mono resa-truncate">
									{restUrl}
									{endpoint.path}
								</code>
							</div>
							<div className="resa-flex resa-items-center resa-gap-2 resa-shrink-0">
								<span className="resa-text-xs resa-text-muted-foreground resa-hidden sm:resa-inline">
									{endpoint.description}
								</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => copyCurl(endpoint.path)}
									title={__('curl kopieren', 'resa')}
								>
									{copiedEndpoint === endpoint.path ? (
										<Check className="resa-h-4 resa-w-4" />
									) : (
										<Copy className="resa-h-4 resa-w-4" />
									)}
								</Button>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
