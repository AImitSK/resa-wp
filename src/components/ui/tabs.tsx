import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.List>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.List
		ref={ref}
		className={cn(
			'resa-inline-flex resa-h-9 resa-items-center resa-justify-center resa-rounded-lg resa-bg-muted resa-p-1 resa-text-muted-foreground',
			className,
		)}
		{...props}
	/>
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Trigger
		ref={ref}
		className={cn(
			'resa-inline-flex resa-items-center resa-justify-center resa-whitespace-nowrap resa-rounded-md resa-px-3 resa-py-1 resa-text-sm resa-font-medium resa-ring-offset-background resa-transition-all focus-visible:resa-outline-none focus-visible:resa-ring-2 focus-visible:resa-ring-ring focus-visible:resa-ring-offset-2 disabled:resa-pointer-events-none disabled:resa-opacity-50',
			className,
		)}
		{...props}
	/>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Content
		ref={ref}
		className={cn(
			'resa-mt-2 resa-ring-offset-background focus-visible:resa-outline-none focus-visible:resa-ring-2 focus-visible:resa-ring-ring focus-visible:resa-ring-offset-2',
			className,
		)}
		{...props}
	/>
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
