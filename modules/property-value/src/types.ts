/**
 * Type definitions for the Immobilienwert-Kalkulator module.
 */

export interface PropertyValueData {
	property_type?: 'house' | 'apartment';
	property_subtype?: string;
	size?: number;
	plot_size?: number;
	rooms?: number;
	year_built?: number;
	condition?: 'new' | 'renovated' | 'good' | 'needs_renovation';
	quality?: 'premium' | 'normal' | 'basic';
	rental_status?: 'owner_occupied' | 'rented' | 'vacant';
	features?: string[];
	additional_features?: string;
	city_id?: number;
	city_name?: string;
	city_slug?: string;
	city_lat?: number;
	city_lng?: number;
	address?: string;
	address_lat?: number;
	address_lng?: number;
	location_rating?: number;
}

export interface PropertyValueResult {
	estimated_value: { estimate: number; low: number; high: number };
	price_per_sqm: number;
	plot_value: number | null;
	market_position: { percentile: number; label: string };
	city_average: number;
	county_average: number;
	city: { id: number; name: string; slug: string };
	factors: {
		base_price: number;
		size_factor: number;
		type_impact: number;
		subtype_impact: number;
		condition_impact: number;
		age_impact: number;
		quality_impact: number;
		location_impact: number;
		rental_impact: number;
		feature_premium: number;
		features_count: number;
	};
}

export interface CityOption {
	id: number;
	slug: string;
	name: string;
	latitude?: number | null;
	longitude?: number | null;
}

export interface FeatureOption {
	key: string;
	label: string;
	icon: string;
}

export interface SubtypeOption {
	key: string;
	label: string;
	icon: string;
}

export interface ModuleConfig {
	module: string;
	cities: CityOption[];
	features: FeatureOption[];
	subtypes_house: SubtypeOption[];
	subtypes_apartment: SubtypeOption[];
}
