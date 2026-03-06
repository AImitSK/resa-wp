/**
 * Property value calculation result display.
 *
 * Shows property value estimate with range, price per m²,
 * annual/monthly rent, sale factor, market position gauge,
 * and comparison to average market value.
 */

import { __ } from '@wordpress/i18n';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResaMap } from '@frontend/components/map';
import { MarketPositionGauge } from './MarketPositionGauge';
import type { ValueCalculationResult, ValueCalculatorData } from '../types';

interface ValueResultProps {
	result: ValueCalculationResult;
	inputs: ValueCalculatorData;
}

/** Format number in DACH style (comma decimal, dot thousands). */
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

const getPropertyTypeLabels = (): Record<string, string> => ({
	apartment: __('Wohnung', 'resa'),
	house: __('Haus', 'resa'),
});

const getConditionLabels = (): Record<string, string> => ({
	new: __('Neubau / Kernsaniert', 'resa'),
	renovated: __('Kürzlich renoviert', 'resa'),
	good: __('Guter Zustand', 'resa'),
	needs_renovation: __('Renovierungsbedürftig', 'resa'),
});

const getFeatureLabels = (): Record<string, string> => ({
	balcony: __('Balkon', 'resa'),
	terrace: __('Terrasse', 'resa'),
	garden: __('Garten', 'resa'),
	elevator: __('Aufzug', 'resa'),
	parking: __('Stellplatz', 'resa'),
	garage: __('Garage', 'resa'),
	cellar: __('Keller', 'resa'),
	fitted_kitchen: __('Einbauküche', 'resa'),
	floor_heating: __('Fußbodenheizung', 'resa'),
	guest_toilet: __('Gäste-WC', 'resa'),
	barrier_free: __('Barrierefrei', 'resa'),
});

