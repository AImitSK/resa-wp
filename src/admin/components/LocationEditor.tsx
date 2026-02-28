/**
 * Location editor — Create/edit a location.
 *
 * Simplified version: Only basic location info (name, region, taxes).
 * Calculation factors are now managed in module settings.
 */

import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

interface LocationEditorProps {
	initialData?: LocationFormData;
	onSave: (data: LocationFormData) => void;
	onCancel: () => void;
	isSaving: boolean;
}

export interface LocationFormData {
	name: string;
	slug: string;
	bundesland: string;
	region_type: string;
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

/** German federal states. */
const BUNDESLAENDER = [
	'Baden-Württemberg',
	'Bayern',
	'Berlin',
	'Brandenburg',
	'Bremen',
	'Hamburg',
	'Hessen',
	'Mecklenburg-Vorpommern',
	'Niedersachsen',
	'Nordrhein-Westfalen',
	'Rheinland-Pfalz',
	'Saarland',
	'Sachsen',
	'Sachsen-Anhalt',
	'Schleswig-Holstein',
	'Thüringen',
];

/** Default Grunderwerbsteuer by Bundesland. */
const GRUNDERWERBSTEUER: Record<string, number> = {
	'Baden-Württemberg': 5.0,
	Bayern: 3.5,
	Berlin: 6.0,
	Brandenburg: 6.5,
	Bremen: 5.0,
	Hamburg: 5.5,
	Hessen: 6.0,
	'Mecklenburg-Vorpommern': 6.0,
	Niedersachsen: 5.0,
	'Nordrhein-Westfalen': 6.5,
	'Rheinland-Pfalz': 5.0,
	Saarland: 6.5,
	Sachsen: 5.5,
	'Sachsen-Anhalt': 5.0,
	'Schleswig-Holstein': 6.5,
	Thüringen: 5.0,
};

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
	bundesland: '',
	region_type: 'medium_city',
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

	const handleBundeslandChange = (bundesland: string) => {
		const grunderwerbsteuer = GRUNDERWERBSTEUER[bundesland] ?? 5.0;
		setForm((prev) => ({
			...prev,
			bundesland,
			data: {
				...prev.data,
				grunderwerbsteuer,
			},
		}));
	};

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

			<Separator />

			{/* Location details */}
			<div className="resa-space-y-4">
				<h3 className="resa-text-sm resa-font-medium resa-text-muted-foreground">
					{__('Region', 'resa')}
				</h3>
				<div className="resa-grid resa-grid-cols-2 resa-gap-4">
					<div className="resa-space-y-2">
						<Label htmlFor="location-bundesland">{__('Bundesland', 'resa')}</Label>
						<select
							id="location-bundesland"
							className="resa-flex resa-h-9 resa-w-full resa-rounded-md resa-border resa-border-input resa-bg-transparent resa-px-3 resa-py-1 resa-text-sm resa-shadow-sm resa-transition-colors focus:resa-outline-none focus:resa-ring-1 focus:resa-ring-ring"
							value={form.bundesland}
							onChange={(e) => handleBundeslandChange(e.target.value)}
						>
							<option value="">{__('Bitte wählen...', 'resa')}</option>
							{BUNDESLAENDER.map((bl) => (
								<option key={bl} value={bl}>
									{bl}
								</option>
							))}
						</select>
					</div>
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

			<Separator />

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
						<p className="resa-text-xs resa-text-muted-foreground">
							{__('Wird automatisch bei Bundesland-Auswahl gesetzt', 'resa')}
						</p>
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

			{/* Info box about module settings */}
			<Alert>
				<Info className="resa-size-4" />
				<AlertDescription>
					{__(
						'Berechnungsfaktoren (Mietpreise, Multiplikatoren) werden jetzt unter ',
						'resa',
					)}
					<span className="resa-font-medium">{__('Smart Assets', 'resa')}</span>
					{__(' → Modul-Einstellungen konfiguriert.', 'resa')}
				</AlertDescription>
			</Alert>

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
