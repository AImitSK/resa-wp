/**
 * Location editor — Create/edit a location with Pauschal/Individuell mode.
 *
 * Pauschal: Select one of 4 region presets.
 * Individuell: Edit all factors manually.
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
	setup_mode: 'pauschal' | 'individuell';
	region_preset: string;
	data: Record<string, unknown>;
	factors: Record<string, unknown> | null;
}

/** Region type presets with default values. */
const PRESETS: Record<string, { label: string; base_price: number; size_degression: number }> = {
	rural: { label: 'Ländlich', base_price: 5.5, size_degression: 0.15 },
	small_town: { label: 'Kleinstadt / Stadtrand', base_price: 7.5, size_degression: 0.18 },
	medium_city: { label: 'Mittelstadt', base_price: 9.5, size_degression: 0.2 },
	large_city: { label: 'Großstadt / Zentrum', base_price: 14.0, size_degression: 0.22 },
};

const FULL_PRESETS: Record<string, Record<string, unknown>> = {
	rural: {
		base_price: 5.5,
		size_degression: 0.15,
		location_ratings: { '1': 0.8, '2': 0.9, '3': 1.0, '4': 1.08, '5': 1.15 },
		condition_multipliers: { new: 1.2, renovated: 1.08, good: 1.0, needs_renovation: 0.82 },
		type_multipliers: { apartment: 1.0, house: 1.12 },
		feature_premiums: {
			balcony: 0.3,
			terrace: 0.5,
			garden: 0.8,
			elevator: 0.15,
			parking: 0.25,
			garage: 0.4,
			cellar: 0.1,
			fitted_kitchen: 0.35,
			floor_heating: 0.25,
			guest_toilet: 0.15,
			barrier_free: 0.2,
		},
		age_multipliers: {
			before_1946: 1.05,
			'1946_1959': 0.92,
			'1960_1979': 0.88,
			'1980_1989': 0.95,
			'1990_1999': 1.0,
			'2000_2014': 1.05,
			'2015_plus': 1.1,
		},
	},
	small_town: {
		base_price: 7.5,
		size_degression: 0.18,
		location_ratings: { '1': 0.83, '2': 0.93, '3': 1.0, '4': 1.1, '5': 1.2 },
		condition_multipliers: { new: 1.22, renovated: 1.1, good: 1.0, needs_renovation: 0.8 },
		type_multipliers: { apartment: 1.0, house: 1.14 },
		feature_premiums: {
			balcony: 0.4,
			terrace: 0.6,
			garden: 0.9,
			elevator: 0.25,
			parking: 0.35,
			garage: 0.5,
			cellar: 0.15,
			fitted_kitchen: 0.45,
			floor_heating: 0.35,
			guest_toilet: 0.2,
			barrier_free: 0.25,
		},
		age_multipliers: {
			before_1946: 1.05,
			'1946_1959': 0.94,
			'1960_1979': 0.9,
			'1980_1989': 0.95,
			'1990_1999': 1.0,
			'2000_2014': 1.05,
			'2015_plus': 1.1,
		},
	},
	medium_city: {
		base_price: 9.5,
		size_degression: 0.2,
		location_ratings: { '1': 0.85, '2': 0.95, '3': 1.0, '4': 1.1, '5': 1.25 },
		condition_multipliers: { new: 1.25, renovated: 1.1, good: 1.0, needs_renovation: 0.8 },
		type_multipliers: { apartment: 1.0, house: 1.15 },
		feature_premiums: {
			balcony: 0.5,
			terrace: 0.75,
			garden: 1.0,
			elevator: 0.3,
			parking: 0.4,
			garage: 0.6,
			cellar: 0.2,
			fitted_kitchen: 0.5,
			floor_heating: 0.4,
			guest_toilet: 0.25,
			barrier_free: 0.3,
		},
		age_multipliers: {
			before_1946: 1.05,
			'1946_1959': 0.95,
			'1960_1979': 0.9,
			'1980_1989': 0.95,
			'1990_1999': 1.0,
			'2000_2014': 1.05,
			'2015_plus': 1.1,
		},
	},
	large_city: {
		base_price: 14.0,
		size_degression: 0.22,
		location_ratings: { '1': 0.85, '2': 0.95, '3': 1.0, '4': 1.12, '5': 1.3 },
		condition_multipliers: { new: 1.28, renovated: 1.12, good: 1.0, needs_renovation: 0.78 },
		type_multipliers: { apartment: 1.0, house: 1.18 },
		feature_premiums: {
			balcony: 0.65,
			terrace: 1.0,
			garden: 1.3,
			elevator: 0.4,
			parking: 0.55,
			garage: 0.8,
			cellar: 0.25,
			fitted_kitchen: 0.6,
			floor_heating: 0.5,
			guest_toilet: 0.3,
			barrier_free: 0.35,
		},
		age_multipliers: {
			before_1946: 1.08,
			'1946_1959': 0.95,
			'1960_1979': 0.88,
			'1980_1989': 0.95,
			'1990_1999': 1.0,
			'2000_2014': 1.06,
			'2015_plus': 1.12,
		},
	},
};

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[äÄ]/g, 'ae')
		.replace(/[öÖ]/g, 'oe')
		.replace(/[üÜ]/g, 'ue')
		.replace(/ß/g, 'ss')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

