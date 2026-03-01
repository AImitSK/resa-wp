/**
 * AddressStep — Collects property address within selected city bounds.
 *
 * Uses AddressInput component from core with city-bounded autocomplete.
 * The address is optional — user can skip this step.
 */

import { useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import type { StepProps } from '@frontend/types/wizard';
import { AddressInput, type AddressData, type AddressBounds } from '@frontend/components/shared';
import type { RentCalculatorData } from '../types';

interface AddressStepProps extends StepProps {
	/** City data for bounding the address search. */
	cityBounds?: AddressBounds;
}

export function AddressStep({ data, updateData, errors, cityBounds }: AddressStepProps) {
	const formData = data as RentCalculatorData;

	// Build current value from form data.
	const currentValue: AddressData | undefined =
		formData.address && formData.address_lat && formData.address_lng
			? {
					displayName: formData.address,
					lat: formData.address_lat,
					lng: formData.address_lng,
				}
			: undefined;

	const handleChange = useCallback(
		(address: AddressData | null) => {
			if (address) {
				updateData({
					address: address.displayName,
					address_lat: address.lat,
					address_lng: address.lng,
				});
			} else {
				updateData({
					address: undefined,
					address_lat: undefined,
					address_lng: undefined,
				});
			}
		},
		[updateData],
	);

	return (
		<div className="resa-space-y-4">
			<div className="resa-text-center resa-mb-6">
				<h3 className="resa-text-lg resa-font-semibold">
					{__('Wo befindet sich die Immobilie?', 'resa')}
				</h3>
				<p className="resa-text-sm resa-text-muted-foreground resa-mt-1">
					{cityBounds
						? /* translators: %s: city name */
							__('Geben Sie die Adresse in %s ein.', 'resa').replace(
								'%s',
								cityBounds.name,
							)
						: __('Geben Sie die Adresse der Immobilie ein.', 'resa')}
				</p>
			</div>

			<AddressInput
				value={currentValue}
				onChange={handleChange}
				boundTo={cityBounds}
				placeholder={__('Straße und Hausnummer...', 'resa')}
				error={errors?.address}
				showMap={true}
				mapHeight={200}
				tileStyle="minimal"
			/>

			{/* Skip hint */}
			<p className="resa-text-xs resa-text-muted-foreground resa-text-center resa-mt-4">
				{__(
					'Sie können diesen Schritt überspringen, wenn Sie die Adresse nicht angeben möchten.',
					'resa',
				)}
			</p>
		</div>
	);
}
