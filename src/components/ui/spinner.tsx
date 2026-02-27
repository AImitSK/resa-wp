import { Loader2Icon } from 'lucide-react';

import { cn } from '@/lib/utils';

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
	return (
		<Loader2Icon
			role="status"
			aria-label="Loading"
			className={cn('resa-size-4 resa-animate-spin', className)}
			{...props}
		/>
	);
}

export { Spinner };
