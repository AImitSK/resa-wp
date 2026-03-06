/**
 * Step 6: Ausstattung — 11 Feature-Checkboxen mit Icons.
 */

import { __ } from '@wordpress/i18n';
import { ResaIcon } from '@/components/icons/ResaIcon';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { StepProps } from '@frontend/types/wizard';
import type { FeatureOption } from '../types';

/** Default features if config hasn't loaded yet. */
const getDefaultFeatures = (): FeatureOption[] => [
	{ key: 'balcony', label: __('Balkon', 'resa'), icon: 'balkon' },
	{ key: 'terrace', label: __('Terrasse', 'resa'), icon: 'terrasse' },
	{ key: 'garden', label: __('Garten', 'resa'), icon: 'garten' },
	{ key: 'elevator', label: __('Aufzug', 'resa'), icon: 'aufzug' },
	{ key: 'parking', label: __('Stellplatz', 'resa'), icon: 'stellplatz' },
	{ key: 'garage', label: __('Garage', 'resa'), icon: 'garage' },
	{ key: 'cellar', label: __('Keller', 'resa'), icon: 'keller' },
	{ key: 'fitted_kitchen', label: __('Einbauküche', 'resa'), icon: 'kueche' },
	{ key: 'floor_heating', label: __('Fußbodenheizung', 'resa'), icon: 'fussbodenheizung' },
	{ key: 'guest_toilet', label: __('Gäste-WC', 'resa'), icon: 'wc' },
	{ key: 'barrier_free', label: __('Barrierefrei', 'resa'), icon: 'barrierefrei' },
];

interface FeaturesStepProps extends StepProps {
	featureOptions?: FeatureOption[];
}

export function FeaturesStep({ data, updateData, featureOptions }: FeaturesStepProps) {
	const defaultFeatures = getDefaultFeatures();
	const features = featureOptions ?? defaultFeatures;
	const selected = (data.features as string[]) ?? [];
	const additionalFeatures = (data.additional_features as string) ?? '';

	const toggle = (key: string) => {
		const next = selected.includes(key)
			? selected.filter((f) => f !== key)
			: [...selected, key];
		updateData({ features: next });
	};

	const handleAdditionalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		updateData({ additional_features: e.target.value });
	};

	return (
		<div className="resa-space-y-4">
			<div className="resa-text-center">
				<h3 className="resa-text-lg resa-font-semibold">
					{__('Ausstattungsmerkmale', 'resa')}
				</h3>
				<p className="resa-text-sm resa-text-muted-foreground resa-mt-1">
					{__('Welche Ausstattung hat die Immobilie? (optional)', 'resa')}
				</p>
			</div>

			<div className="resa-grid resa-grid-cols-2 resa-gap-2">
				{features.map((feature) => {
					const isSelected = selected.includes(feature.key);
					return (
						<button
							key={feature.key}
							type="button"
							onClick={() => toggle(feature.key)}
							className={cn(
								'resa-flex resa-flex-row resa-items-center resa-gap-2 resa-rounded-xl resa-border resa-bg-card resa-p-3 resa-transition-all resa-cursor-pointer focus:resa-outline-none',
								isSelected
									? 'resa-border-primary'
									: 'resa-border-input hover:resa-border-primary/50',
							)}
						>
							<ResaIcon name={feature.icon} size={20} />
							<span className="resa-text-xs resa-font-medium resa-text-left resa-leading-tight">
								{feature.label}
							</span>
						</button>
					);
				})}
			</div>

			{/* Free text for additional features */}
			<div className="resa-mt-4 resa-space-y-1.5">
				<Label htmlFor="additional-features">
					{__('Weitere Ausstattung', 'resa')}
					<span className="resa-text-muted-foreground resa-font-normal resa-ml-1">
						{__('(optional)', 'resa')}
					</span>
				</Label>
				<Textarea
					id="additional-features"
					value={additionalFeatures}
					onChange={handleAdditionalChange}
					placeholder={__('z.B. Smart Home, Sauna, Pool, Klimaanlage...', 'resa')}
					rows={2}
				/>
			</div>
		</div>
	);
}
