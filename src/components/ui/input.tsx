import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					'resa-flex resa-h-9 resa-w-full resa-rounded-md resa-border resa-border-input resa-bg-transparent resa-px-3 resa-py-1 resa-text-base resa-shadow-sm resa-transition-colors file:resa-border-0 file:resa-bg-transparent file:resa-text-sm file:resa-font-medium file:resa-text-foreground placeholder:resa-text-muted-foreground focus-visible:resa-outline-none focus-visible:resa-ring-1 focus-visible:resa-ring-ring disabled:resa-cursor-not-allowed disabled:resa-opacity-50 md:resa-text-sm',
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Input.displayName = 'Input';

export { Input };
