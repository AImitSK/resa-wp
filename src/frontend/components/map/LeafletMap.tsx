/**
 * LeafletMap — Frontend map component using OpenStreetMap.
 *
 * Optimized for the RESA widget with CSS isolation.
 * Read-only display with optional marker.
 */

import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../styles/leaflet-override.css';

// Fix default marker icon issue in webpack/vite builds
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Configure default icon
L.Icon.Default.mergeOptions({
	iconUrl: markerIcon,
	iconRetinaUrl: markerIcon2x,
	shadowUrl: markerShadow,
});

export interface MapPosition {
	lat: number;
	lng: number;
}

export type TileStyle = 'standard' | 'minimal' | 'dark';

interface LeafletMapProps {
	/** Center position */
	center: MapPosition;
	/** Zoom level (1-18) */
	zoom?: number;
	/** Show marker at center */
	showMarker?: boolean;
	/** Custom marker position (defaults to center) */
	markerPosition?: MapPosition;
	/** Map height in pixels */
	height?: number;
	/** Allow scrollwheel zoom */
	scrollWheelZoom?: boolean;
	/** Map tile style */
	tileStyle?: TileStyle;
	/** Additional CSS class */
	className?: string;
}

// Tile layer configurations
const TILE_LAYERS: Record<TileStyle, { url: string; attribution: string }> = {
	standard: {
		url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	},
	minimal: {
		url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
	},
	dark: {
		url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
	},
};

// RESA branded marker icon
const resaMarkerIcon = L.divIcon({
	className: 'resa-map-marker',
	html: `<div class="resa-marker-pin">
		<svg viewBox="0 0 24 24" fill="none">
			<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
			<circle cx="12" cy="10" r="3"></circle>
		</svg>
	</div>`,
	iconSize: [32, 32],
	iconAnchor: [16, 32],
	popupAnchor: [0, -32],
});

export function LeafletMap({
	center,
	zoom = 13,
	showMarker = true,
	markerPosition,
	height = 250,
	scrollWheelZoom = false,
	tileStyle = 'minimal',
	className = '',
}: LeafletMapProps) {
	const tileConfig = TILE_LAYERS[tileStyle];
	const marker = markerPosition || center;

	return (
		<div
			className={`resa-map-container ${className}`}
			style={{
				height: `${height}px`,
				width: '100%',
				borderRadius: 'var(--resa-radius)',
				overflow: 'hidden',
				border: '1px solid hsl(var(--resa-border))',
			}}
		>
			<MapContainer
				center={[center.lat, center.lng]}
				zoom={zoom}
				scrollWheelZoom={scrollWheelZoom}
				style={{ height: '100%', width: '100%' }}
				zoomControl={true}
				attributionControl={true}
			>
				<TileLayer url={tileConfig.url} attribution={tileConfig.attribution} />

				{showMarker && <Marker position={[marker.lat, marker.lng]} icon={resaMarkerIcon} />}
			</MapContainer>
		</div>
	);
}
