/**
 * Step 6: Vermietungsstatus — Eigennutzung / Vermietet / Leerstand.
 */

import { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { SelectionCard } from '@frontend/components/shared/SelectionCard';
import type { StepProps } from '@frontend/types/wizard';

const getRentalOptions = () =>
	[
		{ value: 'owner_occupied', label: __('Eigennutzung', 'resa'), icon: 'selbstgenutzt' },
		{ value: 'rented', label: __('Vermietet', 'resa'), icon: 'vermietet' },
		{ value: 'vacant', label: __('Leerstand', 'resa'), icon: 'leerstand' },
	] as const;

export function RentalStatusStep({ data, updateData }: StepProps) {
	const selected = data.rental_status as string | undefined;
	const options = getRentalOptions();

	// Default to owner_occupied on mount.
	useEffect(() => {
		if (data.rental_status === undefined) {
			updateData({ rental_status: 'owner_occupied' });
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className="resa-space-y-4">
			<div className="resa-text-center">
				<h3 className="resa-text-xl resa-font-semibold">
					{__('Wie wird die Immobilie genutzt?', 'resa')}
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
							onClick={() => updateData({ rental_status: option.value })}
						/>
					</div>
				))}
			</div>
		</div>
	);
}