const emptyForm: LocationFormData = {
	name: '',
	slug: '',
	bundesland: '',
	setup_mode: 'pauschal',
	region_preset: 'medium_city',
	data: FULL_PRESETS.medium_city,
	factors: null,
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

	const handlePresetChange = (preset: string) => {
		const presetData = FULL_PRESETS[preset] ?? FULL_PRESETS.medium_city;
		setForm((prev) => ({
			...prev,
			region_preset: preset,
			data: { ...presetData, setup_mode: 'pauschal', region_preset: preset },
			factors: null,
		}));
	};

	const handleModeSwitch = (mode: 'pauschal' | 'individuell') => {
		if (mode === 'individuell' && form.setup_mode === 'pauschal') {
			// Copy preset values into factors for editing.
			setForm((prev) => ({
				...prev,
				setup_mode: 'individuell',
				factors: { ...prev.data },
			}));
		} else {
			setForm((prev) => ({
				...prev,
				setup_mode: mode,
				factors: mode === 'pauschal' ? null : prev.factors,
			}));
		}
	};

	const handleFactorChange = (key: string, value: number) => {
		setForm((prev) => ({
			...prev,
			factors: { ...(prev.factors ?? {}), [key]: value },
		}));
	};

	const handleNestedFactorChange = (group: string, subKey: string, value: number) => {
		setForm((prev) => {
			const currentFactors = (prev.factors ?? {}) as Record<string, unknown>;
			const currentGroup = (currentFactors[group] as Record<string, number>) ?? {};
			return {
				...prev,
				factors: {
					...currentFactors,
					[group]: { ...currentGroup, [subKey]: value },
				},
			};
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const saveData: LocationFormData = {
			...form,
			data:
				form.setup_mode === 'pauschal'
					? { ...form.data, setup_mode: 'pauschal', region_preset: form.region_preset }
					: { ...form.data, setup_mode: 'individuell' },
		};
		onSave(saveData);
	};

	const factors =
		((form.setup_mode === 'individuell' ? form.factors : form.data) as Record<
			string,
			unknown
		>) ?? {};

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
						placeholder="z.B. München"
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
				<div>
					<label className={labelClass}>Bundesland</label>
					<input
						className={inputClass}
						value={form.bundesland}
						onChange={(e) =>
							setForm((prev) => ({ ...prev, bundesland: e.target.value }))
						}
						placeholder="z.B. Bayern"
					/>
				</div>
			</div>

			{/* Setup mode toggle */}
			<div>
				<label className={labelClass}>Einrichtungsmodus</label>
				<div className="resa-flex resa-gap-4">
					{(['pauschal', 'individuell'] as const).map((mode) => (
						<label
							key={mode}
							className="resa-flex resa-items-center resa-gap-2 resa-cursor-pointer"
						>
							<input
								type="radio"
								name="setup_mode"
								checked={form.setup_mode === mode}
								onChange={() => handleModeSwitch(mode)}
							/>
							<span className="resa-text-sm resa-capitalize">{mode}</span>
						</label>
					))}
				</div>
			</div>

			{/* Pauschal: Preset selection */}
			{form.setup_mode === 'pauschal' && (
				<div>
					<label className={labelClass}>Regionstyp</label>
					<div className="resa-grid resa-grid-cols-2 resa-gap-3">
						{Object.entries(PRESETS).map(([key, preset]) => (
							<label
								key={key}
								className={`resa-flex resa-items-center resa-gap-3 resa-rounded-lg resa-border-2 resa-p-3 resa-cursor-pointer resa-transition-colors ${
									form.region_preset === key
										? 'resa-border-primary resa-bg-primary/5'
										: 'resa-border-input hover:resa-border-primary/50'
								}`}
							>
								<input
									type="radio"
									name="region_preset"
									checked={form.region_preset === key}
									onChange={() => handlePresetChange(key)}
									className="resa-shrink-0"
								/>
								<div>
									<div className="resa-text-sm resa-font-medium">
										{preset.label}
									</div>
									<div className="resa-text-xs resa-text-muted-foreground">
										Basispreis: {preset.base_price.toFixed(2)} EUR/m²
									</div>
								</div>
							</label>
						))}
					</div>

					{/* Preset preview */}
					<details className="resa-mt-3">
						<summary className="resa-text-sm resa-text-muted-foreground resa-cursor-pointer">
							Vorschau der Werte
						</summary>
						<pre className="resa-mt-2 resa-text-xs resa-bg-muted resa-p-3 resa-rounded-md resa-overflow-auto resa-max-h-48">
							{JSON.stringify(form.data, null, 2)}
						</pre>
					</details>
				</div>
			)}

			{/* Individuell: Manual factor editing */}
			{form.setup_mode === 'individuell' && (
				<div className="resa-space-y-4">
					<div className="resa-grid resa-grid-cols-2 resa-gap-4">
						<div>
							<label className={labelClass}>Basismietpreis/m² (EUR)</label>
							<input
								type="number"
								step="0.01"
								className={inputClass}
								value={(factors.base_price as number) ?? 0}
								onChange={(e) =>
									handleFactorChange('base_price', Number(e.target.value))
								}
							/>
						</div>
						<div>
							<label className={labelClass}>Größendegression</label>
							<input
								type="number"
								step="0.01"
								className={inputClass}
								value={(factors.size_degression as number) ?? 0}
								onChange={(e) =>
									handleFactorChange('size_degression', Number(e.target.value))
								}
							/>
						</div>
					</div>

					{/* Location ratings */}
					<FactorGroup
						title="Lage-Faktoren"
						items={[
							{ key: '1', label: 'Einfache Lage (1)' },
							{ key: '2', label: 'Normale Lage (2)' },
							{ key: '3', label: 'Gute Lage (3)' },
							{ key: '4', label: 'Sehr gute Lage (4)' },
							{ key: '5', label: 'Premium-Lage (5)' },
						]}
						group="location_ratings"
						factors={factors}
						onChange={handleNestedFactorChange}
					/>

					{/* Condition multipliers */}
					<FactorGroup
						title="Zustands-Faktoren"
						items={[
							{ key: 'new', label: 'Neubau/Kernsaniert' },
							{ key: 'renovated', label: 'Renoviert' },
							{ key: 'good', label: 'Guter Zustand' },
							{ key: 'needs_renovation', label: 'Renovierungsbedürftig' },
						]}
						group="condition_multipliers"
						factors={factors}
						onChange={handleNestedFactorChange}
					/>

					{/* Type multipliers */}
					<FactorGroup
						title="Immobilientyp-Faktoren"
						items={[
							{ key: 'apartment', label: 'Wohnung' },
							{ key: 'house', label: 'Haus' },
						]}
						group="type_multipliers"
						factors={factors}
						onChange={handleNestedFactorChange}
					/>

					{/* Feature premiums */}
					<FactorGroup
						title="Ausstattungs-Zuschläge (EUR/m²)"
						items={[
							{ key: 'balcony', label: 'Balkon' },
							{ key: 'terrace', label: 'Terrasse' },
							{ key: 'garden', label: 'Garten' },
							{ key: 'elevator', label: 'Aufzug' },
							{ key: 'parking', label: 'Stellplatz' },
							{ key: 'garage', label: 'Garage' },
							{ key: 'cellar', label: 'Keller' },
							{ key: 'fitted_kitchen', label: 'Einbauküche' },
							{ key: 'floor_heating', label: 'Fußbodenheizung' },
							{ key: 'guest_toilet', label: 'Gäste-WC' },
							{ key: 'barrier_free', label: 'Barrierefrei' },
						]}
						group="feature_premiums"
						factors={factors}
						onChange={handleNestedFactorChange}
					/>

					{/* Age multipliers */}
					<FactorGroup
						title="Alter-Faktoren"
						items={[
							{ key: 'before_1946', label: 'Altbau (bis 1945)' },
							{ key: '1946_1959', label: 'Nachkriegsbau (1946-1959)' },
							{ key: '1960_1979', label: '60er/70er Jahre' },
							{ key: '1980_1989', label: '80er Jahre' },
							{ key: '1990_1999', label: '90er Jahre' },
							{ key: '2000_2014', label: '2000er Jahre' },
							{ key: '2015_plus', label: 'Neubau (ab 2015)' },
						]}
						group="age_multipliers"
						factors={factors}
						onChange={handleNestedFactorChange}
					/>
				</div>
			)}

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

/* ---------- FactorGroup Sub-Component ---------- */

interface FactorGroupProps {
	title: string;
	items: { key: string; label: string }[];
	group: string;
	factors: Record<string, unknown>;
	onChange: (group: string, subKey: string, value: number) => void;
}

function FactorGroup({ title, items, group, factors, onChange }: FactorGroupProps) {
	const groupValues = (factors[group] as Record<string, number>) ?? {};

	return (
		<div>
			<h4 className="resa-text-sm resa-font-medium resa-mb-2">{title}</h4>
			<div className="resa-grid resa-grid-cols-2 resa-gap-2">
				{items.map((item) => (
					<div key={item.key} className="resa-flex resa-items-center resa-gap-2">
						<label className="resa-text-xs resa-w-36 resa-shrink-0">{item.label}</label>
						<input
							type="number"
							step="0.01"
							className="resa-w-20 resa-px-2 resa-py-1 resa-text-sm resa-rounded-md resa-border resa-border-input resa-bg-background focus:resa-outline-none focus:resa-ring-1 focus:resa-ring-ring"
							value={groupValues[item.key] ?? 0}
							onChange={(e) => onChange(group, item.key, Number(e.target.value))}
						/>
					</div>
				))}
			</div>
		</div>
	);
}
