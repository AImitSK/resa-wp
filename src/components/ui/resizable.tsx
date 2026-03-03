'use client';

import { GripVertical } from 'lucide-react';
import {
	Group,
	Panel,
	Separator,
	type GroupProps,
	type PanelProps,
	type SeparatorProps,
} from 'react-resizable-panels';

import { cn } from '@/lib/utils';

const ResizablePanelGroup = ({ className, ...props }: GroupProps) => (
	<Group className={cn('resa-flex resa-h-full resa-w-full', className)} {...props} />
);

const ResizablePanel = (props: PanelProps) => <Panel {...props} />;

const ResizableHandle = ({
	withHandle,
	className,
	...props
}: SeparatorProps & {
	withHandle?: boolean;
}) => (
	<Separator
		className={cn(
			'resa-relative resa-flex resa-w-px resa-items-center resa-justify-center resa-bg-border after:resa-absolute after:resa-inset-y-0 after:resa-left-1/2 after:resa-w-1 after:-resa-translate-x-1/2 focus-visible:resa-outline-none focus-visible:resa-ring-1 focus-visible:resa-ring-ring focus-visible:resa-ring-offset-1',
			className,
		)}
		{...props}
	>
		{withHandle && (
			<div className="resa-z-10 resa-flex resa-h-4 resa-w-3 resa-items-center resa-justify-center resa-rounded-sm resa-border resa-bg-border">
				<GripVertical className="resa-h-2.5 resa-w-2.5" />
			</div>
		)}
	</Separator>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
