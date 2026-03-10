/**
 * Step 2: Unterart — Dynamisch je nach Immobilienart.
 */

import { __ } from '@wordpress/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { SelectionCard } from '@frontend/components/shared/SelectionCard';
import type { StepProps } from '@frontend/types/wizard';
import type { SubtypeOption } from '../types';

interface PropertySubtypeStepProps extends StepProps {
	subtypesHouse: SubtypeOption[];
	subtypesApartment: SubtypeOption[];
}

export function PropertySubtypeStep({
	data,
	updateData,
	errors,
	subtypesHouse,
	subtypesApartment,
}: PropertySubtypeStepProps) {
	const propertyType = data.property_type as string | undefined;
	const selected = data.property_subtype as string | undefined;
	const subtypes = propertyType === 'house' ? subtypesHouse : subtypesApartment;

	const heading =
		propertyType === 'house'
			? __('Bitte wählen Sie die Art Ihres Hauses.', 'resa')
			: __('Bitte wählen Sie die Art Ihrer Wohnung.', 'resa');

	return (
		<div className="resa-space-y-4">
			<div className="resa-text-center">
				<h3 className="resa-text-lg resa-font-semibold">{heading}</h3>
			</div>

			<div className="resa-mx-auto resa-grid resa-max-w-lg resa-grid-cols-2 resa-gap-3 sm:resa-grid-cols-3">
				{subtypes.map((subtype) => (
					<SelectionCard
						key={subtype.key}
						icon={subtype.icon}
						label={subtype.label}
						iconSize={48}
						selected={selected === subtype.key}
						onClick={() => updateData({ property_subtype: subtype.key })}
					/>
				))}
			</div>

			<AnimatePresence>
				{errors.property_subtype && (
					<motion.p
						role="alert"
						initial={{ opacity: 0, x: -4 }}
						animate={{ opacity: 1, x: [0, -4, 4, -4, 4, 0] }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.4 }}
						className="resa-text-xs resa-text-destructive resa-text-center"
					>
						{errors.property_subtype}
					</motion.p>
				)}
			</AnimatePresence>
		</div>
	);
}
