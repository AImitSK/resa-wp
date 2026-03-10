/**
 * Step 4: Baujahr — SliderInput with age class subtitle.
 */

import { __ } from '@wordpress/i18n';
import { SliderInput } from '@frontend/components/shared/SliderInput';
import type { StepProps } from '@frontend/types/wizard';

const currentYear = new Date().getFullYear();

const getAgeLabel = (year: number): string => {
	if (year <= 1945) return __('Altbau (bis 1945)', 'resa');
	if (year <= 1959) return __('Nachkriegsbau (1946–1959)', 'resa');
	if (year <= 1979) return __('60er/70er Jahre', 'resa');
	if (year <= 1989) return __('80er Jahre', 'resa');
	if (year <= 1999) return __('90er Jahre', 'resa');
	if (year <= 2014) return __('2000er Jahre', 'resa');
	return __('Neubau (ab 2015)', 'resa');
};

export function YearBuiltStep({ data, updateData, errors }: StepProps) {
	const yearBuilt = data.year_built as number | undefined;

	return (
		<div className="resa-space-y-6">
			<div className="resa-text-center">
				<h3 className="resa-text-xl resa-font-semibold">
					{__('Wann wurde die Immobilie gebaut?', 'resa')}
				</h3>
			</div>

			<SliderInput
				id="resa-pv-year"
				value={yearBuilt}
				onChange={(val) => updateData({ year_built: val })}
				min={1900}
				max={currentYear}
				step={1}
				defaultValue={1980}
				formatValue={String}
				subtitle={yearBuilt !== undefined ? getAgeLabel(yearBuilt) : undefined}
				error={errors.year_built}
			/>
		</div>
	);
}
