import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
	React.ElementRef<typeof CheckboxPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
	<CheckboxPrimitive.Root
		ref={ref}
		className={cn(
			'resa-grid resa-place-content-center resa-peer resa-h-4 resa-w-4 resa-shrink-0 resa-rounded-sm resa-border resa-border-primary resa-shadow focus-visible:resa-outline-none focus-visible:resa-ring-1 focus-visible:resa-ring-ring disabled:resa-cursor-not-allowed disabled:resa-opacity-50 data-[state=checked]:resa-bg-primary data-[state=checked]:resa-text-primary-foreground',
			className,
		)}
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
