/* eslint-disable react/prop-types */
import * as React from 'react';

import { cn } from '@/lib/utils';

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
	({ className, style, ...props }, ref) => (
		<div className="resa-relative resa-w-full resa-overflow-auto">
			<table
				ref={ref}
				className={cn('resa-w-full resa-caption-bottom resa-text-sm', className)}
				style={{ borderCollapse: 'collapse', ...style }}
				{...props}
			/>
		</div>
	),
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<thead ref={ref} className={cn('[&_tr]:resa-border-b', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<tbody ref={ref} className={cn('[&_tr:last-child]:resa-border-0', className)} {...props} />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<tfoot
		ref={ref}
		className={cn(
			'resa-border-t resa-bg-muted/50 resa-font-medium [&>tr]:last:resa-border-b-0',
			className,
		)}
		{...props}
	/>
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
	({ className, style, ...props }, ref) => (
		<tr
			ref={ref}
			className={cn(
				'resa-border-b resa-transition-colors hover:resa-bg-muted/50 data-[state=selected]:resa-bg-muted',
				className,
			)}
			style={{ borderColor: 'hsl(214.3 31.8% 91.4%)', ...style }}
			{...props}
		/>
	),
);
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
	HTMLTableCellElement,
	React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, style, ...props }, ref) => (
	<th
		ref={ref}
		className={cn(
			'resa-h-10 resa-px-2 resa-text-left resa-align-middle resa-font-medium resa-text-muted-foreground [&:has([role=checkbox])]:resa-pr-0 [&>[role=checkbox]]:resa-translate-y-[2px]',
			className,
		)}
		style={{ borderBottom: '1px solid hsl(214.3 31.8% 91.4%)', ...style }}
		{...props}
	/>
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
	HTMLTableCellElement,
	React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, style, ...props }, ref) => (
	<td
		ref={ref}
		className={cn(
			'resa-p-2 resa-align-middle [&:has([role=checkbox])]:resa-pr-0 [&>[role=checkbox]]:resa-translate-y-[2px]',
			className,
		)}
		style={{ borderBottom: '1px solid hsl(214.3 31.8% 91.4%)', ...style }}
		{...props}
	/>
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
	HTMLTableCaptionElement,
	React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
	<caption
		ref={ref}
		className={cn('resa-mt-4 resa-text-sm resa-text-muted-foreground', className)}
		{...props}
	/>
));
TableCaption.displayName = 'TableCaption';

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
