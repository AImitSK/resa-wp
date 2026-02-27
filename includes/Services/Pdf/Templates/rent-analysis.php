<?php
/**
 * PDF template for rent analysis results.
 *
 * Variables available via extract():
 *
 * @var string $lead_name         Lead's full name.
 * @var string $lead_salutation   Salutation (Herr/Frau).
 * @var string $property_type     Property type label.
 * @var string $property_address  Property address/location.
 * @var float  $living_area       Living area in m².
 * @var int    $rooms             Number of rooms.
 * @var int    $construction_year Construction year.
 * @var string $condition         Property condition label.
 * @var string $equipment         Equipment level label.
 * @var float  $estimated_rent    Estimated monthly rent (€).
 * @var float  $rent_min          Minimum rent estimate (€).
 * @var float  $rent_max          Maximum rent estimate (€).
 * @var float  $price_per_sqm     Price per m² (€).
 * @var float  $city_average      City average rent per m² (€).
 * @var float  $county_average    County/region average rent per m² (€).
 * @var string $market_position   Market position label (unter/im/über Durchschnitt).
 * @var array  $factors           Array of factor adjustments.
 * @var string $location_name     Location/city name.
 * @var string $agent_name        Agent's display name.
 * @var string $agent_email       Agent's email.
 * @var string $agent_phone       Agent's phone.
 * @var string $agent_company     Agent's company name.
 * @var string $logo_url          Branding logo URL.
 * @var string $primary_color     Primary brand color.
 * @var string $bar_chart_svg     Pre-rendered bar chart SVG.
 * @var bool   $is_dompdf         Whether rendering via DOMPDF.
 *
 * @package Resa\Services\Pdf\Templates
 */

defined( 'ABSPATH' ) || exit;

// Default values.
$lead_name         = $lead_name ?? '';
$lead_salutation   = $lead_salutation ?? '';
$property_type     = $property_type ?? '';
$property_address  = $property_address ?? '';
$living_area       = $living_area ?? 0;
$rooms             = $rooms ?? 0;
$construction_year = $construction_year ?? 0;
$condition         = $condition ?? '';
$equipment         = $equipment ?? '';
$estimated_rent    = $estimated_rent ?? 0;
$rent_min          = $rent_min ?? 0;
$rent_max          = $rent_max ?? 0;
$price_per_sqm     = $price_per_sqm ?? 0;
$city_average      = $city_average ?? 0;
$county_average    = $county_average ?? 0;
$market_position   = $market_position ?? '';
$factors           = $factors ?? [];
$location_name     = $location_name ?? '';
$agent_name        = $agent_name ?? '';
$agent_email       = $agent_email ?? '';
$agent_phone       = $agent_phone ?? '';
$agent_company     = $agent_company ?? '';
$logo_url          = $logo_url ?? '';
$primary_color     = $primary_color ?? '#3b82f6';
$bar_chart_svg     = $bar_chart_svg ?? '';

/**
 * Format a number in German locale (comma as decimal, dot as thousands).
 *
 * @param float $value   Number to format.
 * @param int   $decimals Number of decimals.
 * @return string Formatted number.
 */
$format_number = function ( float $value, int $decimals = 0 ): string {
	return number_format( $value, $decimals, ',', '.' );
};

/**
 * Format currency in German locale.
 *
 * @param float $value Amount.
 * @return string Formatted currency.
 */
$format_currency = function ( float $value ) use ( $format_number ): string {
	return $format_number( $value, 2 ) . ' €';
};

