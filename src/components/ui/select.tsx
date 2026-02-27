import * as React from 'react';
import { cn } from '@/lib/utils';

const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<'select'>>(
	({ className, children, ...props }, ref) => {
		return (
			<select
				className={cn(
					'resa-flex resa-h-9 resa-w-full resa-rounded-md resa-border resa-border-input resa-bg-transparent resa-px-3 resa-py-1 resa-text-base resa-shadow-sm resa-transition-colors focus-visible:resa-outline-none focus-visible:resa-ring-1 focus-visible:resa-ring-ring disabled:resa-cursor-not-allowed disabled:resa-opacity-50 md:resa-text-sm',
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

export { Select };
