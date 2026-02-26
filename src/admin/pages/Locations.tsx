/**
 * Locations page — manage cities/regions with market data.
 *
 * List view with create/edit/delete actions.
 * Calculation factors are now managed in module settings.
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
			if (!window.confirm(`Location "${name}" wirklich loschen?`)) return;
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
					<h1 className="resa-text-2xl resa-font-bold">Standorte</h1>
					<p className="resa-text-muted-foreground resa-text-sm">
						Verwalte Stadte und Regionen mit regionalen Kostensatzen.
					</p>
				</div>
				<button
					onClick={() => setView('create')}
					className="resa-px-4 resa-py-2 resa-text-sm resa-font-medium resa-rounded-md resa-bg-primary resa-text-primary-foreground hover:resa-bg-primary/90"
				>
					+ Neuer Standort
				</button>
			</div>

			{isLoading && (
				<div className="resa-rounded-lg resa-border resa-bg-card resa-p-6 resa-text-center">
					<p className="resa-text-sm resa-text-muted-foreground">Lade Standorte...</p>
				</div>
			)}

			{error && (
				<div className="resa-rounded-lg resa-border resa-border-destructive/50 resa-bg-destructive/5 resa-p-6">
					<p className="resa-text-sm resa-text-destructive">
						Fehler beim Laden der Standorte.
					</p>
				</div>
			)}

			{locations && locations.length === 0 && (
				<div className="resa-rounded-lg resa-border resa-bg-card resa-p-8 resa-text-center">
					<p className="resa-text-muted-foreground resa-mb-3">
						Noch keine Standorte angelegt.
					</p>
					<button
						onClick={() => setView('create')}
						className="resa-text-sm resa-text-primary resa-underline"
					>
						Ersten Standort anlegen
					</button>
				</div>
			)}

			{locations && locations.length > 0 && (
				<div className="resa-rounded-lg resa-border resa-bg-card">
					<table className="resa-w-full resa-text-sm">
						<thead>
							<tr className="resa-border-b">
								<th className="resa-text-left resa-p-3 resa-font-medium">Name</th>
								<th className="resa-text-left resa-p-3 resa-font-medium">
									Bundesland
								</th>
								<th className="resa-text-left resa-p-3 resa-font-medium">
									Regionstyp
								</th>
								<th className="resa-text-left resa-p-3 resa-font-medium">GrESt</th>
								<th className="resa-text-left resa-p-3 resa-font-medium">Status</th>
								<th className="resa-text-right resa-p-3 resa-font-medium">
									Aktionen
								</th>
							</tr>
						</thead>
						<tbody>
							{locations.map((location) => {
								const regionTypeLabels: Record<string, string> = {
									rural: 'Landlich',
									small_town: 'Kleinstadt',
									medium_city: 'Mittelstadt',
									large_city: 'Grossstadt',
								};
								const grunderwerbsteuer = (location.data as Record<string, unknown>)
									?.grunderwerbsteuer;

								return (
									<tr
										key={location.id}
										className="resa-border-b last:resa-border-0"
									>
										<td className="resa-p-3 resa-font-medium">
											{location.name}
										</td>
										<td className="resa-p-3 resa-text-muted-foreground">
											{location.bundesland || '—'}
										</td>
										<td className="resa-p-3">
											<span className="resa-inline-flex resa-items-center resa-rounded-full resa-px-2 resa-py-0.5 resa-text-xs resa-font-medium resa-bg-gray-100 resa-text-gray-700">
												{regionTypeLabels[location.region_type] ||
													location.region_type}
											</span>
										</td>
										<td className="resa-p-3">
											{grunderwerbsteuer
												? `${Number(grunderwerbsteuer).toFixed(1)}%`
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
												Loschen
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
