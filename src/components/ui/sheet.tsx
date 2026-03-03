'use client';

import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

import { cn, getPortalContainer } from '@/lib/utils';

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
	React.ElementRef<typeof SheetPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
	<SheetPrimitive.Overlay
		className={cn(
			'resa-fixed resa-inset-0 resa-z-50 resa-bg-black/80 resa- data-[state=open]:resa-animate-in data-[state=closed]:resa-animate-out data-[state=closed]:resa-fade-out-0 data-[state=open]:resa-fade-in-0',
			className,
		)}
		{...props}
		ref={ref}
	/>
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
	'resa-fixed resa-z-50 resa-gap-4 resa-bg-background resa-p-6 resa-shadow-lg resa-transition resa-ease-in-out data-[state=closed]:resa-duration-300 data-[state=open]:resa-duration-500 data-[state=open]:resa-animate-in data-[state=closed]:resa-animate-out',
	{
		variants: {
			side: {
				top: 'resa-inset-x-0 resa-top-0 resa-border-b data-[state=closed]:resa-slide-out-to-top data-[state=open]:resa-slide-in-from-top',
				bottom: 'resa-inset-x-0 resa-bottom-0 resa-border-t data-[state=closed]:resa-slide-out-to-bottom data-[state=open]:resa-slide-in-from-bottom',
				left: 'resa-inset-y-0 resa-left-0 resa-h-full resa-w-3/4 resa-border-r data-[state=closed]:resa-slide-out-to-left data-[state=open]:resa-slide-in-from-left sm:resa-max-w-sm',
				right: 'resa-inset-y-0 resa-right-0 resa-h-full resa-w-3/4 resa-border-l data-[state=closed]:resa-slide-out-to-right data-[state=open]:resa-slide-in-from-right sm:resa-max-w-sm',
			},
		},
		defaultVariants: {
			side: 'right',
		},
	},
);

interface SheetContentProps
	extends
		React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
		VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
	React.ElementRef<typeof SheetPrimitive.Content>,
	SheetContentProps
>(({ side = 'right', className, children, ...props }, ref) => (
	<SheetPortal container={getPortalContainer()}>
		<SheetOverlay />
		<SheetPrimitive.Content
			ref={ref}
			className={cn(sheetVariants({ side }), className)}
			{...props}
		>
			<SheetPrimitive.Close className="resa-absolute resa-right-4 resa-top-4 resa-rounded-sm resa-opacity-70 resa-ring-offset-background resa-transition-opacity hover:resa-opacity-100 focus:resa-outline-none focus:resa-ring-2 focus:resa-ring-ring focus:resa-ring-offset-2 disabled:resa-pointer-events-none data-[state=open]:resa-bg-secondary">
				<X className="resa-h-4 resa-w-4" />
				<span className="resa-sr-only">Close</span>
			</SheetPrimitive.Close>
			{children}
		</SheetPrimitive.Content>
	</SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			'resa-flex resa-flex-col resa-space-y-2 resa-text-center sm:resa-text-left',
			className,
		)}
		{...props}
	/>
);
SheetHeader.displayName = 'SheetHeader';

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			'resa-flex resa-flex-col-reverse sm:resa-flex-row sm:resa-justify-end sm:resa-space-x-2',
			className,
		)}
		{...props}
	/>
);
SheetFooter.displayName = 'SheetFooter';

const SheetTitle = React.forwardRef<
	React.ElementRef<typeof SheetPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
	<SheetPrimitive.Title
		ref={ref}
		className={cn('resa-text-lg resa-font-semibold resa-text-foreground', className)}
		{...props}
	/>
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
	React.ElementRef<typeof SheetPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
	<SheetPrimitive.Description
		ref={ref}
		className={cn('resa-text-sm resa-text-muted-foreground', className)}
		{...props}
	/>
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
	Sheet,
	SheetPortal,
	SheetOverlay,
	SheetTrigger,
	SheetClose,
	SheetContent,
	SheetHeader,
	SheetFooter,
	SheetTitle,
	SheetDescription,
};
