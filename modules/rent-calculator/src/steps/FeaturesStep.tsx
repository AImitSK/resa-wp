/**
 * Step 6: Ausstattung — 11 Feature-Checkboxen mit Icons.
 */

import { __ } from '@wordpress/i18n';
import { ResaIcon } from '@/components/icons/ResaIcon';
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

			<div className="resa-grid resa-grid-cols-3 resa-gap-2">
				{features.map((feature) => {
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

			{/* Free text for additional features */}
			<div className="resa-mt-4">
				<label
					htmlFor="additional-features"
					className="resa-block resa-text-sm resa-font-medium resa-mb-1"
				>
					{__('Weitere Ausstattung', 'resa')}
					<span className="resa-text-muted-foreground resa-font-normal resa-ml-1">
						{__('(optional)', 'resa')}
					</span>
				</label>
				<textarea
					id="additional-features"
					value={additionalFeatures}
					onChange={handleAdditionalChange}
					placeholder={__('z.B. Smart Home, Sauna, Pool, Klimaanlage...', 'resa')}
					rows={2}
					className="resa-w-full resa-px-3 resa-py-2 resa-rounded-md resa-border resa-border-input resa-bg-background resa-text-sm placeholder:resa-text-muted-foreground focus:resa-outline-none focus:resa-ring-2 focus:resa-ring-ring"
				/>
			</div>
		</div>
	);
}
