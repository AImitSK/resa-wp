/**
 * ComparisonBarChart — Pure CSS horizontal bar chart for market comparison.
 *
 * Shows property value vs. city average vs. county average.
 * Uses simple CSS bars instead of Nivo to avoid SVG measurement
 * issues with the widget's CSS isolation reset.
 */

import { __ } from '@wordpress/i18n';
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

	return (
		<div
			role="img"
			aria-label={__('Marktvergleich Balkendiagramm', 'resa')}
			className="resa-space-y-3"
		>
			{bars.map((bar) => {
				const widthPercent = maxValue > 0 ? (bar.value / maxValue) * 100 : 0;

				return (
					<div key={bar.label}>
						<div className="resa-flex resa-justify-between resa-items-baseline resa-mb-1">
							<span className="resa-text-xs resa-text-muted-foreground resa-truncate resa-mr-2">
								{bar.label}
							</span>
							<span className="resa-text-xs resa-font-semibold resa-text-foreground resa-whitespace-nowrap">
								{formatChartValue(bar.value, 2, ` ${unit}`)}
							</span>
						</div>
						<div className="resa-h-3 resa-w-full resa-rounded-full resa-bg-muted/40">
							<div
								className="resa-h-3 resa-rounded-full resa-transition-all resa-duration-700 resa-ease-out"
								style={{
									width: `${widthPercent}%`,
									backgroundColor: bar.color,
								}}
							/>
						</div>
					</div>
				);
			})}
		</div>
	);
}
