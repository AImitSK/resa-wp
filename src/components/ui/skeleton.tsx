import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn('resa-animate-pulse resa-rounded-md resa-bg-primary/10', className)}
			{...props}
		/>
	);
}

export { Skeleton };
