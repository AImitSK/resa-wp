/**
 * Step 4: Zustand — 4 Zustandskarten.
 */

import { __ } from '@wordpress/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { SelectionCard } from '@frontend/components/shared/SelectionCard';
import type { StepProps } from '@frontend/types/wizard';

const getOptions = () =>
	[
		{ value: 'new', label: __('Neubau / Kernsaniert', 'resa'), icon: 'neubau' },
		{ value: 'renovated', label: __('Kürzlich renoviert', 'resa'), icon: 'renoviert' },
		{ value: 'good', label: __('Guter Zustand', 'resa'), icon: 'gut' },
		{
			value: 'needs_renovation',
			label: __('Renovierungsbedürftig', 'resa'),
			icon: 'reparaturen',
		},
	] as const;

export function ConditionStep({ data, updateData, errors }: StepProps) {
	const selected = data.condition as string | undefined;
	const options = getOptions();

	return (
		<div className="resa-space-y-4">
			<div className="resa-text-center">
				<h3 className="resa-text-xl resa-font-semibold">
					{__('Zustand der Immobilie', 'resa')}
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
							onClick={() => updateData({ condition: option.value })}
						/>
					</div>
				))}
			</div>

			<AnimatePresence>
				{errors.condition && (
					<motion.p
						role="alert"
						initial={{ opacity: 0, x: -4 }}
						animate={{ opacity: 1, x: [0, -4, 4, -4, 4, 0] }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.4 }}
						className="resa-text-xs resa-text-destructive resa-text-center"
					>
						{errors.condition}
					</motion.p>
				)}
			</AnimatePresence>
		</div>
	);
}
