/**
 * Type definitions for the Immobilienwert-Rechner module.
 */

export interface ValueCalculatorData {
	property_type?: 'apartment' | 'house';
	size?: number;
	rooms?: number;
	year_built?: number;
	city_id?: number;
	city_name?: string;
	city_slug?: string;
	/** City center latitude (for bounded address search). */
	city_lat?: number;
	/** City center longitude (for bounded address search). */
	city_lng?: number;
	/** Full property address from AddressStep. */
	address?: string;
	/** Property latitude from AddressStep. */
	address_lat?: number;
	/** Property longitude from AddressStep. */
	address_lng?: number;
	condition?: 'new' | 'renovated' | 'good' | 'needs_renovation';
	location_rating?: number;
	features?: string[];
	/** Free-text for additional features (non-calculation, info for agent). */
	additional_features?: string;
}

export interface ValueCalculationResult {
	property_value: {
		estimate: number;
		low: number;
		high: number;
	};
	price_per_sqm: number;
	annual_rent: number;
	monthly_rent: number;
	sale_factor: number;
	market_position: {
		percentile: number;
		label: string;
	};
	average_value: number;
	comparison_percent: number;
	city: {
		id: number;
		name: string;
		slug: string;
	};
	city_average: number;
	county_average: number;
	factors: {
		base_price: number;
		size_factor: number;
		location_impact: number;
		condition_impact: number;
		type_impact: number;
		age_impact: number;
		feature_premium: number;
		features_count: number;
	};
}

export interface CityOption {
	id: number;
	slug: string;
	name: string;
	/** City center latitude. */
	latitude?: number | null;
	/** City center longitude. */
	longitude?: number | null;
	/** Default zoom level. */
	zoomLevel?: number;
}

export interface FeatureOption {
	key: string;
	label: string;
	icon: string;
}

export interface ModuleConfig {
	module: string;
	cities: CityOption[];
	features: FeatureOption[];
}
