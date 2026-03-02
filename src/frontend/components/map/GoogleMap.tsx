/**
 * GoogleMap — Google Maps component for RESA.
 *
 * Uses @vis.gl/react-google-maps for Google Maps integration.
 * Premium feature only — requires Google Maps API key.
 */

import { useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import type { MapPosition } from './LeafletMap';

interface GoogleMapProps {
	/** Google Maps API key */
	apiKey: string;
	/** Center position */
	center: MapPosition;
	/** Zoom level (1-20) */
	zoom?: number;
	/** Show marker at center */
	showMarker?: boolean;
	/** Custom marker position */
	markerPosition?: MapPosition;
	/** Map height in pixels */
	height?: number;
	/** Allow scroll wheel zoom */
	scrollWheelZoom?: boolean;
	/** Map style ID (optional) */
	mapId?: string;
	/** Additional CSS class */
	className?: string;
}

/** Read --resa-icon-primary from .resa-widget-root (set by backend). */
function getPrimaryColor(): string {
	const root = document.querySelector('.resa-widget-root');
	if (root) {
		const value = getComputedStyle(root).getPropertyValue('--resa-icon-primary').trim();
		if (value) return value;
	}
	return 'hsl(221.2, 83.2%, 53.3%)'; // default blue
}

export function GoogleMap({
	apiKey,
	center,
	zoom = 13,
	showMarker = true,
	markerPosition,
	height = 250,
	scrollWheelZoom = false,
	mapId,
	className = '',
}: GoogleMapProps) {
	const marker = markerPosition || center;
	const pinColor = useMemo(() => getPrimaryColor(), []);

	return (
		<div
			className={`resa-map-container resa-google-map ${className}`}
			style={{
				height: `${height}px`,
				width: '100%',
				borderRadius: 'var(--resa-radius)',
				overflow: 'hidden',
				border: '1px solid hsl(var(--resa-border))',
			}}
		>
			<APIProvider apiKey={apiKey}>
				<Map
					center={{ lat: center.lat, lng: center.lng }}
					zoom={zoom}
					mapId={mapId}
					gestureHandling={scrollWheelZoom ? 'greedy' : 'cooperative'}
					disableDefaultUI={false}
					zoomControl={true}
					mapTypeControl={false}
					streetViewControl={false}
					fullscreenControl={false}
					style={{ width: '100%', height: '100%' }}
				>
					{showMarker && (
						<AdvancedMarker position={{ lat: marker.lat, lng: marker.lng }}>
							<Pin background={pinColor} borderColor="#ffffff" glyphColor="#ffffff" />
						</AdvancedMarker>
					)}
				</Map>
			</APIProvider>
		</div>
	);
}
