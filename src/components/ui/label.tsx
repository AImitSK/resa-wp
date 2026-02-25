import * as React from 'react';
import { cn } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
	({ className, ...props }, ref) => {
		return (
			<label
				ref={ref}
				className={cn(
					'resa-text-sm resa-font-medium resa-leading-none peer-disabled:resa-cursor-not-allowed peer-disabled:resa-opacity-70',
					className,
				)}
				{...props}
			/>
		);
	},
);
Label.displayName = 'Label';
