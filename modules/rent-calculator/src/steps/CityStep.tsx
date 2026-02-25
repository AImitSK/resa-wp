/**
 * Step 3: Standort — Location Dropdown.
 *
 * Skipped if city is pre-selected via shortcode attribute.
 */

import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { StepProps } from '@frontend/types/wizard';
import type { CityOption } from '../types';

interface CityStepProps extends StepProps {
	cities: CityOption[];
}

export function CityStep({ data, updateData, errors, cities }: CityStepProps) {
	return (
		<div className="resa-space-y-4">
			<div className="resa-text-center">
				<h3 className="resa-text-lg resa-font-semibold">In welcher Stadt?</h3>
				<p className="resa-text-sm resa-text-muted-foreground resa-mt-1">
					Wählen Sie den Standort der Immobilie.
				</p>
			</div>

			<div>
				<Label htmlFor="resa-city">
					Standort <span className="resa-text-destructive">*</span>
				</Label>
				<Select
					id="resa-city"
					value={data.city_id !== undefined ? String(data.city_id) : ''}
					onChange={(e) => {
						const val = e.target.value;
						if (val === '') {
							updateData({
								city_id: undefined,
								city_name: undefined,
								city_slug: undefined,
							});
							return;
						}
						const city = cities.find((c) => c.id === Number(val));
						if (city) {
							updateData({
								city_id: city.id,
								city_name: city.name,
								city_slug: city.slug,
							});
						}
					}}
					className="resa-mt-1"
					aria-invalid={!!errors.city_id}
				>
					<option value="">Bitte wählen</option>
					{cities.map((city) => (
						<option key={city.id} value={city.id}>
							{city.name}
						</option>
					))}
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
