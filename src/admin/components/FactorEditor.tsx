/**
 * Factor editor — Reusable component for editing calculation factors.
 *
 * Used in module settings (SetupTab) for configuring multipliers,
 * premiums, and other calculation parameters.
 *
 * Uses React Hook Form for validation (integrated with parent form).
 * @see docs/design-system/patterns/form-validation.md
 */

import type { UseFormReturn, FieldErrors, Path, PathValue } from 'react-hook-form';
import { __ } from '@wordpress/i18n';

/**
 * Generic form data type that includes a factors object.
 * This allows the FactorEditor to work with any form that has a factors field.
 */
interface FormDataWithFactors {
	factors: {
		base_price?: number;
		size_degression?: number;
		location_ratings?: Record<string, number>;
		condition_multipliers?: Record<string, number>;
		type_multipliers?: Record<string, number>;
		feature_premiums?: Record<string, number>;
		age_multipliers?: Record<string, number>;
		[key: string]: unknown;
	};
}

// ─── Styles ─────────────────────────────────────────────

const inputStyles: React.CSSProperties = {
	width: '80px',
	padding: '4px 8px',
	fontSize: '14px',
	borderRadius: '6px',
	border: '1px solid hsl(214.3 31.8% 78%)',
	backgroundColor: 'white',
};

const inputFullStyles: React.CSSProperties = {
	width: '100%',
	height: '36px',
	padding: '0 12px',
	fontSize: '14px',
	borderRadius: '6px',
	border: '1px solid hsl(214.3 31.8% 78%)',
	backgroundColor: 'white',
};

const labelStyles: React.CSSProperties = {
	display: 'block',
	fontSize: '14px',
	fontWeight: 500,
	marginBottom: '4px',
	color: '#1e303a',
};

const groupTitleStyles: React.CSSProperties = {
	fontSize: '14px',
	fontWeight: 500,
	marginBottom: '8px',
	color: '#1e303a',
};

const errorStyles: React.CSSProperties = {
	fontSize: '13px',
	color: '#ef4444',
	margin: '4px 0 0 0',
};

// ─── Factor Group Item Definition ───────────────────────

interface FactorGroupItem {
	key: string;
	label: string;
}

// ─── Factor Group Component ─────────────────────────────

interface FactorGroupProps<T extends FormDataWithFactors> {
	title: string;
	items: FactorGroupItem[];
	groupName: keyof FormDataWithFactors['factors'];
	form: UseFormReturn<T>;
	errors?: FieldErrors<T>;
}

/**
 * Render a group of factor inputs (e.g., location ratings, condition multipliers).
 * Uses form.register for each input field.
 */
function FactorGroup<T extends FormDataWithFactors>({
	title,
	items,
	groupName,
	form,
	errors,
}: FactorGroupProps<T>) {
	const { setValue, watch } = form;

	// Watch the current group values
	const groupPath = `factors.${String(groupName)}` as Path<T>;
	const groupValues = (watch(groupPath) as Record<string, number> | undefined) ?? {};

	// Get nested errors for this group
	const factorsErrors = errors?.factors as Record<string, unknown> | undefined;
	const groupErrors = factorsErrors?.[String(groupName)] as
		| Record<string, { message?: string }>
		| undefined;

	return (
		<div>
			<h4 style={groupTitleStyles}>{title}</h4>
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(2, 1fr)',
					gap: '8px',
				}}
			>
				{items.map((item) => {
					const fieldPath = `factors.${String(groupName)}.${item.key}` as Path<T>;
					const fieldError = groupErrors?.[item.key];

					return (
						<div
							key={item.key}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
							}}
						>
							<label
								style={{
									fontSize: '12px',
									width: '144px',
									flexShrink: 0,
									color: '#1e303a',
								}}
							>
								{item.label}
							</label>
							<input
								type="number"
								step="0.01"
								value={groupValues[item.key] ?? 0}
								onChange={(e) => {
									const value = parseFloat(e.target.value) || 0;
									setValue(fieldPath, value as PathValue<T, typeof fieldPath>, {
										shouldDirty: true,
										shouldValidate: true,
									});
								}}
								style={{
									...inputStyles,
									borderColor: fieldError ? '#ef4444' : undefined,
								}}
							/>
						</div>
					);
				})}
			</div>
			{groupErrors && Object.keys(groupErrors).length > 0 && (
				<p style={errorStyles}>{__('Bitte gültige Zahlenwerte eingeben', 'resa')}</p>
			)}
		</div>
	);
}

// ─── Main Factor Editor Component ───────────────────────

interface FactorEditorProps<T extends FormDataWithFactors> {
	form: UseFormReturn<T>;
}

/**
 * Full factor editor with all factor groups for rent calculator.
 * Integrates with React Hook Form from parent component.
 */
