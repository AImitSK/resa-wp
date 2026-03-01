/**
 * Leaflet Map Wrapper — Base map component using OpenStreetMap.
 *
 * Used in admin for location editing. Supports markers, click handlers,
 * and drag-to-reposition.
 */

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

interface LeafletMapWrapperProps {
	/** Center position [lat, lng] */
	center: MapPosition;
	/** Zoom level (1-18) */
	zoom: number;
	/** Marker position (if set, shows draggable marker) */
	markerPosition?: MapPosition | null;
	/** Callback when marker is placed or moved */
	onMarkerChange?: (position: MapPosition) => void;
	/** Callback when zoom changes */
	onZoomChange?: (zoom: number) => void;
	/** Map height in pixels */
	height?: number;
	/** Allow clicking on map to set marker */
	clickToPlace?: boolean;
	/** Allow scrollwheel zoom */
	scrollWheelZoom?: boolean;
	/** Map tile style */
	tileStyle?: 'standard' | 'minimal' | 'dark';
}

// Tile layer configurations
const TILE_LAYERS = {
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

// Custom green marker for RESA branding
const resaMarkerIcon = L.divIcon({
	className: 'resa-map-marker',
	html: `<div style="
		background-color: #a9e43f;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 3px solid white;
		box-shadow: 0 2px 6px rgba(0,0,0,0.3);
		display: flex;
		align-items: center;
		justify-content: center;
	">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e303a" stroke-width="2">
			<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
			<circle cx="12" cy="10" r="3"></circle>
		</svg>
	</div>`,
	iconSize: [32, 32],
	iconAnchor: [16, 32],
});

/**
 * Inner component to handle map events.
 */
function MapEventHandler({
	onMarkerChange,
	onZoomChange,
	clickToPlace,
}: {
	onMarkerChange?: (position: MapPosition) => void;
	onZoomChange?: (zoom: number) => void;
	clickToPlace: boolean;
}) {
	useMapEvents({
		click(e) {
			if (clickToPlace && onMarkerChange) {
				onMarkerChange({ lat: e.latlng.lat, lng: e.latlng.lng });
			}
		},
		zoomend(e) {
			if (onZoomChange) {
				onZoomChange(e.target.getZoom());
			}
		},
	});

	return null;
}

/**
 * Component to recenter map when center prop changes.
 */
function MapRecenter({ center, zoom }: { center: MapPosition; zoom: number }) {
	const map = useMap();
	const prevCenter = useRef(center);
	const prevZoom = useRef(zoom);

	useEffect(() => {
		// Only update if center or zoom actually changed significantly
		const centerChanged =
			Math.abs(prevCenter.current.lat - center.lat) > 0.0001 ||
			Math.abs(prevCenter.current.lng - center.lng) > 0.0001;
		const zoomChanged = prevZoom.current !== zoom;

		if (centerChanged || zoomChanged) {
			map.setView([center.lat, center.lng], zoom);
			prevCenter.current = center;
			prevZoom.current = zoom;
		}
	}, [center, zoom, map]);

	return null;
}

/**
 * Draggable marker component.
 */
function DraggableMarker({
	position,
	onDragEnd,
}: {
	position: MapPosition;
	onDragEnd: (position: MapPosition) => void;
}) {
	const markerRef = useRef<L.Marker>(null);

	const eventHandlers = {
		dragend() {
			const marker = markerRef.current;
			if (marker) {
				const latlng = marker.getLatLng();
				onDragEnd({ lat: latlng.lat, lng: latlng.lng });
			}
		},
	};

	return (
		<Marker
			draggable
			eventHandlers={eventHandlers}
			position={[position.lat, position.lng]}
			ref={markerRef}
			icon={resaMarkerIcon}
		/>
	);
}

export function LeafletMapWrapper({
	center,
	zoom,
	markerPosition,
	onMarkerChange,
	onZoomChange,
	height = 300,
	clickToPlace = true,
	scrollWheelZoom = false,
	tileStyle = 'minimal',
}: LeafletMapWrapperProps) {
	const tileConfig = TILE_LAYERS[tileStyle];

	return (
		<div
			style={{
				height: `${height}px`,
				width: '100%',
				borderRadius: '8px',
				overflow: 'hidden',
				border: '1px solid hsl(214.3 31.8% 91.4%)',
			}}
		>
			<MapContainer
				center={[center.lat, center.lng]}
				zoom={zoom}
				scrollWheelZoom={scrollWheelZoom}
				style={{ height: '100%', width: '100%' }}
			>
				<TileLayer url={tileConfig.url} attribution={tileConfig.attribution} />

				<MapEventHandler
					onMarkerChange={onMarkerChange}
					onZoomChange={onZoomChange}
					clickToPlace={clickToPlace}
				/>

				<MapRecenter center={center} zoom={zoom} />

				{markerPosition && onMarkerChange && (
					<DraggableMarker position={markerPosition} onDragEnd={onMarkerChange} />
				)}
			</MapContainer>
		</div>
	);
}
