import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

function ItemGroup({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			role="list"
			data-slot="item-group"
			className={cn('resa-group/item-group resa-flex resa-flex-col', className)}
			{...props}
		/>
	);
}

function ItemSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
	return (
		<Separator
			data-slot="item-separator"
			orientation="horizontal"
			className={cn('resa-my-0', className)}
			{...props}
		/>
	);
}

const itemVariants = cva(
	'resa-group/item [a]:hover:resa-bg-accent/50 focus-visible:resa-border-ring focus-visible:resa-ring-ring/50 [a]:resa-transition-colors resa-flex resa-flex-wrap resa-items-center resa-rounded-md resa-border resa-border-transparent resa-text-sm resa-outline-none resa-transition-colors resa-duration-100 focus-visible:resa-ring-[3px]',
	{
		variants: {
			variant: {
				default: 'resa-bg-transparent',
				outline: 'resa-border-border',
				muted: 'resa-bg-muted/50',
			},
			size: {
				default: 'resa-gap-4 resa-p-4 resa-',
				sm: 'resa-gap-2.5 resa-px-4 resa-py-3',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

function Item({
	className,
	variant = 'default',
	size = 'default',
	asChild = false,
	...props
}: React.ComponentProps<'div'> & VariantProps<typeof itemVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : 'div';
	return (
		<Comp
			data-slot="item"
			data-variant={variant}
			data-size={size}
			className={cn(itemVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

const itemMediaVariants = cva(
	'resa-flex resa-shrink-0 resa-items-center resa-justify-center resa-gap-2 group-has-[[data-slot=item-description]]/item:resa-translate-y-0.5 group-has-[[data-slot=item-description]]/item:resa-self-start [&_svg]:resa-pointer-events-none',
	{
		variants: {
			variant: {
				default: 'resa-bg-transparent',
				icon: 'resa-bg-muted resa-size-8 resa-rounded-sm resa-border [&_svg:not([class*=size-])]:resa-size-4',
				image: 'resa-size-10 resa-overflow-hidden resa-rounded-sm [&_img]:resa-size-full [&_img]:resa-object-cover',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
);

function ItemMedia({
	className,
	variant = 'default',
	...props
}: React.ComponentProps<'div'> & VariantProps<typeof itemMediaVariants>) {
	return (
		<div
			data-slot="item-media"
			data-variant={variant}
			className={cn(itemMediaVariants({ variant, className }))}
			{...props}
		/>
	);
}

function ItemContent({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="item-content"
			className={cn(
				'resa-flex resa-flex-1 resa-flex-col resa-gap-1 [&+[data-slot=item-content]]:resa-flex-none',
				className,
			)}
			{...props}
		/>
	);
}

function ItemTitle({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="item-title"
			className={cn(
				'resa-flex resa-w-fit resa-items-center resa-gap-2 resa-text-sm resa-font-medium resa-leading-snug',
				className,
			)}
			{...props}
		/>
	);
}

function ItemDescription({ className, ...props }: React.ComponentProps<'p'>) {
	return (
		<p
			data-slot="item-description"
			className={cn(
				'resa-text-muted-foreground resa-line-clamp-2 resa-text-balance resa-text-sm resa-font-normal resa-leading-normal',
				'[&>a:hover]:resa-text-primary [&>a]:resa-underline [&>a]:resa-underline-offset-4',
				className,
			)}
			{...props}
		/>
	);
}

function ItemActions({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="item-actions"
			className={cn('resa-flex resa-items-center resa-gap-2', className)}
			{...props}
		/>
	);
}

function ItemHeader({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="item-header"
			className={cn(
				'resa-flex resa-basis-full resa-items-center resa-justify-between resa-gap-2',
				className,
			)}
			{...props}
		/>
	);
}

function ItemFooter({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="item-footer"
			className={cn(
				'resa-flex resa-basis-full resa-items-center resa-justify-between resa-gap-2',
				className,
			)}
			{...props}
		/>
	);
}

export {
	Item,
	ItemMedia,
	ItemContent,
	ItemActions,
	ItemGroup,
	ItemSeparator,
	ItemTitle,
	ItemDescription,
	ItemHeader,
	ItemFooter,
};
