/**
 * Step 5: Zustand + Vermietungsstatus.
 */

import { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { SelectionCard } from '@frontend/components/shared/SelectionCard';
import type { StepProps } from '@frontend/types/wizard';

const getConditionOptions = () =>
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

const getRentalOptions = () =>
	[
		{ value: 'owner_occupied', label: __('Eigennutzung', 'resa'), icon: 'selbstgenutzt' },
		{ value: 'rented', label: __('Vermietet', 'resa'), icon: 'vermietet' },
		{ value: 'vacant', label: __('Leerstand', 'resa'), icon: 'leerstand' },
	] as const;

export function ConditionStep({ data, updateData, errors }: StepProps) {
	const selectedCondition = data.condition as string | undefined;
	const selectedRental = data.rental_status as string | undefined;
	const conditionOptions = getConditionOptions();
	const rentalOptions = getRentalOptions();

	// Default rental_status to owner_occupied.
	useEffect(() => {
		if (data.rental_status === undefined) {
			updateData({ rental_status: 'owner_occupied' });
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className="resa-space-y-6">
			<div className="resa-text-center">
				<h3 className="resa-text-lg resa-font-semibold">
					{__('Zustand und Nutzung', 'resa')}
				</h3>
			</div>

			{/* Zustand */}
			<div className="resa-space-y-2">
				<p className="resa-text-sm resa-font-medium resa-text-muted-foreground">
					{__('Zustand', 'resa')}
				</p>
				<div className="resa-grid resa-grid-cols-2 resa-gap-3 sm:resa-grid-cols-4">
					{conditionOptions.map((option) => (
						<SelectionCard
							key={option.value}
							icon={option.icon}
							label={option.label}
							iconSize={48}
							selected={selectedCondition === option.value}
							onClick={() => updateData({ condition: option.value })}
						/>
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

			{/* Vermietungsstatus */}
			<div className="resa-space-y-2">
				<p className="resa-text-sm resa-font-medium resa-text-muted-foreground">
					{__('Vermietungsstatus', 'resa')}
				</p>
				<div className="resa-grid resa-grid-cols-3 resa-gap-3">
					{rentalOptions.map((option) => (
						<SelectionCard
							key={option.value}
							icon={option.icon}
							label={option.label}
							iconSize={36}
							selected={selectedRental === option.value}
							onClick={() => updateData({ rental_status: option.value })}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
