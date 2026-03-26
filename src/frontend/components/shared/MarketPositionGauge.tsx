/**
 * Market position gauge — horizontal segmented progress indicator.
 *
 * Modern alternative to the semicircle gauge. Shows percentile (0-100)
 * with color-coded segments and animated marker.
 */

import { __ } from '@wordpress/i18n';
import { motion } from 'framer-motion';

interface MarketPositionGaugeProps {
	percentile: number;
	label: string;
}

/** Segment definitions with color and label */
const segments = [
	{ min: 0, max: 20, color: 'hsl(var(--resa-muted-foreground))', label: __('Niedrig', 'resa') },
	{ min: 20, max: 40, color: '#06b6d4', label: __('Unterdurchschnittlich', 'resa') },
	{ min: 40, max: 60, color: '#3b82f6', label: __('Durchschnitt', 'resa') },
	{ min: 60, max: 80, color: '#22c55e', label: __('Überdurchschnittlich', 'resa') },
	{ min: 80, max: 100, color: '#f97316', label: __('Hoch', 'resa') },
];

function getSegmentForPercentile(percentile: number) {
	return (
		segments.find((s) => percentile >= s.min && percentile < s.max) ??
		segments[segments.length - 1]
	);
}

export function MarketPositionGauge({ percentile, label }: MarketPositionGaugeProps) {
	const clampedPercentile = Math.max(0, Math.min(100, percentile));
	const activeSegment = getSegmentForPercentile(clampedPercentile);

	return (
		<div className="resa-flex resa-flex-col resa-items-center resa-gap-3">
			{/* Percentile display */}
			<div className="resa-text-center">
				<motion.span
					className="resa-text-3xl resa-font-bold"
					style={{ color: activeSegment.color }}
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
				>
					{clampedPercentile}%
				</motion.span>
			</div>

			{/* Segmented bar */}
			<div className="resa-w-full resa-max-w-xs">
				<div className="resa-relative resa-h-3 resa-flex resa-gap-0.5 resa-rounded-full resa-overflow-hidden">
					{segments.map((segment, index) => {
						const isActive = clampedPercentile >= segment.min;
						const isCurrent =
							clampedPercentile >= segment.min && clampedPercentile < segment.max;

						return (
							<motion.div
								key={index}
								className="resa-flex-1 resa-relative"
								style={{
									backgroundColor: isActive
										? segment.color
										: 'hsl(var(--resa-muted) / 0.5)',
									opacity: isActive ? 1 : 0.3,
								}}
								initial={{ scaleX: 0 }}
								animate={{ scaleX: 1 }}
								transition={{ delay: index * 0.08, duration: 0.3 }}
							>
								{/* Marker on current segment */}
								{isCurrent && (
									<motion.div
										className="resa-absolute resa-top-1/2 resa-w-1 resa-h-5 resa-bg-foreground resa-rounded-full"
										style={{
											left: `${((clampedPercentile - segment.min) / (segment.max - segment.min)) * 100}%`,
											transform: 'translate(-50%, -50%)',
										}}
										initial={{ opacity: 0, scale: 0 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ delay: 0.5, type: 'spring' }}
									/>
								)}
							</motion.div>
						);
					})}
				</div>

				{/* Labels */}
				<div className="resa-flex resa-justify-between resa-mt-1.5 resa-px-0.5">
					<span className="resa-text-[10px] resa-text-muted-foreground">0%</span>
					<span className="resa-text-[10px] resa-text-muted-foreground">50%</span>
					<span className="resa-text-[10px] resa-text-muted-foreground">100%</span>
				</div>
			</div>

			{/* Status label */}
			<motion.span
				className="resa-text-sm resa-font-medium"
				style={{ color: activeSegment.color }}
				initial={{ opacity: 0, y: 4 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3 }}
			>
				{label || activeSegment.label}
			</motion.span>
		</div>
	);
}
