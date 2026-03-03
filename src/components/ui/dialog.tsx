import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn, getPortalContainer } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Overlay
		ref={ref}
		className={cn(
			'resa-fixed resa-inset-0 resa-z-50 resa-bg-black/80 resa- data-[state=open]:resa-animate-in data-[state=closed]:resa-animate-out data-[state=closed]:resa-fade-out-0 data-[state=open]:resa-fade-in-0',
			className,
		)}
		{...props}
	/>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
	<DialogPortal container={getPortalContainer()}>
		<DialogOverlay />
		<DialogPrimitive.Content
			ref={ref}
			className={cn(
				'resa-fixed resa-left-[50%] resa-top-[50%] resa-z-50 resa-grid resa-w-full resa-max-w-lg resa-translate-x-[-50%] resa-translate-y-[-50%] resa-gap-4 resa-border resa-bg-background resa-p-6 resa-shadow-lg resa-duration-200 data-[state=open]:resa-animate-in data-[state=closed]:resa-animate-out data-[state=closed]:resa-fade-out-0 data-[state=open]:resa-fade-in-0 data-[state=closed]:resa-zoom-out-95 data-[state=open]:resa-zoom-in-95 data-[state=closed]:resa-slide-out-to-left-1/2 data-[state=closed]:resa-slide-out-to-top-[48%] data-[state=open]:resa-slide-in-from-left-1/2 data-[state=open]:resa-slide-in-from-top-[48%] sm:resa-rounded-lg',
				className,
			)}
			{...props}
		>
			{children}
			<DialogPrimitive.Close className="resa-absolute resa-right-4 resa-top-4 resa-rounded-sm resa-opacity-70 resa-ring-offset-background resa-transition-opacity hover:resa-opacity-100 focus:resa-outline-none focus:resa-ring-2 focus:resa-ring-ring focus:resa-ring-offset-2 disabled:resa-pointer-events-none data-[state=open]:resa-bg-accent data-[state=open]:resa-text-muted-foreground">
				<X className="resa-h-4 resa-w-4" />
				<span className="resa-sr-only">Close</span>
			</DialogPrimitive.Close>
		</DialogPrimitive.Content>
	</DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			'resa-flex resa-flex-col resa-space-y-1.5 resa-text-center sm:resa-text-left',
			className,
		)}
		{...props}
	/>
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			'resa-flex resa-flex-col-reverse sm:resa-flex-row sm:resa-justify-end sm:resa-space-x-2',
			className,
		)}
		{...props}
	/>
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Title
		ref={ref}
		className={cn(
			'resa-text-lg resa-font-semibold resa-leading-none resa-tracking-tight',
			className,
		)}
		{...props}
	/>
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Description
		ref={ref}
		className={cn('resa-text-sm resa-text-muted-foreground', className)}
		{...props}
	/>
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
	Dialog,
	DialogPortal,
	DialogOverlay,
	DialogTrigger,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
};
