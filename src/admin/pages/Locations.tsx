/**
 * Locations page — manage cities/regions with market data.
 *
 * List view with create/edit/delete actions.
 * Calculation factors are now managed in module settings.
 */

import { useState, useCallback } from 'react';
import { __, sprintf, _n } from '@wordpress/i18n';
import { Plus, MapPin, Pencil, Trash2, Building2, Crown, AlertTriangle } from 'lucide-react';
import {
	useLocations,
	useCreateLocation,
	useUpdateLocation,
	useDeleteLocation,
	type LocationAdmin,
} from '../hooks/useLocations';
import { useFeatures, useLocationCount } from '../hooks/useFeatures';
import { LocationEditor, type LocationFormData } from '../components/LocationEditor';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

type View = 'list' | 'create' | 'edit';

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
	// Use actual data when available, fallback to server-provided count
	const locationCount = locations?.length ?? serverLocationCount;
	const maxLocations = features.max_locations ?? 1;
	const isFreePlan = features.plan === 'free';
	const canAddLocation =
		features.plan === 'premium' ||
		features.max_locations === null ||
		locationCount < maxLocations;

	const handleCreate = useCallback(
		async (formData: LocationFormData) => {
			await createMutation.mutateAsync({
				name: formData.name,
				slug: formData.slug,
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

	// Get initial data for editor when editing.
	const editingLocation = editingId ? locations?.find((l) => l.id === editingId) : undefined;

	const editInitialData: LocationFormData | undefined = editingLocation
		? {
				name: editingLocation.name,
				slug: editingLocation.slug,
				bundesland: editingLocation.bundesland ?? '',
				region_type: editingLocation.region_type ?? 'medium_city',
				data: (editingLocation.data as LocationFormData['data']) ?? {
					grunderwerbsteuer: 5.0,
					maklerprovision: 3.57,
				},
			}
		: undefined;

	if (view === 'create') {
		// Block access if limit reached
		if (!canAddLocation) {
			return (
				<div className="resa-space-y-6">
					<div>
						<h1 className="resa-text-2xl resa-font-bold resa-tracking-tight">
							{__('Neuer Standort', 'resa')}
						</h1>
					</div>
					<Card>
						<CardContent className="resa-py-12 resa-text-center">
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
								<Crown
									style={{ width: '32px', height: '32px', color: '#a9e43f' }}
								/>
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
								{/* translators: %d = maximale Anzahl Standorte in der Free-Version */}
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
									onClick={() => {
										// Open Freemius upgrade page
										window.open('https://resa-wp.com/pricing', '_blank');
									}}
								>
									<Crown
										style={{
											width: '16px',
											height: '16px',
											marginRight: '6px',
										}}
									/>
									{__('Auf Premium upgraden', 'resa')}
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			);
		}

		return (
			<div className="resa-space-y-6">
				<div>
					<h1 className="resa-text-2xl resa-font-bold resa-tracking-tight">
						{__('Neuer Standort', 'resa')}
					</h1>
					<p className="resa-text-muted-foreground resa-mt-1">
						{__('Erstelle einen neuen Standort mit regionalen Kostensätzen.', 'resa')}
					</p>
				</div>
				<Card>
					<CardContent className="resa-pt-6">
						<LocationEditor
							onSave={handleCreate}
							onCancel={() => setView('list')}
							isSaving={createMutation.isPending}
						/>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (view === 'edit' && editInitialData) {
		return (
			<div className="resa-space-y-6">
				<div>
					<h1 className="resa-text-2xl resa-font-bold resa-tracking-tight">
						{sprintf(__('Standort bearbeiten: %s', 'resa'), editInitialData.name)}
					</h1>
					<p className="resa-text-muted-foreground resa-mt-1">
						{__('Bearbeite die Standortdaten und regionalen Kostensätze.', 'resa')}
					</p>
				</div>
				<Card>
					<CardContent className="resa-pt-6">
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
			</div>
		);
	}

	return (
		<div className="resa-space-y-6">
			{/* Header */}
			<div className="resa-flex resa-items-center resa-justify-between">
				<div>
					<h1 className="resa-text-2xl resa-font-bold resa-tracking-tight">
						{__('Standorte', 'resa')}
					</h1>
					<p className="resa-text-muted-foreground resa-mt-1">
						{__('Verwalte Städte und Regionen mit regionalen Kostensätzen.', 'resa')}
					</p>
				</div>
				<Button
					onClick={() => setView('create')}
					disabled={!canAddLocation}
					style={!canAddLocation ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
				>
					<Plus style={{ width: '16px', height: '16px', marginRight: '6px' }} />
					{__('Neuer Standort', 'resa')}
				</Button>
			</div>

			{/* Location limit warning for free plan */}
			{isFreePlan && (
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						padding: '16px 20px',
						backgroundColor: canAddLocation
							? 'hsl(210 40% 96.1%)'
							: 'rgba(220, 38, 38, 0.1)',
						borderRadius: '8px',
						border: canAddLocation ? 'none' : '1px solid rgba(220, 38, 38, 0.3)',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
						{canAddLocation ? (
							<MapPin
								style={{
									width: '20px',
									height: '20px',
									color: 'hsl(215.4 16.3% 46.9%)',
								}}
							/>
						) : (
							<AlertTriangle
								style={{ width: '20px', height: '20px', color: '#dc2626' }}
							/>
						)}
						<div>
							<div style={{ fontWeight: 500, color: '#1e303a', fontSize: '14px' }}>
								{canAddLocation
									? /* translators: 1: aktuelle Anzahl Standorte, 2: maximale Anzahl Standorte */
										sprintf(
											__('%1$d von %2$d Standorten verwendet', 'resa'),
											locationCount,
											maxLocations,
										)
									: __('Standort-Limit erreicht', 'resa')}
							</div>
							<div style={{ fontSize: '13px', color: 'hsl(215.4 16.3% 46.9%)' }}>
								{canAddLocation
									? __('Free-Version: 1 Standort inklusive', 'resa')
									: __('Upgrade auf Premium für unbegrenzte Standorte', 'resa')}
							</div>
						</div>
					</div>
					{!canAddLocation && (
						<Button
							variant="outline"
							size="sm"
							style={{
								borderColor: '#a9e43f',
								color: '#1e303a',
								backgroundColor: 'white',
							}}
							onClick={() => window.open('https://resa-wp.com/pricing', '_blank')}
						>
							<Crown
								style={{
									width: '14px',
									height: '14px',
									marginRight: '6px',
									color: '#a9e43f',
								}}
							/>
							{__('Upgraden', 'resa')}
						</Button>
					)}
				</div>
			)}

			{/* Loading state */}
			{isLoading && (
				<Card>
					<CardContent className="resa-py-12 resa-flex resa-items-center resa-justify-center resa-gap-2">
						<Spinner className="resa-size-5" />
						<span className="resa-text-muted-foreground">
							{__('Lade Standorte...', 'resa')}
						</span>
					</CardContent>
				</Card>
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
				<Card>
					<CardContent className="resa-py-12 resa-text-center">
						<div className="resa-mx-auto resa-flex resa-size-12 resa-items-center resa-justify-center resa-rounded-full resa-bg-muted resa-mb-4">
							<MapPin className="resa-size-6 resa-text-muted-foreground" />
						</div>
						<h3 className="resa-font-semibold resa-mb-1">
							{__('Keine Standorte vorhanden', 'resa')}
						</h3>
						<p className="resa-text-muted-foreground resa-mb-4">
							{__('Erstelle deinen ersten Standort, um loszulegen.', 'resa')}
						</p>
						<Button onClick={() => setView('create')} variant="outline">
							<Plus className="resa-mr-2 resa-size-4" />
							{__('Ersten Standort anlegen', 'resa')}
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Locations table */}
			{locations && locations.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="resa-text-lg">
							{sprintf(
								_n('%d Standort', '%d Standorte', locations.length, 'resa'),
								locations.length,
							)}
						</CardTitle>
						<CardDescription>
							{__(
								'Übersicht aller konfigurierten Standorte und ihrer Kostensätze.',
								'resa',
							)}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{__('Name', 'resa')}</TableHead>
									<TableHead>{__('Bundesland', 'resa')}</TableHead>
									<TableHead>{__('Regionstyp', 'resa')}</TableHead>
									<TableHead>{__('GrESt', 'resa')}</TableHead>
									<TableHead>{__('Status', 'resa')}</TableHead>
									<TableHead className="resa-text-right">
										{__('Aktionen', 'resa')}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{locations.map((location) => {
									const regionTypeLabels: Record<string, string> = {
										rural: __('Ländlich', 'resa'),
										small_town: __('Kleinstadt', 'resa'),
										medium_city: __('Mittelstadt', 'resa'),
										large_city: __('Großstadt', 'resa'),
									};
									const grunderwerbsteuer = (
										location.data as Record<string, unknown>
									)?.grunderwerbsteuer;

									return (
										<TableRow key={location.id}>
											<TableCell>
												<div className="resa-flex resa-items-center resa-gap-2">
													<div className="resa-flex resa-size-8 resa-items-center resa-justify-center resa-rounded-md resa-bg-muted">
														<Building2 className="resa-size-4 resa-text-muted-foreground" />
													</div>
													<span className="resa-font-medium">
														{location.name}
													</span>
												</div>
											</TableCell>
											<TableCell className="resa-text-muted-foreground">
												{location.bundesland || '—'}
											</TableCell>
											<TableCell>
												<Badge variant="secondary">
													{regionTypeLabels[location.region_type] ||
														location.region_type}
												</Badge>
											</TableCell>
											<TableCell>
												{grunderwerbsteuer
													? `${Number(grunderwerbsteuer).toFixed(1)}%`
													: '—'}
											</TableCell>
											<TableCell>
												<div className="resa-flex resa-items-center resa-gap-2">
													<span
														className={`resa-inline-flex resa-size-2 resa-rounded-full ${
															location.is_active
																? 'resa-bg-green-500'
																: 'resa-bg-gray-300'
														}`}
													/>
													<span className="resa-text-sm resa-text-muted-foreground">
														{location.is_active
															? __('Aktiv', 'resa')
															: __('Inaktiv', 'resa')}
													</span>
												</div>
											</TableCell>
											<TableCell className="resa-text-right">
												<div className="resa-flex resa-items-center resa-justify-end resa-gap-1">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => startEdit(location)}
														className="resa-gap-1"
													>
														<Pencil className="resa-size-3" />
														{__('Bearbeiten', 'resa')}
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															handleDelete(location.id, location.name)
														}
														disabled={deleteMutation.isPending}
														className="resa-text-destructive hover:resa-text-destructive"
													>
														<Trash2 className="resa-size-3" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
