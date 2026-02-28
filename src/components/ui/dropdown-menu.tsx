import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';

import { cn } from '@/lib/utils';

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
		inset?: boolean;
	}
>(({ className, inset, children, ...props }, ref) => (
	<DropdownMenuPrimitive.SubTrigger
		ref={ref}
		className={cn(
			'resa-flex resa-cursor-default resa-select-none resa-items-center resa-gap-2 resa-rounded-sm resa-px-2 resa-py-1.5 resa-text-sm resa-outline-none focus:resa-bg-accent data-[state=open]:resa-bg-accent [&_svg]:resa-pointer-events-none [&_svg]:resa-size-4 [&_svg]:resa-shrink-0',
			inset && 'resa-pl-8',
			className,
		)}
		{...props}
	>
		{children}
		<ChevronRight className="resa-ml-auto" />
	</DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
	<DropdownMenuPrimitive.SubContent
		ref={ref}
		className={cn(
			'resa-z-50 resa-min-w-[8rem] resa-overflow-hidden resa-rounded-md resa-border resa-bg-popover resa-p-1 resa-text-popover-foreground resa-shadow-lg data-[state=open]:resa-animate-in data-[state=closed]:resa-animate-out data-[state=closed]:resa-fade-out-0 data-[state=open]:resa-fade-in-0 data-[state=closed]:resa-zoom-out-95 data-[state=open]:resa-zoom-in-95 data-[side=bottom]:resa-slide-in-from-top-2 data-[side=left]:resa-slide-in-from-right-2 data-[side=right]:resa-slide-in-from-left-2 data-[side=top]:resa-slide-in-from-bottom-2 resa-origin-[--radix-dropdown-menu-content-transform-origin]',
			className,
		)}
		{...props}
	/>
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
	<DropdownMenuPrimitive.Portal>
		<DropdownMenuPrimitive.Content
			ref={ref}
			sideOffset={sideOffset}
			className={cn(
				'resa-z-50 resa-max-h-[var(--radix-dropdown-menu-content-available-height)] resa-min-w-[8rem] resa-overflow-y-auto resa-overflow-x-hidden resa-rounded-md resa-border resa-bg-popover resa-p-1 resa-text-popover-foreground resa-shadow-md',
				'data-[state=open]:resa-animate-in data-[state=closed]:resa-animate-out data-[state=closed]:resa-fade-out-0 data-[state=open]:resa-fade-in-0 data-[state=closed]:resa-zoom-out-95 data-[state=open]:resa-zoom-in-95 data-[side=bottom]:resa-slide-in-from-top-2 data-[side=left]:resa-slide-in-from-right-2 data-[side=right]:resa-slide-in-from-left-2 data-[side=top]:resa-slide-in-from-bottom-2 resa-origin-[--radix-dropdown-menu-content-transform-origin]',
				className,
			)}
			{...props}
		/>
	</DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
		inset?: boolean;
	}
>(({ className, inset, ...props }, ref) => (
	<DropdownMenuPrimitive.Item
		ref={ref}
		className={cn(
			'resa-relative resa-flex resa-cursor-default resa-select-none resa-items-center resa-gap-2 resa-rounded-sm resa-px-2 resa-py-1.5 resa-text-sm resa-outline-none resa-transition-colors focus:resa-bg-accent focus:resa-text-accent-foreground data-[disabled]:resa-pointer-events-none data-[disabled]:resa-opacity-50 [&>svg]:resa-size-4 [&>svg]:resa-shrink-0',
			inset && 'resa-pl-8',
			className,
		)}
		{...props}
	/>
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
	<DropdownMenuPrimitive.CheckboxItem
		ref={ref}
		className={cn(
			'resa-relative resa-flex resa-cursor-default resa-select-none resa-items-center resa-rounded-sm resa-py-1.5 resa-pl-8 resa-pr-2 resa-text-sm resa-outline-none resa-transition-colors focus:resa-bg-accent focus:resa-text-accent-foreground data-[disabled]:resa-pointer-events-none data-[disabled]:resa-opacity-50',
			className,
		)}
		checked={checked}
		{...props}
	>
		<span className="resa-absolute resa-left-2 resa-flex resa-h-3.5 resa-w-3.5 resa-items-center resa-justify-center">
			<DropdownMenuPrimitive.ItemIndicator>
				<Check className="resa-h-4 resa-w-4" />
			</DropdownMenuPrimitive.ItemIndicator>
		</span>
		{children}
	</DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
	<DropdownMenuPrimitive.RadioItem
		ref={ref}
		className={cn(
			'resa-relative resa-flex resa-cursor-default resa-select-none resa-items-center resa-rounded-sm resa-py-1.5 resa-pl-8 resa-pr-2 resa-text-sm resa-outline-none resa-transition-colors focus:resa-bg-accent focus:resa-text-accent-foreground data-[disabled]:resa-pointer-events-none data-[disabled]:resa-opacity-50',
			className,
		)}
		{...props}
	>
		<span className="resa-absolute resa-left-2 resa-flex resa-h-3.5 resa-w-3.5 resa-items-center resa-justify-center">
			<DropdownMenuPrimitive.ItemIndicator>
				<Circle className="resa-h-2 resa-w-2 resa-fill-current" />
			</DropdownMenuPrimitive.ItemIndicator>
		</span>
		{children}
	</DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.Label>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
		inset?: boolean;
	}
>(({ className, inset, ...props }, ref) => (
	<DropdownMenuPrimitive.Label
		ref={ref}
		className={cn(
			'resa-px-2 resa-py-1.5 resa-text-sm resa-font-semibold',
			inset && 'resa-pl-8',
			className,
		)}
		{...props}
	/>
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
	<DropdownMenuPrimitive.Separator
		ref={ref}
		className={cn('resa--mx-1 resa-my-1 resa-h-px resa-bg-muted', className)}
		{...props}
	/>
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
	return (
		<span
			className={cn(
				'resa-ml-auto resa-text-xs resa-tracking-widest resa-opacity-60',
				className,
			)}
			{...props}
		/>
	);
};
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuCheckboxItem,
	DropdownMenuRadioItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuGroup,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuRadioGroup,
};
