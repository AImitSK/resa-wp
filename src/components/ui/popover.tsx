import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn, getPortalContainer } from '@/lib/utils';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = React.forwardRef<
	React.ElementRef<typeof PopoverPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
	<PopoverPrimitive.Portal container={getPortalContainer()}>
		<PopoverPrimitive.Content
			ref={ref}
			align={align}
			sideOffset={sideOffset}
			className={cn(
				'resa-z-50 resa-w-72 resa-rounded-md resa-border resa-bg-popover resa-p-4 resa-text-popover-foreground resa-shadow-md resa-outline-none data-[state=open]:resa-animate-in data-[state=closed]:resa-animate-out data-[state=closed]:resa-fade-out-0 data-[state=open]:resa-fade-in-0 data-[state=closed]:resa-zoom-out-95 data-[state=open]:resa-zoom-in-95 data-[side=bottom]:resa-slide-in-from-top-2 data-[side=left]:resa-slide-in-from-right-2 data-[side=right]:resa-slide-in-from-left-2 data-[side=top]:resa-slide-in-from-bottom-2 resa-origin-[--radix-popover-content-transform-origin]',
				className,
			)}
			{...props}
		/>
	</PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
