/**
 * ComparisonBarChart — Horizontal bar chart for market comparison.
 *
 * Shows property value vs. city average vs. county average.
 * Used in RentResult and ValueResult components.
 *
 * Features:
 * - Responsive design
 * - DACH number formatting
 * - Animated on mount (via Framer Motion container)
 * - Accessible with ARIA labels
 */

import { __ } from '@wordpress/i18n';
import { ResponsiveBar } from '@nivo/bar';
import { resaChartTheme, resaColors, formatChartValue } from '@frontend/lib/chart-theme';

export interface ComparisonBarChartProps {
	/** Label for the property bar (e.g., "Ihr Objekt") */
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
	/** Chart height in pixels */
	height?: number;
}

interface ChartDatum {
	id: string;
	label: string;
	value: number;
	color: string;
	[key: string]: string | number;
}

export function ComparisonBarChart({
	propertyLabel = __('Ihr Objekt', 'resa'),
	propertyValue,
	cityAverage,
	cityName,
	countyAverage,
	unit = '€/m²',
	height = 160,
}: ComparisonBarChartProps) {
	// Don't render if no valid data
	if (propertyValue <= 0 && cityAverage <= 0 && countyAverage <= 0) {
		return null;
	}

	// Build data array with only non-zero values
	const data: ChartDatum[] = [];

	if (propertyValue > 0) {
		data.push({
			id: 'property',
			label: propertyLabel,
			value: propertyValue,
			color: resaColors.comparison[0], // Blue - primary
		});
	}

	if (cityAverage > 0) {
		data.push({
			id: 'city',
			label: cityName || __('Stadt', 'resa'),
			value: cityAverage,
			color: resaColors.comparison[1], // Gray - secondary
		});
	}

	if (countyAverage > 0) {
		data.push({
			id: 'county',
			label: __('Landkreis', 'resa'),
			value: countyAverage,
			color: resaColors.comparison[2], // Light gray - tertiary
		});
	}

	// Need at least 2 bars for meaningful comparison
	if (data.length < 2) {
		return null;
	}

	// Calculate max value for axis domain (add 15% padding)
	const maxValue = Math.max(...data.map((d) => d.value)) * 1.15;

	return (
		<div
			role="img"
			aria-label={__('Marktvergleich Balkendiagramm', 'resa')}
			style={{ height, width: '100%' }}
		>
			<ResponsiveBar
				data={data}
				keys={['value']}
				indexBy="label"
				layout="horizontal"
				margin={{ top: 10, right: 60, bottom: 10, left: 90 }}
				padding={0.35}
				valueScale={{ type: 'linear', max: maxValue }}
				indexScale={{ type: 'band', round: true }}
				colors={(d) => d.data.color as string}
				borderRadius={4}
				borderWidth={0}
				enableGridX={true}
				enableGridY={false}
				axisTop={null}
				axisRight={null}
				axisBottom={null}
				axisLeft={{
					tickSize: 0,
					tickPadding: 8,
				}}
				labelSkipWidth={60}
				labelSkipHeight={0}
				label={(d) => formatChartValue(d.value as number, 2, ` ${unit}`)}
				labelTextColor="#ffffff"
				theme={resaChartTheme}
				animate={true}
				motionConfig="gentle"
				role="img"
				ariaLabel={__('Marktvergleich', 'resa')}
			/>
		</div>
	);
}
