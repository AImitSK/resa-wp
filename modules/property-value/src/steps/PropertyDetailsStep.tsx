/**
 * Step 3: Fläche & Zimmer — Wohnfläche, Grundstück (bei Haus), Zimmer.
 *
 * All numeric inputs use SliderInput for a modern UX.
 */

import { __ } from '@wordpress/i18n';
import { SliderInput } from '@frontend/components/shared/SliderInput';
import type { StepProps } from '@frontend/types/wizard';

export function PropertyDetailsStep({ data, updateData, errors }: StepProps) {
	const isHouse = data.property_type === 'house';

	return (
		<div className="resa-space-y-6">
			<div className="resa-text-center">
				<h3 className="resa-text-xl resa-font-semibold">
					{__('Fläche und Zimmer', 'resa')}
				</h3>
			</div>

			{/* Wohnfläche */}
			<div>
				<h4 className="resa-text-sm resa-font-medium resa-mb-2">
					{__('Wohnfläche', 'resa')} <span className="resa-text-destructive">*</span>
				</h4>
				<SliderInput
					id="resa-pv-size"
					value={data.size as number | undefined}
					onChange={(val) => updateData({ size: val })}
					min={20}
					max={500}
					step={5}
					unit="m²"
					defaultValue={100}
					error={errors.size}
				/>
			</div>

			{/* Grundstücksfläche — nur bei Haus */}
			{isHouse && (
				<div>
					<h4 className="resa-text-sm resa-font-medium resa-mb-2">
						{__('Grundstücksfläche', 'resa')}
					</h4>
					<SliderInput
						id="resa-pv-plot"
						value={data.plot_size as number | undefined}
						onChange={(val) => updateData({ plot_size: val })}
						min={100}
						max={2500}
						step={10}
						unit="m²"
						defaultValue={500}
						error={errors.plot_size}
					/>
				</div>
			)}

			{/* Zimmer */}
			<div>
				<h4 className="resa-text-sm resa-font-medium resa-mb-2">{__('Zimmer', 'resa')}</h4>
				<SliderInput
					id="resa-pv-rooms"
					value={data.rooms as number | undefined}
					onChange={(val) => updateData({ rooms: val })}
					min={1}
					max={10}
					step={0.5}
					defaultValue={3}
					error={errors.rooms}
				/>
			</div>
		</div>
	);
}