export function FactorEditor<T extends FormDataWithFactors>({ form }: FactorEditorProps<T>) {
	const {
		setValue,
		watch,
		formState: { errors },
	} = form;

	// Watch base values
	const basePrice = (watch('factors.base_price' as Path<T>) as number | undefined) ?? 0;
	const sizeDegression = (watch('factors.size_degression' as Path<T>) as number | undefined) ?? 0;

	// Get errors for base fields
	const factorsErrors = errors?.factors as Record<string, { message?: string }> | undefined;
	const basePriceError = factorsErrors?.base_price;
	const sizeDegresssionError = factorsErrors?.size_degression;

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			{/* Base values */}
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(2, 1fr)',
					gap: '16px',
				}}
			>
				<div>
					<label style={labelStyles}>{__('Basismietpreis/m2 (EUR)', 'resa')}</label>
					<input
						type="number"
						step="0.01"
						value={basePrice}
						onChange={(e) => {
							const value = parseFloat(e.target.value) || 0;
							setValue(
								'factors.base_price' as Path<T>,
								value as PathValue<T, Path<T>>,
								{ shouldDirty: true, shouldValidate: true },
							);
						}}
						style={{
							...inputFullStyles,
							borderColor: basePriceError ? '#ef4444' : undefined,
						}}
					/>
					{basePriceError && <p style={errorStyles}>{basePriceError.message}</p>}
				</div>
				<div>
					<label style={labelStyles}>{__('Grossendegression', 'resa')}</label>
					<input
						type="number"
						step="0.01"
						value={sizeDegression}
						onChange={(e) => {
							const value = parseFloat(e.target.value) || 0;
							setValue(
								'factors.size_degression' as Path<T>,
								value as PathValue<T, Path<T>>,
								{ shouldDirty: true, shouldValidate: true },
							);
						}}
						style={{
							...inputFullStyles,
							borderColor: sizeDegresssionError ? '#ef4444' : undefined,
						}}
					/>
					{sizeDegresssionError && (
						<p style={errorStyles}>{sizeDegresssionError.message}</p>
					)}
				</div>
			</div>

			{/* Location ratings */}
			<FactorGroup
				title={__('Lage-Faktoren', 'resa')}
				items={[
					{ key: '1', label: __('Einfache Lage (1)', 'resa') },
					{ key: '2', label: __('Normale Lage (2)', 'resa') },
					{ key: '3', label: __('Gute Lage (3)', 'resa') },
					{ key: '4', label: __('Sehr gute Lage (4)', 'resa') },
					{ key: '5', label: __('Premium-Lage (5)', 'resa') },
				]}
				groupName="location_ratings"
				form={form}
				errors={errors}
			/>

			{/* Condition multipliers */}
			<FactorGroup
				title={__('Zustands-Faktoren', 'resa')}
				items={[
					{ key: 'new', label: __('Neubau/Kernsaniert', 'resa') },
					{ key: 'renovated', label: __('Renoviert', 'resa') },
					{ key: 'good', label: __('Guter Zustand', 'resa') },
					{ key: 'needs_renovation', label: __('Renovierungsbedurftig', 'resa') },
				]}
				groupName="condition_multipliers"
				form={form}
				errors={errors}
			/>

			{/* Type multipliers */}
			<FactorGroup
				title={__('Immobilientyp-Faktoren', 'resa')}
				items={[
					{ key: 'apartment', label: __('Wohnung', 'resa') },
					{ key: 'house', label: __('Haus', 'resa') },
				]}
				groupName="type_multipliers"
				form={form}
				errors={errors}
			/>

			{/* Feature premiums */}
			<FactorGroup
				title={__('Ausstattungs-Zuschlage (EUR/m2)', 'resa')}
				items={[
					{ key: 'balcony', label: __('Balkon', 'resa') },
					{ key: 'terrace', label: __('Terrasse', 'resa') },
					{ key: 'garden', label: __('Garten', 'resa') },
					{ key: 'elevator', label: __('Aufzug', 'resa') },
					{ key: 'parking', label: __('Stellplatz', 'resa') },
					{ key: 'garage', label: __('Garage', 'resa') },
					{ key: 'cellar', label: __('Keller', 'resa') },
					{ key: 'fitted_kitchen', label: __('Einbaukuche', 'resa') },
					{ key: 'floor_heating', label: __('Fussbodenheizung', 'resa') },
					{ key: 'guest_toilet', label: __('Gaste-WC', 'resa') },
					{ key: 'barrier_free', label: __('Barrierefrei', 'resa') },
				]}
				groupName="feature_premiums"
				form={form}
				errors={errors}
			/>

			{/* Age multipliers */}
			<FactorGroup
				title={__('Alter-Faktoren', 'resa')}
				items={[
					{ key: 'before_1946', label: __('Altbau (bis 1945)', 'resa') },
					{ key: '1946_1959', label: __('Nachkriegsbau (1946-1959)', 'resa') },
					{ key: '1960_1979', label: __('60er/70er Jahre', 'resa') },
					{ key: '1980_1989', label: __('80er Jahre', 'resa') },
					{ key: '1990_1999', label: __('90er Jahre', 'resa') },
					{ key: '2000_2014', label: __('2000er Jahre', 'resa') },
					{ key: '2015_plus', label: __('Neubau (ab 2015)', 'resa') },
				]}
				groupName="age_multipliers"
				form={form}
				errors={errors}
			/>
		</div>
	);
}