export function ValueResult({ result, inputs }: ValueResultProps) {
	const {
		property_value,
		price_per_sqm,
		annual_rent,
		monthly_rent,
		sale_factor,
		market_position,
		average_value,
		comparison_percent,
	} = result;

	const propertyTypeLabels = getPropertyTypeLabels();
	const conditionLabels = getConditionLabels();
	const featureLabels = getFeatureLabels();

	// Determine comparison indicator
	const comparisonIcon =
		comparison_percent > 2 ? (
			<TrendingUp className="resa-h-4 resa-w-4 resa-text-green-500" />
		) : comparison_percent < -2 ? (
			<TrendingDown className="resa-h-4 resa-w-4 resa-text-red-500" />
		) : (
			<Minus className="resa-h-4 resa-w-4 resa-text-muted-foreground" />
		);

	const comparisonText =
		comparison_percent > 2
			? __('über dem Durchschnitt', 'resa')
			: comparison_percent < -2
				? __('unter dem Durchschnitt', 'resa')
				: __('im Durchschnitt', 'resa');

	return (
		<div className="resa-space-y-4">
			{/* Main result */}
			<Card>
				<CardHeader className="resa-text-center resa-pb-2">
					<CardTitle className="resa-text-base">
						{__('Geschätzter Immobilienwert', 'resa')}
					</CardTitle>
				</CardHeader>
				<CardContent className="resa-text-center">
					<div className="resa-text-4xl resa-font-bold resa-text-primary">
						{formatCurrency(property_value.estimate)}
					</div>
					<div className="resa-text-sm resa-text-muted-foreground resa-mt-1">
						({formatCurrency(property_value.low)} –{' '}
						{formatCurrency(property_value.high)})
					</div>
				</CardContent>
			</Card>

			{/* Comparison to average */}
			<Card>
				<CardContent className="resa-p-4">
					<div className="resa-flex resa-items-center resa-justify-between">
						<div>
							<div className="resa-text-xs resa-text-muted-foreground">
								{__('Vergleich zum Durchschnitt', 'resa')}
							</div>
							<div className="resa-text-sm resa-font-medium resa-mt-1">
								{__('Durchschnittswert:', 'resa')} {formatCurrency(average_value)}
							</div>
						</div>
						<div className="resa-flex resa-items-center resa-gap-2">
							{comparisonIcon}
							<div className="resa-text-right">
								<div className="resa-font-semibold">
									{comparison_percent > 0 ? '+' : ''}
									{comparison_percent.toFixed(1)}%
								</div>
								<div className="resa-text-xs resa-text-muted-foreground">
									{comparisonText}
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Details grid */}
			<div className="resa-grid resa-grid-cols-2 resa-gap-3">
				<Card>
					<CardContent className="resa-p-4 resa-text-center">
						<div className="resa-text-xs resa-text-muted-foreground">
							{__('Preis pro m²', 'resa')}
						</div>
						<div className="resa-text-lg resa-font-semibold">
							{formatCurrencyPrecise(price_per_sqm)}/m²
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="resa-p-4 resa-text-center">
						<div className="resa-text-xs resa-text-muted-foreground">
							{__('Vervielfältiger', 'resa')}
						</div>
						<div className="resa-text-lg resa-font-semibold">{sale_factor}×</div>
					</CardContent>
				</Card>
			</div>

			{/* Rent income details */}
			<div className="resa-grid resa-grid-cols-2 resa-gap-3">
				<Card>
					<CardContent className="resa-p-4 resa-text-center">
						<div className="resa-text-xs resa-text-muted-foreground">
							{__('Monatsmiete (geschätzt)', 'resa')}
						</div>
						<div className="resa-text-lg resa-font-semibold">
							{formatCurrency(monthly_rent)}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="resa-p-4 resa-text-center">
						<div className="resa-text-xs resa-text-muted-foreground">
							{__('Jährliche Mieteinnahmen', 'resa')}
						</div>
						<div className="resa-text-lg resa-font-semibold">
							{formatCurrency(annual_rent)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Market position */}
			<Card>
				<CardContent className="resa-p-4">
					<div className="resa-text-xs resa-text-muted-foreground resa-text-center resa-mb-2">
						{__('Marktposition', 'resa')}
					</div>
					<MarketPositionGauge
						percentile={market_position.percentile}
						label={market_position.label}
					/>
				</CardContent>
			</Card>

			{/* Input summary */}
			<Card>
				<CardContent className="resa-p-4">
					<div className="resa-text-xs resa-font-medium resa-text-muted-foreground resa-mb-2">
						{__('Ihre Eingaben', 'resa')}
					</div>
					<ul className="resa-space-y-1 resa-text-sm">
						<li>
							{propertyTypeLabels[inputs.property_type ?? ''] ?? inputs.property_type}
							, {inputs.size} m²
							{inputs.city_name && `, ${inputs.city_name}`}
						</li>
						<li>
							{conditionLabels[inputs.condition ?? ''] ?? inputs.condition},{' '}
							{__('Lage', 'resa')} {inputs.location_rating}/5
						</li>
						{inputs.features && inputs.features.length > 0 && (
							<li>{inputs.features.map((f) => featureLabels[f] ?? f).join(', ')}</li>
						)}
					</ul>
				</CardContent>
			</Card>

			{/* Location map — show if address coordinates available */}
			{inputs.address_lat && inputs.address_lng && (
				<Card>
					<CardContent className="resa-p-4">
						<div className="resa-text-xs resa-font-medium resa-text-muted-foreground resa-mb-2">
							{__('Standort', 'resa')}
						</div>
						<div className="resa-rounded-lg resa-overflow-hidden">
							<ResaMap
								center={{ lat: inputs.address_lat, lng: inputs.address_lng }}
								zoom={15}
								showMarker
								height={180}
								lazyLoad={false}
							/>
						</div>
						{inputs.address && (
							<p className="resa-text-xs resa-text-muted-foreground resa-text-center resa-mt-2">
								{inputs.address}
							</p>
						)}
					</CardContent>
				</Card>
			)}

			{/* Agent hint */}
			<div className="resa-rounded-lg resa-bg-muted/50 resa-p-4 resa-text-center">
				<p className="resa-text-sm resa-text-muted-foreground">
					{__(
						'Ein Immobilienexperte analysiert Ihre Daten und meldet sich in Kürze bei Ihnen.',
						'resa',
					)}
				</p>
			</div>
		</div>
	);
}
