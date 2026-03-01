/**
 * ResaMap — Provider-agnostic map component.
 *
 * Abstracts the map provider (Leaflet/OSM or Google Maps) and handles
 * lazy loading via Intersection Observer.
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

import { LeafletMap, type MapPosition, type TileStyle } from './LeafletMap';
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

export function ResaMap({
	center,
	zoom,
	showMarker = true,
	markerPosition,
	height = 250,
	config: configOverride,
	lazyLoad = true,
	className = '',
}: ResaMapProps) {
	// Merge configuration
	const config = {
		...getMapConfig(),
		...configOverride,
	};

	const effectiveZoom = zoom ?? config.defaultZoom ?? 13;

	// Render the appropriate map component
	const renderMap = () => {
		// Google Maps support (Phase 5 - placeholder for now)
		if (config.provider === 'google' && config.googleApiKey) {
			// TODO: Implement GoogleMap component in Phase 5
			// For now, fall back to Leaflet
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
		}

		// Default: Leaflet/OSM
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

	// Wrap in lazy loader if enabled
	if (lazyLoad) {
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
