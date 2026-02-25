import * as React from 'react';
import { cn } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					'resa-flex resa-h-10 resa-w-full resa-rounded-md resa-border resa-border-input resa-bg-background resa-px-3 resa-py-2 resa-text-sm resa-ring-offset-background file:resa-border-0 file:resa-bg-transparent file:resa-text-sm file:resa-font-medium placeholder:resa-text-muted-foreground focus-visible:resa-outline-none focus-visible:resa-ring-2 focus-visible:resa-ring-ring focus-visible:resa-ring-offset-2 disabled:resa-cursor-not-allowed disabled:resa-opacity-50',
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Input.displayName = 'Input';
