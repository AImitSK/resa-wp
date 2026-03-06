/**
 * RESA Chart Theme — Nivo theming configuration.
 *
 * Provides consistent styling for all Nivo charts across the plugin.
 * Used in both frontend widget (Result screens) and admin (Analytics).
 */

/**
 * RESA Chart Theme for Nivo.
 *
 * Matches the overall RESA design system:
 * - Slate color palette for text/borders
 * - Clean, minimal axes
 * - Subtle grid lines
 * - Modern tooltip styling
 */
export const resaChartTheme = {
	// Typography
	fontFamily: 'system-ui, -apple-system, sans-serif',
	fontSize: 13,

	// Text defaults
	text: {
		fill: '#64748b',
		fontSize: 12,
	},

	// Axis styling
	axis: {
		domain: {
			line: {
				stroke: '#e2e8f0',
				strokeWidth: 1,
			},
		},
		ticks: {
			text: {
				fill: '#64748b',
				fontSize: 11,
			},
			line: {
				stroke: '#e2e8f0',
				strokeWidth: 1,
			},
		},
		legend: {
			text: {
				fill: '#334155',
				fontSize: 12,
				fontWeight: 600,
			},
		},
	},

	// Grid lines
	grid: {
		line: {
			stroke: '#f1f5f9',
			strokeWidth: 1,
		},
	},

	// Labels on chart elements
	labels: {
		text: {
			fill: '#1e293b',
			fontSize: 12,
			fontWeight: 500,
		},
	},

	// Legend styling
	legends: {
		text: {
			fill: '#475569',
			fontSize: 12,
		},
	},

	// Tooltip container
	tooltip: {
		container: {
			background: '#ffffff',
			borderRadius: '8px',
			boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
			padding: '10px 14px',
			fontSize: '13px',
			color: '#1e293b',
		},
	},

	// Annotations
	annotations: {
		text: {
			fill: '#64748b',
			fontSize: 12,
		},
		link: {
			stroke: '#94a3b8',
			strokeWidth: 1,
		},
		outline: {
			stroke: '#e2e8f0',
			strokeWidth: 1,
		},
		symbol: {
			fill: '#3b82f6',
		},
	},
};

/**
 * RESA Color Palettes for charts.
 *
 * Each palette is designed for specific use cases:
 * - primary: Single-series charts, emphasis
 * - comparison: Multi-series comparison (your value vs. averages)
 * - gradient: Sequential data, trends
 * - factors: Categorical data with distinct meanings
 * - costs: Cost breakdowns (similar hues)
 * - energy: Efficiency ratings (green → red)
 * - positive/negative: Sentiment or change direction
 */
export const resaColors = {
	/** Primary blue shades — single series, emphasis */
	primary: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'] as const,

	/** Comparison: Blue (yours) → Gray (averages) */
	comparison: ['#3b82f6', '#94a3b8', '#cbd5e1'] as const,

	/** Gradient: Blue → Purple → Pink */
	gradient: ['#3b82f6', '#8b5cf6', '#ec4899'] as const,

	/** Factors: Distinct categories (Lage, Zustand, etc.) */
	factors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'] as const,

	/** Costs: Blue → Purple shades (same family) */
	costs: ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'] as const,

	/** Energy efficiency: Green (A) → Red (H) */
	energy: ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'] as const,

	/** Positive/Negative: Green = good, Red = bad */
	positive: '#10b981',
	negative: '#ef4444',
	neutral: '#64748b',
} as const;

/**
 * Get color for a value relative to average.
 *
 * @param value - The value to evaluate
 * @param average - The average to compare against
 * @param higherIsBetter - Whether higher values are positive (default: true)
 * @returns Color string
 */
export function getComparisonColor(value: number, average: number, higherIsBetter = true): string {
	const ratio = value / average;
	const threshold = 0.02; // 2% tolerance

	if (ratio > 1 + threshold) {
		return higherIsBetter ? resaColors.positive : resaColors.negative;
	}
	if (ratio < 1 - threshold) {
		return higherIsBetter ? resaColors.negative : resaColors.positive;
	}
	return resaColors.neutral;
}

/**
 * Format number for chart labels in DACH style.
 *
 * @param value - Number to format
 * @param decimals - Decimal places (default: 0)
 * @param suffix - Suffix to append (e.g., ' €/m²')
 * @returns Formatted string
 */
export function formatChartValue(value: number, decimals = 0, suffix = ''): string {
	return (
		value.toLocaleString('de-DE', {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		}) + suffix
	);
}
