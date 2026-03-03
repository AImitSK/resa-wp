import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps {
	value: number;
	min?: number;
	max?: number;
	step?: number;
	onChange: (value: number) => void;
	className?: string;
	disabled?: boolean;
}

/**
 * Simple range slider without Radix dependency.
 * Uses native <input type="range"> with custom styling.
 */
export function Slider({
	value,
	min = 0,
	max = 100,
	step = 1,
	onChange,
	className,
	disabled = false,
}: SliderProps) {
	const percentage = ((value - min) / (max - min)) * 100;

	return (
		<div className={cn('resa-relative resa-flex resa-w-full resa-items-center', className)}>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				disabled={disabled}
				className="resa-w-full resa-h-2 resa-rounded-full resa-appearance-none resa-cursor-pointer resa-bg-secondary disabled:resa-opacity-50 disabled:resa-cursor-not-allowed [&::-webkit-slider-thumb]:resa-appearance-none [&::-webkit-slider-thumb]:resa-h-5 [&::-webkit-slider-thumb]:resa-w-5 [&::-webkit-slider-thumb]:resa-rounded-full [&::-webkit-slider-thumb]:resa-border-2 [&::-webkit-slider-thumb]:resa-border-primary [&::-webkit-slider-thumb]:resa-bg-background [&::-webkit-slider-thumb]:resa-ring-offset-background [&::-webkit-slider-thumb]:resa-transition-colors [&::-webkit-slider-thumb]:resa-shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.15)] [&::-moz-range-thumb]:resa-h-5 [&::-moz-range-thumb]:resa-w-5 [&::-moz-range-thumb]:resa-rounded-full [&::-moz-range-thumb]:resa-border-2 [&::-moz-range-thumb]:resa-border-primary [&::-moz-range-thumb]:resa-bg-background [&::-moz-range-thumb]:resa-shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.15)]"
				style={{
					background: `linear-gradient(to right, hsl(var(--resa-primary)) 0%, hsl(var(--resa-primary)) ${percentage}%, hsl(var(--resa-secondary)) ${percentage}%, hsl(var(--resa-secondary)) 100%)`,
				}}
			/>
		</div>
	);
}
