/**
 * Location values tab — Configure location-specific calculation values.
 */

import { useState } from 'react';
import { useLocations, type LocationAdmin } from '../../hooks/useLocations';
import type { LocationValue, ModuleSettingsData } from '../../hooks/useModuleSettings';

interface LocationValuesTabProps {
	settings: ModuleSettingsData;
	onSaveLocationValue: (locationId: number, values: LocationValue) => void;
	onDeleteLocationValue: (locationId: number) => void;
	isSaving: boolean;
}

export function LocationValuesTab({
	settings,
	onSaveLocationValue,
	onDeleteLocationValue,
	isSaving,
}: LocationValuesTabProps) {
	const { data: locations, isLoading: locationsLoading } = useLocations();
	const [editingLocationId, setEditingLocationId] = useState<number | null>(null);

	if (locationsLoading) {
		return (
			<div className="resa-flex resa-items-center resa-justify-center resa-py-12">
				<div className="resa-text-muted-foreground">Standorte werden geladen...</div>
			</div>
		);
	}

	const activeLocations = locations?.filter((l) => l.is_active) ?? [];

	if (activeLocations.length === 0) {
		return (
			<div className="resa-rounded-lg resa-border resa-bg-card resa-p-6 resa-text-center">
				<div className="resa-text-muted-foreground resa-mb-4">
					Keine aktiven Standorte vorhanden.
				</div>
				<p className="resa-text-sm resa-text-muted-foreground">
					Erstelle zuerst einen Standort unter{' '}
					<span className="resa-font-medium">Standorte</span>, um standortspezifische
					Werte zu konfigurieren.
				</p>
			</div>
		);
	}

	return (
		<div className="resa-space-y-4">
			<div className="resa-rounded-lg resa-border resa-bg-muted/50 resa-p-4">
				<p className="resa-text-sm resa-text-muted-foreground">
					Hier kannst du fur jeden Standort individuelle Basiswerte festlegen. Diese
					uberschreiben die globalen Einstellungen fur den jeweiligen Standort.
				</p>
			</div>

			{activeLocations.map((location) => {
				const hasCustomValues = !!settings.location_values?.[String(location.id)];
				const values = settings.location_values?.[String(location.id)];
				const isEditing = editingLocationId === location.id;

				return (
					<LocationValueCard
						key={location.id}
						location={location}
						values={values}
						hasCustomValues={hasCustomValues}
						isEditing={isEditing}
						isSaving={isSaving}
						onEdit={() => setEditingLocationId(location.id)}
						onCancel={() => setEditingLocationId(null)}
						onSave={(newValues) => {
							onSaveLocationValue(location.id, newValues);
							setEditingLocationId(null);
						}}
						onDelete={() => {
							onDeleteLocationValue(location.id);
						}}
					/>
				);
			})}
		</div>
	);
}

interface LocationValueCardProps {
	location: LocationAdmin;
	values?: LocationValue;
	hasCustomValues: boolean;
	isEditing: boolean;
	isSaving: boolean;
	onEdit: () => void;
	onCancel: () => void;
	onSave: (values: LocationValue) => void;
	onDelete: () => void;
}

