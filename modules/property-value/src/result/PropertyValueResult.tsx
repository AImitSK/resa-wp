/**
 * Property value result display.
 *
 * Shows estimated market value with range, price per m²,
 * plot value (houses only), market position, comparison chart,
 * factor breakdown, and input summary.
 */

import { __ } from '@wordpress/i18n';
import { ComparisonBarChart } from '@frontend/components/charts';
import {
	ResultLayout,
	ResultHero,
	ResultStatCard,
	MarketPositionGauge,
	InputSummary,
} from '@frontend/components/shared';
import { FactorBreakdownChart } from './FactorBreakdownChart';
import type { PropertyValueResult as PropertyValueResultType, PropertyValueData } from '../types';

interface PropertyValueResultProps {
	result: PropertyValueResultType;
	inputs: PropertyValueData;
	agent?: {
		name?: string;
		photo_url?: string;
		phone?: string;
	};
}

function formatCurrency(value: number): string {
	return value.toLocaleString('de-DE', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	});
}

function formatCurrencyPrecise(value: number): string {
	return value.toLocaleString('de-DE', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

const propertyTypeLabels: Record<string, string> = {
	apartment: 'Wohnung',
	house: 'Haus',
};

const subtypeLabels: Record<string, string> = {
	efh: 'Einfamilienhaus',
	rh: 'Reihenhaus',
	dhh: 'Doppelhaushälfte',
	zfh: 'Zweifamilienhaus',
	mfh: 'Mehrfamilienhaus',
	eg: 'Erdgeschosswohnung',
	etage: 'Etagenwohnung',
	dg: 'Dachgeschosswohnung',
	maisonette: 'Maisonette',
	penthouse: 'Penthouse',
};

const conditionLabels: Record<string, string> = {
	new: 'Neubau / Kernsaniert',
	renovated: 'Kürzlich renoviert',
	good: 'Guter Zustand',
	needs_renovation: 'Renovierungsbedürftig',
};

const qualityLabels: Record<string, string> = {
	premium: 'Gehobene Ausstattung',
	normal: 'Normale Ausstattung',
	basic: 'Einfache Ausstattung',
};

const featureLabels: Record<string, string> = {
	balcony: 'Balkon',
	terrace: 'Terrasse',
	garden: 'Garten',
	elevator: 'Aufzug',
	parking: 'Stellplatz',
	garage: 'Garage',
	cellar: 'Keller',
	fitted_kitchen: 'Einbauküche',
	floor_heating: 'Fußbodenheizung',
	guest_toilet: 'Gäste-WC',
	barrier_free: 'Barrierefrei',
	solar: 'Solar/PV-Anlage',
};

export function PropertyValueResult({ result, inputs, agent }: PropertyValueResultProps) {
	const {
		estimated_value,
		price_per_sqm,
		plot_value,
		market_position,
		city_average,
		county_average,
		factors,
	} = result;

	const showMarketComparison =
		[price_per_sqm, city_average, county_average].filter((v) => v > 0).length >= 2;

	// Build factor breakdown data
	const factorItems = [
		{ label: __('Lage', 'resa'), impact: factors.location_impact },
		{ label: __('Ausstattung', 'resa'), impact: factors.quality_impact },
		{ label: __('Zustand', 'resa'), impact: factors.condition_impact },
		{ label: __('Alter', 'resa'), impact: factors.age_impact },
		{ label: __('Vermietung', 'resa'), impact: factors.rental_impact },
		{ label: __('Unterart', 'resa'), impact: factors.subtype_impact },
		{ label: __('Typ', 'resa'), impact: factors.type_impact },
	];

	// Build input summary items
	const inputItems = [
		{
			label: __('Objekttyp', 'resa'),
			value:
				subtypeLabels[inputs.property_subtype ?? ''] ??
				propertyTypeLabels[inputs.property_type ?? ''] ??
				inputs.property_type ??
				'',
			icon: 'haus',
		},
		{
			label: __('Wohnfläche', 'resa'),
			value: `${inputs.size} m²`,
			icon: 'flaeche',
		},
		...(inputs.plot_size
			? [
					{
						label: __('Grundstück', 'resa'),
						value: `${inputs.plot_size} m²`,
						icon: 'grundstueck',
					},
				]
			: []),
		...(inputs.city_name
			? [{ label: __('Standort', 'resa'), value: inputs.city_name, icon: 'standort' }]
			: []),
		{
			label: __('Zustand', 'resa'),
			value: conditionLabels[inputs.condition ?? ''] ?? inputs.condition ?? '',
			icon: 'zustand',
		},
		{
			label: __('Qualität', 'resa'),
			value: qualityLabels[inputs.quality ?? ''] ?? inputs.quality ?? '',
			icon: 'ausstattung',
		},
		{
			label: __('Lage', 'resa'),
			value: `${inputs.location_rating}/5`,
			icon: 'lage',
		},
		...(inputs.features && inputs.features.length > 0
			? [
					{
						label: __('Extras', 'resa'),
						value: inputs.features.map((f) => featureLabels[f] ?? f).join(', '),
						icon: 'feature',
					},
				]
			: []),
	];

	return (
		<ResultLayout
			hero={
				<ResultHero
					icon="haus"
					label={__('Geschätzter Marktwert', 'resa')}
					value={formatCurrency(estimated_value.estimate)}
					subtitle={`${__('Spanne:', 'resa')} ${formatCurrency(estimated_value.low)} – ${formatCurrency(estimated_value.high)}`}
				/>
			}
			stats={
				<div
					className={`resa-grid resa-gap-3 ${plot_value ? 'resa-grid-cols-2' : 'resa-grid-cols-1'}`}
				>
					<ResultStatCard
						icon="wohnung"
						label={__('Kaufpreis pro m²', 'resa')}
						value={`${formatCurrencyPrecise(price_per_sqm)}/m²`}
					/>
					{plot_value !== null && plot_value > 0 && (
						<ResultStatCard
							icon="grundstueck"
							label={__('Grundstückswert', 'resa')}
							value={formatCurrency(plot_value)}
						/>
					)}
				</div>
			}
			marketPosition={
				<MarketPositionGauge
					percentile={market_position.percentile}
					label={market_position.label}
				/>
			}
			comparison={
				showMarketComparison ? (
					<>
						<div className="resa-text-xs resa-font-medium resa-text-muted-foreground resa-mb-3">
							{__('Marktvergleich (EUR/m²)', 'resa')}
						</div>
						<ComparisonBarChart
							propertyValue={price_per_sqm}
							cityAverage={city_average}
							cityName={inputs.city_name}
							countyAverage={county_average}
							unit="EUR/m²"
						/>
					</>
				) : undefined
			}
			extraContent={
				<>
					<div className="resa-text-xs resa-font-medium resa-text-muted-foreground resa-mb-3">
						{__('Wertfaktoren', 'resa')}
					</div>
					<FactorBreakdownChart factors={factorItems} />
				</>
			}
			inputSummary={<InputSummary items={inputItems} defaultCollapsed />}
			location={
				inputs.address_lat && inputs.address_lng
					? {
							lat: inputs.address_lat,
							lng: inputs.address_lng,
							address: inputs.address,
						}
					: undefined
			}
			agent={agent}
		/>
	);
}
