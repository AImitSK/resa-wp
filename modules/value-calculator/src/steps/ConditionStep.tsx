/**
 * Step 4: Zustand — 4 Zustandskarten.
 */

import { __ } from '@wordpress/i18n';
import { ResaIcon } from '@/components/icons/ResaIcon';
import { cn } from '@/lib/utils';
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
				<h3 className="resa-text-lg resa-font-semibold">
					{__('Zustand der Immobilie', 'resa')}
				</h3>
				<p className="resa-text-sm resa-text-muted-foreground resa-mt-1">
					{__('Wie würden Sie den aktuellen Zustand beschreiben?', 'resa')}
				</p>
			</div>

			<div className="resa-grid resa-grid-cols-2 resa-gap-3">
				{options.map((option) => (
					<button
						key={option.value}
						type="button"
						onClick={() => updateData({ condition: option.value })}
						className={cn(
							'resa-flex resa-flex-col resa-items-center resa-gap-2 resa-rounded-xl resa-border resa-bg-card resa-p-4 resa-transition-all resa-cursor-pointer focus:resa-outline-none',
							selected === option.value
								? 'resa-border-primary'
								: 'resa-border-input hover:resa-border-primary/50',
						)}
					>
						<ResaIcon name={option.icon} size={36} />
						<span className="resa-text-xs resa-font-medium resa-text-center">
							{option.label}
						</span>
					</button>
				))}
			</div>

			{errors.condition && (
				<p role="alert" className="resa-text-xs resa-text-destructive resa-text-center">
					{errors.condition}
				</p>
			)}
		</div>
	);
}
