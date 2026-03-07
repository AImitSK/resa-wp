/**
 * API Keys tab — key management + endpoint documentation.
 *
 * Allows creating, toggling, and deleting API keys for external read-only access.
 * Keys are shown only once on creation. Limited to 5 keys. Premium-only.
 */

import { useState, type ReactNode } from 'react';
import { __ } from '@wordpress/i18n';
import {
	Plus,
	Trash2,
	Copy,
	Check,
	BookOpen,
	AlertTriangle,
	ChevronDown,
	Code,
	MoreHorizontal,
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
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
import { Separator } from '@/components/ui/separator';

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

const MAX_API_KEYS = 5;

export function ApiKeysTab() {
	const { data: apiKeys, isLoading } = useApiKeys();
	const createMutation = useCreateApiKey();
	const updateMutation = useUpdateApiKey();
	const deleteMutation = useDeleteApiKey();

	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [revealDialogOpen, setRevealDialogOpen] = useState(false);
	const [createdKey, setCreatedKey] = useState<ApiKeyCreateResponse | null>(null);
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

	if (isLoading) {
		return (
			<div>
				<Skeleton className="resa-h-6 resa-w-32 resa-mb-4" />
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
					<h4 style={headlineStyle}>{__('API-Schlüssel', 'resa')}</h4>
					<p style={sublineStyle}>
						{__(
							'Erstellen Sie API-Schlüssel für den externen Zugriff auf Leads und Standorte.',
							'resa',
						)}
					</p>
				</div>
				<PrimaryButton onClick={openCreateDialog} disabled={isAtLimit}>
					<Plus style={{ width: '16px', height: '16px' }} />
					{__('API-Schlüssel erstellen', 'resa')}
				</PrimaryButton>
			</div>

			{isAtLimit && (
				<p style={{ fontSize: '13px', color: '#dc2626', margin: '0 0 16px 0' }}>
					{__('Maximal 5 API-Schlüssel erlaubt.', 'resa')}
				</p>
			)}

			{/* Empty state */}
			{(!apiKeys || apiKeys.length === 0) && (
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
						{__('Noch keine API-Schlüssel', 'resa')}
					</p>
					<p
						style={{
							fontSize: '14px',
							color: '#1e303a',
							margin: '0 0 16px 0',
						}}
					>
						{__(
							'Ermöglichen Sie externen Systemen den Zugriff auf Ihre Daten.',
							'resa',
						)}
					</p>
					<OutlineButton onClick={openCreateDialog}>
						<Plus style={{ width: '16px', height: '16px' }} />
						{__('Ersten API-Schlüssel erstellen', 'resa')}
					</OutlineButton>
				</div>
			)}

			{/* API Keys Table */}
			{apiKeys && apiKeys.length > 0 && (
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
									{__('Schlüssel', 'resa')}
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
									{__('Letzte Nutzung', 'resa')}
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
							{apiKeys.map((apiKey, idx) => (
								<TableRow key={apiKey.id}>
									<TableCell
										style={{
											paddingLeft: '16px',
											paddingTop: '12px',
											paddingBottom: '12px',
											fontWeight: 500,
											color: '#1e303a',
											borderBottom:
												idx === apiKeys.length - 1
													? 'none'
													: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										{apiKey.name}
									</TableCell>
									<TableCell
										style={{
											paddingTop: '12px',
											paddingBottom: '12px',
											borderBottom:
												idx === apiKeys.length - 1
													? 'none'
													: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										<Badge
											variant="outline"
											style={{ fontFamily: 'monospace', fontSize: '11px' }}
										>
											{apiKey.keyPrefix}...
										</Badge>
									</TableCell>
									<TableCell
										style={{
											paddingTop: '12px',
											paddingBottom: '12px',
											color: '#1e303a',
											fontSize: '13px',
											borderBottom:
												idx === apiKeys.length - 1
													? 'none'
													: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										{apiKey.lastUsedAt
											? new Date(apiKey.lastUsedAt).toLocaleDateString(
													'de-DE',
												)
											: __('Noch nie', 'resa')}
									</TableCell>
									<TableCell
										style={{
											paddingTop: '12px',
											paddingBottom: '12px',
											textAlign: 'center',
											borderBottom:
												idx === apiKeys.length - 1
													? 'none'
													: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										<Switch
											checked={apiKey.isActive}
											onCheckedChange={() => handleToggle(apiKey)}
										/>
									</TableCell>
									<TableCell
										style={{
											paddingTop: '12px',
											paddingBottom: '12px',
											paddingRight: '16px',
											borderBottom:
												idx === apiKeys.length - 1
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
													onClick={() => handleDelete(apiKey.id)}
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
						<OutlineButton onClick={() => setCreateDialogOpen(false)}>
							{__('Abbrechen', 'resa')}
						</OutlineButton>
						<PrimaryButton
							onClick={handleCreate}
							disabled={formName.trim() === '' || createMutation.isPending}
						>
							{createMutation.isPending
								? __('Erstellen...', 'resa')
								: __('Erstellen', 'resa')}
						</PrimaryButton>
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
						<PrimaryButton onClick={handleRevealClose}>
							{__('Verstanden', 'resa')}
						</PrimaryButton>
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
