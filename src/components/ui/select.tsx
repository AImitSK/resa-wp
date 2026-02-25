import * as React from 'react';
import { cn } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
	({ className, children, ...props }, ref) => {
		return (
			<select
				className={cn(
					'resa-flex resa-h-10 resa-w-full resa-items-center resa-justify-between resa-rounded-md resa-border resa-border-input resa-bg-background resa-px-3 resa-py-2 resa-text-sm resa-ring-offset-background placeholder:resa-text-muted-foreground focus:resa-outline-none focus:resa-ring-2 focus:resa-ring-ring focus:resa-ring-offset-2 disabled:resa-cursor-not-allowed disabled:resa-opacity-50',
					className,
				)}
				ref={ref}
				{...props}
			>
				{children}
			</select>
		);
	},
);
Select.displayName = 'Select';
