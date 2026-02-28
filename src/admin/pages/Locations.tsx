/**
 * Locations page — manage cities/regions with market data.
 *
 * Design matches Leads and ModuleStore pages.
 */

import { useState, useCallback } from 'react';
import { __, sprintf, _n } from '@wordpress/i18n';
import {
	Plus,
	MapPin,
	Pencil,
	Trash2,
	Crown,
	AlertTriangle,
	MoreHorizontal,
	ArrowLeft,
} from 'lucide-react';
import {
	useLocations,
	useCreateLocation,
	useUpdateLocation,
	useDeleteLocation,
	type LocationAdmin,
} from '../hooks/useLocations';
import { useFeatures, useLocationCount } from '../hooks/useFeatures';
import { LocationEditor, type LocationFormData } from '../components/LocationEditor';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type View = 'list' | 'create' | 'edit';

// Region type labels
const REGION_TYPE_LABELS: Record<string, string> = {
	city_center: __('Innenstadt', 'resa'),
	urban: __('Städtisch', 'resa'),
	suburban: __('Stadtrand', 'resa'),
	small_town: __('Kleinstadt', 'resa'),
	rural: __('Ländlich', 'resa'),
	medium_city: __('Mittelstadt', 'resa'),
	large_city: __('Großstadt', 'resa'),
};

