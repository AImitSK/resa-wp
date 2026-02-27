import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';

import { cn } from '@/lib/utils';

const Switch = React.forwardRef<
	React.ElementRef<typeof SwitchPrimitives.Root>,
	React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, checked, ...props }, ref) => (
	<SwitchPrimitives.Root
		className={cn(
			'resa-peer resa-inline-flex resa-h-5 resa-w-9 resa-shrink-0 resa-cursor-pointer resa-items-center resa-rounded-full resa-border-2 resa-border-transparent resa-shadow-sm resa-transition-colors focus-visible:resa-outline-none disabled:resa-cursor-not-allowed disabled:resa-opacity-50',
			className,
		)}
		checked={checked}
		style={{
			backgroundColor: checked ? '#a9e43f' : '#1e303a',
		}}
		{...props}
		ref={ref}
	>
		<SwitchPrimitives.Thumb
			style={{
				display: 'block',
				width: '16px',
				height: '16px',
				borderRadius: '9999px',
				backgroundColor: 'white',
				boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
				transition: 'transform 100ms',
				transform: checked ? 'translateX(16px)' : 'translateX(0)',
			}}
		/>
	</SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
