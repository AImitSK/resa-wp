/**
 * Step 5: Lage-Bewertung — Slider 1-5 mit dynamischem Label.
 */

import { Slider } from '@/components/ui/slider';
import type { StepProps } from '@frontend/types/wizard';

const ratingLabels: Record<number, { label: string; description: string }> = {
	1: { label: 'Einfache Lage', description: 'Lärm, wenig Infrastruktur, einfache Umgebung' },
	2: { label: 'Normale Lage', description: 'Durchschnittliche Wohngegend mit Grundversorgung' },
	3: { label: 'Gute Lage', description: 'Solide Infrastruktur, angenehmes Wohnumfeld' },
	4: { label: 'Sehr gute Lage', description: 'Bevorzugte Wohngegend, gute Anbindung' },
	5: {
		label: 'Premium-Lage',
		description: 'Topstandort, exzellente Infrastruktur, ruhig und grün',
	},
};

export function LocationRatingStep({ data, updateData, errors }: StepProps) {
	const rating = (data.location_rating as number) ?? 3;
	const info = ratingLabels[rating] ?? ratingLabels[3];

	return (
		<div className="resa-space-y-6">
			<div className="resa-text-center">
				<h3 className="resa-text-lg resa-font-semibold">Wie bewerten Sie die Lage?</h3>
				<p className="resa-text-sm resa-text-muted-foreground resa-mt-1">
					Bewerten Sie die Wohnlage auf einer Skala von 1 bis 5.
				</p>
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
					<span>Einfach</span>
					<span>Premium</span>
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
