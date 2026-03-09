/* eslint-disable react/prop-types */
import * as React from 'react';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { DayButton, DayPicker, getDefaultClassNames } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';

// CSS for range highlighting + WP-Admin table override
const rangeStyles = `
  [data-slot="calendar"] table,
  [data-slot="calendar"] thead,
  [data-slot="calendar"] tbody {
    display: block !important;
    width: 100% !important;
    border: none !important;
  }
  [data-slot="calendar"] tr {
    display: flex !important;
    width: 100% !important;
  }
  [data-slot="calendar"] th,
  [data-slot="calendar"] td {
    display: block !important;
    flex: 1 1 0% !important;
    padding: 0 !important;
    border: none !important;
    background: transparent !important;
    text-align: center !important;
  }
  .rdp-range_start,
  .rdp-range_end {
    position: relative;
  }
  .rdp-range_start::before,
  .rdp-range_end::before,
  .rdp-range_middle::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    background-color: hsl(210 40% 96.1%);
    z-index: 0;
  }
  .rdp-range_start::before {
    left: 50%;
    right: 0;
  }
  .rdp-range_end::before {
    left: 0;
    right: 50%;
  }
  .rdp-range_middle::before {
    left: 0;
    right: 0;
  }
  .rdp-range_start.rdp-range_end::before {
    display: none;
  }
  .rdp-range_start > button,
  .rdp-range_end > button,
  .rdp-range_middle > button {
    position: relative;
    z-index: 1;
  }
`;

function Calendar({
	className,
	classNames,
	showOutsideDays = true,
	captionLayout = 'label',
	buttonVariant = 'ghost',
	formatters,
	components,
	...props
}: React.ComponentProps<typeof DayPicker> & {
	buttonVariant?: React.ComponentProps<typeof Button>['variant'];
}) {
	const defaultClassNames = getDefaultClassNames();

	return (
		<>
			<style>{rangeStyles}</style>
			<DayPicker
				showOutsideDays={showOutsideDays}
				className={cn(
					'resa-bg-background resa-group/calendar resa-p-3 resa-[--cell-size:2rem] [[data-slot=card-content]_&]:resa-bg-transparent [[data-slot=popover-content]_&]:resa-bg-transparent',
					String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
					String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
					className,
				)}
				captionLayout={captionLayout}
				formatters={{
					formatMonthDropdown: (date) =>
						date.toLocaleString('default', { month: 'short' }),
					...formatters,
				}}
				classNames={{
					root: cn('resa-w-full', defaultClassNames.root),
					months: cn(
						'resa-relative resa-flex resa-flex-col resa-gap-4 md:resa-flex-row',
						defaultClassNames.months,
					),
					month: cn(
						'resa-flex resa-flex-1 resa-min-w-0 resa-flex-col resa-gap-4',
						defaultClassNames.month,
					),
					nav: cn(
						'resa-absolute resa-inset-x-0 resa-top-0 resa-flex resa-w-full resa-items-center resa-justify-between resa-gap-1',
						defaultClassNames.nav,
					),
					button_previous: cn(
						buttonVariants({ variant: buttonVariant }),
						'resa-h-[--cell-size] resa-w-[--cell-size] resa-select-none resa-p-0 aria-disabled:resa-opacity-50',
						defaultClassNames.button_previous,
					),
					button_next: cn(
						buttonVariants({ variant: buttonVariant }),
						'resa-h-[--cell-size] resa-w-[--cell-size] resa-select-none resa-p-0 aria-disabled:resa-opacity-50',
						defaultClassNames.button_next,
					),
					month_caption: cn(
						'resa-flex resa-h-[--cell-size] resa-w-full resa-items-center resa-justify-center resa-px-[--cell-size]',
						defaultClassNames.month_caption,
					),
					dropdowns: cn(
						'resa-flex resa-h-[--cell-size] resa-w-full resa-items-center resa-justify-center resa-gap-1.5 resa-text-sm resa-font-medium',
						defaultClassNames.dropdowns,
					),
					dropdown_root: cn(
						'has-focus:resa-border-ring resa-border-input resa-shadow-xs has-focus:resa-ring-ring/50 has-focus:resa-ring-[3px] resa-relative resa-rounded-md resa-border',
						defaultClassNames.dropdown_root,
					),
					dropdown: cn(
						'resa-bg-popover resa-absolute resa-inset-0 resa-opacity-0',
						defaultClassNames.dropdown,
					),
					caption_label: cn(
						'resa-select-none resa-font-medium',
						captionLayout === 'label'
							? 'resa-text-sm'
							: '[&>svg]:resa-text-muted-foreground resa-flex resa-h-8 resa-items-center resa-gap-1 resa-rounded-md resa-pl-2 resa-pr-1 resa-text-sm [&>svg]:resa-size-3.5',
						defaultClassNames.caption_label,
					),
					table: 'resa-w-full resa-border-collapse',
					weekdays: cn('resa-flex', defaultClassNames.weekdays),
					weekday: cn(
						'resa-text-muted-foreground resa-flex-1 resa-select-none resa-rounded-md resa-text-[0.8rem] resa-font-normal',
						defaultClassNames.weekday,
					),
					week: cn('resa-mt-2 resa-flex resa-w-full', defaultClassNames.week),
					week_number_header: cn(
						'resa-w-[--cell-size] resa-select-none',
						defaultClassNames.week_number_header,
					),
					week_number: cn(
						'resa-text-muted-foreground resa-select-none resa-text-[0.8rem]',
						defaultClassNames.week_number,
					),
					day: cn(
						'resa-group/day resa-relative resa-flex-1 resa-aspect-square resa-h-full resa-w-full resa-select-none resa-p-0 resa-text-center',
						defaultClassNames.day,
					),
					range_start: 'rdp-range_start',
					range_middle: 'rdp-range_middle',
					range_end: 'rdp-range_end',
					today: cn(
						'resa-bg-accent resa-text-accent-foreground resa-rounded-md data-[selected=true]:resa-rounded-none',
						defaultClassNames.today,
					),
					outside: cn(
						'resa-text-muted-foreground aria-selected:resa-text-muted-foreground',
						defaultClassNames.outside,
					),
					disabled: cn(
						'resa-text-muted-foreground resa-opacity-50',
						defaultClassNames.disabled,
					),
					hidden: cn('resa-invisible', defaultClassNames.hidden),
					...classNames,
				}}
				components={{
					Root: ({ className, rootRef, ...props }) => {
						return (
							<div
								data-slot="calendar"
								ref={rootRef}
								className={cn(className)}
								{...props}
							/>
						);
					},
					Chevron: ({ className, orientation, ...props }) => {
						if (orientation === 'left') {
							return (
								<ChevronLeftIcon
									className={cn('resa-size-4', className)}
									{...props}
								/>
							);
						}

						if (orientation === 'right') {
							return (
								<ChevronRightIcon
									className={cn('resa-size-4', className)}
									{...props}
								/>
							);
						}

						return (
							<ChevronDownIcon className={cn('resa-size-4', className)} {...props} />
						);
					},
					DayButton: CalendarDayButton,
					WeekNumber: ({ children, ...props }) => {
						return (
							<td {...props}>
								<div className="resa-flex resa-size-[--cell-size] resa-items-center resa-justify-center resa-text-center">
									{children}
								</div>
							</td>
						);
					},
					...components,
				}}
				{...props}
			/>
		</>
	);
}

