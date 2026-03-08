import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
	'resa-inline-flex resa-items-center resa-justify-center resa-gap-2 resa-whitespace-nowrap resa-rounded-md resa-text-sm resa-font-medium resa-transition-colors focus-visible:resa-outline-none focus-visible:resa-ring-1 focus-visible:resa-ring-ring disabled:resa-pointer-events-none disabled:resa-opacity-50 [&_svg]:resa-pointer-events-none [&_svg]:resa-size-4 [&_svg]:resa-shrink-0',
	{
		variants: {
			variant: {
				default:
					'resa-bg-primary resa-text-primary-foreground resa-shadow hover:resa-bg-primary/90',
				destructive:
					'resa-bg-destructive resa-text-destructive-foreground resa-shadow-sm hover:resa-bg-destructive/90',
				outline:
					'resa-border resa-border-input resa-bg-background resa-shadow-sm hover:resa-bg-accent hover:resa-text-accent-foreground',
				secondary:
					'resa-bg-secondary resa-text-secondary-foreground resa-shadow-sm hover:resa-bg-secondary/80',
				ghost: 'hover:resa-bg-accent hover:resa-text-accent-foreground',
				link: 'resa-text-primary resa-underline-offset-4 hover:resa-underline',
			},
			size: {
				default: 'resa-h-9 resa-px-4 resa-py-2',
				sm: 'resa-h-8 resa-rounded-md resa-px-3 resa-text-xs',
				lg: 'resa-h-10 resa-rounded-md resa-px-8',
				icon: 'resa-h-9 resa-w-9',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button';
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = 'Button';

export { Button, buttonVariants };
