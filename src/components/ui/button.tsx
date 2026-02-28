import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
	'resa-inline-flex resa-items-center resa-justify-center resa-gap-2 resa-whitespace-nowrap resa-rounded-md resa-text-sm resa-font-medium resa-cursor-pointer resa-transition-colors focus-visible:resa-outline-none focus-visible:resa-ring-1 focus-visible:resa-ring-ring disabled:resa-pointer-events-none disabled:resa-cursor-not-allowed disabled:resa-opacity-50 [&_svg]:resa-pointer-events-none [&_svg]:resa-size-4 [&_svg]:resa-shrink-0',
	{
		variants: {
			variant: {
				default:
					'resa-border-0 resa-bg-primary resa-text-primary-foreground resa-shadow hover:resa-bg-primary/90',
				destructive:
					'resa-border-0 resa-bg-destructive resa-text-destructive-foreground resa-shadow-sm hover:resa-bg-destructive/90',
				outline:
					'resa-border resa-border-input resa-bg-background resa-shadow-sm hover:resa-bg-accent hover:resa-text-accent-foreground',
				secondary:
					'resa-border-0 resa-bg-secondary resa-text-secondary-foreground resa-shadow-sm hover:resa-bg-secondary/80',
				ghost: 'resa-border-0 resa-bg-transparent hover:resa-bg-accent hover:resa-text-accent-foreground',
				link: 'resa-border-0 resa-bg-transparent resa-text-primary resa-underline-offset-4 hover:resa-underline',
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

// Inline style fallbacks for WordPress admin compatibility
const variantStyles: Record<string, React.CSSProperties> = {
	default: {
		backgroundColor: '#a9e43f',
		color: '#1e303a',
		border: 'none',
		boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
	},
	destructive: {
		backgroundColor: '#dc2626',
		color: 'white',
		border: 'none',
	},
	outline: {
		backgroundColor: 'white',
		color: '#1e303a',
		border: '1px solid hsl(214.3 31.8% 91.4%)',
		boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
	},
	secondary: {
		backgroundColor: 'hsl(210 40% 96.1%)',
		color: '#1e303a',
		border: 'none',
	},
	ghost: {
		backgroundColor: 'transparent',
		color: '#1e303a',
		border: 'none',
	},
	link: {
		backgroundColor: 'transparent',
		color: '#1e303a',
		border: 'none',
		textDecoration: 'none',
	},
};

const sizeStyles: Record<string, React.CSSProperties> = {
	default: {
		height: '36px',
		padding: '8px 16px',
	},
	sm: {
		height: '32px',
		padding: '6px 12px',
		fontSize: '13px',
	},
	lg: {
		height: '40px',
		padding: '8px 32px',
	},
	icon: {
		height: '36px',
		width: '36px',
		padding: '0',
	},
};

const disabledStyles: React.CSSProperties = {
	opacity: 0.5,
	cursor: 'not-allowed',
	pointerEvents: 'none',
};

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant = 'default',
			size = 'default',
			style,
			disabled,
			asChild = false,
			...props
		},
		ref,
	) => {
		const Comp = asChild ? Slot : 'button';

		const baseStyles: React.CSSProperties = {
			display: 'inline-flex',
			alignItems: 'center',
			justifyContent: 'center',
			gap: '8px',
			whiteSpace: 'nowrap',
			borderRadius: '6px',
			fontSize: '14px',
			fontWeight: 500,
			cursor: 'pointer',
			transition: 'all 150ms',
			...variantStyles[variant ?? 'default'],
			...sizeStyles[size ?? 'default'],
			...(disabled ? disabledStyles : {}),
			...style,
		};

		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				style={baseStyles}
				disabled={disabled}
				{...props}
			/>
		);
	},
);
Button.displayName = 'Button';

export { Button, buttonVariants };
