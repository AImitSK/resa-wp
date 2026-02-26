/**
 * Location editor — Create/edit a location.
 *
 * Simplified version: Only basic location info (name, region, taxes).
 * Calculation factors are now managed in module settings.
 */

import { useState } from 'react';

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
	{ value: 'rural', label: 'Landlich' },
	{ value: 'small_town', label: 'Kleinstadt / Stadtrand' },
	{ value: 'medium_city', label: 'Mittelstadt' },
	{ value: 'large_city', label: 'Grossstadt / Zentrum' },
];

/** German federal states. */
const BUNDESLAENDER = [
	'Baden-Wurttemberg',
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
	'Thuringen',
];

/** Default Grunderwerbsteuer by Bundesland. */
const GRUNDERWERBSTEUER: Record<string, number> = {
	'Baden-Wurttemberg': 5.0,
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
	Thuringen: 5.0,
};

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[aA]/g, 'ae')
		.replace(/[oO]/g, 'oe')
		.replace(/[uU]/g, 'ue')
		.replace(/ss/g, 'ss')
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

	const inputClass =
		'resa-w-full resa-px-3 resa-py-2 resa-rounded-md resa-border resa-border-input resa-bg-background resa-text-sm focus:resa-outline-none focus:resa-ring-2 focus:resa-ring-ring';
	const labelClass = 'resa-block resa-text-sm resa-font-medium resa-mb-1';

	return (
		<form onSubmit={handleSubmit} className="resa-space-y-6">
			{/* Basic info */}
			<div className="resa-grid resa-grid-cols-2 resa-gap-4">
				<div>
					<label className={labelClass}>Name *</label>
					<input
						className={inputClass}
						value={form.name}
						onChange={(e) => updateName(e.target.value)}
						placeholder="z.B. Munchen"
						required
					/>
				</div>
				<div>
					<label className={labelClass}>Slug</label>
					<input
						className={inputClass}
						value={form.slug}
						onChange={(e) => {
							setAutoSlug(false);
							setForm((prev) => ({ ...prev, slug: e.target.value }));
						}}
						placeholder="z.B. muenchen"
					/>
				</div>
			</div>

			{/* Location details */}
			<div className="resa-grid resa-grid-cols-2 resa-gap-4">
				<div>
					<label className={labelClass}>Bundesland</label>
					<select
						className={inputClass}
						value={form.bundesland}
						onChange={(e) => handleBundeslandChange(e.target.value)}
					>
						<option value="">Bitte wahlen...</option>
						{BUNDESLAENDER.map((bl) => (
							<option key={bl} value={bl}>
								{bl}
							</option>
						))}
					</select>
				</div>
				<div>
					<label className={labelClass}>Regionstyp</label>
					<select
						className={inputClass}
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

			{/* Tax and commission rates */}
			<div className="resa-rounded-lg resa-border resa-bg-muted/30 resa-p-4">
				<h4 className="resa-text-sm resa-font-medium resa-mb-3">Regionale Kostensatze</h4>
				<div className="resa-grid resa-grid-cols-2 resa-gap-4">
					<div>
						<label className={labelClass}>Grunderwerbsteuer (%)</label>
						<input
							type="number"
							step="0.1"
							min="0"
							max="10"
							className={inputClass}
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
						<p className="resa-text-xs resa-text-muted-foreground resa-mt-1">
							Wird automatisch bei Bundesland-Auswahl gesetzt
						</p>
					</div>
					<div>
						<label className={labelClass}>Maklerprovision (%)</label>
						<input
							type="number"
							step="0.01"
							min="0"
							max="10"
							className={inputClass}
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
						<p className="resa-text-xs resa-text-muted-foreground resa-mt-1">
							Standard: 3,57% (inkl. MwSt.)
						</p>
					</div>
				</div>
			</div>

			{/* Info box about module settings */}
			<div className="resa-rounded-lg resa-border resa-bg-blue-50 resa-border-blue-200 resa-p-4">
				<p className="resa-text-sm resa-text-blue-800">
					<strong>Hinweis:</strong> Berechnungsfaktoren (Mietpreise, Multiplikatoren)
					werden jetzt unter <em>Smart Assets</em> → Modul-Einstellungen konfiguriert.
				</p>
			</div>

			{/* Actions */}
			<div className="resa-flex resa-gap-3 resa-justify-end">
				<button
					type="button"
					onClick={onCancel}
					className="resa-px-4 resa-py-2 resa-text-sm resa-rounded-md resa-border resa-border-input hover:resa-bg-muted"
				>
					Abbrechen
				</button>
				<button
					type="submit"
					disabled={isSaving || !form.name}
					className="resa-px-4 resa-py-2 resa-text-sm resa-font-medium resa-rounded-md resa-bg-primary resa-text-primary-foreground hover:resa-bg-primary/90 disabled:resa-opacity-50"
				>
					{isSaving ? 'Speichern...' : 'Speichern'}
				</button>
			</div>
		</form>
	);
}
