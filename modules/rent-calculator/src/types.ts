/**
 * Type definitions for the Mietpreis-Kalkulator module.
 */

export interface RentCalculatorData {
	property_type?: 'apartment' | 'house';
	size?: number;
	rooms?: number;
	year_built?: number;
	city_id?: number;
	city_name?: string;
	city_slug?: string;
	condition?: 'new' | 'renovated' | 'good' | 'needs_renovation';
	location_rating?: number;
	features?: string[];
	/** Free-text for additional features (non-calculation, info for agent). */
	additional_features?: string;
}

export interface RentCalculationResult {
	monthly_rent: { estimate: number; low: number; high: number };
	annual_rent: number;
	price_per_sqm: number;
	market_position: { percentile: number; label: string };
	city: { id: number; name: string; slug: string };
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
