/**
 * Property value result display.
 *
 * Shows estimated market value with range, price per m²,
 * plot value (houses only), market position, comparison chart,
 * factor breakdown, and input summary.
 */

import { __ } from '@wordpress/i18n';
import { motion } from 'framer-motion';
import { ResaIcon } from '@/components/icons';
import { ResaMap } from '@frontend/components/map';
import { ComparisonBarChart } from '@frontend/components/charts';
import { MarketPositionGauge } from '@frontend/components/shared/MarketPositionGauge';
import { FactorBreakdownChart } from './FactorBreakdownChart';
import type { PropertyValueResult as PropertyValueResultType, PropertyValueData } from '../types';

interface PropertyValueResultProps {
	result: PropertyValueResultType;
	inputs: PropertyValueData;
	/** Optional agent info for personalized CTA */
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

const getPropertyTypeLabels = (): Record<string, string> => ({
	apartment: __('Wohnung', 'resa'),
	house: __('Haus', 'resa'),
});

const getSubtypeLabels = (): Record<string, string> => ({
	efh: __('Einfamilienhaus', 'resa'),
	rh: __('Reihenhaus', 'resa'),
	dhh: __('Doppelhaushälfte', 'resa'),
	zfh: __('Zweifamilienhaus', 'resa'),
	mfh: __('Mehrfamilienhaus', 'resa'),
	eg: __('Erdgeschosswohnung', 'resa'),
	etage: __('Etagenwohnung', 'resa'),
	dg: __('Dachgeschosswohnung', 'resa'),
	maisonette: __('Maisonette', 'resa'),
	penthouse: __('Penthouse', 'resa'),
});

const getConditionLabels = (): Record<string, string> => ({
	new: __('Neubau / Kernsaniert', 'resa'),
	renovated: __('Kürzlich renoviert', 'resa'),
	good: __('Guter Zustand', 'resa'),
	needs_renovation: __('Renovierungsbedürftig', 'resa'),
});

const getQualityLabels = (): Record<string, string> => ({
	premium: __('Gehobene Ausstattung', 'resa'),
	normal: __('Normale Ausstattung', 'resa'),
	basic: __('Einfache Ausstattung', 'resa'),
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
	solar: __('Solar/PV-Anlage', 'resa'),
});

const stagger = {
	hidden: {},
	show: {
		transition: {
			staggerChildren: 0.1,
		},
	},
};

const fadeUp = {
	hidden: { opacity: 0, y: 12 },
	show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
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

	const propertyTypeLabels = getPropertyTypeLabels();
	const subtypeLabels = getSubtypeLabels();
	const conditionLabels = getConditionLabels();
	const qualityLabels = getQualityLabels();
	const featureLabels = getFeatureLabels();

	const comparisonBars = [price_per_sqm, city_average, county_average].filter(
		(v) => v > 0,
	).length;
	const showMarketComparison = comparisonBars >= 2;

	// Build factor breakdown data.
	const factorItems = [
		{ label: __('Lage', 'resa'), impact: factors.location_impact },
		{ label: __('Ausstattung', 'resa'), impact: factors.quality_impact },
		{ label: __('Zustand', 'resa'), impact: factors.condition_impact },
		{ label: __('Alter', 'resa'), impact: factors.age_impact },
		{ label: __('Vermietung', 'resa'), impact: factors.rental_impact },
		{ label: __('Unterart', 'resa'), impact: factors.subtype_impact },
		{ label: __('Typ', 'resa'), impact: factors.type_impact },
	];

	return (
		<motion.div className="resa-space-y-6" variants={stagger} initial="hidden" animate="show">
			{/* Hero — Main result with gradient background */}
			<motion.div
				variants={fadeUp}
				className="resa-relative resa-overflow-hidden resa-rounded-2xl resa-p-8 resa-text-center"
				style={{
					background:
						'linear-gradient(135deg, hsl(var(--resa-primary) / 0.08) 0%, hsl(var(--resa-primary) / 0.18) 100%)',
				}}
			>
				{/* Decorative background circles */}
				<div
					className="resa-absolute resa-w-32 resa-h-32 resa-rounded-full resa-opacity-20 resa-pointer-events-none"
					style={{
						background: 'hsl(var(--resa-primary))',
						top: '-4rem',
						right: '-4rem',
					}}
				/>
				<div
					className="resa-absolute resa-w-24 resa-h-24 resa-rounded-full resa-opacity-10 resa-pointer-events-none"
					style={{
						background: 'hsl(var(--resa-primary))',
						bottom: '-3rem',
						left: '-3rem',
					}}
				/>

				<div className="resa-relative">
					<div className="resa-inline-flex resa-items-center resa-gap-2 resa-text-sm resa-text-muted-foreground resa-mb-3">
						<ResaIcon name="haus" size={16} className="resa-text-primary" />
						{__('Geschätzter Marktwert', 'resa')}
					</div>
					<motion.div
						className="resa-text-5xl resa-font-bold resa-text-primary resa-tracking-tight"
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
					>
						{formatCurrency(estimated_value.estimate)}
					</motion.div>
					<div className="resa-text-sm resa-text-muted-foreground resa-mt-3 resa-font-medium">
						{__('Spanne:', 'resa')} {formatCurrency(estimated_value.low)} –{' '}
						{formatCurrency(estimated_value.high)}
					</div>
				</div>
			</motion.div>

			{/* Detail stats */}
			<motion.div
				variants={fadeUp}
				className={`resa-grid resa-gap-3 ${plot_value ? 'resa-grid-cols-2' : 'resa-grid-cols-1'}`}
			>
				<div className="resa-bg-muted/30 resa-rounded-lg resa-p-4 resa-flex resa-items-center resa-gap-3">
					<ResaIcon
						name="wohnung"
						size={28}
						className="resa-text-muted-foreground resa-shrink-0"
					/>
					<div>
						<div className="resa-text-xs resa-text-muted-foreground">
							{__('Kaufpreis pro m²', 'resa')}
						</div>
						<div className="resa-text-lg resa-font-semibold">
							{formatCurrencyPrecise(price_per_sqm)}/m²
						</div>
					</div>
				</div>
				{plot_value !== null && plot_value > 0 && (
					<div className="resa-bg-muted/30 resa-rounded-lg resa-p-4 resa-flex resa-items-center resa-gap-3">
						<ResaIcon
							name="grundstueck"
							size={28}
							className="resa-text-muted-foreground resa-shrink-0"
						/>
						<div>
							<div className="resa-text-xs resa-text-muted-foreground">
								{__('Grundstückswert', 'resa')}
							</div>
							<div className="resa-text-lg resa-font-semibold">
								{formatCurrency(plot_value)}
							</div>
						</div>
					</div>
				)}
			</motion.div>

			{/* Market position */}
			<motion.div variants={fadeUp} className="resa-border-b resa-border-border resa-pb-6">
				<div className="resa-text-xs resa-text-muted-foreground resa-text-center resa-mb-2">
					{__('Marktposition', 'resa')}
				</div>
				<MarketPositionGauge
					percentile={market_position.percentile}
					label={market_position.label}
				/>
			</motion.div>

			{/* Market comparison */}
			{showMarketComparison && (
				<motion.div
					variants={fadeUp}
					className="resa-border-b resa-border-border resa-pb-6"
				>
					<div className="resa-text-xs resa-font-medium resa-text-muted-foreground resa-mb-3">
						{__('Marktvergleich (EUR/m²)', 'resa')}
					</div>
					<ComparisonBarChart
						propertyValue={price_per_sqm}
						cityAverage={city_average}
						cityName={inputs.city_name}
						countyAverage={county_average}
						unit="EUR/m²"
						height={140}
					/>
				</motion.div>
			)}

			{/* Factor breakdown */}
			<motion.div variants={fadeUp} className="resa-border-b resa-border-border resa-pb-6">
				<div className="resa-text-xs resa-font-medium resa-text-muted-foreground resa-mb-3">
					{__('Wertfaktoren', 'resa')}
				</div>
				<FactorBreakdownChart factors={factorItems} height={factorItems.length * 28} />
			</motion.div>

			{/* Input summary */}
			<motion.div variants={fadeUp} className="resa-bg-muted/20 resa-rounded-lg resa-p-4">
				<div className="resa-text-xs resa-font-medium resa-text-muted-foreground resa-mb-2">
					{__('Ihre Eingaben', 'resa')}
				</div>
				<div className="resa-text-sm resa-space-y-0.5">
					<p>
						{subtypeLabels[inputs.property_subtype ?? ''] ??
							propertyTypeLabels[inputs.property_type ?? ''] ??
							inputs.property_type}
						{' · '}
						{inputs.size} m²
						{inputs.plot_size
							? ` · ${inputs.plot_size} m² ${__('Grundstück', 'resa')}`
							: ''}
						{inputs.city_name && ` · ${inputs.city_name}`}
					</p>
					<p>
						{conditionLabels[inputs.condition ?? ''] ?? inputs.condition}
						{' · '}
						{qualityLabels[inputs.quality ?? ''] ?? inputs.quality}
						{' · '}
						{__('Lage', 'resa')} {inputs.location_rating}/5
					</p>
					{inputs.features && inputs.features.length > 0 && (
						<p>{inputs.features.map((f) => featureLabels[f] ?? f).join(', ')}</p>
					)}
				</div>
			</motion.div>

			{/* Location map */}
			{inputs.address_lat && inputs.address_lng && (
				<motion.div
					variants={fadeUp}
					className="resa-border-b resa-border-border resa-pb-6"
				>
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
				</motion.div>
			)}

			{/* Agent CTA — personalized if agent data available */}
			<motion.div
				variants={fadeUp}
				className="resa-bg-primary resa-text-primary-foreground resa-rounded-xl resa-p-5"
			>
				{agent?.name ? (
					<div className="resa-flex resa-items-center resa-gap-4">
						{agent.photo_url ? (
							<img
								src={agent.photo_url}
								alt={agent.name}
								className="resa-w-14 resa-h-14 resa-rounded-full resa-object-cover resa-border-2 resa-border-primary-foreground/20 resa-shrink-0"
							/>
						) : (
							<div className="resa-w-14 resa-h-14 resa-rounded-full resa-bg-primary-foreground/20 resa-flex resa-items-center resa-justify-center resa-shrink-0">
								<ResaIcon name="user" size={24} />
							</div>
						)}
						<div className="resa-flex-1 resa-min-w-0">
							<p className="resa-text-sm resa-opacity-90">
								{__('Ihr Ansprechpartner', 'resa')}
							</p>
							<p className="resa-font-semibold resa-truncate">{agent.name}</p>
							{agent.phone && (
								<p className="resa-text-sm resa-font-medium resa-mt-1">
									{agent.phone}
								</p>
							)}
						</div>
					</div>
				) : (
					<p className="resa-text-sm resa-text-center">
						{__(
							'Ein Immobilienexperte analysiert Ihre Daten und meldet sich in Kürze bei Ihnen.',
							'resa',
						)}
					</p>
				)}
			</motion.div>
		</motion.div>
	);
}
