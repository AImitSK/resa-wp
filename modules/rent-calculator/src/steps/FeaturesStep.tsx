/**
 * Step 6: Ausstattung — 11 Feature-Checkboxen mit Icons.
 */

import { ResaIcon } from '@/components/icons/ResaIcon';
import { cn } from '@/lib/utils';
import type { StepProps } from '@frontend/types/wizard';
import type { FeatureOption } from '../types';

/** Default features if config hasn't loaded yet. */
const defaultFeatures: FeatureOption[] = [
	{ key: 'balcony', label: 'Balkon', icon: 'balkon' },
	{ key: 'terrace', label: 'Terrasse', icon: 'terrasse' },
	{ key: 'garden', label: 'Garten', icon: 'garten' },
	{ key: 'elevator', label: 'Aufzug', icon: 'aufzug' },
	{ key: 'parking', label: 'Stellplatz', icon: 'stellplatz' },
	{ key: 'garage', label: 'Garage', icon: 'garage' },
	{ key: 'cellar', label: 'Keller', icon: 'keller' },
	{ key: 'fitted_kitchen', label: 'Einbauküche', icon: 'kueche' },
	{ key: 'floor_heating', label: 'Fußbodenheizung', icon: 'fussbodenheizung' },
	{ key: 'guest_toilet', label: 'Gäste-WC', icon: 'wc' },
	{ key: 'barrier_free', label: 'Barrierefrei', icon: 'barrierefrei' },
];

interface FeaturesStepProps extends StepProps {
	featureOptions?: FeatureOption[];
}

export function FeaturesStep({
	data,
	updateData,
	featureOptions = defaultFeatures,
}: FeaturesStepProps) {
	const selected = (data.features as string[]) ?? [];

	const toggle = (key: string) => {
		const next = selected.includes(key)
			? selected.filter((f) => f !== key)
			: [...selected, key];
		updateData({ features: next });
	};

	return (
		<div className="resa-space-y-4">
			<div className="resa-text-center">
				<h3 className="resa-text-lg resa-font-semibold">Ausstattungsmerkmale</h3>
				<p className="resa-text-sm resa-text-muted-foreground resa-mt-1">
					Welche Ausstattung hat die Immobilie? (optional)
				</p>
			</div>

			<div className="resa-grid resa-grid-cols-3 resa-gap-2">
				{featureOptions.map((feature) => {
					const isSelected = selected.includes(feature.key);
					return (
						<button
							key={feature.key}
							type="button"
							onClick={() => toggle(feature.key)}
							className={cn(
								'resa-flex resa-flex-col resa-items-center resa-gap-1.5 resa-rounded-lg resa-border-2 resa-p-3 resa-transition-colors resa-cursor-pointer',
								isSelected
									? 'resa-border-primary resa-bg-primary/5'
									: 'resa-border-input hover:resa-border-primary/50',
							)}
						>
							<ResaIcon name={feature.icon} size={28} />
							<span className="resa-text-xs resa-font-medium resa-text-center resa-leading-tight">
								{feature.label}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