function CalendarDayButton({
	className,
	day,
	modifiers,
	...props
}: React.ComponentProps<typeof DayButton>) {
	const defaultClassNames = getDefaultClassNames();

	const ref = React.useRef<HTMLButtonElement>(null);
	React.useEffect(() => {
		if (modifiers.focused) ref.current?.focus();
	}, [modifiers.focused]);

	// Compute styles for range selection
	const isRangeStart = modifiers.range_start;
	const isRangeEnd = modifiers.range_end;
	const isRangeMiddle = modifiers.range_middle;
	const isSelectedSingle = modifiers.selected && !isRangeStart && !isRangeEnd && !isRangeMiddle;

	const rangeStyle: React.CSSProperties = {};
	if (isRangeStart || isRangeEnd || isSelectedSingle) {
		rangeStyle.backgroundColor = '#a9e43f';
		rangeStyle.color = '#1e303a';
		rangeStyle.borderRadius = '6px';
	} else if (isRangeMiddle) {
		rangeStyle.backgroundColor = 'hsl(210 40% 96.1%)';
		rangeStyle.color = '#1e303a';
		rangeStyle.borderRadius = '0';
	}

	return (
		<Button
			ref={ref}
			variant="ghost"
			size="icon"
			data-day={day.date.toLocaleDateString()}
			data-selected-single={isSelectedSingle}
			data-range-start={isRangeStart}
			data-range-end={isRangeEnd}
			data-range-middle={isRangeMiddle}
			style={rangeStyle}
			className={cn(
				'resa-flex resa-aspect-square resa-h-auto resa-w-full resa-min-w-[--cell-size] resa-flex-col resa-gap-1 resa-font-normal resa-leading-none group-data-[focused=true]/day:resa-relative group-data-[focused=true]/day:resa-z-10 group-data-[focused=true]/day:resa-ring-[3px] [&>span]:resa-text-xs [&>span]:resa-opacity-70',
				defaultClassNames.day,
				className,
			)}
			{...props}
		/>
	);
}

export { Calendar, CalendarDayButton };
