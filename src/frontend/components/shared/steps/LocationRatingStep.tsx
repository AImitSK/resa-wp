/**
 * Shared Step: Lage-Bewertung — Slider 1-5 mit dynamischem Label.
 */

import { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { Slider } from '@/components/ui/slider';
import type { StepProps } from '@frontend/types/wizard';

const getRatingLabels = (): Record<number, { label: string; description: string }> => ({
	1: {
		label: __('Einfache Lage', 'resa'),
		description: __('Lärm, wenig Infrastruktur, einfache Umgebung', 'resa'),
	},
	2: {
		label: __('Normale Lage', 'resa'),
		description: __('Durchschnittliche Wohngegend mit Grundversorgung', 'resa'),
	},
	3: {
		label: __('Gute Lage', 'resa'),
		description: __('Solide Infrastruktur, angenehmes Wohnumfeld', 'resa'),
	},
	4: {
		label: __('Sehr gute Lage', 'resa'),
		description: __('Bevorzugte Wohngegend, gute Anbindung', 'resa'),
	},
	5: {
		label: __('Premium-Lage', 'resa'),
		description: __('Topstandort, exzellente Infrastruktur, ruhig und grün', 'resa'),
	},
});

export function LocationRatingStep({ data, updateData, errors }: StepProps) {
	const rating = (data.location_rating as number) ?? 3;
	const ratingLabels = getRatingLabels();
	const info = ratingLabels[rating] ?? ratingLabels[3];

	// Initialwert sofort in data setzen, damit Zod-Validierung nicht fehlschlägt
	useEffect(() => {
		if (data.location_rating === undefined) {
			updateData({ location_rating: 3 });
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className="resa-space-y-6">
			<div className="resa-text-center">
				<h3 className="resa-text-xl resa-font-semibold">
					{__('Wie bewerten Sie die Lage?', 'resa')}
				</h3>
			</div>

			<div className="resa-space-y-4">
				<Slider
					value={rating}
					min={1}
					max={5}
					step={1}
					onChange={(value) => updateData({ location_rating: value })}
				/>

				<div className="resa-flex resa-justify-between resa-text-xs resa-text-muted-foreground">
					<span>{__('Einfach', 'resa')}</span>
					<span>{__('Premium', 'resa')}</span>
				</div>

				<div className="resa-text-center resa-rounded-lg resa-bg-muted/50 resa-p-4">
					<div className="resa-text-2xl resa-font-bold resa-text-primary">{rating}/5</div>
					<div className="resa-text-sm resa-font-medium resa-mt-1">{info.label}</div>
					<div className="resa-text-xs resa-text-muted-foreground resa-mt-1">
						{info.description}
					</div>
				</div>
			</div>

			{errors.location_rating && (
				<p role="alert" className="resa-text-xs resa-text-destructive resa-text-center">
					{errors.location_rating}
				</p>
			)}
		</div>
	);
}
