/**
 * SliderInput — Slider with floating tooltip, min/max labels, and inline text input.
 *
 * Used for all numeric value inputs in wizard steps (Wohnfläche, Grundstück, Baujahr, Zimmer).
 * Desktop: slider + input side by side. Mobile: stacked.
 * Default value is shown immediately (tooltip + input).
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

export interface SliderInputProps {
	/** Current value. */
	value: number | undefined;
	/** Called when the value changes. */
	onChange: (value: number | undefined) => void;
	/** Slider minimum. */
	min: number;
	/** Slider maximum. */
	max: number;
	/** Slider step size. Default: 1. */
	step?: number;
	/** Unit shown in tooltip and input (e.g. "m²"). */
	unit?: string;
	/** Label for min end. Defaults to "< {min} {unit}". */
	minLabel?: string;
	/** Label for max end. Defaults to "> {max} {unit}". */
	maxLabel?: string;
	/** Default value when slider first appears. */
	defaultValue?: number;
	/** Error message. */
	error?: string;
	/** Input field ID for accessibility. */
	id?: string;
	/** Optional subtitle shown below the tooltip (e.g. age class). */
	subtitle?: string;
	/** Custom value formatter for tooltip/labels. Overrides default locale formatting. */
	formatValue?: (value: number) => string;
}

export function SliderInput({
	value,
	onChange,
	min,
	max,
	step = 1,
	unit,
	minLabel,
	maxLabel,
	defaultValue,
	error,
	id,
	subtitle,
	formatValue,
}: SliderInputProps) {
	const resolvedDefault = defaultValue ?? Math.round((min + max) / 2);
	const sliderValue = value ?? resolvedDefault;
	const trackRef = useRef<HTMLDivElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);
	const [tooltipLeft, setTooltipLeft] = useState<number | null>(null);

	// Write default into wizard data on mount so validation passes.
	useEffect(() => {
		if (value === undefined) {
			onChange(resolvedDefault);
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const computeTooltipLeft = useCallback((): number | null => {
		if (!trackRef.current) return null;
		const pct = Math.max(0, Math.min(100, ((sliderValue - min) / (max - min)) * 100));
		const trackWidth = trackRef.current.offsetWidth;
		let left = (trackWidth * pct) / 100;

		// Clamp so tooltip doesn't overflow left/right edge.
		if (tooltipRef.current) {
			const tooltipWidth = tooltipRef.current.offsetWidth;
			const halfTooltip = tooltipWidth / 2;
			left = Math.max(halfTooltip, Math.min(left, trackWidth - halfTooltip));
		}

		return left;
	}, [sliderValue, min, max]);

	useEffect(() => {
		// Compute after mount and on every value change via rAF to avoid synchronous setState.
		const id = requestAnimationFrame(() => {
			setTooltipLeft(computeTooltipLeft());
		});
		return () => cancelAnimationFrame(id);
	}, [computeTooltipLeft]);

	useEffect(() => {
		// Recompute on resize.
		const onResize = () => setTooltipLeft(computeTooltipLeft());
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, [computeTooltipLeft]);

	const handleSliderChange = (val: number) => {
		onChange(val);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value;
		if (raw === '') {
			onChange(undefined);
			return;
		}
		const num = Number(raw);
		if (!isNaN(num)) {
			onChange(num);
		}
	};

	const fmt = (v: number) => (formatValue ? formatValue(v) : v.toLocaleString('de-DE'));
	const displayMin = minLabel ?? `< ${fmt(min)} ${unit ?? ''}`.trim();
	const displayMax = maxLabel ?? `> ${fmt(max)} ${unit ?? ''}`.trim();
	const tooltipText = `${fmt(sliderValue)}${unit ? ` ${unit}` : ''}`;

	return (
		<div className="resa-space-y-2">
			{/* Desktop: slider + input side by side / Mobile: stacked */}
			<div className="resa-flex resa-flex-col sm:resa-flex-row sm:resa-items-end sm:resa-gap-4">
				{/* Slider with tooltip */}
				<div className="resa-relative resa-pt-10 resa-px-1 resa-flex-1 resa-min-w-0">
					{/* Floating tooltip */}
					<div
						ref={tooltipRef}
						className="resa-absolute resa-top-0 resa-pointer-events-none resa-transition-[left] resa-duration-100 resa-ease-out"
						style={{
							left: tooltipLeft ?? 0,
							opacity: tooltipLeft !== null ? 1 : 0,
						}}
					>
						<div className="resa-relative -resa-translate-x-1/2">
							<div className="resa-bg-foreground resa-text-background resa-text-sm resa-font-semibold resa-px-3 resa-py-1 resa-rounded-md resa-whitespace-nowrap">
								{tooltipText}
							</div>
							{/* Arrow */}
							<div className="resa-w-0 resa-h-0 resa-mx-auto resa-border-x-[6px] resa-border-x-transparent resa-border-t-[6px] resa-border-t-foreground" />
						</div>
					</div>

					<div ref={trackRef}>
						<Slider
							value={sliderValue}
							min={min}
							max={max}
							step={step}
							onChange={handleSliderChange}
						/>
					</div>

					{/* Min / Max labels */}
					<div className="resa-flex resa-justify-between resa-mt-1.5">
						<span className="resa-text-xs resa-text-muted-foreground">
							{displayMin}
						</span>
						<span className="resa-text-xs resa-text-muted-foreground">
							{displayMax}
						</span>
					</div>
				</div>

				{/* Alternative input — neben Slider auf Desktop, darunter auf Mobile */}
				<div className="resa-mt-3 sm:resa-mt-0 sm:resa-w-36 resa-shrink-0">
					<span className="resa-text-xs resa-text-muted-foreground sm:resa-sr-only">
						{__('Alternativ eingeben', 'resa')}
					</span>
					<div className="resa-relative resa-mt-1 sm:resa-mt-0">
						<Input
							id={id}
							type="number"
							min={min}
							max={max}
							step={step}
							value={String(sliderValue)}
							onChange={handleInputChange}
							aria-invalid={!!error}
							aria-label={__('Alternativ eingeben', 'resa')}
						/>
						{unit && (
							<span className="resa-absolute resa-right-3 resa-top-1/2 -resa-translate-y-1/2 resa-text-sm resa-text-muted-foreground">
								{unit}
							</span>
						)}
					</div>
				</div>
			</div>

			{/* Subtitle (e.g. age class) */}
			{subtitle && (
				<div className="resa-text-center resa-text-sm resa-font-medium resa-text-muted-foreground">
					{subtitle}
				</div>
			)}

			{error && (
				<p role="alert" className="resa-text-xs resa-text-destructive resa-mt-1">
					{error}
				</p>
			)}
		</div>
	);
}
