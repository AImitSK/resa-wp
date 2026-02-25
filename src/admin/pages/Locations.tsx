/**
 * Locations page — manage cities/regions with market data.
 *
 * List view with create/edit/delete actions.
 * Editor supports Pauschal (preset) and Individuell (custom) modes.
 */

import { useState, useCallback } from 'react';
import {
	useLocations,
	useCreateLocation,
	useUpdateLocation,
	useDeleteLocation,
	type LocationAdmin,
} from '../hooks/useLocations';
import { LocationEditor, type LocationFormData } from '../components/LocationEditor';

type View = 'list' | 'create' | 'edit';

export function Locations() {
	const [view, setView] = useState<View>('list');
	const [editingId, setEditingId] = useState<number | null>(null);

	const { data: locations, isLoading, error } = useLocations();
	const createMutation = useCreateLocation();
	const updateMutation = useUpdateLocation();
	const deleteMutation = useDeleteLocation();

	const handleCreate = useCallback(
		async (formData: LocationFormData) => {
			await createMutation.mutateAsync({
				name: formData.name,
				slug: formData.slug,
				bundesland: formData.bundesland,
				data: formData.data,
				factors: formData.factors,
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
					data: formData.data,
					factors: formData.factors,
				},
			});
			setView('list');
			setEditingId(null);
		},
		[editingId, updateMutation],
	);

	const handleDelete = useCallback(
		async (id: number, name: string) => {
			if (!window.confirm(`Location "${name}" wirklich löschen?`)) return;
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
				setup_mode:
					(editingLocation.data?.setup_mode as 'pauschal' | 'individuell') ?? 'pauschal',
				region_preset: (editingLocation.data?.region_preset as string) ?? 'medium_city',
				data: editingLocation.data ?? {},
				factors: editingLocation.factors,
			}
		: undefined;

	if (view === 'create') {
		return (
			<div>
				<h1 className="resa-text-2xl resa-font-bold resa-mb-4">Neue Location</h1>
				<div className="resa-rounded-lg resa-border resa-bg-card resa-p-6">
					<LocationEditor
						onSave={handleCreate}
						onCancel={() => setView('list')}
						isSaving={createMutation.isPending}
					/>
				</div>
			</div>
		);
	}

	if (view === 'edit' && editInitialData) {
		return (
			<div>
				<h1 className="resa-text-2xl resa-font-bold resa-mb-4">
					Location bearbeiten: {editInitialData.name}
				</h1>
				<div className="resa-rounded-lg resa-border resa-bg-card resa-p-6">
					<LocationEditor
						initialData={editInitialData}
						onSave={handleUpdate}
						onCancel={() => {
							setView('list');
							setEditingId(null);
						}}
						isSaving={updateMutation.isPending}
					/>
				</div>
			</div>
		);
	}

	return (
		<div>
			<div className="resa-flex resa-items-center resa-justify-between resa-mb-4">
				<div>
					<h1 className="resa-text-2xl resa-font-bold">Locations</h1>
					<p className="resa-text-muted-foreground resa-text-sm">
						Verwalte Städte und Regionen mit regionalen Marktdaten.
					</p>
				</div>
				<button
					onClick={() => setView('create')}
					className="resa-px-4 resa-py-2 resa-text-sm resa-font-medium resa-rounded-md resa-bg-primary resa-text-primary-foreground hover:resa-bg-primary/90"
				>
					+ Neue Location
				</button>
			</div>

			{isLoading && (
				<div className="resa-rounded-lg resa-border resa-bg-card resa-p-6 resa-text-center">
					<p className="resa-text-sm resa-text-muted-foreground">Lade Locations...</p>
				</div>
			)}

			{error && (
				<div className="resa-rounded-lg resa-border resa-border-destructive/50 resa-bg-destructive/5 resa-p-6">
					<p className="resa-text-sm resa-text-destructive">
						Fehler beim Laden der Locations.
					</p>
				</div>
			)}

			{locations && locations.length === 0 && (
				<div className="resa-rounded-lg resa-border resa-bg-card resa-p-8 resa-text-center">
					<p className="resa-text-muted-foreground resa-mb-3">
						Noch keine Locations angelegt.
					</p>
					<button
						onClick={() => setView('create')}
						className="resa-text-sm resa-text-primary resa-underline"
					>
						Erste Location anlegen
					</button>
				</div>
			)}

			{locations && locations.length > 0 && (
				<div className="resa-rounded-lg resa-border resa-bg-card">
					<table className="resa-w-full resa-text-sm">
						<thead>
							<tr className="resa-border-b">
								<th className="resa-text-left resa-p-3 resa-font-medium">Name</th>
								<th className="resa-text-left resa-p-3 resa-font-medium">Slug</th>
								<th className="resa-text-left resa-p-3 resa-font-medium">Modus</th>
								<th className="resa-text-left resa-p-3 resa-font-medium">
									Basispreis
								</th>
								<th className="resa-text-left resa-p-3 resa-font-medium">Status</th>
								<th className="resa-text-right resa-p-3 resa-font-medium">
									Aktionen
								</th>
							</tr>
						</thead>
						<tbody>
							{locations.map((location) => {
								const setupMode =
									(location.data?.setup_mode as string) ?? 'pauschal';
								const effectiveData = location.factors ?? location.data ?? {};
								const basePrice = (effectiveData as Record<string, unknown>)
									.base_price as number | undefined;

								return (
									<tr
										key={location.id}
										className="resa-border-b last:resa-border-0"
									>
										<td className="resa-p-3 resa-font-medium">
											{location.name}
										</td>
										<td className="resa-p-3 resa-text-muted-foreground">
											{location.slug}
										</td>
										<td className="resa-p-3">
											<span
												className={`resa-inline-flex resa-items-center resa-rounded-full resa-px-2 resa-py-0.5 resa-text-xs resa-font-medium ${
													setupMode === 'individuell'
														? 'resa-bg-blue-100 resa-text-blue-700'
														: 'resa-bg-green-100 resa-text-green-700'
												}`}
											>
												{setupMode}
											</span>
										</td>
										<td className="resa-p-3">
											{basePrice
												? `${Number(basePrice).toFixed(2)} EUR/m²`
												: '—'}
										</td>
										<td className="resa-p-3">
											<span
												className={`resa-inline-flex resa-h-2 resa-w-2 resa-rounded-full ${
													location.is_active
														? 'resa-bg-green-500'
														: 'resa-bg-gray-300'
												}`}
											/>
										</td>
										<td className="resa-p-3 resa-text-right">
											<button
												onClick={() => startEdit(location)}
												className="resa-text-xs resa-text-primary hover:resa-underline resa-mr-3"
											>
												Bearbeiten
											</button>
											<button
												onClick={() =>
													handleDelete(location.id, location.name)
												}
												className="resa-text-xs resa-text-destructive hover:resa-underline"
												disabled={deleteMutation.isPending}
											>
												Löschen
											</button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
