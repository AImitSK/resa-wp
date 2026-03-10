/**
 * FactorBreakdownChart — Horizontal bars showing factor impact (% deviation from neutral).
 */

interface FactorItem {
	label: string;
	impact: number; // e.g. 1.10 → +10%
}

interface FactorBreakdownChartProps {
	factors: FactorItem[];
	height?: number;
}

export function FactorBreakdownChart({ factors, height = 200 }: FactorBreakdownChartProps) {
	const maxAbsPercent = Math.max(
		...factors.map((f) => Math.abs((f.impact - 1) * 100)),
		10, // Minimum scale of 10%
	);

	return (
		<div style={{ height }} className="resa-space-y-2">
			{factors.map((factor, i) => {
				const percent = (factor.impact - 1) * 100;
				const isPositive = percent > 0.5;
				const isNegative = percent < -0.5;
				const barWidth = Math.min((Math.abs(percent) / maxAbsPercent) * 100, 100);
				const displayPercent = Math.round(percent);

				return (
					<div key={i} className="resa-flex resa-items-center resa-gap-2">
						<span className="resa-text-xs resa-text-muted-foreground resa-w-24 resa-text-right resa-shrink-0">
							{factor.label}
						</span>

						<div className="resa-flex-1 resa-flex resa-items-center resa-h-5">
							{/* Center line concept: bars grow from left */}
							<div
								className="resa-h-4 resa-rounded-sm resa-transition-all"
								style={{
									width: `${Math.max(barWidth, 2)}%`,
									backgroundColor: isPositive
										? 'hsl(var(--resa-primary))'
										: isNegative
											? 'hsl(var(--resa-destructive))'
											: 'hsl(var(--resa-muted-foreground))',
									opacity: isPositive || isNegative ? 0.8 : 0.4,
								}}
							/>
						</div>

						<span
							className="resa-text-xs resa-font-medium resa-w-12 resa-shrink-0"
							style={{
								color: isPositive
									? 'hsl(var(--resa-primary))'
									: isNegative
										? 'hsl(var(--resa-destructive))'
										: 'hsl(var(--resa-muted-foreground))',
							}}
						>
							{isPositive ? '+' : ''}
							{displayPercent}%
						</span>
					</div>
				);
			})}
		</div>
	);
}
