/**
 * FactorBreakdownChart — Diverging horizontal bar chart.
 *
 * Bars grow from center: positive factors to the right (green),
 * negative factors to the left (red). Sorted by impact magnitude.
 */

import { motion } from 'framer-motion';

interface FactorItem {
	label: string;
	impact: number; // e.g. 1.10 → +10%, 0.95 → -5%
}

interface FactorBreakdownChartProps {
	factors: FactorItem[];
	height?: number;
}

const containerVariants = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.05,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { duration: 0.3 } },
};

export function FactorBreakdownChart({ factors }: FactorBreakdownChartProps) {
	// Convert impact to percentage and sort by absolute magnitude
	const processedFactors = factors
		.map((f) => ({
			...f,
			percent: (f.impact - 1) * 100,
		}))
		.sort((a, b) => Math.abs(b.percent) - Math.abs(a.percent));

	const maxAbsPercent = Math.max(
		...processedFactors.map((f) => Math.abs(f.percent)),
		10, // Minimum scale
	);

	return (
		<motion.div
			className="resa-space-y-2"
			variants={containerVariants}
			initial="hidden"
			animate="visible"
		>
			{processedFactors.map((factor, index) => {
				const isPositive = factor.percent > 0.5;
				const isNegative = factor.percent < -0.5;
				const isNeutral = !isPositive && !isNegative;

				// Bar width as percentage of half the container (since we have left and right sides)
				const barWidthPercent = Math.min(
					(Math.abs(factor.percent) / maxAbsPercent) * 50,
					50,
				);
				const displayPercent = Math.round(factor.percent);

				// Color based on impact direction
				const barColor = isPositive
					? 'hsl(142, 76%, 36%)' // Green
					: isNegative
						? 'hsl(0, 84%, 60%)' // Red
						: 'hsl(var(--resa-muted-foreground))';

				const textColor = isPositive
					? 'resa-text-green-600'
					: isNegative
						? 'resa-text-red-500'
						: 'resa-text-muted-foreground';

				return (
					<motion.div
						key={index}
						className="resa-flex resa-items-center resa-gap-2"
						variants={itemVariants}
					>
						{/* Label */}
						<span className="resa-text-xs resa-text-muted-foreground resa-w-20 resa-text-right resa-shrink-0">
							{factor.label}
						</span>

						{/* Diverging bar container */}
						<div className="resa-flex-1 resa-flex resa-items-center resa-h-5">
							{/* Left side (negative) */}
							<div className="resa-flex-1 resa-flex resa-justify-end">
								{isNegative && (
									<motion.div
										className="resa-h-4 resa-rounded-l-sm"
										style={{ backgroundColor: barColor }}
										initial={{ width: 0 }}
										animate={{ width: `${barWidthPercent * 2}%` }}
										transition={{
											delay: index * 0.05 + 0.2,
											duration: 0.4,
											ease: 'easeOut',
										}}
									/>
								)}
							</div>

							{/* Center line */}
							<div className="resa-w-px resa-h-5 resa-bg-border resa-shrink-0" />

							{/* Right side (positive) */}
							<div className="resa-flex-1 resa-flex resa-justify-start">
								{(isPositive || isNeutral) && (
									<motion.div
										className="resa-h-4 resa-rounded-r-sm"
										style={{
											backgroundColor: barColor,
											opacity: isNeutral ? 0.4 : 1,
										}}
										initial={{ width: 0 }}
										animate={{
											width: isNeutral ? '4px' : `${barWidthPercent * 2}%`,
										}}
										transition={{
											delay: index * 0.05 + 0.2,
											duration: 0.4,
											ease: 'easeOut',
										}}
									/>
								)}
							</div>
						</div>

						{/* Percentage value */}
						<span
							className={`resa-text-xs resa-font-medium resa-w-10 resa-shrink-0 ${textColor}`}
						>
							{isPositive ? '+' : ''}
							{displayPercent}%
						</span>
					</motion.div>
				);
			})}

			{/* Legend */}
			<div className="resa-flex resa-justify-center resa-gap-4 resa-mt-3 resa-pt-2 resa-border-t resa-border-border">
				<span className="resa-flex resa-items-center resa-gap-1.5 resa-text-[10px] resa-text-muted-foreground">
					<span className="resa-w-2 resa-h-2 resa-rounded-full resa-bg-red-500" />
					Mindert Wert
				</span>
				<span className="resa-flex resa-items-center resa-gap-1.5 resa-text-[10px] resa-text-muted-foreground">
					<span className="resa-w-2 resa-h-2 resa-rounded-full resa-bg-green-600" />
					Steigert Wert
				</span>
			</div>
		</motion.div>
	);
}
