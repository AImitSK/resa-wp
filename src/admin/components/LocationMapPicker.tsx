/**
 * Location Map Picker — Map with coordinate input for location editing.
 *
 * Features:
 * - Interactive map with clickable/draggable marker
 * - Latitude/Longitude input fields (auto-filled on marker move)
 * - Zoom level selector
 * - Instructions for users
 */

import { useState, useEffect, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import { MapPin, Navigation } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LeafletMapWrapper, type MapPosition } from './map/LeafletMapWrapper';

interface LocationMapPickerProps {
	/** Initial latitude */
	latitude?: number | null;
	/** Initial longitude */
	longitude?: number | null;
	/** Initial zoom level */
	zoomLevel?: number;
	/** Callback when coordinates change */
	onCoordinatesChange: (lat: number | null, lng: number | null, zoom: number) => void;
}

// Default center: Germany (roughly center)
const DEFAULT_CENTER: MapPosition = {
	lat: 51.1657,
	lng: 10.4515,
};
const DEFAULT_ZOOM = 6;

// Zoom level options
const ZOOM_OPTIONS = [
	{ value: 5, label: __('Land', 'resa') },
	{ value: 8, label: __('Region', 'resa') },
	{ value: 10, label: __('Großraum', 'resa') },
	{ value: 12, label: __('Stadt', 'resa') },
	{ value: 13, label: __('Stadtteil', 'resa') },
	{ value: 15, label: __('Viertel', 'resa') },
	{ value: 17, label: __('Straße', 'resa') },
];

