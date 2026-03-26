/**
 * ComparisonBarChart — Animated horizontal bar chart for market comparison.
 *
 * Shows property value vs. city average vs. county average.
 * Uses CSS transitions with staggered entry animation.
 */

import { __ } from '@wordpress/i18n';
import { motion } from 'framer-motion';
import { resaColors, formatChartValue } from '@frontend/lib/chart-theme';

export interface ComparisonBarChartProps {
	/** Label for the property bar */
	propertyLabel?: string;
	/** Property value (€/m²) */
	propertyValue: number;
	/** City average (€/m²) */
	cityAverage: number;
	/** City name for label */
	cityName?: string;
	/** County average (€/m²) */
	countyAverage: number;
	/** Unit suffix for values */
	unit?: string;
	/** Chart height in pixels (unused, kept for API compat) */
	height?: number;
}

interface BarEntry {
	label: string;
	value: number;
	color: string;
}

const barVariants = {
	hidden: { width: 0, opacity: 0 },
	visible: (widthPercent: number) => ({
		width: `${widthPercent}%`,
		opacity: 1,
		transition: {
			width: { duration: 0.6, ease: 'easeOut' as const },
			opacity: { duration: 0.3 },
		},
	}),
};

const containerVariants = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.15,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, x: -8 },
	visible: {
		opacity: 1,
		x: 0,
		transition: { duration: 0.3 },
	},
};

export function ComparisonBarChart({
	propertyLabel = __('Ihr Objekt', 'resa'),
	propertyValue,
	cityAverage,
	cityName,
	countyAverage,
	unit = '€/m²',
}: ComparisonBarChartProps) {
	// Build data array with only non-zero values.
	const bars: BarEntry[] = [];

	if (propertyValue > 0) {
		bars.push({ label: propertyLabel, value: propertyValue, color: resaColors.comparison[0] });
	}
	if (cityAverage > 0) {
		bars.push({
			label: cityName || __('Stadt', 'resa'),
			value: cityAverage,
			color: resaColors.comparison[1],
		});
	}
	if (countyAverage > 0) {
		bars.push({
			label: __('Landkreis', 'resa'),
			value: countyAverage,
			color: resaColors.comparison[2],
		});
	}

	// Need at least 2 bars for meaningful comparison.
	if (bars.length < 2) {
		return null;
	}

	const maxValue = Math.max(...bars.map((b) => b.value));

	// Calculate difference to first bar (property) for context
	const propertyVal = bars[0]?.value ?? 0;

	return (
		<motion.div
			role="img"
			aria-label={__('Marktvergleich Balkendiagramm', 'resa')}
			className="resa-space-y-3"
			variants={containerVariants}
			initial="hidden"
			animate="visible"
		>
			{bars.map((bar, index) => {
				const widthPercent = maxValue > 0 ? (bar.value / maxValue) * 100 : 0;
				const isProperty = index === 0;
				const diffPercent =
					!isProperty && propertyVal > 0
						? Math.round(((bar.value - propertyVal) / propertyVal) * 100)
						: null;

				return (
					<motion.div key={bar.label} variants={itemVariants}>
						<div className="resa-flex resa-justify-between resa-items-baseline resa-mb-1">
							<span className="resa-text-xs resa-text-muted-foreground resa-truncate resa-mr-2">
								{bar.label}
							</span>
							<span className="resa-flex resa-items-baseline resa-gap-2">
								{diffPercent !== null && (
									<span
										className={`resa-text-[10px] resa-font-medium ${
											diffPercent > 0
												? 'resa-text-red-500'
												: diffPercent < 0
													? 'resa-text-green-600'
													: 'resa-text-muted-foreground'
										}`}
									>
										{diffPercent > 0 ? '+' : ''}
										{diffPercent}%
									</span>
								)}
								<span className="resa-text-xs resa-font-semibold resa-text-foreground resa-whitespace-nowrap">
									{formatChartValue(bar.value, 2, ` ${unit}`)}
								</span>
							</span>
						</div>
						<div className="resa-h-3 resa-w-full resa-rounded-full resa-bg-muted/40 resa-overflow-hidden">
							<motion.div
								className="resa-h-3 resa-rounded-full"
								style={{ backgroundColor: bar.color }}
								variants={barVariants}
								custom={widthPercent}
							/>
						</div>
					</motion.div>
				);
			})}
		</motion.div>
	);
}
