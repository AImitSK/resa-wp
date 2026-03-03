import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
	React.ElementRef<typeof CheckboxPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, style, ...props }, ref) => (
	<CheckboxPrimitive.Root
		ref={ref}
		className={cn(
			'resa-grid resa-place-content-center resa-peer resa-h-4 resa-w-4 resa-shrink-0 resa-rounded-sm resa-bg-background disabled:resa-cursor-not-allowed disabled:resa-opacity-50 data-[state=checked]:resa-bg-primary data-[state=checked]:resa-text-primary-foreground',
			className,
		)}
		style={{
			border: '1px solid hsl(214.3 31.8% 91.4%)',
			boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
			...style,
		}}
		{...props}
	>
		<CheckboxPrimitive.Indicator
			className={cn('resa-grid resa-place-content-center resa-text-current')}
		>
			<Check className="resa-h-4 resa-w-4" />
		</CheckboxPrimitive.Indicator>
	</CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
