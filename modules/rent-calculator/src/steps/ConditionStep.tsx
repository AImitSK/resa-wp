/**
 * Step 4: Zustand — 4 Zustandskarten.
 */

import { ResaIcon } from '@/components/icons/ResaIcon';
import { cn } from '@/lib/utils';
import type { StepProps } from '@frontend/types/wizard';

const options = [
	{ value: 'new', label: 'Neubau / Kernsaniert', icon: 'neubau' },
	{ value: 'renovated', label: 'Kürzlich renoviert', icon: 'renoviert' },
	{ value: 'good', label: 'Guter Zustand', icon: 'gut' },
	{ value: 'needs_renovation', label: 'Renovierungsbedürftig', icon: 'reparaturen' },
] as const;

export function ConditionStep({ data, updateData, errors }: StepProps) {
	const selected = data.condition as string | undefined;

	return (
		<div className="resa-space-y-4">
			<div className="resa-text-center">
				<h3 className="resa-text-lg resa-font-semibold">Zustand der Immobilie</h3>
				<p className="resa-text-sm resa-text-muted-foreground resa-mt-1">
					Wie würden Sie den aktuellen Zustand beschreiben?
				</p>
			</div>

			<div className="resa-grid resa-grid-cols-2 resa-gap-3">
				{options.map((option) => (
					<button
						key={option.value}
						type="button"
						onClick={() => updateData({ condition: option.value })}
						className={cn(
							'resa-flex resa-flex-col resa-items-center resa-gap-2 resa-rounded-lg resa-border-2 resa-p-4 resa-transition-colors resa-cursor-pointer',
							selected === option.value
								? 'resa-border-primary resa-bg-primary/5'
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
