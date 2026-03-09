import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

import { cn, getPortalContainer } from '@/lib/utils';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
	<SelectPrimitive.Trigger
		ref={ref}
		className={cn(
			'resa-flex resa-h-9 resa-w-full resa-items-center resa-justify-between resa-whitespace-nowrap resa-rounded-md resa-border resa-border-input resa-bg-background resa-px-3 resa-py-2 resa-text-sm resa-shadow-sm resa-cursor-pointer data-[placeholder]:resa-text-muted-foreground disabled:resa-cursor-not-allowed disabled:resa-opacity-50 [&>span]:resa-line-clamp-1',
			className,
		)}
		{...props}
		style={{ backgroundColor: 'white' }}
	>
		{children}
		<SelectPrimitive.Icon asChild>
			<ChevronDown className="resa-h-4 resa-w-4 resa-opacity-50" />
		</SelectPrimitive.Icon>
	</SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.ScrollUpButton
		ref={ref}
		className={cn(
			'resa-flex resa-cursor-default resa-items-center resa-justify-center resa-py-1',
			className,
		)}
		{...props}
	>
		<ChevronUp className="resa-h-4 resa-w-4" />
	</SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.ScrollDownButton
		ref={ref}
		className={cn(
			'resa-flex resa-cursor-default resa-items-center resa-justify-center resa-py-1',
			className,
		)}
		{...props}
	>
		<ChevronDown className="resa-h-4 resa-w-4" />
	</SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
	<SelectPrimitive.Portal container={getPortalContainer()}>
		<SelectPrimitive.Content
			ref={ref}
			className={cn(
				'resa-relative resa-z-50 resa-max-h-[--radix-select-content-available-height] resa-min-w-[8rem] resa-overflow-y-auto resa-overflow-x-hidden resa-rounded-md resa-border resa-shadow-md data-[state=open]:resa-animate-in data-[state=closed]:resa-animate-out data-[state=closed]:resa-fade-out-0 data-[state=open]:resa-fade-in-0 data-[state=closed]:resa-zoom-out-95 data-[state=open]:resa-zoom-in-95 data-[side=bottom]:resa-slide-in-from-top-2 data-[side=left]:resa-slide-in-from-right-2 data-[side=right]:resa-slide-in-from-left-2 data-[side=top]:resa-slide-in-from-bottom-2 resa-origin-[--radix-select-content-transform-origin]',
				position === 'popper' &&
					'data-[side=bottom]:resa-translate-y-1 data-[side=left]:resa--translate-x-1 data-[side=right]:resa-translate-x-1 data-[side=top]:resa--translate-y-1',
				className,
			)}
			style={{ backgroundColor: 'white', color: 'hsl(0 0% 15%)' }}
			position={position}
			{...props}
		>
			<SelectScrollUpButton />
			<SelectPrimitive.Viewport
				className={cn(
					'resa-p-1',
					position === 'popper' &&
						'resa-h-[var(--radix-select-trigger-height)] resa-w-full resa-min-w-[var(--radix-select-trigger-width)]',
				)}
				style={{ backgroundColor: 'white' }}
			>
				{children}
			</SelectPrimitive.Viewport>
			<SelectScrollDownButton />
		</SelectPrimitive.Content>
	</SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Label>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.Label
		ref={ref}
		className={cn('resa-px-2 resa-py-1.5 resa-text-sm resa-font-semibold', className)}
		{...props}
	/>
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
	<SelectPrimitive.Item
		ref={ref}
		className={cn(
			'resa-relative resa-flex resa-w-full resa-cursor-pointer resa-select-none resa-items-center resa-rounded-sm resa-py-1.5 resa-pl-2 resa-pr-8 resa-text-sm resa-outline-none resa-transition-colors hover:resa-bg-accent hover:resa-text-accent-foreground focus:resa-bg-accent focus:resa-text-accent-foreground data-[disabled]:resa-pointer-events-none data-[disabled]:resa-opacity-50',
			className,
		)}
		{...props}
	>
		<span className="resa-absolute resa-right-2 resa-flex resa-h-3.5 resa-w-3.5 resa-items-center resa-justify-center">
			<SelectPrimitive.ItemIndicator>
				<Check className="resa-h-4 resa-w-4" />
			</SelectPrimitive.ItemIndicator>
		</span>
		<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
	</SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Separator>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.Separator
		ref={ref}
		className={cn('resa--mx-1 resa-my-1 resa-h-px resa-bg-muted', className)}
		{...props}
	/>
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
	Select,
	SelectGroup,
	SelectValue,
	SelectTrigger,
	SelectContent,
	SelectLabel,
	SelectItem,
	SelectSeparator,
	SelectScrollUpButton,
	SelectScrollDownButton,
};
