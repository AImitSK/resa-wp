/**
 * API Keys tab — key management + endpoint documentation.
 *
 * Allows creating, toggling, and deleting API keys for external read-only access.
 * Keys are shown only once on creation. Limited to 5 keys. Premium-only.
 */

import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import {
	Key,
	Plus,
	Trash2,
	Copy,
	Check,
	BookOpen,
	AlertTriangle,
	ChevronDown,
	Code,
} from 'lucide-react';

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
 * Endpoint documentation section with quick-start example and per-endpoint details.
 */
function EndpointDocs() {
	const restUrl = window.resaAdmin?.restUrl ?? '/wp-json/resa/v1/';
	const baseUrl = `${window.location.origin}${restUrl}`;
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

	const copyText = (text: string, id: string) => {
		navigator.clipboard.writeText(text);
		setCopiedId(id);
		setTimeout(() => setCopiedId(null), 2000);
	};

	const toggleEndpoint = (path: string) => {
		setExpandedEndpoint((prev) => (prev === path ? null : path));
	};

	const quickStartCode = `fetch("${baseUrl}external/leads", {
  headers: {
    "Authorization": "Bearer resa_YOUR_API_KEY"
  }
})
.then(res => res.json())
.then(data => console.log(data.items));`;

	const endpoints = [
		{
			method: 'GET',
			path: 'external/leads',
			description: __(
				'Paginierte Lead-Liste. Query-Parameter: page, perPage, status, assetType.',
				'resa',
			),
			curl: `curl -H "Authorization: Bearer resa_YOUR_KEY" \\\n  "${baseUrl}external/leads?page=1&perPage=25"`,
			response: `{
  "items": [
    {
      "id": 1,
      "assetType": "rent-calculator",
      "status": "new",
      "firstName": "Maria",
      "lastName": "Schmidt",
      "email": "maria@example.com",
      "phone": "+49 123 456789",
      "locationId": 1,
      "locationName": "Berlin",
      "createdAt": "2025-06-01 10:30:00",
      "completedAt": "2025-06-01 10:32:00"
    }
  ],
  "total": 42,
  "page": 1,
  "perPage": 25,
  "totalPages": 2
}`,
		},
		{
			method: 'GET',
			path: 'external/leads/{id}',
			description: __(
				'Einzelner Lead mit Eingaben und Ergebnis. Ohne interne Felder (notes, meta, consent_text).',
				'resa',
			),
			curl: `curl -H "Authorization: Bearer resa_YOUR_KEY" \\\n  "${baseUrl}external/leads/1"`,
			response: `{
  "id": 1,
  "sessionId": "a1b2c3d4-...",
  "assetType": "rent-calculator",
  "status": "new",
  "firstName": "Maria",
  "lastName": "Schmidt",
  "email": "maria@example.com",
  "phone": "+49 123 456789",
  "company": null,
  "salutation": "Frau",
  "message": null,
  "locationId": 1,
  "agentId": null,
  "inputs": { "propertyType": "apartment", "areaSqm": 75 },
  "result": { "rentMin": 562.5, "rentMax": 735.0 },
  "consentGiven": true,
  "pdfSent": false,
  "createdAt": "2025-06-01 10:30:00",
  "updatedAt": "2025-06-01 10:32:00",
  "completedAt": "2025-06-01 10:32:00"
}`,
		},
		{
			method: 'GET',
			path: 'external/locations',
			description: __('Alle aktiven Standorte mit Koordinaten.', 'resa'),
			curl: `curl -H "Authorization: Bearer resa_YOUR_KEY" \\\n  "${baseUrl}external/locations"`,
			response: `[
  {
    "id": 1,
    "slug": "berlin",
    "name": "Berlin",
    "country": "DE",
    "bundesland": "Berlin",
    "regionType": "city",
    "latitude": 52.52,
    "longitude": 13.405,
    "isActive": true
  }
]`,
		},
	];

	return (
		<Card className="resa-mt-4">
			<CardHeader>
				<CardTitle className="resa-flex resa-items-center resa-gap-2">
					<BookOpen className="resa-h-5 resa-w-5" />
					{__('API-Dokumentation', 'resa')}
				</CardTitle>
				<p className="resa-text-sm resa-text-muted-foreground">
					{__(
						'Read-only Zugriff auf Leads und Standorte via Bearer-Token im Authorization-Header.',
						'resa',
					)}
				</p>
			</CardHeader>
			<CardContent className="resa-space-y-6">
				{/* Quick Start */}
				<div>
					<div className="resa-flex resa-items-center resa-justify-between resa-mb-2">
						<h4 className="resa-text-sm resa-font-medium resa-flex resa-items-center resa-gap-1.5">
							<Code className="resa-h-4 resa-w-4" />
							{__('Quick Start', 'resa')}
						</h4>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => copyText(quickStartCode, 'quickstart')}
							title={__('Kopieren', 'resa')}
						>
							{copiedId === 'quickstart' ? (
								<Check className="resa-h-4 resa-w-4" />
							) : (
								<Copy className="resa-h-4 resa-w-4" />
							)}
						</Button>
					</div>
					<pre className="resa-bg-muted resa-rounded-md resa-p-3 resa-text-xs resa-font-mono resa-overflow-x-auto resa-whitespace-pre">
						{quickStartCode}
					</pre>
				</div>

				<Separator />

				{/* Endpoints */}
				<div className="resa-space-y-2">
					<h4 className="resa-text-sm resa-font-medium resa-mb-3">
						{__('Endpunkte', 'resa')}
					</h4>
					{endpoints.map((endpoint) => {
						const isExpanded = expandedEndpoint === endpoint.path;
						return (
							<div
								key={endpoint.path}
								className="resa-border resa-rounded-md resa-overflow-hidden"
							>
								{/* Endpoint header (clickable) */}
								<button
									type="button"
									className="resa-flex resa-items-center resa-justify-between resa-gap-3 resa-w-full resa-px-3 resa-py-2.5 resa-text-left hover:resa-bg-muted/50 resa-transition-colors"
									onClick={() => toggleEndpoint(endpoint.path)}
								>
									<div className="resa-flex resa-items-center resa-gap-2 resa-min-w-0">
										<Badge
											variant="secondary"
											className="resa-shrink-0 resa-text-xs"
										>
											{endpoint.method}
										</Badge>
										<code className="resa-text-xs resa-font-mono resa-truncate">
											{restUrl}
											{endpoint.path}
										</code>
									</div>
									<ChevronDown
										className={`resa-h-4 resa-w-4 resa-shrink-0 resa-text-muted-foreground resa-transition-transform ${isExpanded ? 'resa-rotate-180' : ''}`}
									/>
								</button>

								{/* Expanded details */}
								{isExpanded && (
									<div className="resa-border-t resa-px-3 resa-py-3 resa-space-y-3 resa-bg-muted/30">
										<p className="resa-text-xs resa-text-muted-foreground">
											{endpoint.description}
										</p>

										{/* curl example */}
										<div>
											<div className="resa-flex resa-items-center resa-justify-between resa-mb-1">
												<span className="resa-text-xs resa-font-medium">
													curl
												</span>
												<Button
													variant="ghost"
													size="sm"
													className="resa-h-6 resa-px-1.5"
													onClick={(e) => {
														e.stopPropagation();
														copyText(
															endpoint.curl,
															`curl-${endpoint.path}`,
														);
													}}
												>
													{copiedId === `curl-${endpoint.path}` ? (
														<Check className="resa-h-3.5 resa-w-3.5" />
													) : (
														<Copy className="resa-h-3.5 resa-w-3.5" />
													)}
												</Button>
											</div>
											<pre className="resa-bg-muted resa-rounded resa-p-2 resa-text-xs resa-font-mono resa-overflow-x-auto resa-whitespace-pre">
												{endpoint.curl}
											</pre>
										</div>

										{/* Example response */}
										<div>
											<div className="resa-flex resa-items-center resa-justify-between resa-mb-1">
												<span className="resa-text-xs resa-font-medium">
													{__('Beispiel-Response', 'resa')}
												</span>
												<Button
													variant="ghost"
													size="sm"
													className="resa-h-6 resa-px-1.5"
													onClick={(e) => {
														e.stopPropagation();
														copyText(
															endpoint.response,
															`resp-${endpoint.path}`,
														);
													}}
												>
													{copiedId === `resp-${endpoint.path}` ? (
														<Check className="resa-h-3.5 resa-w-3.5" />
													) : (
														<Copy className="resa-h-3.5 resa-w-3.5" />
													)}
												</Button>
											</div>
											<pre className="resa-bg-muted resa-rounded resa-p-2 resa-text-xs resa-font-mono resa-overflow-x-auto resa-whitespace-pre resa-max-h-64 resa-overflow-y-auto">
												{endpoint.response}
											</pre>
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
