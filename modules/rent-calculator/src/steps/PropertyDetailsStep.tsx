/**
 * Step 2: Grunddaten — Wohnfläche, Zimmer, Baujahr.
 *
 * All numeric inputs use SliderInput for a modern UX.
 */

import { __ } from '@wordpress/i18n';
import { SliderInput } from '@frontend/components/shared/SliderInput';
import type { StepProps } from '@frontend/types/wizard';

const currentYear = new Date().getFullYear();

export function PropertyDetailsStep({ data, updateData, errors }: StepProps) {
	return (
		<div className="resa-space-y-6">
			<div className="resa-text-center">
				<h3 className="resa-text-xl resa-font-semibold">
					{__('Grunddaten der Immobilie', 'resa')}
				</h3>
			</div>

			{/* Wohnfläche */}
			<div>
				<h4 className="resa-text-sm resa-font-medium resa-mb-2">
					{__('Wohnfläche', 'resa')} <span className="resa-text-destructive">*</span>
				</h4>
				<SliderInput
					id="resa-size"
					value={data.size as number | undefined}
					onChange={(val) => updateData({ size: val })}
					min={20}
					max={300}
					step={5}
					unit="m²"
					defaultValue={70}
					error={errors.size}
				/>
			</div>

			{/* Zimmer */}
			<div>
				<h4 className="resa-text-sm resa-font-medium resa-mb-2">{__('Zimmer', 'resa')}</h4>
				<SliderInput
					id="resa-rooms"
					value={data.rooms as number | undefined}
					onChange={(val) => updateData({ rooms: val })}
					min={1}
					max={8}
					step={0.5}
					defaultValue={3}
					error={errors.rooms}
				/>
			</div>

			{/* Baujahr */}
			<div>
				<h4 className="resa-text-sm resa-font-medium resa-mb-2">{__('Baujahr', 'resa')}</h4>
				<SliderInput
					id="resa-year"
					value={data.year_built as number | undefined}
					onChange={(val) => updateData({ year_built: val })}
					min={1900}
					max={currentYear}
					step={1}
					defaultValue={1990}
					formatValue={String}
					error={errors.year_built}
				/>
			</div>
		</div>
	);
}
