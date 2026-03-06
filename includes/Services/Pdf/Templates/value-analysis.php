<?php
/**
 * PDF template for property value analysis results.
 *
 * Dual-rendering: Uses $is_dompdf flag to switch between:
 * - Puppeteer: Inline SVG charts + Leaflet map + full CSS
 * - DOMPDF: GD-PNG charts (base64) + no map + simplified CSS
 *
 * @package Resa\Services\Pdf\Templates
 */

defined( 'ABSPATH' ) || exit;

// Default values.
$is_dompdf         = $is_dompdf ?? false;
$lead_name         = $lead_name ?? '';
$lead_salutation   = $lead_salutation ?? '';
$property_type     = $property_type ?? '';
$property_address  = $property_address ?? '';
$living_area       = $living_area ?? 0;
$rooms             = $rooms ?? 0;
$construction_year = $construction_year ?? 0;
$condition         = $condition ?? '';
$equipment              = $equipment ?? '';
$additional_equipment   = $additional_equipment ?? '';
// Property value fields.
$property_value         = $property_value ?? 0;
$property_value_min     = $property_value_min ?? 0;
$property_value_max     = $property_value_max ?? 0;
$sale_factor            = $sale_factor ?? 25;
$average_value          = $average_value ?? 0;
$comparison_percent     = $comparison_percent ?? 0;
// Rent fields (underlying calculation).
$estimated_rent    = $estimated_rent ?? 0;
$annual_rent       = $annual_rent ?? 0;
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
$address_lat       = $address_lat ?? null;
$address_lng       = $address_lng ?? null;
$market_percentile = $market_percentile ?? 0;

// New multi-agent + PDF settings variables (injected by PdfGenerator::renderTemplate).
$agents        = $agents ?? [];
$show_agents   = $show_agents ?? true;
$show_date     = $show_date ?? true;
$header_text   = $header_text ?? '';
$footer_text   = $footer_text ?? '';
$margins       = $margins ?? [ 'top' => 20, 'bottom' => 25, 'left' => 15, 'right' => 15 ];
$branding_text = $branding_text ?? 'RESA — Real Estate Smart Assets';

// Logo layout settings.
$logo_position = $logo_position ?? 'left';
$logo_size     = $logo_size ?? 36;

// Per-module PDF section toggles (injected by PdfGenerator::renderTemplate).
$pdf_sections   = $pdf_sections ?? [];
$show_chart     = $pdf_sections['showChart'] ?? true;
$show_factors   = $pdf_sections['showFactors'] ?? true;
$show_map       = $pdf_sections['showMap'] ?? true;
$show_cta       = $pdf_sections['showCta'] ?? true;
$show_disclaimer = $pdf_sections['showDisclaimer'] ?? true;
$cta_title_custom = $pdf_sections['ctaTitle'] ?? '';
$cta_text_custom  = $pdf_sections['ctaText'] ?? '';

// Build legacy single-agent into agents array if agents is empty.
if ( empty( $agents ) && $agent_name !== '' ) {
	$agents = [
		(object) [
			'name'      => $agent_name,
			'position'  => '',
			'email'     => $agent_email,
			'phone'     => $agent_phone,
			'photo_url' => '',
		],
	];
}

$display_footer = $footer_text !== '' ? $footer_text : $branding_text;

$m_top    = absint( $margins['top'] ?? 20 );
$m_bottom = absint( $margins['bottom'] ?? 25 );
$m_left   = absint( $margins['left'] ?? 15 );
$m_right  = absint( $margins['right'] ?? 15 );

// Dual-rendering chart data.
$bar_chart_svg     = $bar_chart_svg ?? '';
$bar_chart_png     = $bar_chart_png ?? '';
$gauge_svg         = $gauge_svg ?? '';
$gauge_png         = $gauge_png ?? '';

// Legacy fallbacks.
$gauge_image_url   = $gauge_image_url ?? $gauge_png;

$format_number = function ( float $value, int $decimals = 0 ): string {
	return number_format( $value, $decimals, ',', '.' );
};

$format_currency = function ( float $value, int $decimals = 0 ) use ( $format_number ): string {
	return $format_number( $value, $decimals ) . ' €';
};

$current_date = wp_date( 'd.m.Y' ) ?: gmdate( 'd.m.Y' );

