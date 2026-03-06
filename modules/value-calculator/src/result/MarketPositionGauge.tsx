/**
 * Market position gauge — semi-circle radial indicator.
 *
 * Uses a simple SVG arc instead of Nivo to keep the bundle small.
 * Shows percentile (0-100) with color-coded indicator.
 */

interface MarketPositionGaugeProps {
	percentile: number;
	label: string;
}

function getColor(percentile: number): string {
	if (percentile <= 20) return '#64748b'; // Slate
	if (percentile <= 35) return '#06b6d4'; // Cyan
	if (percentile <= 50) return '#3b82f6'; // Blue
	if (percentile <= 65) return '#22c55e'; // Green
	if (percentile <= 80) return '#f97316'; // Orange
	return '#ef4444'; // Red
}

export function MarketPositionGauge({ percentile, label }: MarketPositionGaugeProps) {
	const color = getColor(percentile);
	const angle = (percentile / 100) * 180;
	const radians = (angle * Math.PI) / 180;

	// SVG arc for the filled portion (180° semicircle).
	const radius = 80;
	const cx = 100;
	const cy = 100;

	// Calculate needle endpoint.
	const needleAngle = Math.PI - radians; // Start from left (180°) to right (0°).
	const needleX = cx + radius * 0.85 * Math.cos(needleAngle);
	const needleY = cy - radius * 0.85 * Math.sin(needleAngle);

	return (
		<div className="resa-flex resa-flex-col resa-items-center">
			<svg viewBox="0 0 200 120" className="resa-w-48 resa-h-auto">
				{/* Background arc */}
				<path
					d="M 20 100 A 80 80 0 0 1 180 100"
					fill="none"
					stroke="hsl(var(--resa-muted))"
					strokeWidth="12"
					strokeLinecap="round"
				/>

				{/* Colored arc */}
				{percentile > 0 && (
					<path
						d={describeArc(cx, cy, radius, 180, 180 - angle)}
						fill="none"
						stroke={color}
						strokeWidth="12"
						strokeLinecap="round"
					/>
				)}

				{/* Needle */}
				<line
					x1={cx}
					y1={cy}
					x2={needleX}
					y2={needleY}
					stroke="hsl(var(--resa-foreground))"
					strokeWidth="2"
					strokeLinecap="round"
				/>

				{/* Center dot */}
				<circle cx={cx} cy={cy} r="4" fill="hsl(var(--resa-foreground))" />

				{/* Percentile text */}
				<text
					x={cx}
					y={cy - 20}
					textAnchor="middle"
					className="resa-text-2xl resa-font-bold"
					fill="hsl(var(--resa-foreground))"
					fontSize="24"
					fontWeight="bold"
				>
					{percentile}%
				</text>
			</svg>

			<span className="resa-text-sm resa-font-medium resa-text-muted-foreground -resa-mt-2">
				{label}
			</span>
		</div>
	);
}

/**
 * Generate an SVG arc path.
 */
function describeArc(
	cx: number,
	cy: number,
	radius: number,
	startAngle: number,
	endAngle: number,
): string {
	const start = polarToCartesian(cx, cy, radius, endAngle);
	const end = polarToCartesian(cx, cy, radius, startAngle);
	const largeArcFlag = startAngle - endAngle <= 180 ? '0' : '1';

	return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(
	cx: number,
	cy: number,
	radius: number,
	angleDegrees: number,
): { x: number; y: number } {
	const angleRadians = ((angleDegrees - 0) * Math.PI) / 180;
	return {
		x: cx + radius * Math.cos(angleRadians),
		y: cy - radius * Math.sin(angleRadians),
	};
}