function LocationValueCard({
	location,
	values,
	hasCustomValues,
	isEditing,
	isSaving,
	onEdit,
	onCancel,
	onSave,
	onDelete,
}: LocationValueCardProps) {
	const [formValues, setFormValues] = useState<LocationValue>({
		base_price: values?.base_price ?? 0,
		price_min: values?.price_min ?? 0,
		price_max: values?.price_max ?? 0,
	});

	const handleInputChange = (key: keyof LocationValue, value: number) => {
		setFormValues((prev) => ({ ...prev, [key]: value }));
	};

	const handleSave = () => {
		onSave(formValues);
	};

	const inputClass =
		'resa-w-24 resa-px-2 resa-py-1 resa-text-sm resa-rounded-md resa-border resa-border-input resa-bg-background focus:resa-outline-none focus:resa-ring-1 focus:resa-ring-ring';

	return (
		<div className="resa-rounded-lg resa-border resa-bg-card resa-p-4">
			<div className="resa-flex resa-items-center resa-justify-between resa-mb-3">
				<div>
					<h4 className="resa-font-medium">{location.name}</h4>
					<div className="resa-text-xs resa-text-muted-foreground">
						{location.bundesland && `${location.bundesland} • `}
						{location.region_type}
					</div>
				</div>
				<div className="resa-flex resa-items-center resa-gap-2">
					{hasCustomValues && !isEditing && (
						<span className="resa-text-xs resa-px-2 resa-py-0.5 resa-rounded-full resa-bg-blue-100 resa-text-blue-800">
							Individuell
						</span>
					)}
					{!hasCustomValues && !isEditing && (
						<span className="resa-text-xs resa-px-2 resa-py-0.5 resa-rounded-full resa-bg-gray-100 resa-text-gray-600">
							Standard
						</span>
					)}
				</div>
			</div>

			{isEditing ? (
				<div className="resa-space-y-4">
					<div className="resa-grid resa-grid-cols-3 resa-gap-4">
						<div>
							<label className="resa-block resa-text-xs resa-font-medium resa-mb-1">
								Basispreis (EUR/m2)
							</label>
							<input
								type="number"
								step="0.01"
								className={inputClass}
								value={formValues.base_price}
								onChange={(e) =>
									handleInputChange('base_price', Number(e.target.value))
								}
							/>
						</div>
						<div>
							<label className="resa-block resa-text-xs resa-font-medium resa-mb-1">
								Min (EUR/m2)
							</label>
							<input
								type="number"
								step="0.01"
								className={inputClass}
								value={formValues.price_min ?? 0}
								onChange={(e) =>
									handleInputChange('price_min', Number(e.target.value))
								}
							/>
						</div>
						<div>
							<label className="resa-block resa-text-xs resa-font-medium resa-mb-1">
								Max (EUR/m2)
							</label>
							<input
								type="number"
								step="0.01"
								className={inputClass}
								value={formValues.price_max ?? 0}
								onChange={(e) =>
									handleInputChange('price_max', Number(e.target.value))
								}
							/>
						</div>
					</div>
					<div className="resa-flex resa-gap-2 resa-justify-end">
						<button
							type="button"
							onClick={onCancel}
							className="resa-px-3 resa-py-1.5 resa-text-sm resa-rounded-md resa-border resa-border-input hover:resa-bg-muted"
						>
							Abbrechen
						</button>
						<button
							type="button"
							onClick={handleSave}
							disabled={isSaving}
							className="resa-px-3 resa-py-1.5 resa-text-sm resa-font-medium resa-rounded-md resa-bg-primary resa-text-primary-foreground hover:resa-bg-primary/90 disabled:resa-opacity-50"
						>
							{isSaving ? 'Speichern...' : 'Speichern'}
						</button>
					</div>
				</div>
			) : (
				<div className="resa-flex resa-items-center resa-justify-between">
					{hasCustomValues && values ? (
						<div className="resa-text-sm">
							<span className="resa-font-medium">
								{values.base_price?.toFixed(2)}
							</span>{' '}
							EUR/m2
							{values.price_min !== undefined && values.price_max !== undefined && (
								<span className="resa-text-muted-foreground resa-ml-2">
									(Spanne: {values.price_min?.toFixed(2)} -{' '}
									{values.price_max?.toFixed(2)})
								</span>
							)}
						</div>
					) : (
						<div className="resa-text-sm resa-text-muted-foreground">
							Verwendet globale Einstellungen
						</div>
					)}
					<div className="resa-flex resa-gap-2">
						{hasCustomValues && (
							<button
								type="button"
								onClick={onDelete}
								disabled={isSaving}
								className="resa-text-xs resa-text-destructive hover:resa-underline disabled:resa-opacity-50"
							>
								Zurucksetzen
							</button>
						)}
						<button
							type="button"
							onClick={onEdit}
							className="resa-text-xs resa-text-primary hover:resa-underline"
						>
							{hasCustomValues ? 'Bearbeiten' : 'Anpassen'}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
