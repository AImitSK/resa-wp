<?php
/**
 * Base PDF layout template.
 *
 * Variables available via extract():
 *
 * @var string $title       Document title.
 * @var string $content     Main HTML content.
 * @var string $logo_url    Branding logo URL (optional).
 * @var string $primary_color Primary brand color (default: #3b82f6).
 * @var string $agent_name  Agent name (optional).
 * @var string $agent_phone Agent phone (optional).
 * @var string $agent_email Agent email (optional).
 * @var bool   $is_dompdf   Whether rendering via DOMPDF.
 *
 * @package Resa\Services\Pdf
 */

defined( 'ABSPATH' ) || exit;

// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- Template variable, not overriding WP global.
$title         = isset( $title ) ? $title : '';
$content       = $content ?? '';
$primary_color = $primary_color ?? '#3b82f6';
$logo_url      = $logo_url ?? '';
$agent_name    = $agent_name ?? '';
$agent_phone   = $agent_phone ?? '';
$agent_email   = $agent_email ?? '';
$branding_text = $branding_text ?? 'RESA — Real Estate Smart Assets';
?>
<!DOCTYPE html>
<html lang="de">
<head>
	<meta charset="UTF-8">
	<title><?php echo esc_html( $title ); ?></title>
	<style>
		/* === Reset === */
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}

		body {
			font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
			font-size: 13px;
			line-height: 1.5;
			color: #1e293b;
		}

		/* === Page === */
		.page {
			width: 210mm;
			min-height: 287mm;
			padding: 20mm 15mm 25mm 15mm;
			page-break-after: always;
			position: relative;
		}

		.page:last-child {
			page-break-after: avoid;
		}

		/* === Header === */
		.pdf-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding-bottom: 12px;
			border-bottom: 2px solid <?php echo esc_attr( $primary_color ); ?>;
			margin-bottom: 24px;
		}

		.pdf-header img {
			max-height: 40px;
			max-width: 180px;
		}

		.pdf-header .brand-text {
			font-size: 10px;
			color: #94a3b8;
		}

		/* === Typography === */
		h1 {
			font-size: 24px;
			font-weight: 700;
			color: #0f172a;
			margin-bottom: 16px;
		}

		h2 {
			font-size: 18px;
			font-weight: 600;
			color: #1e293b;
			margin-bottom: 12px;
			margin-top: 24px;
		}

		h3 {
			font-size: 14px;
			font-weight: 600;
			color: #334155;
			margin-bottom: 8px;
		}

		p {
			margin-bottom: 10px;
		}

		/* === Result Box === */
		.result-box {
			background-color: #f0f9ff;
			border: 1px solid #bae6fd;
			border-left: 4px solid <?php echo esc_attr( $primary_color ); ?>;
			padding: 16px 20px;
			margin: 16px 0;
			border-radius: 4px;
		}

		.result-box .value {
			font-size: 28px;
			font-weight: 700;
			color: <?php echo esc_attr( $primary_color ); ?>;
		}

		.result-box .label {
			font-size: 12px;
			color: #64748b;
			margin-top: 4px;
		}

		/* === Chart Container === */
		.chart-container {
			margin: 16px 0;
			text-align: center;
		}

		.chart-container svg {
			max-width: 100%;
		}

		/* === Table === */
		table {
			width: 100%;
			border-collapse: collapse;
			margin: 12px 0;
		}

		th, td {
			padding: 8px 12px;
			text-align: left;
			border-bottom: 1px solid #e2e8f0;
		}

		th {
			background-color: #f8fafc;
			font-weight: 600;
			font-size: 12px;
			color: #64748b;
			text-transform: uppercase;
		}

		/* === Agent Card === */
		.agent-card {
			background-color: #f8fafc;
			border: 1px solid #e2e8f0;
			border-radius: 8px;
			padding: 20px;
			margin-top: 24px;
		}

		.agent-card .name {
			font-size: 16px;
			font-weight: 600;
			color: #0f172a;
		}

		.agent-card .contact {
			font-size: 12px;
			color: #64748b;
			margin-top: 4px;
		}

		/* === Footer === */
		.pdf-footer {
			position: absolute;
			bottom: 10mm;
			left: 15mm;
			right: 15mm;
			border-top: 1px solid #e2e8f0;
			padding-top: 8px;
			font-size: 9px;
			color: #94a3b8;
			display: flex;
			justify-content: space-between;
		}

		/* === Utilities === */
		.text-center { text-align: center; }
		.text-right { text-align: right; }
		.text-muted { color: #64748b; }
		.text-small { font-size: 11px; }
		.mt-4 { margin-top: 16px; }
		.mb-4 { margin-bottom: 16px; }
		.flex { display: flex; }
		.gap-4 { gap: 16px; }
	</style>
</head>
<body>
	<div class="page">
		<!-- Header -->
		<div class="pdf-header">
			<?php if ( $logo_url !== '' ) : ?>
				<img src="<?php echo esc_url( $logo_url ); ?>" alt="">
			<?php else : ?>
				<span class="brand-text"><?php echo esc_html( $branding_text ); ?></span>
			<?php endif; ?>
			<span class="brand-text"><?php echo esc_html( gmdate( 'd.m.Y' ) ); ?></span>
		</div>

		<!-- Title -->
		<?php if ( $title !== '' ) : ?>
			<h1><?php echo esc_html( $title ); ?></h1>
		<?php endif; ?>

		<!-- Content -->
		<?php
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $content is pre-built HTML from trusted template rendering.
		echo $content;
		?>

		<!-- Agent Card -->
		<?php if ( $agent_name !== '' ) : ?>
			<div class="agent-card">
				<div class="name"><?php echo esc_html( $agent_name ); ?></div>
				<?php if ( $agent_phone !== '' || $agent_email !== '' ) : ?>
					<div class="contact">
						<?php
						$contact_parts = [];
						if ( $agent_phone !== '' ) {
							$contact_parts[] = esc_html( $agent_phone );
						}
						if ( $agent_email !== '' ) {
							$contact_parts[] = esc_html( $agent_email );
						}
						// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Each part already escaped above.
						echo implode( ' | ', $contact_parts );
						?>
					</div>
				<?php endif; ?>
			</div>
		<?php endif; ?>

		<!-- Footer -->
		<div class="pdf-footer">
			<span><?php echo esc_html( $branding_text ); ?></span>
			<span><?php echo esc_html( gmdate( 'd.m.Y' ) ); ?></span>
		</div>
	</div>
</body>
</html>
