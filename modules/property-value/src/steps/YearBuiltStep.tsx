/**
 * Step 4: Baujahr — Slider + Direkteingabe.
 */

import { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
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
	const yearBuilt = (data.year_built as number) ?? 1980;

	// Set default on mount.
	useEffect(() => {
		if (data.year_built === undefined) {
			updateData({ year_built: 1980 });
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className="resa-space-y-6">
			<div className="resa-text-center">
				<h3 className="resa-text-lg resa-font-semibold">
					{__('Wann wurde die Immobilie gebaut?', 'resa')}
				</h3>
			</div>

			<div className="resa-space-y-4">
				<Slider
					value={yearBuilt}
					min={1900}
					max={currentYear}
					step={1}
					onChange={(value) => updateData({ year_built: value })}
				/>

				<div className="resa-flex resa-justify-between resa-text-xs resa-text-muted-foreground">
					<span>1900</span>
					<span>{currentYear}</span>
				</div>

				<div className="resa-text-center resa-rounded-lg resa-bg-muted/50 resa-p-4">
					<div className="resa-text-2xl resa-font-bold resa-text-primary">
						{yearBuilt}
					</div>
					<div className="resa-text-sm resa-font-medium resa-mt-1">
						{getAgeLabel(yearBuilt)}
					</div>
				</div>

				{/* Direct input */}
				<div>
					<Label htmlFor="resa-pv-year">{__('Oder direkt eingeben', 'resa')}</Label>
					<Input
						id="resa-pv-year"
						type="number"
						min={1800}
						max={currentYear + 5}
						value={yearBuilt}
						onChange={(e) => {
							const val = e.target.value;
							if (val !== '') {
								updateData({ year_built: Number(val) });
							}
						}}
						className="resa-mt-1"
						aria-invalid={!!errors.year_built}
					/>
					{errors.year_built && (
						<p role="alert" className="resa-text-xs resa-text-destructive resa-mt-1">
							{errors.year_built}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
