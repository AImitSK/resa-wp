/**
 * Step 1: Immobilienart — Wohnung oder Haus.
 */

import { __ } from '@wordpress/i18n';
import { ResaIcon } from '@/components/icons/ResaIcon';
import { cn } from '@/lib/utils';
import type { StepProps } from '@frontend/types/wizard';

const getOptions = () =>
	[
		{ value: 'apartment', label: __('Wohnung', 'resa'), icon: 'wohnung' },
		{ value: 'house', label: __('Haus', 'resa'), icon: 'haus' },
	] as const;

export function PropertyTypeStep({ data, updateData, errors }: StepProps) {
	const selected = data.property_type as string | undefined;
	const options = getOptions();

	return (
		<div className="resa-space-y-4">
			<div className="resa-text-center">
				<h3 className="resa-text-lg resa-font-semibold">
					{__('Welche Art von Immobilie?', 'resa')}
				</h3>
				<p className="resa-text-sm resa-text-muted-foreground resa-mt-1">
					{__('Wählen Sie den Immobilientyp aus.', 'resa')}
				</p>
			</div>

			<div className="resa-grid resa-grid-cols-2 resa-gap-4">
				{options.map((option) => (
					<button
						key={option.value}
						type="button"
						onClick={() => updateData({ property_type: option.value })}
						className={cn(
							'resa-flex resa-flex-col resa-items-center resa-gap-3 resa-rounded-lg resa-border-2 resa-p-6 resa-transition-colors resa-cursor-pointer',
							selected === option.value
								? 'resa-border-primary resa-bg-primary/5'
								: 'resa-border-input hover:resa-border-primary/50',
						)}
					>
						<ResaIcon name={option.icon} size={48} />
						<span className="resa-text-sm resa-font-medium">{option.label}</span>
					</button>
				))}
			</div>

			{errors.property_type && (
				<p role="alert" className="resa-text-xs resa-text-destructive resa-text-center">
					{errors.property_type}
				</p>
			)}
		</div>
	);
}
