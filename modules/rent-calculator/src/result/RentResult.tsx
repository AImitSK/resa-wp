/**
 * Rent calculation result display.
 *
 * Shows monthly rent estimate with range, price per m²,
 * annual rent, and market position gauge.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarketPositionGauge } from './MarketPositionGauge';
import type { RentCalculationResult, RentCalculatorData } from '../types';

interface RentResultProps {
	result: RentCalculationResult;
	inputs: RentCalculatorData;
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

export function RentResult({ result, inputs }: RentResultProps) {
	const { monthly_rent, annual_rent, price_per_sqm, market_position } = result;

	return (
		<div className="resa-space-y-4">
			{/* Main result */}
			<Card>
				<CardHeader className="resa-text-center resa-pb-2">
					<CardTitle className="resa-text-base">Geschätzte Monatsmiete</CardTitle>
				</CardHeader>
				<CardContent className="resa-text-center">
					<div className="resa-text-4xl resa-font-bold resa-text-primary">
						{formatCurrency(monthly_rent.estimate)}
					</div>
					<div className="resa-text-sm resa-text-muted-foreground resa-mt-1">
						({formatCurrency(monthly_rent.low)} – {formatCurrency(monthly_rent.high)})
					</div>
				</CardContent>
			</Card>

			{/* Details grid */}
			<div className="resa-grid resa-grid-cols-2 resa-gap-3">
				<Card>
					<CardContent className="resa-p-4 resa-text-center">
						<div className="resa-text-xs resa-text-muted-foreground">Preis pro m²</div>
						<div className="resa-text-lg resa-font-semibold">
							{formatCurrencyPrecise(price_per_sqm)}/m²
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="resa-p-4 resa-text-center">
						<div className="resa-text-xs resa-text-muted-foreground">
							Jährliche Mieteinnahmen
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
						Marktposition
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
						Ihre Eingaben
					</div>
					<ul className="resa-space-y-1 resa-text-sm">
						<li>
							{propertyTypeLabels[inputs.property_type ?? ''] ?? inputs.property_type}
							, {inputs.size} m²
							{inputs.city_name && `, ${inputs.city_name}`}
						</li>
						<li>
							{conditionLabels[inputs.condition ?? ''] ?? inputs.condition}, Lage{' '}
							{inputs.location_rating}/5
						</li>
						{inputs.features && inputs.features.length > 0 && (
							<li>{inputs.features.map((f) => featureLabels[f] ?? f).join(', ')}</li>
						)}
					</ul>
				</CardContent>
			</Card>

			{/* Agent hint */}
			<div className="resa-rounded-lg resa-bg-muted/50 resa-p-4 resa-text-center">
				<p className="resa-text-sm resa-text-muted-foreground">
					Ein Immobilienexperte analysiert Ihre Daten und meldet sich in Kürze bei Ihnen.
				</p>
			</div>
		</div>
	);
}
