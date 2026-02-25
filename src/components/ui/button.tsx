import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
	size?: 'default' | 'sm' | 'lg' | 'icon';
}

const variantStyles: Record<string, string> = {
	default: 'resa-bg-primary resa-text-primary-foreground hover:resa-bg-primary/90',
	secondary: 'resa-bg-secondary resa-text-secondary-foreground hover:resa-bg-secondary/80',
	outline:
		'resa-border resa-border-input resa-bg-background hover:resa-bg-accent hover:resa-text-accent-foreground',
	ghost: 'hover:resa-bg-accent hover:resa-text-accent-foreground',
	destructive:
		'resa-bg-destructive resa-text-destructive-foreground hover:resa-bg-destructive/90',
};

const sizeStyles: Record<string, string> = {
	default: 'resa-h-10 resa-px-4 resa-py-2',
	sm: 'resa-h-9 resa-rounded-md resa-px-3',
	lg: 'resa-h-11 resa-rounded-md resa-px-8',
	icon: 'resa-h-10 resa-w-10',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant = 'default', size = 'default', ...props }, ref) => {
		return (
			<button
				className={cn(
					'resa-inline-flex resa-items-center resa-justify-center resa-whitespace-nowrap resa-rounded-md resa-text-sm resa-font-medium resa-ring-offset-background resa-transition-colors focus-visible:resa-outline-none focus-visible:resa-ring-2 focus-visible:resa-ring-ring focus-visible:resa-ring-offset-2 disabled:resa-pointer-events-none disabled:resa-opacity-50',
					variantStyles[variant],
					sizeStyles[size],
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = 'Button';
