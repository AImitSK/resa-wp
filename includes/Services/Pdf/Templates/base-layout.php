<?php
/**
 * Base PDF layout template.
 *
 * Variables available via extract():
 *
 * @var string $title          Document title.
 * @var string $content        Main HTML content.
 * @var string $logo_url       Branding logo URL (optional).
 * @var string $primary_color  Primary brand color (default: #3b82f6).
 * @var string $header_text    Custom header text (optional).
 * @var string $footer_text    Custom footer text (optional).
 * @var bool   $show_date      Whether to show date in header/footer.
 * @var bool   $show_agents    Whether to show agents block.
 * @var array  $margins        Page margins [top, bottom, left, right] in mm.
 * @var array  $agents         Array of agent objects (name, position, email, phone, photo_url).
 * @var string $agent_name     Legacy: single agent name (fallback).
 * @var string $agent_phone    Legacy: single agent phone (fallback).
 * @var string $agent_email    Legacy: single agent email (fallback).
 * @var bool   $is_dompdf      Whether rendering via DOMPDF.
 *
 * @package Resa\Services\Pdf
 */

defined( 'ABSPATH' ) || exit;

// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- Template variable, not overriding WP global.
$title         = isset( $title ) ? $title : '';
$content       = $content ?? '';
$primary_color = $primary_color ?? '#3b82f6';
$logo_url      = $logo_url ?? '';
$header_text   = $header_text ?? '';
$footer_text   = $footer_text ?? '';
$show_date     = $show_date ?? true;
$show_agents   = $show_agents ?? true;
$margins       = $margins ?? [ 'top' => 20, 'bottom' => 25, 'left' => 15, 'right' => 15 ];
$agents        = $agents ?? [];
$branding_text = $branding_text ?? 'RESA — Real Estate Smart Assets';

// Legacy fallback: if no agents array but single agent data exists, build one.
if ( empty( $agents ) && ! empty( $agent_name ) ) {
	$agents = [
		(object) [
			'name'      => $agent_name ?? '',
			'position'  => '',
			'email'     => $agent_email ?? '',
			'phone'     => $agent_phone ?? '',
			'photo_url' => '',
		],
	];
}

$m_top    = absint( $margins['top'] ?? 20 );
$m_bottom = absint( $margins['bottom'] ?? 25 );
$m_left   = absint( $margins['left'] ?? 15 );
$m_right  = absint( $margins['right'] ?? 15 );

$display_brand = $header_text !== '' ? $header_text : $branding_text;
$display_footer = $footer_text !== '' ? $footer_text : $branding_text;
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
			padding: <?php echo esc_attr( "{$m_top}mm {$m_right}mm {$m_bottom}mm {$m_left}mm" ); ?>;
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

		/* === Agent Section === */
		.agents-section {
			margin-top: 32px;
			padding-top: 16px;
			border-top: 1px solid #e2e8f0;
		}

		.agents-section h3 {
			font-size: 14px;
			font-weight: 600;
			color: #334155;
			margin-bottom: 12px;
		}

		.agents-grid {
			display: flex;
			flex-wrap: wrap;
			gap: 12px;
		}

		.agent-card {
			flex: 1 1 calc(50% - 6px);
			min-width: 200px;
			background-color: #f8fafc;
			border: 1px solid #e2e8f0;
			border-radius: 8px;
			padding: 16px;
			display: flex;
			gap: 12px;
			align-items: flex-start;
		}

		.agent-card .agent-photo {
			width: 48px;
			height: 48px;
			border-radius: 50%;
			object-fit: cover;
			flex-shrink: 0;
		}

		.agent-card .agent-photo-placeholder {
			width: 48px;
			height: 48px;
			border-radius: 50%;
			background-color: #e2e8f0;
			flex-shrink: 0;
		}

		.agent-card .agent-info .name {
			font-size: 14px;
			font-weight: 600;
			color: #0f172a;
		}

		.agent-card .agent-info .position {
			font-size: 12px;
			color: #64748b;
			margin-top: 2px;
		}

		.agent-card .agent-info .contact {
			font-size: 12px;
			color: #64748b;
			margin-top: 4px;
		}

		/* === Footer === */
		.pdf-footer {
			position: absolute;
			bottom: <?php echo esc_attr( max( $m_bottom - 15, 5 ) ); ?>mm;
			left: <?php echo esc_attr( $m_left ); ?>mm;
			right: <?php echo esc_attr( $m_right ); ?>mm;
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
				<span class="brand-text"><?php echo esc_html( $display_brand ); ?></span>
			<?php endif; ?>
			<?php if ( $show_date ) : ?>
				<span class="brand-text"><?php echo esc_html( gmdate( 'd.m.Y' ) ); ?></span>
			<?php endif; ?>
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

		<!-- Agents -->
		<?php if ( $show_agents && ! empty( $agents ) ) : ?>
			<div class="agents-section">
				<h3><?php echo esc_html__( 'Ihre Ansprechpartner', 'resa' ); ?></h3>
				<div class="agents-grid">
					<?php foreach ( $agents as $agent ) : ?>
						<?php
						$a_name     = is_object( $agent ) ? ( $agent->name ?? '' ) : ( $agent['name'] ?? '' );
						$a_position = is_object( $agent ) ? ( $agent->position ?? '' ) : ( $agent['position'] ?? '' );
						$a_email    = is_object( $agent ) ? ( $agent->email ?? '' ) : ( $agent['email'] ?? '' );
						$a_phone    = is_object( $agent ) ? ( $agent->phone ?? '' ) : ( $agent['phone'] ?? '' );
						$a_photo    = is_object( $agent ) ? ( $agent->photo_url ?? '' ) : ( $agent['photo_url'] ?? '' );
						?>
						<?php if ( $a_name !== '' ) : ?>
							<div class="agent-card">
								<?php if ( $a_photo !== '' ) : ?>
									<img class="agent-photo" src="<?php echo esc_url( $a_photo ); ?>" alt="<?php echo esc_attr( $a_name ); ?>">
								<?php else : ?>
									<div class="agent-photo-placeholder"></div>
								<?php endif; ?>
								<div class="agent-info">
									<div class="name"><?php echo esc_html( $a_name ); ?></div>
									<?php if ( $a_position !== '' ) : ?>
										<div class="position"><?php echo esc_html( $a_position ); ?></div>
									<?php endif; ?>
									<?php if ( $a_phone !== '' || $a_email !== '' ) : ?>
										<div class="contact">
											<?php if ( $a_phone !== '' ) : ?>
												<?php echo esc_html( $a_phone ); ?><br>
											<?php endif; ?>
											<?php if ( $a_email !== '' ) : ?>
												<?php echo esc_html( $a_email ); ?>
											<?php endif; ?>
										</div>
									<?php endif; ?>
								</div>
							</div>
						<?php endif; ?>
					<?php endforeach; ?>
				</div>
			</div>
		<?php endif; ?>

		<!-- Footer -->
		<div class="pdf-footer">
			<span><?php echo esc_html( $display_footer ); ?></span>
			<?php if ( $show_date ) : ?>
				<span><?php echo esc_html( gmdate( 'd.m.Y' ) ); ?></span>
			<?php endif; ?>
		</div>
	</div>
</body>
</html>
