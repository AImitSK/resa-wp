/**
 * Factor editor — Reusable component for editing calculation factors.
 *
 * Used in module settings (SetupTab) for configuring multipliers,
 * premiums, and other calculation parameters.
 */

interface FactorGroupItem {
	key: string;
	label: string;
}

interface FactorGroupProps {
	title: string;
	items: FactorGroupItem[];
	group: string;
	factors: Record<string, unknown>;
	onChange: (group: string, subKey: string, value: number) => void;
}

/**
 * Render a group of factor inputs (e.g., location ratings, condition multipliers).
 */
export function FactorGroup({ title, items, group, factors, onChange }: FactorGroupProps) {
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

interface FactorEditorProps {
	factors: Record<string, unknown>;
	onFactorChange: (key: string, value: number) => void;
	onNestedFactorChange: (group: string, subKey: string, value: number) => void;
}

/**
 * Full factor editor with all factor groups for rent calculator.
 */
export function FactorEditor({ factors, onFactorChange, onNestedFactorChange }: FactorEditorProps) {
	const inputClass =
		'resa-w-full resa-px-3 resa-py-2 resa-rounded-md resa-border resa-border-input resa-bg-background resa-text-sm focus:resa-outline-none focus:resa-ring-2 focus:resa-ring-ring';
	const labelClass = 'resa-block resa-text-sm resa-font-medium resa-mb-1';

	return (
		<div className="resa-space-y-4">
			{/* Base values */}
			<div className="resa-grid resa-grid-cols-2 resa-gap-4">
				<div>
					<label className={labelClass}>Basismietpreis/m2 (EUR)</label>
					<input
						type="number"
						step="0.01"
						className={inputClass}
						value={(factors.base_price as number) ?? 0}
						onChange={(e) => onFactorChange('base_price', Number(e.target.value))}
					/>
				</div>
				<div>
					<label className={labelClass}>Grossendegression</label>
					<input
						type="number"
						step="0.01"
						className={inputClass}
						value={(factors.size_degression as number) ?? 0}
						onChange={(e) => onFactorChange('size_degression', Number(e.target.value))}
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
				onChange={onNestedFactorChange}
			/>

			{/* Condition multipliers */}
			<FactorGroup
				title="Zustands-Faktoren"
				items={[
					{ key: 'new', label: 'Neubau/Kernsaniert' },
					{ key: 'renovated', label: 'Renoviert' },
					{ key: 'good', label: 'Guter Zustand' },
					{ key: 'needs_renovation', label: 'Renovierungsbedurftig' },
				]}
				group="condition_multipliers"
				factors={factors}
				onChange={onNestedFactorChange}
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
				onChange={onNestedFactorChange}
			/>

			{/* Feature premiums */}
			<FactorGroup
				title="Ausstattungs-Zuschlage (EUR/m2)"
				items={[
					{ key: 'balcony', label: 'Balkon' },
					{ key: 'terrace', label: 'Terrasse' },
					{ key: 'garden', label: 'Garten' },
					{ key: 'elevator', label: 'Aufzug' },
					{ key: 'parking', label: 'Stellplatz' },
					{ key: 'garage', label: 'Garage' },
					{ key: 'cellar', label: 'Keller' },
					{ key: 'fitted_kitchen', label: 'Einbaukuche' },
					{ key: 'floor_heating', label: 'Fussbodenheizung' },
					{ key: 'guest_toilet', label: 'Gaste-WC' },
					{ key: 'barrier_free', label: 'Barrierefrei' },
				]}
				group="feature_premiums"
				factors={factors}
				onChange={onNestedFactorChange}
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
				onChange={onNestedFactorChange}
			/>
		</div>
	);
}
