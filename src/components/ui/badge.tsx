import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

const variantStyles: Record<string, string> = {
	default: 'resa-border-transparent resa-bg-primary resa-text-primary-foreground',
	secondary: 'resa-border-transparent resa-bg-secondary resa-text-secondary-foreground',
	outline: 'resa-text-foreground',
	destructive: 'resa-border-transparent resa-bg-destructive resa-text-destructive-foreground',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
	return (
		<div
			className={cn(
				'resa-inline-flex resa-items-center resa-rounded-full resa-border resa-px-2.5 resa-py-0.5 resa-text-xs resa-font-semibold resa-transition-colors focus:resa-outline-none focus:resa-ring-2 focus:resa-ring-ring focus:resa-ring-offset-2',
				variantStyles[variant],
				className,
			)}
			{...props}
		/>
	);
}