$esc_image_src = function ( string $src ): string {
	if ( str_starts_with( $src, 'data:image/' ) ) {
		return esc_attr( $src );
	}
	return esc_url( $src );
};

// Determine which chart data to use based on engine.
$active_bar_chart = $is_dompdf ? $bar_chart_png : $bar_chart_svg;
$active_gauge     = $is_dompdf ? $gauge_png : $gauge_svg;

// Map is only available with Puppeteer (Leaflet requires JS) and when enabled.
$has_map = $show_map && ! $is_dompdf && $address_lat !== null && $address_lng !== null;

// Calculate comparison indicator.
$comparison_icon = '';
$comparison_color = '#64748b';
if ( $comparison_percent > 2 ) {
	$comparison_icon = '▲';
	$comparison_color = '#16a34a';
} elseif ( $comparison_percent < -2 ) {
	$comparison_icon = '▼';
	$comparison_color = '#dc2626';
}
?>
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title><?php esc_html_e( 'Immobilienwert-Analyse', 'resa' ); ?></title>
<?php if ( $has_map ) : ?>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<?php endif; ?>
<style>
@page { size: A4; margin: <?php echo esc_attr( "{$m_top}mm {$m_right}mm {$m_bottom}mm {$m_left}mm" ); ?>; }
body { font-family: DejaVu Sans, Helvetica, Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #1e293b; margin: 0; padding: 0; }
table { border-collapse: collapse; }
h1 { font-size: 20px; font-weight: bold; color: #0f172a; margin: 0 0 12px 0; }
h2 { font-size: 14px; font-weight: bold; color: #1e293b; margin: 16px 0 8px 0; }
h3 { font-size: 12px; font-weight: bold; color: #334155; margin: 0 0 6px 0; }
p { margin: 0 0 8px 0; }
<?php if ( $has_map ) : ?>
#pdf-map { width: 100%; height: 200px; border: 1px solid #e2e8f0; }
<?php endif; ?>
</style>
</head>
<body>

<!-- Header -->
<?php
$logo_max_height = absint( $logo_size ) ?: 36;
$logo_max_width  = (int) round( $logo_max_height * 4 );
$has_logo        = $logo_url !== '';
$has_header_text = $header_text !== '';
?>
<table width="100%" style="margin-bottom: 16px;">
<tr>
<?php if ( $logo_position === 'left' ) : ?>
<td style="vertical-align: middle;">
<?php if ( $has_logo ) : ?>
<img src="<?php echo $esc_image_src( $logo_url ); ?>" style="max-height: <?php echo esc_attr( $logo_max_height ); ?>px; max-width: <?php echo esc_attr( $logo_max_width ); ?>px;">
<?php if ( $has_header_text ) : ?>
<div style="font-size: 10px; color: #64748b; margin-top: 4px;"><?php echo esc_html( $header_text ); ?></div>
<?php endif; ?>
<?php elseif ( $has_header_text ) : ?>
<span style="font-size: 10px; color: #64748b;"><?php echo esc_html( $header_text ); ?></span>
<?php else : ?>
<span style="font-size: 10px; color: #64748b;"><?php esc_html_e( 'RESA — Immobilienwert-Analyse', 'resa' ); ?></span>
<?php endif; ?>
</td>
<?php if ( $show_date ) : ?>
<td style="text-align: right; font-size: 10px; color: #64748b; vertical-align: middle;">
<?php echo esc_html( $current_date ); ?>
</td>
<?php endif; ?>

<?php elseif ( $logo_position === 'center' ) : ?>
<td width="30%" style="vertical-align: middle;">
<?php if ( $has_header_text ) : ?>
<span style="font-size: 10px; color: #64748b;"><?php echo esc_html( $header_text ); ?></span>
<?php endif; ?>
</td>
<td style="text-align: center; vertical-align: middle;">
<?php if ( $has_logo ) : ?>
<img src="<?php echo $esc_image_src( $logo_url ); ?>" style="max-height: <?php echo esc_attr( $logo_max_height ); ?>px; max-width: <?php echo esc_attr( $logo_max_width ); ?>px;">
<?php endif; ?>
</td>
<td width="30%" style="text-align: right; font-size: 10px; color: #64748b; vertical-align: middle;">
<?php if ( $show_date ) : ?>
<?php echo esc_html( $current_date ); ?>
<?php endif; ?>
</td>

<?php else : /* right — no date in header, footer is enough */ ?>
<td style="vertical-align: middle;">
<?php if ( $has_header_text ) : ?>
<span style="font-size: 10px; color: #64748b;"><?php echo esc_html( $header_text ); ?></span>
<?php endif; ?>
</td>
<td style="text-align: right; vertical-align: middle;">
<?php if ( $has_logo ) : ?>
<img src="<?php echo $esc_image_src( $logo_url ); ?>" style="max-height: <?php echo esc_attr( $logo_max_height ); ?>px; max-width: <?php echo esc_attr( $logo_max_width ); ?>px;">
<?php endif; ?>
</td>
<?php endif; ?>
</tr>
</table>

<h1><?php esc_html_e( 'Ihre Immobilienwert-Analyse', 'resa' ); ?></h1>

<?php if ( $lead_name !== '' ) : ?>
<p style="color: #475569; margin-bottom: 14px;">
<?php
$greeting = $lead_salutation !== '' ? $lead_salutation . ' ' . $lead_name : $lead_name;
printf( esc_html__( 'Guten Tag %s,', 'resa' ), esc_html( $greeting ) );
?>
<br><?php esc_html_e( 'vielen Dank für Ihr Interesse. Hier ist Ihre persönliche Immobilienwert-Analyse:', 'resa' ); ?>
</p>
<?php endif; ?>

<!-- Result + Gauge side by side -->
<table width="100%" style="margin-bottom: 16px;" cellspacing="0" cellpadding="0">
<tr>
<td style="vertical-align: middle; padding-right: 12px;">
<!-- Result Box -->
<table width="100%" style="background-color: #f0f9ff; border-left: 4px solid <?php echo esc_attr( $primary_color ); ?>;">
<tr>
<td style="padding: 14px 16px;">
<div style="font-size: 26px; font-weight: bold; color: <?php echo esc_attr( $primary_color ); ?>;">
<?php echo esc_html( $format_currency( $property_value ) ); ?>
</div>
<?php if ( $property_value_min > 0 && $property_value_max > 0 ) : ?>
<div style="font-size: 12px; color: #64748b; margin-top: 4px;">
<?php printf( esc_html__( 'Spanne: %1$s – %2$s', 'resa' ), esc_html( $format_currency( $property_value_min ) ), esc_html( $format_currency( $property_value_max ) ) ); ?>
</div>
<?php endif; ?>
<div style="font-size: 10px; color: #64748b; margin-top: 4px;">
<?php esc_html_e( 'Geschätzter Marktwert Ihrer Immobilie', 'resa' ); ?>
</div>
</td>
</tr>
</table>
</td>
<?php if ( $active_gauge !== '' ) : ?>
<td width="200" style="vertical-align: middle; text-align: center;">
<?php if ( $is_dompdf ) : ?>
<img src="<?php echo $esc_image_src( $active_gauge ); ?>" style="width: 180px; height: auto;">
<?php else : ?>
<div style="display: inline-block; width: 200px;">
<?php
// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- SVG generated by SimpleGaugeChart, not user input.
echo $active_gauge;
?>
</div>
<?php endif; ?>
</td>
<?php elseif ( $market_position !== '' ) : ?>
<td width="140" style="vertical-align: middle; text-align: center;">
<?php
$badge_bg = '#fef3c7'; $badge_color = '#92400e';
if ( stripos( $market_position, 'über' ) !== false ) { $badge_bg = '#dcfce7'; $badge_color = '#166534'; }
elseif ( stripos( $market_position, 'unter' ) !== false ) { $badge_bg = '#fee2e2'; $badge_color = '#991b1b'; }
?>
<span style="background-color: <?php echo esc_attr( $badge_bg ); ?>; color: <?php echo esc_attr( $badge_color ); ?>; padding: 3px 8px; font-size: 10px; font-weight: bold;">
<?php echo esc_html( $market_position ); ?>
</span>
</td>
<?php endif; ?>
</tr>
</table>

<!-- Comparison to average -->
<?php if ( $average_value > 0 ) : ?>
<table width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; margin-bottom: 16px;">
<tr>
<td style="padding: 12px;">
<table width="100%">
<tr>
<td style="vertical-align: middle;">
<div style="font-size: 10px; color: #64748b;"><?php esc_html_e( 'Vergleich zum Durchschnitt', 'resa' ); ?></div>
<div style="font-size: 12px; color: #1e293b; margin-top: 2px;">
<?php esc_html_e( 'Durchschnittswert:', 'resa' ); ?> <?php echo esc_html( $format_currency( $average_value ) ); ?>
</div>
</td>
<td style="text-align: right; vertical-align: middle;">
<div style="font-size: 16px; font-weight: bold; color: <?php echo esc_attr( $comparison_color ); ?>;">
<?php echo esc_html( $comparison_icon ); ?>
<?php echo esc_html( ( $comparison_percent > 0 ? '+' : '' ) . $format_number( $comparison_percent, 1 ) ); ?>%
</div>
<div style="font-size: 10px; color: #64748b;">
<?php
if ( $comparison_percent > 2 ) {
	esc_html_e( 'über dem Durchschnitt', 'resa' );
} elseif ( $comparison_percent < -2 ) {
	esc_html_e( 'unter dem Durchschnitt', 'resa' );
} else {
	esc_html_e( 'im Durchschnitt', 'resa' );
}
?>
</div>
</td>
</tr>
</table>
</td>
</tr>
</table>
<?php endif; ?>

<!-- Stats -->
<table width="100%" style="margin-bottom: 16px;">
<tr>
<td width="25%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; text-align: center;">
<div style="font-size: 16px; font-weight: bold; color: <?php echo esc_attr( $primary_color ); ?>;"><?php echo esc_html( $format_number( $price_per_sqm, 2 ) ); ?> €/m²</div>
<div style="font-size: 9px; color: #64748b; margin-top: 2px;"><?php esc_html_e( 'PREIS PRO M²', 'resa' ); ?></div>
</td>
<td width="25%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; text-align: center;">
<div style="font-size: 16px; font-weight: bold; color: <?php echo esc_attr( $primary_color ); ?>;"><?php echo esc_html( $format_number( $sale_factor, 1 ) ); ?>×</div>
<div style="font-size: 9px; color: #64748b; margin-top: 2px;"><?php esc_html_e( 'VERVIELFÄLTIGER', 'resa' ); ?></div>
</td>
<td width="25%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; text-align: center;">
<div style="font-size: 16px; font-weight: bold; color: <?php echo esc_attr( $primary_color ); ?>;"><?php echo esc_html( $format_currency( $estimated_rent ) ); ?></div>
<div style="font-size: 9px; color: #64748b; margin-top: 2px;"><?php esc_html_e( 'MONATSMIETE', 'resa' ); ?></div>
</td>
<td width="25%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; text-align: center;">
<div style="font-size: 16px; font-weight: bold; color: <?php echo esc_attr( $primary_color ); ?>;"><?php echo esc_html( $format_currency( $annual_rent ) ); ?></div>
<div style="font-size: 9px; color: #64748b; margin-top: 2px;"><?php esc_html_e( 'JAHRESMIETE', 'resa' ); ?></div>
</td>
</tr>
</table>

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
<?php if ( $additional_equipment !== '' ) : ?>
<tr><td width="30%" style="padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #64748b;"><?php esc_html_e( 'ZUSATZAUSSTATTUNG', 'resa' ); ?></td><td style="padding: 6px 0; border-bottom: 1px solid #e2e8f0;"><?php echo esc_html( $additional_equipment ); ?></td></tr>
<?php endif; ?>
</table>

<?php if ( $has_map ) : ?>
<!-- Leaflet Map (Puppeteer only — renders with networkidle0) -->
<div style="margin: 14px 0;">
<div id="pdf-map"></div>
<?php if ( $property_address !== '' ) : ?>
<p style="font-size: 9px; color: #64748b; margin-top: 4px; text-align: center;"><?php echo esc_html( $property_address ); ?></p>
<?php endif; ?>
</div>
<script>
(function() {
  var map = L.map('pdf-map', {
    center: [<?php echo esc_js( (string) $address_lat ); ?>, <?php echo esc_js( (string) $address_lng ); ?>],
    zoom: 15,
    zoomControl: false,
    attributionControl: false
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map);

  var markerIcon = L.divIcon({
    className: '',
    html: '<svg width="24" height="36" viewBox="0 0 24 36"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="<?php echo esc_js( $primary_color ); ?>"/><circle cx="12" cy="12" r="5" fill="white"/></svg>',
    iconSize: [24, 36],
    iconAnchor: [12, 36]
  });

  L.marker([<?php echo esc_js( (string) $address_lat ); ?>, <?php echo esc_js( (string) $address_lng ); ?>], { icon: markerIcon }).addTo(map);
})();
</script>
<?php endif; ?>

<?php if ( $show_agents && ! empty( $agents ) ) :
	// Build filtered agents list.
	$visible_agents = [];
	foreach ( $agents as $a ) {
		$a_name = is_object( $a ) ? ( $a->name ?? '' ) : ( $a['name'] ?? '' );
		if ( $a_name !== '' ) {
			$visible_agents[] = $a;
		}
	}
?>
<?php if ( ! empty( $visible_agents ) ) : ?>
<div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
<h3><?php echo esc_html( count( $visible_agents ) > 1 ? __( 'Ihre Ansprechpartner', 'resa' ) : __( 'Ihr Ansprechpartner', 'resa' ) ); ?></h3>
<table width="100%" cellspacing="0" cellpadding="0">
<?php
$chunks = array_chunk( $visible_agents, 2 );
foreach ( $chunks as $row ) :
?>
<tr>
<?php foreach ( $row as $a ) :
	$a_name     = is_object( $a ) ? ( $a->name ?? '' ) : ( $a['name'] ?? '' );
	$a_position = is_object( $a ) ? ( $a->position ?? '' ) : ( $a['position'] ?? '' );
	$a_email    = is_object( $a ) ? ( $a->email ?? '' ) : ( $a['email'] ?? '' );
	$a_phone    = is_object( $a ) ? ( $a->phone ?? '' ) : ( $a['phone'] ?? '' );
	$a_photo    = is_object( $a ) ? ( $a->photo_url ?? '' ) : ( $a['photo_url'] ?? '' );
?>
<td width="50%" style="padding: 5px; vertical-align: top;">
<table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
<tr>
<?php if ( $a_photo !== '' ) : ?>
<td width="50" style="padding: 10px 0 10px 10px; vertical-align: top;">
<img src="<?php echo $esc_image_src( $a_photo ); ?>" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
</td>
<?php else : ?>
<td width="50" style="padding: 10px 0 10px 10px; vertical-align: top;">
<div style="width: 40px; height: 40px; border-radius: 50%; background-color: #e2e8f0;"></div>
</td>
<?php endif; ?>
<td style="padding: 10px 10px 10px 8px; vertical-align: top;">
<div style="font-size: 12px; font-weight: bold; color: #0f172a;"><?php echo esc_html( $a_name ); ?></div>
<?php if ( $a_position !== '' ) : ?>
<div style="font-size: 10px; color: #64748b;"><?php echo esc_html( $a_position ); ?></div>
<?php endif; ?>
<?php if ( $a_phone !== '' ) : ?>
<div style="font-size: 10px; color: #334155; margin-top: 3px;"><?php echo esc_html( $a_phone ); ?></div>
<?php endif; ?>
<?php if ( $a_email !== '' ) : ?>
<div style="font-size: 10px; color: #334155;"><?php echo esc_html( $a_email ); ?></div>
<?php endif; ?>
</td>
</tr>
</table>
</td>
<?php endforeach; ?>
<?php if ( count( $row ) === 1 ) : ?>
<td width="50%"></td>
<?php endif; ?>
</tr>
<?php endforeach; ?>
</table>
</div>
<?php endif; ?>
<?php endif; ?>

<?php if ( $show_chart ) : ?>
<h2><?php esc_html_e( 'Marktvergleich', 'resa' ); ?></h2>
<p style="font-size: 10px; color: #64748b; margin-bottom: 12px;">
<?php esc_html_e( 'Vergleich Ihres geschätzten Mietpreises mit regionalen Durchschnittswerten (€/m²)', 'resa' ); ?>
</p>

<?php if ( $active_bar_chart !== '' ) : ?>
<div style="margin-bottom: 20px; text-align: center;">
<?php if ( $is_dompdf ) : ?>
<!-- DOMPDF: PNG via GD -->
<img src="<?php echo $esc_image_src( $active_bar_chart ); ?>" style="max-width: 100%; height: auto;">
<?php else : ?>
<!-- Puppeteer: Inline SVG -->
<?php
// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- SVG generated by SimpleBarChart, not user input.
echo $active_bar_chart;
?>
<?php endif; ?>
</div>
<?php endif; ?>
<?php endif; ?>

<?php if ( $show_factors && ! empty( $factors ) ) : ?>
<h2><?php esc_html_e( 'Einflussfaktoren', 'resa' ); ?></h2>
<p style="font-size: 10px; color: #64748b; margin-bottom: 10px;">
<?php esc_html_e( 'Diese Faktoren beeinflussen den geschätzten Immobilienwert:', 'resa' ); ?>
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

<?php if ( $show_disclaimer ) : ?>
<table width="100%" style="background-color: #fefce8; border: 1px solid #fef08a; margin-top: 20px;">
<tr>
<td style="padding: 10px; font-size: 9px; color: #713f12;">
<strong><?php esc_html_e( 'Hinweis:', 'resa' ); ?></strong>
<?php esc_html_e( 'Diese Analyse basiert auf statistischen Durchschnittswerten und dient der Orientierung. Der tatsächliche Verkaufswert kann je nach Marktlage, Ausstattungsdetails und Verhandlung abweichen. Für eine präzise Bewertung empfehlen wir eine persönliche Beratung.', 'resa' ); ?>
</td>
</tr>
</table>
<?php endif; ?>

<?php if ( $show_cta ) :
// CTA block — use first agent for the contact CTA.
$cta_agent_name  = '';
$cta_agent_phone = '';
if ( $show_agents && ! empty( $agents ) ) {
	$first = $agents[0];
	$cta_agent_name  = is_object( $first ) ? ( $first->name ?? '' ) : ( $first['name'] ?? '' );
	$cta_agent_phone = is_object( $first ) ? ( $first->phone ?? '' ) : ( $first['phone'] ?? '' );
} elseif ( $agent_name !== '' ) {
	$cta_agent_name  = $agent_name;
	$cta_agent_phone = $agent_phone;
}

// Custom CTA texts with {name} placeholder.
$cta_display_title = $cta_title_custom !== '' ? $cta_title_custom : __( 'Interesse an einer persönlichen Beratung?', 'resa' );
$cta_display_text  = $cta_text_custom !== ''
	? str_replace( '{name}', $cta_agent_name, $cta_text_custom )
	: sprintf( __( 'Kontaktieren Sie %s für eine unverbindliche Einschätzung.', 'resa' ), $cta_agent_name );
?>
<?php if ( $cta_agent_name !== '' ) : ?>
<table width="100%" style="background-color: #f0f9ff; border: 1px solid #bae6fd; margin-top: 16px;">
<tr>
<td style="padding: 14px; text-align: center;">
<div style="font-size: 12px; font-weight: bold; color: #0f172a; margin-bottom: 4px;">
<?php echo esc_html( $cta_display_title ); ?>
</div>
<div style="font-size: 10px; color: #475569;">
<?php echo esc_html( $cta_display_text ); ?>
</div>
<?php if ( $cta_agent_phone !== '' ) : ?>
<div style="font-size: 14px; font-weight: bold; color: <?php echo esc_attr( $primary_color ); ?>; margin-top: 8px;">
<?php echo esc_html( $cta_agent_phone ); ?>
</div>
<?php endif; ?>
</td>
</tr>
</table>
<?php endif; ?>
<?php endif; ?>

<!-- Footer -->
<?php
$broker = $broker ?? [];
$footer_parts = array_filter( [
	$broker['company'] ?? '',
	$broker['address'] ?? '',
	$broker['phone'] ?? '',
	$broker['email'] ?? '',
	$broker['website'] ?? '',
] );
$footer_address = implode( '  ·  ', $footer_parts );
?>
<table width="100%" style="margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
<?php if ( $footer_address !== '' ) : ?>
<tr>
<td colspan="2" style="font-size: 8px; color: #94a3b8; padding-bottom: 3px;">
<?php echo esc_html( $footer_address ); ?>
</td>
</tr>
<?php endif; ?>
<tr>
<td style="font-size: 8px; color: #94a3b8;"><?php echo esc_html( $display_footer ); ?></td>
<?php if ( $show_date ) : ?>
<td style="font-size: 8px; color: #94a3b8; text-align: right;"><?php echo esc_html( $current_date ); ?></td>
<?php endif; ?>
</tr>
</table>

</body>
</html>