export function Locations() {
	const [view, setView] = useState<View>('list');
	const [editingId, setEditingId] = useState<number | null>(null);

	const { data: locations, isLoading, error } = useLocations();
	const createMutation = useCreateLocation();
	const updateMutation = useUpdateLocation();
	const deleteMutation = useDeleteLocation();

	// Feature gate checks
	const features = useFeatures();
	const serverLocationCount = useLocationCount();
	const locationCount = locations?.length ?? serverLocationCount;
	const maxLocations = features.max_locations ?? 1;
	const isFreePlan = features.plan === 'free';
	const canAddLocation =
		features.plan === 'premium' ||
		features.max_locations === null ||
		locationCount < maxLocations;

	const pluginUrl = window.resaAdmin?.pluginUrl ?? '';
	const logoUrl = `${pluginUrl}assets/images/resa-smart-assets.png`;

	const handleCreate = useCallback(
		async (formData: LocationFormData) => {
			await createMutation.mutateAsync({
				name: formData.name,
				slug: formData.slug,
				country: formData.country,
				bundesland: formData.bundesland,
				region_type: formData.region_type,
				data: formData.data,
			});
			setView('list');
		},
		[createMutation],
	);

	const handleUpdate = useCallback(
		async (formData: LocationFormData) => {
			if (editingId === null) return;
			await updateMutation.mutateAsync({
				id: editingId,
				data: {
					name: formData.name,
					slug: formData.slug,
					country: formData.country,
					bundesland: formData.bundesland,
					region_type: formData.region_type,
					data: formData.data,
				},
			});
			setView('list');
			setEditingId(null);
		},
		[editingId, updateMutation],
	);

	const handleDelete = useCallback(
		async (id: number, name: string) => {
			if (!window.confirm(sprintf(__('Standort "%s" wirklich löschen?', 'resa'), name)))
				return;
			await deleteMutation.mutateAsync(id);
		},
		[deleteMutation],
	);

	const startEdit = (location: LocationAdmin) => {
		setEditingId(location.id);
		setView('edit');
	};

	const editingLocation = editingId ? locations?.find((l) => l.id === editingId) : undefined;

	const editInitialData: LocationFormData | undefined = editingLocation
		? {
				name: editingLocation.name,
				slug: editingLocation.slug,
				country: editingLocation.country ?? '',
				bundesland: editingLocation.bundesland ?? '',
				region_type: editingLocation.region_type ?? 'medium_city',
				data: (editingLocation.data as LocationFormData['data']) ?? {
					grunderwerbsteuer: 5.0,
					maklerprovision: 3.57,
				},
			}
		: undefined;

	// ─── Create View ───────────────────────────────────────
	if (view === 'create') {
		if (!canAddLocation) {
			return (
				<Card>
					{/* Breadcrumb Bar */}
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							backgroundColor: 'hsl(210 40% 96.1%)',
							padding: '10px 24px',
							borderRadius: '12px 12px 0 0',
						}}
					>
						<nav aria-label="breadcrumb">
							<ol
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									margin: 0,
									padding: 0,
									listStyle: 'none',
									fontSize: '14px',
								}}
							>
								<li>
									<span
										onClick={() => setView('list')}
										style={{
											color: 'hsl(215.4 16.3% 46.9%)',
											cursor: 'pointer',
										}}
									>
										{__('Standorte', 'resa')}
									</span>
								</li>
								<li style={{ color: 'hsl(215.4 16.3% 46.9%)' }}>/</li>
								<li>
									<span style={{ fontWeight: 500, color: '#1e303a' }}>
										{__('Neuer Standort', 'resa')}
									</span>
								</li>
							</ol>
						</nav>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setView('list')}
							style={{ gap: '6px' }}
						>
							<ArrowLeft style={{ width: '16px', height: '16px' }} />
							{__('Zurück', 'resa')}
						</Button>
					</div>

					<CardContent style={{ padding: '48px 24px', textAlign: 'center' }}>
						<div
							style={{
								width: '64px',
								height: '64px',
								borderRadius: '12px',
								backgroundColor: 'rgba(169, 228, 63, 0.2)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								margin: '0 auto 16px',
							}}
						>
							<Crown style={{ width: '32px', height: '32px', color: '#a9e43f' }} />
						</div>
						<h3
							style={{
								fontSize: '18px',
								fontWeight: 600,
								color: '#1e303a',
								marginBottom: '8px',
							}}
						>
							{__('Standort-Limit erreicht', 'resa')}
						</h3>
						<p
							style={{
								color: 'hsl(215.4 16.3% 46.9%)',
								marginBottom: '24px',
								maxWidth: '400px',
								margin: '0 auto 24px',
							}}
						>
							{sprintf(
								__(
									'In der kostenlosen Version kannst du maximal %d Standort anlegen. Upgrade auf Premium für unbegrenzte Standorte.',
									'resa',
								),
								maxLocations,
							)}
						</p>
						<div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
							<Button variant="outline" onClick={() => setView('list')}>
								{__('Zurück', 'resa')}
							</Button>
							<Button
								style={{
									backgroundColor: '#a9e43f',
									color: '#1e303a',
									border: 'none',
								}}
								onClick={() => window.open('https://resa-wp.com/pricing', '_blank')}
							>
								<Crown
									style={{ width: '16px', height: '16px', marginRight: '6px' }}
								/>
								{__('Auf Premium upgraden', 'resa')}
							</Button>
						</div>
					</CardContent>
				</Card>
			);
		}

		return (
			<Card>
				{/* Breadcrumb Bar */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						backgroundColor: 'hsl(210 40% 96.1%)',
						padding: '10px 24px',
						borderRadius: '12px 12px 0 0',
					}}
				>
					<nav aria-label="breadcrumb">
						<ol
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								margin: 0,
								padding: 0,
								listStyle: 'none',
								fontSize: '14px',
							}}
						>
							<li>
								<span
									onClick={() => setView('list')}
									style={{
										color: 'hsl(215.4 16.3% 46.9%)',
										cursor: 'pointer',
									}}
								>
									{__('Standorte', 'resa')}
								</span>
							</li>
							<li style={{ color: 'hsl(215.4 16.3% 46.9%)' }}>/</li>
							<li>
								<span style={{ fontWeight: 500, color: '#1e303a' }}>
									{__('Neuer Standort', 'resa')}
								</span>
							</li>
						</ol>
					</nav>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setView('list')}
						style={{ gap: '6px' }}
					>
						<ArrowLeft style={{ width: '16px', height: '16px' }} />
						{__('Zurück', 'resa')}
					</Button>
				</div>

				<CardContent style={{ padding: '24px' }}>
					<LocationEditor
						onSave={handleCreate}
						onCancel={() => setView('list')}
						isSaving={createMutation.isPending}
					/>
				</CardContent>
			</Card>
		);
	}

	// ─── Edit View ───────────────────────────────────────
	if (view === 'edit' && editInitialData) {
		return (
			<Card>
				{/* Breadcrumb Bar */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						backgroundColor: 'hsl(210 40% 96.1%)',
						padding: '10px 24px',
						borderRadius: '12px 12px 0 0',
					}}
				>
					<nav aria-label="breadcrumb">
						<ol
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								margin: 0,
								padding: 0,
								listStyle: 'none',
								fontSize: '14px',
							}}
						>
							<li>
								<span
									onClick={() => {
										setView('list');
										setEditingId(null);
									}}
									style={{
										color: 'hsl(215.4 16.3% 46.9%)',
										cursor: 'pointer',
									}}
								>
									{__('Standorte', 'resa')}
								</span>
							</li>
							<li style={{ color: 'hsl(215.4 16.3% 46.9%)' }}>/</li>
							<li>
								<span style={{ fontWeight: 500, color: '#1e303a' }}>
									{editInitialData.name}
								</span>
							</li>
						</ol>
					</nav>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							setView('list');
							setEditingId(null);
						}}
						style={{ gap: '6px' }}
					>
						<ArrowLeft style={{ width: '16px', height: '16px' }} />
						{__('Zurück', 'resa')}
					</Button>
				</div>

				<CardContent style={{ padding: '24px' }}>
					<LocationEditor
						initialData={editInitialData}
						onSave={handleUpdate}
						onCancel={() => {
							setView('list');
							setEditingId(null);
						}}
						isSaving={updateMutation.isPending}
					/>
				</CardContent>
			</Card>
		);
	}

	// ─── List View ───────────────────────────────────────
	return (
		<Card>
			{/* Header with logo */}
			<div
				style={{
					display: 'flex',
					alignItems: 'flex-start',
					justifyContent: 'space-between',
					padding: '24px',
					paddingBottom: '20px',
				}}
			>
				<div>
					<h2 style={{ fontSize: '24px', fontWeight: 600, lineHeight: 1.2, margin: 0 }}>
						{__('Standorte', 'resa')}
					</h2>
					<p
						style={{
							fontSize: '14px',
							color: 'hsl(215.4 16.3% 46.9%)',
							marginTop: '4px',
							marginBottom: 0,
						}}
					>
						{__('Verwalte Städte und Regionen mit regionalen Kostensätzen.', 'resa')}
					</p>
				</div>
				<img
					src={logoUrl}
					alt="RESA Smart Assets"
					style={{ height: '64px', width: 'auto' }}
				/>
			</div>

			<CardContent className="resa-space-y-6">
				{/* Toolbar */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
					}}
				>
					<div style={{ fontSize: '14px', color: 'hsl(215.4 16.3% 46.9%)' }}>
						{locations &&
							sprintf(
								_n('%d Standort', '%d Standorte', locations.length, 'resa'),
								locations.length,
							)}
					</div>
					<Button
						onClick={() => setView('create')}
						disabled={!canAddLocation}
						style={
							!canAddLocation
								? { opacity: 0.5, cursor: 'not-allowed' }
								: { backgroundColor: '#a9e43f', color: '#1e303a', border: 'none' }
						}
					>
						<Plus style={{ width: '16px', height: '16px', marginRight: '6px' }} />
						{__('Neuer Standort', 'resa')}
					</Button>
				</div>

				{/* Loading state */}
				{isLoading && (
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							padding: '48px',
							gap: '8px',
						}}
					>
						<Spinner style={{ width: '20px', height: '20px' }} />
						<span style={{ color: 'hsl(215.4 16.3% 46.9%)' }}>
							{__('Lade Standorte...', 'resa')}
						</span>
					</div>
				)}

				{/* Error state */}
				{error && (
					<Alert variant="destructive">
						<AlertTitle>{__('Fehler beim Laden', 'resa')}</AlertTitle>
						<AlertDescription>
							{__('Die Standorte konnten nicht geladen werden.', 'resa')}
						</AlertDescription>
					</Alert>
				)}

				{/* Empty state */}
				{locations && locations.length === 0 && (
					<div style={{ padding: '48px 0', textAlign: 'center' }}>
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
							<MapPin
								style={{
									width: '24px',
									height: '24px',
									color: 'hsl(215.4 16.3% 46.9%)',
								}}
							/>
						</div>
						<h3 style={{ fontWeight: 600, marginBottom: '4px', color: '#1e303a' }}>
							{__('Keine Standorte vorhanden', 'resa')}
						</h3>
						<p
							style={{
								color: 'hsl(215.4 16.3% 46.9%)',
								marginBottom: '16px',
							}}
						>
							{__('Erstelle deinen ersten Standort, um loszulegen.', 'resa')}
						</p>
						<Button
							onClick={() => setView('create')}
							style={{
								backgroundColor: '#a9e43f',
								color: '#1e303a',
								border: 'none',
							}}
						>
							<Plus style={{ width: '16px', height: '16px', marginRight: '6px' }} />
							{__('Ersten Standort anlegen', 'resa')}
						</Button>
					</div>
				)}

				{/* Locations table */}
				{locations && locations.length > 0 && (
					<div
						style={{
							border: '1px solid hsl(214.3 31.8% 91.4%)',
							borderRadius: '8px',
							overflow: 'hidden',
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
										}}
									>
										{__('Name', 'resa')}
									</TableHead>
									<TableHead
										style={{ paddingTop: '12px', paddingBottom: '12px' }}
									>
										{__('Bundesland', 'resa')}
									</TableHead>
									<TableHead
										style={{ paddingTop: '12px', paddingBottom: '12px' }}
									>
										{__('Regionstyp', 'resa')}
									</TableHead>
									<TableHead
										style={{ paddingTop: '12px', paddingBottom: '12px' }}
									>
										{__('GrESt', 'resa')}
									</TableHead>
									<TableHead
										style={{ paddingTop: '12px', paddingBottom: '12px' }}
									>
										{__('Status', 'resa')}
									</TableHead>
									<TableHead
										style={{
											paddingTop: '12px',
											paddingBottom: '12px',
											width: '48px',
										}}
									></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{locations.map((location) => {
									const grunderwerbsteuer = (
										location.data as Record<string, unknown>
									)?.grunderwerbsteuer;

									return (
										<TableRow
											key={location.id}
											onClick={(e) => {
												// Prevent row click when clicking dropdown
												if (
													(e.target as HTMLElement).closest(
														'button, [data-radix-collection-item]',
													)
												) {
													return;
												}
												startEdit(location);
											}}
											style={{ cursor: 'pointer' }}
										>
											<TableCell
												style={{
													paddingLeft: '16px',
													paddingTop: '12px',
													paddingBottom: '12px',
												}}
											>
												<div
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: '10px',
													}}
												>
													<div
														style={{
															width: '32px',
															height: '32px',
															borderRadius: '6px',
															backgroundColor: location.is_active
																? '#a9e43f'
																: 'hsl(210 40% 96.1%)',
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
														}}
													>
														<MapPin
															style={{
																width: '16px',
																height: '16px',
																color: location.is_active
																	? '#1e303a'
																	: 'hsl(215.4 16.3% 46.9%)',
															}}
														/>
													</div>
													<span
														style={{
															fontWeight: 500,
															color: '#1e303a',
														}}
													>
														{location.name}
													</span>
												</div>
											</TableCell>
											<TableCell
												style={{
													color: 'hsl(215.4 16.3% 46.9%)',
													paddingTop: '12px',
													paddingBottom: '12px',
												}}
											>
												{location.bundesland || '—'}
											</TableCell>
											<TableCell
												style={{
													paddingTop: '12px',
													paddingBottom: '12px',
												}}
											>
												<span
													style={{
														display: 'inline-block',
														fontSize: '11px',
														padding: '3px 10px',
														borderRadius: '9999px',
														backgroundColor: '#1e303a',
														color: 'white',
														fontWeight: 500,
													}}
												>
													{REGION_TYPE_LABELS[location.region_type] ||
														location.region_type}
												</span>
											</TableCell>
											<TableCell
												style={{
													paddingTop: '12px',
													paddingBottom: '12px',
												}}
											>
												{grunderwerbsteuer
													? `${Number(grunderwerbsteuer).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
													: '—'}
											</TableCell>
											<TableCell
												style={{
													paddingTop: '12px',
													paddingBottom: '12px',
												}}
											>
												<div
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: '6px',
													}}
												>
													<span
														style={{
															width: '8px',
															height: '8px',
															borderRadius: '50%',
															backgroundColor: location.is_active
																? '#22c55e'
																: '#d1d5db',
														}}
													/>
													<span
														style={{
															fontSize: '13px',
															color: 'hsl(215.4 16.3% 46.9%)',
														}}
													>
														{location.is_active
															? __('Aktiv', 'resa')
															: __('Inaktiv', 'resa')}
													</span>
												</div>
											</TableCell>
											<TableCell
												style={{
													paddingTop: '12px',
													paddingBottom: '12px',
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
																style={{
																	width: '16px',
																	height: '16px',
																}}
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
														<DropdownMenuLabel>
															{__('Aktionen', 'resa')}
														</DropdownMenuLabel>
														<DropdownMenuItem
															onClick={() => startEdit(location)}
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
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={() =>
																handleDelete(
																	location.id,
																	location.name,
																)
															}
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
									);
								})}
							</TableBody>
						</Table>
					</div>
				)}

				{/* Limit warning for free plan */}
				{isFreePlan && !canAddLocation && locations && locations.length > 0 && (
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							padding: '16px',
							backgroundColor: 'hsl(45 93% 94%)',
							borderRadius: '8px',
							border: '1px solid hsl(45 93% 80%)',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
							<AlertTriangle
								style={{ width: '20px', height: '20px', color: 'hsl(45 93% 40%)' }}
							/>
							<div>
								<p style={{ margin: 0, fontWeight: 500, color: '#1e303a' }}>
									{__('Standort-Limit erreicht', 'resa')}
								</p>
								<p
									style={{
										margin: 0,
										fontSize: '13px',
										color: 'hsl(215.4 16.3% 46.9%)',
									}}
								>
									{__('Upgrade auf Premium für unbegrenzte Standorte.', 'resa')}
								</p>
							</div>
						</div>
						<Button
							size="sm"
							onClick={() => window.open('https://resa-wp.com/pricing', '_blank')}
							style={{
								backgroundColor: '#1e303a',
								color: 'white',
								border: 'none',
							}}
						>
							<Crown style={{ width: '14px', height: '14px', marginRight: '6px' }} />
							{__('Upgrade', 'resa')}
						</Button>
					</div>
				)}
			</CardContent>

			{/* Footer */}
			<div
				style={{
					backgroundColor: '#1e303a',
					color: 'white',
					padding: '16px 24px',
					borderRadius: '0 0 12px 12px',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					fontSize: '13px',
				}}
			>
				<div>© {new Date().getFullYear()} RESA - smart assets</div>
				<div style={{ display: 'flex', gap: '24px' }}>
					<a
						href="https://www.resa-wp.com"
						target="_blank"
						rel="noopener noreferrer"
						style={{ color: 'white', textDecoration: 'none' }}
					>
						www.resa-wp.com
					</a>
					<a
						href="https://www.resa-wp.com/support"
						target="_blank"
						rel="noopener noreferrer"
						style={{ color: 'white', textDecoration: 'none' }}
					>
						Support
					</a>
				</div>
			</div>
		</Card>
	);
}
