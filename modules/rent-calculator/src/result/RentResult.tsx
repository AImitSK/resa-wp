/**
 * Rent calculation result display.
 *
 * Shows monthly rent estimate with range, price per m²,
 * annual rent, and market position gauge.
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
import type { RentCalculationResult, RentCalculatorData } from '../types';

interface RentResultProps {
	result: RentCalculationResult;
	inputs: RentCalculatorData;
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

const conditionLabels: Record<string, string> = {
	new: 'Neubau / Kernsaniert',
	renovated: 'Kürzlich renoviert',
	good: 'Guter Zustand',
	needs_renovation: 'Renovierungsbedürftig',
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
};

export function RentResult({ result, inputs, agent }: RentResultProps) {
	const {
		monthly_rent,
		annual_rent,
		price_per_sqm,
		market_position,
		city_average,
		county_average,
	} = result;

	const showMarketComparison =
		[price_per_sqm, city_average, county_average].filter((v) => v > 0).length >= 2;

	// Build input summary items
	const inputItems = [
		{
			label: __('Objekttyp', 'resa'),
			value: propertyTypeLabels[inputs.property_type ?? ''] ?? inputs.property_type ?? '',
			icon: 'wohnung',
		},
		{
			label: __('Wohnfläche', 'resa'),
			value: `${inputs.size} m²`,
			icon: 'flaeche',
		},
		...(inputs.city_name
			? [{ label: __('Standort', 'resa'), value: inputs.city_name, icon: 'standort' }]
			: []),
		{
			label: __('Zustand', 'resa'),
			value: conditionLabels[inputs.condition ?? ''] ?? inputs.condition ?? '',
			icon: 'zustand',
		},
		{
			label: __('Lage', 'resa'),
			value: `${inputs.location_rating}/5`,
			icon: 'lage',
		},
		...(inputs.features && inputs.features.length > 0
			? [
					{
						label: __('Ausstattung', 'resa'),
						value: inputs.features.map((f) => featureLabels[f] ?? f).join(', '),
						icon: 'ausstattung',
					},
				]
			: []),
	];

	return (
		<ResultLayout
			hero={
				<ResultHero
					icon="euro"
					label={__('Geschätzte Monatsmiete', 'resa')}
					value={formatCurrency(monthly_rent.estimate)}
					subtitle={`${__('Spanne:', 'resa')} ${formatCurrency(monthly_rent.low)} – ${formatCurrency(monthly_rent.high)}`}
				/>
			}
			stats={
				<div className="resa-grid resa-grid-cols-2 resa-gap-3">
					<ResultStatCard
						icon="wohnung"
						label={__('Preis pro m²', 'resa')}
						value={`${formatCurrencyPrecise(price_per_sqm)}/m²`}
					/>
					<ResultStatCard
						icon="zeitrahmen"
						label={__('Jährliche Mieteinnahmen', 'resa')}
						value={formatCurrency(annual_rent)}
					/>
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
							{__('Marktvergleich (€/m²)', 'resa')}
						</div>
						<ComparisonBarChart
							propertyValue={price_per_sqm}
							cityAverage={city_average}
							cityName={inputs.city_name}
							countyAverage={county_average}
							unit="€/m²"
						/>
					</>
				) : undefined
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
