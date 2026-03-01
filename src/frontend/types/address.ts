/**
 * Types for address search and geocoding in frontend.
 */

/**
 * Address data returned from selection.
 */
export interface AddressData {
	/** Full address string (formatted) */
	displayName: string;
	/** Street + house number */
	street?: string;
	/** Postal code */
	postalCode?: string;
	/** City name */
	city?: string;
	/** Latitude */
	lat: number;
	/** Longitude */
	lng: number;
}

/**
 * Single geocoding result from API.
 * Note: Field names match PHP snake_case API response.
 */
export interface GeocodingResult {
	/** Latitude */
	lat: number;
	/** Longitude */
	lng: number;
	/** Full display name */
	display_name: string;
	/** City name */
	city: string | null;
	/** State/region */
	state: string | null;
	/** Country name */
	country: string | null;
	/** ISO country code (de, at, ch) */
	country_code: string | null;
	/** Postal code */
	postal_code: string | null;
}

/**
 * Geocoding API response.
 */
export interface GeocodingResponse {
	/** Whether request was successful */
	success: boolean;
	/** Array of results */
	data: {
		results: GeocodingResult[];
		provider: string;
	};
}

/**
 * Options for bounding address search to a region.
 */
export interface AddressBounds {
	/** Location name (e.g., "Bad Oeynhausen") */
	name: string;
	/** Center latitude */
	lat?: number;
	/** Center longitude */
	lng?: number;
	/** Bounding box [minLat, maxLat, minLng, maxLng] */
	boundingBox?: [number, number, number, number];
}

/**
 * Location data from API (for CityStep integration).
 */
export interface LocationData {
	/** Location ID */
	id: number;
	/** URL slug */
	slug: string;
	/** Display name */
	name: string;
	/** Latitude (if configured) */
	latitude: number | null;
	/** Longitude (if configured) */
	longitude: number | null;
	/** Default zoom level */
	zoomLevel: number;
}