$current_date = wp_date( 'd.m.Y' ) ?: gmdate( 'd.m.Y' );
?>
<!DOCTYPE html>
<html lang="de">
<head>
	<meta charset="UTF-8">
	<title><?php esc_html_e( 'Mietpreis-Analyse', 'resa' ); ?></title>
	<style>
		/* === Reset (DOMPDF compatible) === */
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}

		body {
			font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
			font-size: 12px;
			line-height: 1.5;
			color: #1e293b;
		}

		/* === Page Layout === */
		.page {
			width: 210mm;
			min-height: 287mm;
			padding: 15mm;
			page-break-after: always;
			position: relative;
		}

		.page:last-child {
			page-break-after: avoid;
		}

		/* === Header === */
		.header-table {
			width: 100%;
			border-collapse: collapse;
			margin-bottom: 20px;
			border-bottom: 2px solid <?php echo esc_attr( $primary_color ); ?>;
			padding-bottom: 10px;
		}

		.header-table td {
			vertical-align: middle;
			padding: 0;
		}

		.header-logo {
			max-height: 40px;
			max-width: 160px;
		}

		.header-date {
			text-align: right;
			font-size: 11px;
			color: #94a3b8;
		}

		.brand-text {
			font-size: 11px;
			color: #94a3b8;
		}

		/* === Typography === */
		h1 {
			font-size: 22px;
			font-weight: 700;
			color: #0f172a;
			margin-bottom: 16px;
		}

		h2 {
			font-size: 16px;
			font-weight: 600;
			color: #1e293b;
			margin-bottom: 12px;
			margin-top: 20px;
		}

		h3 {
			font-size: 13px;
			font-weight: 600;
			color: #334155;
			margin-bottom: 8px;
		}

		p {
			margin-bottom: 8px;
		}

		/* === Result Box === */
		.result-box {
			background-color: #f0f9ff;
			border: 1px solid #bae6fd;
			border-left: 4px solid <?php echo esc_attr( $primary_color ); ?>;
			padding: 16px 20px;
			margin: 16px 0;
		}

		.result-main-value {
			font-size: 32px;
			font-weight: 700;
			color: <?php echo esc_attr( $primary_color ); ?>;
		}

		.result-range {
			font-size: 14px;
			color: #64748b;
			margin-top: 4px;
		}

		.result-label {
			font-size: 12px;
			color: #64748b;
			margin-top: 4px;
		}

		/* === Info Table === */
		.info-table {
			width: 100%;
			border-collapse: collapse;
			margin: 12px 0;
		}

		.info-table td {
			padding: 8px 12px;
			border-bottom: 1px solid #e2e8f0;
			vertical-align: top;
		}

		.info-table .label {
			width: 40%;
			color: #64748b;
			font-size: 11px;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}

		.info-table .value {
			color: #0f172a;
			font-weight: 500;
		}

		/* === Stats Grid (Table-based for DOMPDF) === */
		.stats-table {
			width: 100%;
			border-collapse: collapse;
			margin: 16px 0;
		}

		.stats-table td {
			width: 33.33%;
			padding: 12px;
			text-align: center;
			background-color: #f8fafc;
			border: 1px solid #e2e8f0;
		}

		.stat-value {
			font-size: 20px;
			font-weight: 700;
			color: <?php echo esc_attr( $primary_color ); ?>;
		}

		.stat-label {
			font-size: 10px;
			color: #64748b;
			margin-top: 4px;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}

		/* === Factors Table === */
		.factors-table {
			width: 100%;
			border-collapse: collapse;
			margin: 12px 0;
		}

		.factors-table th {
			background-color: #f8fafc;
			font-weight: 600;
			font-size: 11px;
			color: #64748b;
			text-transform: uppercase;
			letter-spacing: 0.5px;
			padding: 10px 12px;
			text-align: left;
			border-bottom: 2px solid #e2e8f0;
		}

		.factors-table td {
			padding: 10px 12px;
			border-bottom: 1px solid #e2e8f0;
		}

		.factor-positive {
			color: #059669;
			font-weight: 600;
		}

		.factor-negative {
			color: #dc2626;
			font-weight: 600;
		}

		.factor-neutral {
			color: #64748b;
		}

		/* === Chart Container === */
		.chart-container {
			margin: 16px 0;
			text-align: center;
		}

		.chart-container svg {
			max-width: 100%;
		}

		/* === Agent Card === */
		.agent-card {
			background-color: #f8fafc;
			border: 1px solid #e2e8f0;
			padding: 16px 20px;
			margin-top: 20px;
		}

		.agent-card-table {
			width: 100%;
			border-collapse: collapse;
		}

		.agent-card-table td {
			padding: 0;
			vertical-align: top;
		}

		.agent-name {
			font-size: 15px;
			font-weight: 600;
			color: #0f172a;
		}

		.agent-company {
			font-size: 12px;
			color: #64748b;
			margin-top: 2px;
		}

		.agent-contact {
			font-size: 12px;
			color: #334155;
			margin-top: 8px;
		}

		/* === Footer === */
		.footer-table {
			width: 100%;
			border-collapse: collapse;
			position: absolute;
			bottom: 10mm;
			left: 15mm;
			right: 15mm;
			border-top: 1px solid #e2e8f0;
			padding-top: 8px;
		}

		.footer-table td {
			font-size: 9px;
			color: #94a3b8;
			padding: 0;
		}

		/* === Market Position Badge === */
		.market-badge {
			display: inline-block;
			padding: 4px 10px;
			font-size: 11px;
			font-weight: 600;
			border-radius: 4px;
		}

		.market-badge-above {
			background-color: #dcfce7;
			color: #166534;
		}

		.market-badge-average {
			background-color: #fef3c7;
			color: #92400e;
		}

		.market-badge-below {
			background-color: #fee2e2;
			color: #991b1b;
		}

		/* === Greeting === */
		.greeting {
			margin-bottom: 16px;
			color: #475569;
		}
	</style>
