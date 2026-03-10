/**
 * Step 7: Ausstattungsqualität — Gehoben / Normal / Einfach.
 */

import { __ } from '@wordpress/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { SelectionCard } from '@frontend/components/shared/SelectionCard';
import type { StepProps } from '@frontend/types/wizard';

const getOptions = () =>
	[
		{ value: 'premium', label: __('Gehoben', 'resa'), icon: 'gehoben' },
		{ value: 'normal', label: __('Normal', 'resa'), icon: 'normal' },
		{ value: 'basic', label: __('Einfach', 'resa'), icon: 'einfach' },
	] as const;

export function QualityStep({ data, updateData, errors }: StepProps) {
	const selected = data.quality as string | undefined;
	const options = getOptions();

	return (
		<div className="resa-space-y-4">
			<div className="resa-text-center">
				<h3 className="resa-text-xl resa-font-semibold">
					{__('Wie ist die Ausstattung Ihrer Immobilie?', 'resa')}
				</h3>
			</div>

			<div className="resa-flex resa-flex-wrap resa-justify-center resa-gap-4">
				{options.map((option) => (
					<div key={option.value} style={{ width: 170 }}>
						<SelectionCard
							icon={option.icon}
							label={option.label}
							iconSize={64}
							selected={selected === option.value}
							onClick={() => updateData({ quality: option.value })}
						/>
					</div>
				))}
			</div>

			<AnimatePresence>
				{errors.quality && (
					<motion.p
						role="alert"
						initial={{ opacity: 0, x: -4 }}
						animate={{ opacity: 1, x: [0, -4, 4, -4, 4, 0] }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.4 }}
						className="resa-text-xs resa-text-destructive resa-text-center"
					>
						{errors.quality}
					</motion.p>
				)}
			</AnimatePresence>
		</div>
	);
}
