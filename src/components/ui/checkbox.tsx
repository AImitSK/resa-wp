import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
	label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
	({ className, label, id, ...props }, ref) => {
		const checkbox = (
			<input
				type="checkbox"
				ref={ref}
				id={id}
				className={cn(
					'resa-h-4 resa-w-4 resa-shrink-0 resa-rounded-sm resa-border resa-border-primary resa-ring-offset-background focus-visible:resa-outline-none focus-visible:resa-ring-2 focus-visible:resa-ring-ring focus-visible:resa-ring-offset-2 disabled:resa-cursor-not-allowed disabled:resa-opacity-50',
					className,
				)}
				{...props}
			/>
		);

		if (!label) return checkbox;

		return (
			<div className="resa-flex resa-items-center resa-space-x-2">
				{checkbox}
				<label
					htmlFor={id}
					className="resa-text-sm resa-font-medium resa-leading-none resa-cursor-pointer peer-disabled:resa-cursor-not-allowed peer-disabled:resa-opacity-70"
				>
					{label}
				</label>
			</div>
		);
	},
);
Checkbox.displayName = 'Checkbox';
