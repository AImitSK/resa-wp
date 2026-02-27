import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const alertVariants = cva(
	'resa-relative resa-w-full resa-rounded-lg resa-border resa-px-4 resa-py-3 resa-text-sm [&>svg+div]:resa-translate-y-[-3px] [&>svg]:resa-absolute [&>svg]:resa-left-4 [&>svg]:resa-top-4 [&>svg]:resa-text-foreground [&>svg~*]:resa-pl-7',
	{
		variants: {
			variant: {
				default: 'resa-bg-background resa-text-foreground',
				destructive:
					'resa-border-destructive/50 resa-text-destructive dark:resa-border-destructive [&>svg]:resa-text-destructive',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
);

const Alert = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
	<div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
	({ className, ...props }, ref) => (
		<h5
			ref={ref}
			className={cn(
				'resa-mb-1 resa-font-medium resa-leading-none resa-tracking-tight',
				className,
			)}
			{...props}
		/>
	),
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn('resa-text-sm [&_p]:resa-leading-relaxed', className)}
		{...props}
	/>
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
