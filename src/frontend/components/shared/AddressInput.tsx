/**
 * AddressInput — Combined address autocomplete with map preview.
 *
 * Core component for modules to collect property addresses.
 * Features:
 * - City-bounded autocomplete (Nominatim)
 * - Interactive map showing selected location
 * - Fully accessible (keyboard navigation, ARIA)
 * - CSS-isolated with resa- prefix
 */

import { useState, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import { AddressAutocomplete } from '../map/AddressAutocomplete';
import { ResaMap, type MapPosition } from '../map';
import type { AddressData, AddressBounds } from '../../types/address';

export interface AddressInputProps {
	/** Current address value */
	value?: AddressData;
	/** Callback when address changes */
	onChange: (address: AddressData | null) => void;
	/** Bound search to a specific city/region */
	boundTo?: AddressBounds;
	/** Placeholder text for input */
	placeholder?: string;
	/** Error message to display */
	error?: string;
	/** Show map preview below input */
	showMap?: boolean;
	/** Map height in pixels */
	mapHeight?: number;
	/** Map tile style */
	tileStyle?: 'standard' | 'minimal' | 'dark';
	/** Disabled state */
	disabled?: boolean;
	/** Additional CSS class */
	className?: string;
}

export function AddressInput({
	value,
	onChange,
	boundTo,
	placeholder,
	error,
	showMap = true,
	mapHeight = 200,
	tileStyle = 'minimal',
	disabled = false,
	className = '',
}: AddressInputProps) {
	// Track whether user has selected an address.
	const [hasSelection, setHasSelection] = useState(!!value);

	const handleSelect = useCallback(
		(address: AddressData | null) => {
			setHasSelection(!!address);
			onChange(address);
		},
		[onChange],
	);

	// Calculate map center and marker position.
	const mapCenter: MapPosition | null =
		value?.lat && value?.lng ? { lat: value.lat, lng: value.lng } : null;

	// Default center from boundTo if no selection yet.
	const defaultCenter: MapPosition | null =
		boundTo?.lat && boundTo?.lng ? { lat: boundTo.lat, lng: boundTo.lng } : null;

	const displayCenter = mapCenter || defaultCenter;

	return (
		<div className={`resa-address-input ${className}`}>
			{/* Autocomplete input */}
			<AddressAutocomplete
				value={value?.displayName}
				onSelect={handleSelect}
				boundTo={boundTo}
				placeholder={placeholder}
				error={error}
				disabled={disabled}
			/>

			{/* Map preview */}
			{showMap && displayCenter && (
				<div className="resa-address-input__map">
					<ResaMap
						center={displayCenter}
						zoom={hasSelection ? 16 : boundTo?.lat ? 13 : 10}
						showMarker={hasSelection}
						markerPosition={mapCenter || undefined}
						height={mapHeight}
						config={{ tileStyle }}
						lazyLoad={false}
					/>
				</div>
			)}

			{/* Help text */}
			{!hasSelection && !error && (
				<p className="resa-address-input__hint">
					{boundTo
						? /* translators: %s: city/region name */
							__('Geben Sie eine Adresse in %s ein.', 'resa').replace(
								'%s',
								boundTo.name,
							)
						: __('Geben Sie Straße und Hausnummer ein.', 'resa')}
				</p>
			)}

			{/* Selected address display */}
			{hasSelection && value && (
				<p className="resa-address-input__selected">
					<span className="resa-address-input__selected-icon">
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<polyline points="20 6 9 17 4 12" />
						</svg>
					</span>
					{value.displayName}
				</p>
			)}

			<style>{`
				.resa-address-input {
					display: flex;
					flex-direction: column;
					gap: 12px;
				}

				.resa-address-input__map {
					border-radius: var(--resa-radius);
					overflow: hidden;
				}

				.resa-address-input__hint {
					font-size: 12px;
					color: hsl(var(--resa-muted-foreground));
					margin: 0;
				}

				.resa-address-input__selected {
					display: flex;
					align-items: flex-start;
					gap: 8px;
					font-size: 13px;
					color: hsl(var(--resa-foreground));
					margin: 0;
					padding: 8px 12px;
					background: hsl(var(--resa-muted));
					border-radius: var(--resa-radius);
				}

				.resa-address-input__selected-icon {
					flex-shrink: 0;
					color: hsl(var(--resa-primary));
					margin-top: 2px;
				}
			`}</style>
		</div>
	);
}

// Re-export types.
export type { AddressData, AddressBounds } from '../../types/address';
