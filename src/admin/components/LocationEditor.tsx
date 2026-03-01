/**
 * Location editor — Create/edit a location.
 *
 * Simplified version: Only basic location info (name, region, taxes).
 * Calculation factors are now managed in module settings.
 * Now includes map picker for setting coordinates.
 */

import { useState, useCallback } from 'react';
import { __ } from '@wordpress/i18n';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { LocationMapPicker } from './LocationMapPicker';

interface LocationEditorProps {
	initialData?: LocationFormData;
	onSave: (data: LocationFormData) => void;
	onCancel: () => void;
	isSaving: boolean;
}

export interface LocationFormData {
	name: string;
	slug: string;
	country: string;
	bundesland: string;
	region_type: string;
	latitude?: number | null;
	longitude?: number | null;
	zoom_level?: number;
	data: {
		grunderwerbsteuer?: number;
		maklerprovision?: number;
		[key: string]: unknown;
	};
}

/** Region types for selection. */
const REGION_TYPES = [
	{ value: 'rural', label: 'Ländlich' },
	{ value: 'small_town', label: 'Kleinstadt / Stadtrand' },
	{ value: 'medium_city', label: 'Mittelstadt' },
	{ value: 'large_city', label: 'Großstadt / Zentrum' },
];

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/ä/g, 'ae')
		.replace(/ö/g, 'oe')
		.replace(/ü/g, 'ue')
		.replace(/ß/g, 'ss')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

const emptyForm: LocationFormData = {
	name: '',
	slug: '',
	country: '',
	bundesland: '',
	region_type: 'medium_city',
	latitude: null,
	longitude: null,
	zoom_level: 13,
	data: {
		grunderwerbsteuer: 5.0,
		maklerprovision: 3.57,
	},
};

export function LocationEditor({ initialData, onSave, onCancel, isSaving }: LocationEditorProps) {
	const [form, setForm] = useState<LocationFormData>(initialData ?? emptyForm);
	const [autoSlug, setAutoSlug] = useState(!initialData);

	const updateName = (name: string) => {
		setForm((prev) => ({
			...prev,
			name,
			slug: autoSlug ? slugify(name) : prev.slug,
		}));
	};

	const handleCoordinatesChange = useCallback(
		(lat: number | null, lng: number | null, zoom: number) => {
			setForm((prev) => ({
				...prev,
				latitude: lat,
				longitude: lng,
				zoom_level: zoom,
			}));
		},
		[],
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSave(form);
	};

	return (
		<form onSubmit={handleSubmit} className="resa-space-y-6">
			{/* Basic info */}
			<div className="resa-space-y-4">
				<h3 className="resa-text-sm resa-font-medium resa-text-muted-foreground">
					{__('Grunddaten', 'resa')}
				</h3>
				<div className="resa-grid resa-grid-cols-2 resa-gap-4">
					<div className="resa-space-y-2">
						<Label htmlFor="location-name">{__('Name', 'resa')} *</Label>
						<Input
							id="location-name"
							value={form.name}
							onChange={(e) => updateName(e.target.value)}
							placeholder={__('z.B. München', 'resa')}
							required
						/>
					</div>
					<div className="resa-space-y-2">
						<Label htmlFor="location-slug">{__('Slug', 'resa')}</Label>
						<Input
							id="location-slug"
							value={form.slug}
							onChange={(e) => {
								setAutoSlug(false);
								setForm((prev) => ({ ...prev, slug: e.target.value }));
							}}
							placeholder={__('z.B. muenchen', 'resa')}
						/>
					</div>
				</div>
			</div>

			{/* Location details */}
			<div className="resa-space-y-4">
				<h3 className="resa-text-sm resa-font-medium resa-text-muted-foreground">
					{__('Region', 'resa')}
				</h3>
				<div className="resa-grid resa-grid-cols-2 resa-gap-4">
					<div className="resa-space-y-2">
						<Label htmlFor="location-country">{__('Land', 'resa')} *</Label>
						<Input
							id="location-country"
							value={form.country}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, country: e.target.value }))
							}
							placeholder={__('z.B. Deutschland, Österreich, Rumänien...', 'resa')}
							required
						/>
					</div>
					<div className="resa-space-y-2">
						<Label htmlFor="location-bundesland">
							{__('Region / Bundesland', 'resa')}
						</Label>
						<Input
							id="location-bundesland"
							value={form.bundesland}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, bundesland: e.target.value }))
							}
							placeholder={__('z.B. Bayern, Wien, București...', 'resa')}
						/>
					</div>
				</div>
				<div className="resa-grid resa-grid-cols-2 resa-gap-4">
					<div className="resa-space-y-2">
						<Label htmlFor="location-region-type">{__('Regionstyp', 'resa')}</Label>
						<select
							id="location-region-type"
							className="resa-flex resa-h-9 resa-w-full resa-rounded-md resa-border resa-border-input resa-bg-transparent resa-px-3 resa-py-1 resa-text-sm resa-shadow-sm resa-transition-colors focus:resa-outline-none focus:resa-ring-1 focus:resa-ring-ring"
							value={form.region_type}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, region_type: e.target.value }))
							}
						>
							{REGION_TYPES.map((rt) => (
								<option key={rt.value} value={rt.value}>
									{rt.label}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			{/* Map Picker */}
			<div className="resa-space-y-4">
				<h3 className="resa-text-sm resa-font-medium resa-text-muted-foreground">
					{__('Kartenposition', 'resa')}
				</h3>
				<LocationMapPicker
					latitude={form.latitude}
					longitude={form.longitude}
					zoomLevel={form.zoom_level ?? 13}
					onCoordinatesChange={handleCoordinatesChange}
				/>
			</div>

			{/* Tax and commission rates */}
			<div className="resa-space-y-4">
				<h3 className="resa-text-sm resa-font-medium resa-text-muted-foreground">
					{__('Regionale Kostensätze', 'resa')}
				</h3>
				<div className="resa-grid resa-grid-cols-2 resa-gap-4">
					<div className="resa-space-y-2">
						<Label htmlFor="location-grest">
							{__('Grunderwerbsteuer (%)', 'resa')}
						</Label>
						<Input
							id="location-grest"
							type="number"
							step="0.1"
							min="0"
							max="10"
							value={form.data.grunderwerbsteuer ?? 5.0}
							onChange={(e) =>
								setForm((prev) => ({
									...prev,
									data: {
										...prev.data,
										grunderwerbsteuer: Number(e.target.value),
									},
								}))
							}
						/>
					</div>
					<div className="resa-space-y-2">
						<Label htmlFor="location-makler">{__('Maklerprovision (%)', 'resa')}</Label>
						<Input
							id="location-makler"
							type="number"
							step="0.01"
							min="0"
							max="10"
							value={form.data.maklerprovision ?? 3.57}
							onChange={(e) =>
								setForm((prev) => ({
									...prev,
									data: {
										...prev.data,
										maklerprovision: Number(e.target.value),
									},
								}))
							}
						/>
						<p className="resa-text-xs resa-text-muted-foreground">
							{__('Standard: 3,57% (inkl. MwSt.)', 'resa')}
						</p>
					</div>
				</div>
			</div>

			{/* Actions */}
			<div className="resa-flex resa-gap-3 resa-justify-end resa-pt-4">
				<Button type="button" variant="outline" onClick={onCancel}>
					{__('Abbrechen', 'resa')}
				</Button>
				<Button type="submit" disabled={isSaving || !form.name}>
					{isSaving && <Spinner className="resa-mr-2" />}
					{isSaving ? __('Speichern...', 'resa') : __('Speichern', 'resa')}
				</Button>
			</div>
		</form>
	);
}
