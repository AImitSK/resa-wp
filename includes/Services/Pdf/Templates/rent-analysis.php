<?php
/**
 * PDF template for rent analysis results.
 *
 * DOMPDF-optimized: Uses fixed pixel widths, no flexbox/grid, simple table layouts.
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
$map_image_url     = $map_image_url ?? '';
$bar_chart_svg     = $bar_chart_svg ?? '';

$format_number = function ( float $value, int $decimals = 0 ): string {
	return number_format( $value, $decimals, ',', '.' );
};

$format_currency = function ( float $value ) use ( $format_number ): string {
	return $format_number( $value, 2 ) . ' €';
};

$current_date = wp_date( 'd.m.Y' ) ?: gmdate( 'd.m.Y' );

$esc_image_src = function ( string $src ): string {
	if ( str_starts_with( $src, 'data:image/' ) ) {
		return esc_attr( $src );
	}
	return esc_url( $src );
};

// Chart data is passed via $bar_chart_svg from LeadPdfService.
?>
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title><?php esc_html_e( 'Mietpreis-Analyse', 'resa' ); ?></title>
<style>
@page { size: A4; margin: 15mm; }
body { font-family: DejaVu Sans, Helvetica, Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #1e293b; margin: 0; padding: 0; }
table { border-collapse: collapse; }
h1 { font-size: 20px; font-weight: bold; color: #0f172a; margin: 0 0 12px 0; }
h2 { font-size: 14px; font-weight: bold; color: #1e293b; margin: 16px 0 8px 0; }
h3 { font-size: 12px; font-weight: bold; color: #334155; margin: 0 0 6px 0; }
p { margin: 0 0 8px 0; }
.page { page-break-after: always; }
.page:last-child { page-break-after: avoid; }
</style>
</head>
<body>

<!-- PAGE 1 -->
<div class="page">

<!-- Header -->
<table width="100%" style="margin-bottom: 16px;">
<tr>
<td width="70%" style="vertical-align: middle;">
<?php if ( $logo_url !== '' ) : ?>
<img src="<?php echo $esc_image_src( $logo_url ); ?>" style="max-height: 36px; max-width: 140px;">
<?php else : ?>
<span style="font-size: 10px; color: #64748b;"><?php esc_html_e( 'RESA — Mietpreis-Analyse', 'resa' ); ?></span>
<?php endif; ?>
</td>
<td width="30%" style="text-align: right; font-size: 10px; color: #64748b; vertical-align: middle;">
<?php echo esc_html( $current_date ); ?>
</td>
</tr>
</table>

<h1><?php esc_html_e( 'Ihre Mietpreis-Analyse', 'resa' ); ?></h1>

<?php if ( $lead_name !== '' ) : ?>
<p style="color: #475569; margin-bottom: 14px;">
<?php
$greeting = $lead_salutation !== '' ? $lead_salutation . ' ' . $lead_name : $lead_name;
printf( esc_html__( 'Guten Tag %s,', 'resa' ), esc_html( $greeting ) );
?>
<br><?php esc_html_e( 'vielen Dank für Ihr Interesse. Hier ist Ihre persönliche Mietpreis-Analyse:', 'resa' ); ?>
</p>
<?php endif; ?>

<!-- Result Box -->
<table width="100%" style="background-color: #f0f9ff; border-left: 4px solid <?php echo esc_attr( $primary_color ); ?>; margin-bottom: 16px;">
<tr>
<td style="padding: 14px 16px;">
<div style="font-size: 26px; font-weight: bold; color: <?php echo esc_attr( $primary_color ); ?>;">
<?php echo esc_html( $format_currency( $estimated_rent ) ); ?> / <?php esc_html_e( 'Monat', 'resa' ); ?>
</div>
<?php if ( $rent_min > 0 && $rent_max > 0 ) : ?>
<div style="font-size: 12px; color: #64748b; margin-top: 4px;">
<?php printf( esc_html__( 'Spanne: %1$s – %2$s', 'resa' ), esc_html( $format_currency( $rent_min ) ), esc_html( $format_currency( $rent_max ) ) ); ?>
</div>
<?php endif; ?>
<div style="font-size: 10px; color: #64748b; margin-top: 4px;">
<?php esc_html_e( 'Geschätzte marktübliche Kaltmiete', 'resa' ); ?>
</div>
</td>
</tr>
</table>

<!-- Stats -->
<table width="100%" style="margin-bottom: 16px;">
<tr>
<td width="33%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; text-align: center;">
<div style="font-size: 16px; font-weight: bold; color: <?php echo esc_attr( $primary_color ); ?>;"><?php echo esc_html( $format_number( $price_per_sqm, 2 ) ); ?> €/m²</div>
<div style="font-size: 9px; color: #64748b; margin-top: 2px;"><?php esc_html_e( 'IHR OBJEKT', 'resa' ); ?></div>
</td>
<td width="33%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; text-align: center;">
<div style="font-size: 16px; font-weight: bold; color: <?php echo esc_attr( $primary_color ); ?>;"><?php echo esc_html( $format_number( $city_average, 2 ) ); ?> €/m²</div>
<div style="font-size: 9px; color: #64748b; margin-top: 2px;"><?php echo esc_html( strtoupper( $location_name ) ); ?></div>
</td>
<td width="33%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; text-align: center;">
<div style="font-size: 16px; font-weight: bold; color: <?php echo esc_attr( $primary_color ); ?>;"><?php echo esc_html( $format_number( $county_average, 2 ) ); ?> €/m²</div>
<div style="font-size: 9px; color: #64748b; margin-top: 2px;"><?php esc_html_e( 'LANDKREIS', 'resa' ); ?></div>
</td>
</tr>
</table>

<?php if ( $market_position !== '' ) : ?>
<p style="margin-bottom: 14px;">
<?php esc_html_e( 'Marktposition:', 'resa' ); ?>
<?php
$badge_bg = '#fef3c7'; $badge_color = '#92400e';
if ( stripos( $market_position, 'über' ) !== false ) { $badge_bg = '#dcfce7'; $badge_color = '#166534'; }
elseif ( stripos( $market_position, 'unter' ) !== false ) { $badge_bg = '#fee2e2'; $badge_color = '#991b1b'; }
?>
<span style="background-color: <?php echo esc_attr( $badge_bg ); ?>; color: <?php echo esc_attr( $badge_color ); ?>; padding: 3px 8px; font-size: 10px; font-weight: bold;">
<?php echo esc_html( $market_position ); ?>
</span>
</p>
<?php endif; ?>

<h2><?php esc_html_e( 'Objektdaten', 'resa' ); ?></h2>
<table width="100%" style="margin-bottom: 14px;">
<?php if ( $property_type !== '' ) : ?>
<tr><td width="30%" style="padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #64748b;"><?php esc_html_e( 'OBJEKTTYP', 'resa' ); ?></td><td style="padding: 6px 0; border-bottom: 1px solid #e2e8f0;"><?php echo esc_html( $property_type ); ?></td></tr>
<?php endif; ?>
<?php if ( $property_address !== '' ) : ?>
<tr><td width="30%" style="padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #64748b;"><?php esc_html_e( 'LAGE', 'resa' ); ?></td><td style="padding: 6px 0; border-bottom: 1px solid #e2e8f0;"><?php echo esc_html( $property_address ); ?></td></tr>
<?php endif; ?>
<?php if ( $living_area > 0 ) : ?>
<tr><td width="30%" style="padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #64748b;"><?php esc_html_e( 'WOHNFLÄCHE', 'resa' ); ?></td><td style="padding: 6px 0; border-bottom: 1px solid #e2e8f0;"><?php echo esc_html( $format_number( $living_area, 0 ) ); ?> m²</td></tr>
<?php endif; ?>
<?php if ( $rooms > 0 ) : ?>
<tr><td width="30%" style="padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #64748b;"><?php esc_html_e( 'ZIMMER', 'resa' ); ?></td><td style="padding: 6px 0; border-bottom: 1px solid #e2e8f0;"><?php echo esc_html( $rooms ); ?></td></tr>
<?php endif; ?>
<?php if ( $construction_year > 0 ) : ?>
<tr><td width="30%" style="padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #64748b;"><?php esc_html_e( 'BAUJAHR', 'resa' ); ?></td><td style="padding: 6px 0; border-bottom: 1px solid #e2e8f0;"><?php echo esc_html( $construction_year ); ?></td></tr>
<?php endif; ?>
<?php if ( $condition !== '' ) : ?>
<tr><td width="30%" style="padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #64748b;"><?php esc_html_e( 'ZUSTAND', 'resa' ); ?></td><td style="padding: 6px 0; border-bottom: 1px solid #e2e8f0;"><?php echo esc_html( $condition ); ?></td></tr>
<?php endif; ?>
<?php if ( $equipment !== '' ) : ?>
<tr><td width="30%" style="padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #64748b;"><?php esc_html_e( 'AUSSTATTUNG', 'resa' ); ?></td><td style="padding: 6px 0; border-bottom: 1px solid #e2e8f0;"><?php echo esc_html( $equipment ); ?></td></tr>
<?php endif; ?>
</table>

<?php if ( $map_image_url !== '' ) : ?>
<div style="margin: 14px 0; text-align: center;">
<img src="<?php echo $esc_image_src( $map_image_url ); ?>" style="max-width: 100%; height: auto; border: 1px solid #e2e8f0;">
<?php if ( $property_address !== '' ) : ?>
<p style="font-size: 9px; color: #64748b; margin-top: 4px;"><?php echo esc_html( $property_address ); ?></p>
<?php endif; ?>
</div>
<?php endif; ?>

<?php if ( $agent_name !== '' ) : ?>
<table width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; margin-top: 14px;">
<tr>
<td style="padding: 12px;">
<h3><?php esc_html_e( 'Ihr Ansprechpartner', 'resa' ); ?></h3>
<div style="font-size: 13px; font-weight: bold; color: #0f172a;"><?php echo esc_html( $agent_name ); ?></div>
<?php if ( $agent_company !== '' ) : ?>
<div style="font-size: 11px; color: #64748b;"><?php echo esc_html( $agent_company ); ?></div>
<?php endif; ?>
<?php if ( $agent_phone !== '' || $agent_email !== '' ) : ?>
<div style="font-size: 11px; color: #334155; margin-top: 6px;">
<?php if ( $agent_phone !== '' ) : ?><?php esc_html_e( 'Tel.:', 'resa' ); ?> <?php echo esc_html( $agent_phone ); ?><?php endif; ?>
<?php if ( $agent_phone !== '' && $agent_email !== '' ) : ?> | <?php endif; ?>
<?php if ( $agent_email !== '' ) : ?><?php echo esc_html( $agent_email ); ?><?php endif; ?>
</div>
<?php endif; ?>
</td>
</tr>
</table>
<?php endif; ?>

<table width="100%" style="margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
<tr>
<td style="font-size: 8px; color: #94a3b8;"><?php esc_html_e( 'RESA — Real Estate Smart Assets', 'resa' ); ?></td>
<td style="font-size: 8px; color: #94a3b8; text-align: right;"><?php esc_html_e( 'Seite 1 von 2', 'resa' ); ?></td>
</tr>
</table>

</div>

<!-- PAGE 2 -->
<div class="page">

<!-- Header -->
<table width="100%" style="margin-bottom: 16px;">
<tr>
<td width="70%" style="vertical-align: middle;">
<?php if ( $logo_url !== '' ) : ?>
<img src="<?php echo $esc_image_src( $logo_url ); ?>" style="max-height: 36px; max-width: 140px;">
<?php else : ?>
<span style="font-size: 10px; color: #64748b;"><?php esc_html_e( 'RESA — Mietpreis-Analyse', 'resa' ); ?></span>
<?php endif; ?>
</td>
<td width="30%" style="text-align: right; font-size: 10px; color: #64748b; vertical-align: middle;">
<?php echo esc_html( $current_date ); ?>
</td>
</tr>
</table>

<h2 style="margin-top: 0;"><?php esc_html_e( 'Marktvergleich', 'resa' ); ?></h2>
<p style="font-size: 10px; color: #64748b; margin-bottom: 12px;">
<?php esc_html_e( 'Vergleich Ihres geschätzten Mietpreises mit regionalen Durchschnittswerten (€/m²)', 'resa' ); ?>
</p>

<?php if ( $bar_chart_svg !== '' ) : ?>
<!-- Bar Chart SVG from SimpleBarChart -->
<div style="margin-bottom: 20px; text-align: center;">
<?php
// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- SVG generated by SimpleBarChart.
echo $bar_chart_svg;
?>
</div>
<?php endif; ?>

<?php if ( ! empty( $factors ) ) : ?>
<h2><?php esc_html_e( 'Einflussfaktoren', 'resa' ); ?></h2>
<p style="font-size: 10px; color: #64748b; margin-bottom: 10px;">
<?php esc_html_e( 'Diese Faktoren beeinflussen den geschätzten Mietpreis Ihres Objekts:', 'resa' ); ?>
</p>

<table width="100%" style="margin-bottom: 16px;">
<tr style="background-color: #f8fafc;">
<th width="40%" style="padding: 8px; text-align: left; font-size: 9px; color: #64748b; border-bottom: 2px solid #e2e8f0;"><?php esc_html_e( 'FAKTOR', 'resa' ); ?></th>
<th width="35%" style="padding: 8px; text-align: left; font-size: 9px; color: #64748b; border-bottom: 2px solid #e2e8f0;"><?php esc_html_e( 'WERT', 'resa' ); ?></th>
<th width="25%" style="padding: 8px; text-align: right; font-size: 9px; color: #64748b; border-bottom: 2px solid #e2e8f0;"><?php esc_html_e( 'EINFLUSS', 'resa' ); ?></th>
</tr>
<?php foreach ( $factors as $factor ) :
	$impact = $factor['impact'] ?? 0;
	$impact_color = '#64748b';
	$impact_text = '±0%';
	if ( is_numeric( $impact ) ) {
		if ( $impact > 0 ) { $impact_color = '#059669'; $impact_text = '+' . $format_number( (float) $impact, 1 ) . '%'; }
		elseif ( $impact < 0 ) { $impact_color = '#dc2626'; $impact_text = $format_number( (float) $impact, 1 ) . '%'; }
	}
?>
<tr>
<td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><?php echo esc_html( $factor['label'] ?? '' ); ?></td>
<td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><?php echo esc_html( $factor['value'] ?? '' ); ?></td>
<td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: <?php echo esc_attr( $impact_color ); ?>;"><?php echo esc_html( $impact_text ); ?></td>
</tr>
<?php endforeach; ?>
</table>
<?php endif; ?>

<table width="100%" style="background-color: #fefce8; border: 1px solid #fef08a; margin-top: 20px;">
<tr>
<td style="padding: 10px; font-size: 9px; color: #713f12;">
<strong><?php esc_html_e( 'Hinweis:', 'resa' ); ?></strong>
<?php esc_html_e( 'Diese Analyse basiert auf statistischen Durchschnittswerten und dient der Orientierung. Der tatsächliche Mietpreis kann je nach Marktlage, Ausstattungsdetails und Verhandlung abweichen. Für eine präzise Bewertung empfehlen wir eine persönliche Beratung.', 'resa' ); ?>
</td>
</tr>
</table>

<?php if ( $agent_name !== '' ) : ?>
<table width="100%" style="background-color: #f0f9ff; border: 1px solid #bae6fd; margin-top: 16px;">
<tr>
<td style="padding: 14px; text-align: center;">
<div style="font-size: 12px; font-weight: bold; color: #0f172a; margin-bottom: 4px;">
<?php esc_html_e( 'Interesse an einer persönlichen Beratung?', 'resa' ); ?>
</div>
<div style="font-size: 10px; color: #475569;">
<?php printf( esc_html__( 'Kontaktieren Sie %s für eine unverbindliche Einschätzung.', 'resa' ), esc_html( $agent_name ) ); ?>
</div>
<?php if ( $agent_phone !== '' ) : ?>
<div style="font-size: 14px; font-weight: bold; color: <?php echo esc_attr( $primary_color ); ?>; margin-top: 8px;">
<?php echo esc_html( $agent_phone ); ?>
</div>
<?php endif; ?>
</td>
</tr>
</table>
<?php endif; ?>

<table width="100%" style="margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
<tr>
<td style="font-size: 8px; color: #94a3b8;"><?php esc_html_e( 'RESA — Real Estate Smart Assets', 'resa' ); ?></td>
<td style="font-size: 8px; color: #94a3b8; text-align: right;"><?php esc_html_e( 'Seite 2 von 2', 'resa' ); ?></td>
</tr>
</table>

</div>

</body>
</html>
