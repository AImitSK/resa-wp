/**
 * Step 6: Ausstattung — 11 Feature-Checkboxen mit Icons.
 */

import { __ } from '@wordpress/i18n';
import { motion, AnimatePresence } from 'framer-motion';
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
				<h3 className="resa-text-xl resa-font-semibold">
					{__('Ausstattungsmerkmale', 'resa')}
				</h3>
			</div>

			<div className="resa-grid resa-grid-cols-2 resa-gap-2 sm:resa-grid-cols-3">
				{features.map((feature) => {
					const isSelected = selected.includes(feature.key);
					return (
						<motion.button
							key={feature.key}
							type="button"
							onClick={() => toggle(feature.key)}
							whileHover={{
								scale: 1.03,
								zIndex: 10,
								...(!isSelected && {
									background:
										'linear-gradient(to bottom, hsl(0 0% 100%), hsl(0 0% 96%))',
								}),
							}}
							whileTap={{ scale: 0.97 }}
							className={cn(
								'resa-relative resa-flex resa-flex-row resa-items-center resa-gap-2 resa-rounded-xl resa-border resa-bg-card resa-p-3 resa-cursor-pointer resa-transition-colors',
								'focus-visible:resa-outline-none focus-visible:resa-ring-2 focus-visible:resa-ring-primary focus-visible:resa-ring-offset-2',
								isSelected
									? 'resa-border-2 resa-border-primary resa-bg-primary/10 resa-shadow-sm'
									: 'resa-border-input hover:resa-border-primary/40 hover:resa-shadow-md',
							)}
						>
							<AnimatePresence>
								{isSelected && (
									<motion.span
										initial={{ scale: 0, opacity: 0 }}
										animate={{ scale: 1, opacity: 1 }}
										exit={{ scale: 0, opacity: 0 }}
										transition={{ type: 'spring', stiffness: 500, damping: 30 }}
										className="resa-absolute resa-right-1.5 resa-top-1.5 resa-flex resa-h-4 resa-w-4 resa-items-center resa-justify-center resa-rounded-full resa-bg-primary resa-text-primary-foreground"
									>
										<svg
											width="10"
											height="10"
											viewBox="0 0 12 12"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										>
											<polyline points="2,6 5,9 10,3" />
										</svg>
									</motion.span>
								)}
							</AnimatePresence>
							<ResaIcon name={feature.icon} size={20} />
							<span className="resa-text-xs resa-font-medium resa-text-left resa-leading-tight">
								{feature.label}
							</span>
						</motion.button>
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