</head>
<body>
	<!-- Page 1: Core Results -->
	<div class="page">
		<!-- Header -->
		<table class="header-table">
			<tr>
				<td style="width: 60%;">
					<?php if ( $logo_url !== '' ) : ?>
						<img src="<?php echo esc_url( $logo_url ); ?>" alt="" class="header-logo">
					<?php else : ?>
						<span class="brand-text"><?php esc_html_e( 'RESA — Mietpreis-Analyse', 'resa' ); ?></span>
					<?php endif; ?>
				</td>
				<td class="header-date">
					<?php echo esc_html( $current_date ); ?>
				</td>
			</tr>
		</table>

		<!-- Title -->
		<h1><?php esc_html_e( 'Ihre Mietpreis-Analyse', 'resa' ); ?></h1>

		<!-- Greeting -->
		<?php if ( $lead_name !== '' ) : ?>
			<p class="greeting">
				<?php
				$greeting = $lead_salutation !== '' ? $lead_salutation . ' ' . $lead_name : $lead_name;
				/* translators: %s: Lead name with optional salutation */
				printf( esc_html__( 'Guten Tag %s,', 'resa' ), esc_html( $greeting ) );
				?>
				<br>
				<?php esc_html_e( 'vielen Dank für Ihr Interesse. Hier ist Ihre persönliche Mietpreis-Analyse:', 'resa' ); ?>
			</p>
		<?php endif; ?>

		<!-- Main Result Box -->
		<div class="result-box">
			<div class="result-main-value">
				<?php echo esc_html( $format_currency( $estimated_rent ) ); ?> / <?php esc_html_e( 'Monat', 'resa' ); ?>
			</div>
			<?php if ( $rent_min > 0 && $rent_max > 0 ) : ?>
				<div class="result-range">
					<?php
					/* translators: 1: Minimum rent, 2: Maximum rent */
					printf(
						esc_html__( 'Spanne: %1$s – %2$s', 'resa' ),
						esc_html( $format_currency( $rent_min ) ),
						esc_html( $format_currency( $rent_max ) )
					);
					?>
				</div>
			<?php endif; ?>
			<div class="result-label">
				<?php esc_html_e( 'Geschätzte marktübliche Kaltmiete', 'resa' ); ?>
			</div>
		</div>

		<!-- Stats Row -->
		<table class="stats-table">
			<tr>
				<td>
					<div class="stat-value"><?php echo esc_html( $format_number( $price_per_sqm, 2 ) ); ?> €/m²</div>
					<div class="stat-label"><?php esc_html_e( 'Ihr Objekt', 'resa' ); ?></div>
				</td>
				<td>
					<div class="stat-value"><?php echo esc_html( $format_number( $city_average, 2 ) ); ?> €/m²</div>
					<div class="stat-label"><?php echo esc_html( $location_name ); ?></div>
				</td>
				<td>
					<div class="stat-value"><?php echo esc_html( $format_number( $county_average, 2 ) ); ?> €/m²</div>
					<div class="stat-label"><?php esc_html_e( 'Landkreis', 'resa' ); ?></div>
				</td>
			</tr>
		</table>

		<!-- Market Position -->
		<?php if ( $market_position !== '' ) : ?>
			<p>
				<?php esc_html_e( 'Marktposition:', 'resa' ); ?>
				<?php
				$badge_class = 'market-badge-average';
				if ( stripos( $market_position, 'über' ) !== false ) {
					$badge_class = 'market-badge-above';
				} elseif ( stripos( $market_position, 'unter' ) !== false ) {
					$badge_class = 'market-badge-below';
				}
				?>
				<span class="market-badge <?php echo esc_attr( $badge_class ); ?>">
					<?php echo esc_html( $market_position ); ?>
				</span>
			</p>
		<?php endif; ?>

		<!-- Property Details -->
		<h2><?php esc_html_e( 'Objektdaten', 'resa' ); ?></h2>
		<table class="info-table">
			<?php if ( $property_type !== '' ) : ?>
				<tr>
					<td class="label"><?php esc_html_e( 'Objekttyp', 'resa' ); ?></td>
					<td class="value"><?php echo esc_html( $property_type ); ?></td>
				</tr>
			<?php endif; ?>
			<?php if ( $property_address !== '' ) : ?>
				<tr>
					<td class="label"><?php esc_html_e( 'Lage', 'resa' ); ?></td>
					<td class="value"><?php echo esc_html( $property_address ); ?></td>
				</tr>
			<?php endif; ?>
			<?php if ( $living_area > 0 ) : ?>
				<tr>
					<td class="label"><?php esc_html_e( 'Wohnfläche', 'resa' ); ?></td>
					<td class="value"><?php echo esc_html( $format_number( $living_area, 0 ) ); ?> m²</td>
				</tr>
			<?php endif; ?>
			<?php if ( $rooms > 0 ) : ?>
				<tr>
					<td class="label"><?php esc_html_e( 'Zimmer', 'resa' ); ?></td>
					<td class="value"><?php echo esc_html( $rooms ); ?></td>
				</tr>
			<?php endif; ?>
			<?php if ( $construction_year > 0 ) : ?>
				<tr>
					<td class="label"><?php esc_html_e( 'Baujahr', 'resa' ); ?></td>
					<td class="value"><?php echo esc_html( $construction_year ); ?></td>
				</tr>
			<?php endif; ?>
			<?php if ( $condition !== '' ) : ?>
				<tr>
					<td class="label"><?php esc_html_e( 'Zustand', 'resa' ); ?></td>
					<td class="value"><?php echo esc_html( $condition ); ?></td>
				</tr>
			<?php endif; ?>
			<?php if ( $equipment !== '' ) : ?>
				<tr>
					<td class="label"><?php esc_html_e( 'Ausstattung', 'resa' ); ?></td>
					<td class="value"><?php echo esc_html( $equipment ); ?></td>
				</tr>
			<?php endif; ?>
		</table>

		<!-- Agent Card -->
		<?php if ( $agent_name !== '' ) : ?>
			<div class="agent-card">
				<h3><?php esc_html_e( 'Ihr Ansprechpartner', 'resa' ); ?></h3>
				<table class="agent-card-table">
					<tr>
						<td>
							<div class="agent-name"><?php echo esc_html( $agent_name ); ?></div>
							<?php if ( $agent_company !== '' ) : ?>
								<div class="agent-company"><?php echo esc_html( $agent_company ); ?></div>
							<?php endif; ?>
							<?php if ( $agent_phone !== '' || $agent_email !== '' ) : ?>
								<div class="agent-contact">
									<?php if ( $agent_phone !== '' ) : ?>
										<?php esc_html_e( 'Tel.:', 'resa' ); ?> <?php echo esc_html( $agent_phone ); ?>
									<?php endif; ?>
									<?php if ( $agent_phone !== '' && $agent_email !== '' ) : ?>
										&nbsp;|&nbsp;
									<?php endif; ?>
									<?php if ( $agent_email !== '' ) : ?>
										<?php echo esc_html( $agent_email ); ?>
									<?php endif; ?>
								</div>
							<?php endif; ?>
						</td>
					</tr>
				</table>
			</div>
		<?php endif; ?>

		<!-- Footer -->
		<table class="footer-table">
			<tr>
				<td style="width: 50%;"><?php esc_html_e( 'RESA — Real Estate Smart Assets', 'resa' ); ?></td>
				<td style="width: 50%; text-align: right;"><?php esc_html_e( 'Seite 1 von 2', 'resa' ); ?></td>
			</tr>
		</table>
	</div>

	<!-- Page 2: Factors & Comparison -->
	<div class="page">
		<!-- Header -->
		<table class="header-table">
			<tr>
				<td style="width: 60%;">
					<?php if ( $logo_url !== '' ) : ?>
						<img src="<?php echo esc_url( $logo_url ); ?>" alt="" class="header-logo">
					<?php else : ?>
						<span class="brand-text"><?php esc_html_e( 'RESA — Mietpreis-Analyse', 'resa' ); ?></span>
					<?php endif; ?>
				</td>
				<td class="header-date">
					<?php echo esc_html( $current_date ); ?>
				</td>
			</tr>
		</table>

		<!-- Comparison Chart -->
		<h2><?php esc_html_e( 'Marktvergleich', 'resa' ); ?></h2>
		<p style="color: #64748b; font-size: 11px; margin-bottom: 12px;">
			<?php esc_html_e( 'Vergleich Ihres geschätzten Mietpreises mit regionalen Durchschnittswerten (€/m²)', 'resa' ); ?>
		</p>

		<?php if ( $bar_chart_svg !== '' ) : ?>
			<div class="chart-container">
				<?php
				// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- SVG is generated by trusted SimpleBarChart.
				echo $bar_chart_svg;
				?>
			</div>
		<?php endif; ?>

		<!-- Factors Analysis -->
		<?php if ( ! empty( $factors ) ) : ?>
			<h2><?php esc_html_e( 'Einflussfaktoren', 'resa' ); ?></h2>
			<p style="color: #64748b; font-size: 11px; margin-bottom: 12px;">
				<?php esc_html_e( 'Diese Faktoren beeinflussen den geschätzten Mietpreis Ihres Objekts:', 'resa' ); ?>
			</p>

			<table class="factors-table">
				<thead>
					<tr>
						<th style="width: 50%;"><?php esc_html_e( 'Faktor', 'resa' ); ?></th>
						<th style="width: 25%;"><?php esc_html_e( 'Wert', 'resa' ); ?></th>
						<th style="width: 25%;"><?php esc_html_e( 'Einfluss', 'resa' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<?php foreach ( $factors as $factor ) : ?>
						<?php
						$factor_label  = $factor['label'] ?? '';
						$factor_value  = $factor['value'] ?? '';
						$factor_impact = $factor['impact'] ?? 0;

						$impact_class = 'factor-neutral';
						$impact_text  = '±0%';

						if ( is_numeric( $factor_impact ) ) {
							if ( $factor_impact > 0 ) {
								$impact_class = 'factor-positive';
								$impact_text  = '+' . $format_number( (float) $factor_impact, 1 ) . '%';
							} elseif ( $factor_impact < 0 ) {
								$impact_class = 'factor-negative';
								$impact_text  = $format_number( (float) $factor_impact, 1 ) . '%';
							}
						}
						?>
						<tr>
							<td><?php echo esc_html( $factor_label ); ?></td>
							<td><?php echo esc_html( $factor_value ); ?></td>
							<td class="<?php echo esc_attr( $impact_class ); ?>"><?php echo esc_html( $impact_text ); ?></td>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
		<?php endif; ?>

		<!-- Disclaimer -->
		<div style="margin-top: 30px; padding: 12px 16px; background-color: #fefce8; border: 1px solid #fef08a; font-size: 10px; color: #713f12;">
			<strong><?php esc_html_e( 'Hinweis:', 'resa' ); ?></strong>
			<?php esc_html_e( 'Diese Analyse basiert auf statistischen Durchschnittswerten und dient der Orientierung. Der tatsächliche Mietpreis kann je nach Marktlage, Ausstattungsdetails und Verhandlung abweichen. Für eine präzise Bewertung empfehlen wir eine persönliche Beratung.', 'resa' ); ?>
		</div>

		<!-- CTA -->
		<?php if ( $agent_name !== '' ) : ?>
			<div style="margin-top: 24px; padding: 16px 20px; background-color: #f0f9ff; border: 1px solid #bae6fd; text-align: center;">
				<p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #0f172a;">
					<?php esc_html_e( 'Interesse an einer persönlichen Beratung?', 'resa' ); ?>
				</p>
				<p style="margin: 0; font-size: 12px; color: #475569;">
					<?php
					/* translators: %s: Agent name */
					printf( esc_html__( 'Kontaktieren Sie %s für eine unverbindliche Einschätzung.', 'resa' ), esc_html( $agent_name ) );
					?>
				</p>
				<?php if ( $agent_phone !== '' ) : ?>
					<p style="margin: 12px 0 0; font-size: 15px; font-weight: 600; color: <?php echo esc_attr( $primary_color ); ?>;">
						<?php echo esc_html( $agent_phone ); ?>
					</p>
				<?php endif; ?>
			</div>
		<?php endif; ?>

		<!-- Footer -->
		<table class="footer-table">
			<tr>
				<td style="width: 50%;"><?php esc_html_e( 'RESA — Real Estate Smart Assets', 'resa' ); ?></td>
				<td style="width: 50%; text-align: right;"><?php esc_html_e( 'Seite 2 von 2', 'resa' ); ?></td>
			</tr>
		</table>
	</div>
</body>
</html>
