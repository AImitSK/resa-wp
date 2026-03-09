/**
 * Step 3: Standort — Location Dropdown.
 *
 * Skipped if city is pre-selected via shortcode attribute.
 */

import { __ } from '@wordpress/i18n';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import type { StepProps } from '@frontend/types/wizard';
import type { CityOption } from '../types';

interface CityStepProps extends StepProps {
	cities: CityOption[];
}

export function CityStep({ data, updateData, errors, cities }: CityStepProps) {
	const handleValueChange = (val: string) => {
		if (val === '') {
			updateData({
				city_id: undefined,
				city_name: undefined,
				city_slug: undefined,
				city_lat: undefined,
				city_lng: undefined,
			});
			return;
		}
		const city = cities.find((c) => c.id === Number(val));
		if (city) {
			updateData({
				city_id: city.id,
				city_name: city.name,
				city_slug: city.slug,
				// Store coordinates for address search bounding.
				city_lat: city.latitude ?? undefined,
				city_lng: city.longitude ?? undefined,
			});
		}
	};

	return (
		<div className="resa-space-y-4">
			<div className="resa-text-center">
				<h3 className="resa-text-lg resa-font-semibold">
					{__('In welcher Stadt?', 'resa')}
				</h3>
			</div>

			<div>
				<Label htmlFor="resa-city">
					{__('Standort', 'resa')} <span className="resa-text-destructive">*</span>
				</Label>
				<Select
					value={data.city_id !== undefined ? String(data.city_id) : ''}
					onValueChange={handleValueChange}
				>
					<SelectTrigger
						id="resa-city"
						className="resa-mt-1"
						aria-invalid={!!errors.city_id}
					>
						<SelectValue placeholder={__('Bitte wählen', 'resa')} />
					</SelectTrigger>
					<SelectContent>
						{cities.map((city) => (
							<SelectItem key={city.id} value={String(city.id)}>
								{city.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{errors.city_id && (
					<p role="alert" className="resa-text-xs resa-text-destructive resa-mt-1">
						{errors.city_id}
					</p>
				)}
			</div>
		</div>
	);
}