export function LocationMapPicker({
	latitude,
	longitude,
	zoomLevel = 13,
	onCoordinatesChange,
}: LocationMapPickerProps) {
	// Local state for controlled inputs
	const [latInput, setLatInput] = useState<string>(latitude?.toString() ?? '');
	const [lngInput, setLngInput] = useState<string>(longitude?.toString() ?? '');
	const [zoom, setZoom] = useState<number>(zoomLevel);

	// Determine map center and marker position
	const hasCoordinates =
		latitude !== null &&
		longitude !== null &&
		latitude !== undefined &&
		longitude !== undefined;
	const markerPosition: MapPosition | null = hasCoordinates
		? { lat: latitude, lng: longitude }
		: null;
	const mapCenter: MapPosition = hasCoordinates
		? { lat: latitude, lng: longitude }
		: DEFAULT_CENTER;
	const initialZoom = hasCoordinates ? zoom : DEFAULT_ZOOM;

	// Update inputs when props change (e.g., from geocoding)
	useEffect(() => {
		setLatInput(latitude?.toString() ?? '');
		setLngInput(longitude?.toString() ?? '');
	}, [latitude, longitude]);

	useEffect(() => {
		setZoom(zoomLevel);
	}, [zoomLevel]);

	// Handle marker placement/drag
	const handleMarkerChange = useCallback(
		(position: MapPosition) => {
			// Round to 6 decimal places (about 0.1m precision)
			const lat = Math.round(position.lat * 1000000) / 1000000;
			const lng = Math.round(position.lng * 1000000) / 1000000;

			setLatInput(lat.toString());
			setLngInput(lng.toString());
			onCoordinatesChange(lat, lng, zoom);
		},
		[zoom, onCoordinatesChange],
	);

	// Handle zoom change from map
	const handleZoomChange = useCallback(
		(newZoom: number) => {
			setZoom(newZoom);
			if (hasCoordinates) {
				onCoordinatesChange(latitude, longitude, newZoom);
			}
		},
		[hasCoordinates, latitude, longitude, onCoordinatesChange],
	);

	// Handle manual coordinate input
	const handleLatInputChange = (value: string) => {
		setLatInput(value);
		const parsed = parseFloat(value);
		if (!isNaN(parsed) && parsed >= -90 && parsed <= 90) {
			const lng = parseFloat(lngInput);
			if (!isNaN(lng)) {
				onCoordinatesChange(parsed, lng, zoom);
			}
		}
	};

	const handleLngInputChange = (value: string) => {
		setLngInput(value);
		const parsed = parseFloat(value);
		if (!isNaN(parsed) && parsed >= -180 && parsed <= 180) {
			const lat = parseFloat(latInput);
			if (!isNaN(lat)) {
				onCoordinatesChange(lat, parsed, zoom);
			}
		}
	};

	// Handle zoom select change
	const handleZoomSelectChange = (value: string) => {
		const newZoom = parseInt(value, 10);
		setZoom(newZoom);
		if (hasCoordinates) {
			onCoordinatesChange(latitude, longitude, newZoom);
		}
	};

	// Clear coordinates
	const handleClear = () => {
		setLatInput('');
		setLngInput('');
		onCoordinatesChange(null, null, zoom);
	};

	// Try to get user's location
	const handleLocateMe = () => {
		if (!navigator.geolocation) {
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const lat = Math.round(position.coords.latitude * 1000000) / 1000000;
				const lng = Math.round(position.coords.longitude * 1000000) / 1000000;
				setLatInput(lat.toString());
				setLngInput(lng.toString());
				setZoom(13);
				onCoordinatesChange(lat, lng, 13);
			},
			() => {
				// Silently fail - geolocation not available or denied
			},
		);
	};

	return (
		<div className="resa-space-y-4">
			{/* Map */}
			<div>
				<div className="resa-flex resa-items-center resa-justify-between resa-mb-2">
					<Label>{__('Standort auf Karte', 'resa')}</Label>
					{navigator.geolocation && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleLocateMe}
							className="resa-text-xs"
						>
							<Navigation
								style={{ width: '14px', height: '14px', marginRight: '4px' }}
							/>
							{__('Mein Standort', 'resa')}
						</Button>
					)}
				</div>

				<LeafletMapWrapper
					center={mapCenter}
					zoom={initialZoom}
					markerPosition={markerPosition}
					onMarkerChange={handleMarkerChange}
					onZoomChange={handleZoomChange}
					height={280}
					clickToPlace
					tileStyle="minimal"
				/>

				{/* Instructions */}
				<p
					className="resa-text-xs resa-text-muted-foreground resa-mt-2"
					style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
				>
					<MapPin style={{ width: '12px', height: '12px' }} />
					{hasCoordinates
						? __(
								'Marker verschieben oder auf Karte klicken um Position zu ändern.',
								'resa',
							)
						: __('Auf die Karte klicken um den Standort zu setzen.', 'resa')}
				</p>
			</div>

			{/* Coordinate inputs */}
			<div className="resa-grid resa-grid-cols-3 resa-gap-4">
				<div className="resa-space-y-2">
					<Label htmlFor="location-latitude">{__('Breitengrad', 'resa')}</Label>
					<Input
						id="location-latitude"
						type="number"
						step="any"
						min="-90"
						max="90"
						value={latInput}
						onChange={(e) => handleLatInputChange(e.target.value)}
						placeholder="52.2058"
					/>
				</div>
				<div className="resa-space-y-2">
					<Label htmlFor="location-longitude">{__('Längengrad', 'resa')}</Label>
					<Input
						id="location-longitude"
						type="number"
						step="any"
						min="-180"
						max="180"
						value={lngInput}
						onChange={(e) => handleLngInputChange(e.target.value)}
						placeholder="8.7974"
					/>
				</div>
				<div className="resa-space-y-2">
					<Label htmlFor="location-zoom">{__('Zoom-Level', 'resa')}</Label>
					<select
						id="location-zoom"
						className="resa-flex resa-h-9 resa-w-full resa-rounded-md resa-border resa-border-input resa-bg-transparent resa-px-3 resa-py-1 resa-text-sm resa-shadow-sm resa-transition-colors focus:resa-outline-none focus:resa-ring-1 focus:resa-ring-ring"
						value={zoom}
						onChange={(e) => handleZoomSelectChange(e.target.value)}
					>
						{ZOOM_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.value} — {option.label}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Clear button */}
			{hasCoordinates && (
				<div className="resa-flex resa-justify-end">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={handleClear}
						className="resa-text-xs resa-text-muted-foreground"
					>
						{__('Koordinaten entfernen', 'resa')}
					</Button>
				</div>
			)}
		</div>
	);
}
