import * as React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={cn(
				'resa-rounded-lg resa-border resa-bg-card resa-text-card-foreground resa-shadow-sm',
				className,
			)}
			{...props}
		/>
	),
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={cn('resa-flex resa-flex-col resa-space-y-1.5 resa-p-6', className)}
			{...props}
		/>
	),
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
	HTMLHeadingElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
	<h3
		ref={ref}
		className={cn(
			'resa-text-2xl resa-font-semibold resa-leading-none resa-tracking-tight',
			className,
		)}
		{...props}
	/>
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
	<p ref={ref} className={cn('resa-text-sm resa-text-muted-foreground', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn('resa-p-6 resa-pt-0', className)} {...props} />
	),
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={cn('resa-flex resa-items-center resa-p-6 resa-pt-0', className)}
			{...props}
		/>
	),
);
CardFooter.displayName = 'CardFooter';
