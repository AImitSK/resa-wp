/**
 * ResaMap — Provider-agnostic map component.
 *
 * Abstracts the map provider (Leaflet/OSM or Google Maps) and handles
 * lazy loading via Intersection Observer. Google Maps requires user
 * consent before loading (GDPR compliance).
 *
 * Usage:
 * ```tsx
 * <ResaMap
 *   center={{ lat: 52.2058, lng: 8.7974 }}
 *   zoom={13}
 *   showMarker
 * />
 * ```
 */

import { useState, useCallback } from 'react';
import { LeafletMap, type MapPosition, type TileStyle } from './LeafletMap';
import { GoogleMap } from './GoogleMap';
import { GoogleMapConsent } from './GoogleMapConsent';
import { MapPlaceholder } from './MapPlaceholder';

export type MapProvider = 'osm' | 'google';

export interface ResaMapConfig {
	/** Map provider */
	provider: MapProvider;
	/** Google Maps API key (required for Google provider) */
	googleApiKey?: string;
	/** Tile style for OSM provider */
	tileStyle?: TileStyle;
	/** Default zoom level */
	defaultZoom?: number;
	/** Enable scroll wheel zoom */
	scrollZoom?: boolean;
}

interface ResaMapProps {
	/** Center position */
	center: MapPosition;
	/** Zoom level (overrides config default) */
	zoom?: number;
	/** Show marker at center */
	showMarker?: boolean;
	/** Custom marker position */
	markerPosition?: MapPosition;
	/** Map height in pixels */
	height?: number;
	/** Map configuration (from settings) */
	config?: Partial<ResaMapConfig>;
	/** Enable lazy loading */
	lazyLoad?: boolean;
	/** Skip GDPR consent for Google Maps (use only if consent handled externally) */
	skipConsent?: boolean;
	/** Additional CSS class */
	className?: string;
}

// Default configuration
const DEFAULT_CONFIG: ResaMapConfig = {
	provider: 'osm',
	tileStyle: 'minimal',
	defaultZoom: 13,
	scrollZoom: false,
};

// Session storage key for Google Maps consent
const CONSENT_STORAGE_KEY = 'resa_google_maps_consent';

/**
 * Get map configuration from window.resaConfig or use defaults.
 */
function getMapConfig(): ResaMapConfig {
	const resaConfig = (
		window as unknown as { resaConfig?: { mapSettings?: Partial<ResaMapConfig> } }
	).resaConfig;

	if (resaConfig?.mapSettings) {
		return {
			...DEFAULT_CONFIG,
			...resaConfig.mapSettings,
		};
	}

	return DEFAULT_CONFIG;
}

/**
 * Check if user has already consented to Google Maps in this session.
 */
function hasGoogleMapsConsent(): boolean {
	try {
		return sessionStorage.getItem(CONSENT_STORAGE_KEY) === 'true';
	} catch {
		// sessionStorage not available
		return false;
	}
}

/**
 * Save Google Maps consent to session storage.
 */
function saveGoogleMapsConsent(): void {
	try {
		sessionStorage.setItem(CONSENT_STORAGE_KEY, 'true');
	} catch {
		// sessionStorage not available
	}
}

export function ResaMap({
	center,
	zoom,
	showMarker = true,
	markerPosition,
	height = 250,
	config: configOverride,
	lazyLoad = true,
	skipConsent = false,
	className = '',
}: ResaMapProps) {
	// Merge configuration
	const config = {
		...getMapConfig(),
		...configOverride,
	};

	const effectiveZoom = zoom ?? config.defaultZoom ?? 13;
	const isGoogleMaps = config.provider === 'google' && config.googleApiKey;

	// Track consent state for Google Maps
	const [hasConsented, setHasConsented] = useState(() => {
		// Skip consent check if not using Google Maps or if skipConsent is true
		if (!isGoogleMaps || skipConsent) return true;
		return hasGoogleMapsConsent();
	});

	const handleConsent = useCallback(() => {
		saveGoogleMapsConsent();
		setHasConsented(true);
	}, []);

	// Render the appropriate map component
	const renderMap = () => {
		// Google Maps with API key
		if (isGoogleMaps) {
			// Show consent dialog if not yet consented
			if (!hasConsented) {
				return (
					<GoogleMapConsent
						height={height}
						onAccept={handleConsent}
						className={className}
					/>
				);
			}

			return (
				<GoogleMap
					apiKey={config.googleApiKey!}
					center={center}
					zoom={effectiveZoom}
					showMarker={showMarker}
					markerPosition={markerPosition}
					height={height}
					scrollWheelZoom={config.scrollZoom}
					className={className}
				/>
			);
		}

		// Default: Leaflet/OSM (no consent needed)
		return (
			<LeafletMap
				center={center}
				zoom={effectiveZoom}
				showMarker={showMarker}
				markerPosition={markerPosition}
				height={height}
				scrollWheelZoom={config.scrollZoom}
				tileStyle={config.tileStyle}
				className={className}
			/>
		);
	};

	// Wrap in lazy loader if enabled (only for actual maps, not consent)
	if (lazyLoad && hasConsented) {
		return (
			<MapPlaceholder height={height} className={className}>
				{renderMap()}
			</MapPlaceholder>
		);
	}

	return renderMap();
}

// Re-export types for convenience
export type { MapPosition, TileStyle } from './LeafletMap';
