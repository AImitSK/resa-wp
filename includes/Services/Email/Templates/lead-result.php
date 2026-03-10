<?php
/**
 * Lead result email template.
 *
 * Sent to leads after form completion with PDF analysis attached.
 *
 * Available variables (all escaped):
 *   $lead_name       — Lead's full name
 *   $lead_salutation — Salutation (Herr/Frau)
 *   $asset_type      — Module name (e.g. "Mietpreis-Kalkulator")
 *   $result_summary  — Formatted result summary (HTML)
 *   $agent_name      — Agent's display name
 *   $agent_email     — Agent's email
 *   $agent_phone     — Agent's phone
 *   $agent_company   — Agent's company name
 *   $location_name   — Location/city name
 *   $site_name       — Website name
 *
 * @package Resa\Services\Email\Templates
 */

defined( 'ABSPATH' ) || exit;

$branding       = \Resa\Services\Email\EmailService::getBrandingVars();
$headerBg       = esc_attr( $branding['email_header_bg'] );
$headerColor    = \Resa\Services\Email\EmailService::getContrastColor( $branding['email_header_bg'] );
$subColor       = $headerColor === '#ffffff' ? 'rgba(255,255,255,0.6)' : 'rgba(30,41,59,0.5)';
$primaryColor   = esc_attr( $branding['primary_color'] );
$logoUrl        = $branding['logo_url'];
$showPoweredBy  = $branding['show_powered_by'];
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title><?php esc_html_e( 'Ihre Analyse', 'resa' ); ?></title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
	<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5;">
		<tr>
			<td style="padding: 40px 20px;">
				<table role="presentation" cellpadding="0" cellspacing="0" width="600" align="center" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

					<!-- Header -->
					<tr>
						<td style="background-color: <?php echo $headerBg; ?>; padding: 30px 40px; text-align: center;">
							<?php if ( ! empty( $logoUrl ) ) : ?>
								<img src="<?php echo esc_url( $logoUrl ); ?>" alt="<?php echo esc_attr( $site_name ); ?>" style="max-height: 50px; max-width: 200px; margin-bottom: 8px;" /><br />
							<?php endif; ?>
							<h1 style="margin: 0; color: <?php echo $headerColor; ?>; font-size: 24px; font-weight: 600;">
								<?php esc_html_e( 'Ihre Analyse ist fertig', 'resa' ); ?>
							</h1>
							<p style="margin: 10px 0 0; color: <?php echo $subColor; ?>; font-size: 14px;">
								<?php echo esc_html( $asset_type ); ?>
							</p>
						</td>
					</tr>

					<!-- Greeting -->
					<tr>
						<td style="padding: 30px 40px 20px;">
							<p style="margin: 0; color: #334155; font-size: 16px; line-height: 1.5;">
								<?php
								$greeting = $lead_salutation !== '' ? $lead_salutation . ' ' . $lead_name : $lead_name;
								/* translators: %s: Lead name with optional salutation */
								printf( esc_html__( 'Guten Tag %s,', 'resa' ), esc_html( $greeting ) );
								?>
							</p>
							<p style="margin: 15px 0 0; color: #475569; font-size: 15px; line-height: 1.6;">
								<?php esc_html_e( 'vielen Dank für Ihr Interesse! Wir haben Ihre Angaben ausgewertet und Ihre persönliche Analyse erstellt.', 'resa' ); ?>
							</p>
						</td>
					</tr>

					<!-- Result Summary (only if real data, not fallback text) -->
					<?php $hasConcreteSummary = ! empty( $result_summary ) && strpos( $result_summary, '€' ) !== false; ?>
					<?php if ( $hasConcreteSummary ) : ?>
					<tr>
						<td style="padding: 0 40px;">
							<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0f9ff; border-radius: 8px; border-left: 4px solid <?php echo $primaryColor; ?>;">
								<tr>
									<td style="padding: 20px 25px;">
										<h3 style="margin: 0 0 12px; color: #0f172a; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
											<?php esc_html_e( 'Ihr Ergebnis auf einen Blick', 'resa' ); ?>
										</h3>
										<div style="color: #1e40af; font-size: 15px; line-height: 1.8;">
											<?php
											// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Already escaped in buildResultSummary().
											echo $result_summary;
											?>
										</div>
									</td>
								</tr>
							</table>
						</td>
					</tr>
					<?php endif; ?>

					<!-- PDF Attachment Note -->
					<tr>
						<td style="padding: 25px 40px;">
							<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ecfdf5; border-radius: 8px; border: 1px solid #a7f3d0;">
								<tr>
									<td style="padding: 20px 25px;">
										<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
											<tr>
												<td style="width: 40px; vertical-align: top;">
													<div style="width: 32px; height: 32px; background-color: #10b981; border-radius: 50%; text-align: center; line-height: 32px; color: #ffffff; font-size: 16px;">
														&#128206;
													</div>
												</td>
												<td style="vertical-align: top; padding-left: 12px;">
													<p style="margin: 0; color: #065f46; font-size: 14px; font-weight: 600;">
														<?php esc_html_e( 'PDF-Analyse im Anhang', 'resa' ); ?>
													</p>
													<p style="margin: 6px 0 0; color: #047857; font-size: 13px; line-height: 1.5;">
														<?php esc_html_e( 'Die vollständige Analyse mit allen Details finden Sie als PDF im Anhang dieser E-Mail.', 'resa' ); ?>
													</p>
												</td>
											</tr>
										</table>
									</td>
								</tr>
							</table>
						</td>
					</tr>

					<!-- Agent Contact Section -->
					<?php if ( ! empty( $agent_name ) ) : ?>
					<tr>
						<td style="padding: 0 40px 25px;">
							<h3 style="margin: 0 0 15px; color: #0f172a; font-size: 16px; font-weight: 600;">
								<?php esc_html_e( 'Ihr Ansprechpartner', 'resa' ); ?>
							</h3>
							<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
								<tr>
									<td style="padding: 20px 25px;">
										<p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 600;">
											<?php echo esc_html( $agent_name ); ?>
										</p>
										<?php if ( ! empty( $agent_company ) ) : ?>
											<p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">
												<?php echo esc_html( $agent_company ); ?>
											</p>
										<?php endif; ?>

										<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 15px;">
											<?php if ( ! empty( $agent_phone ) ) : ?>
											<tr>
												<td style="padding: 4px 0;">
													<a href="tel:<?php echo esc_attr( $agent_phone ); ?>" style="color: <?php echo $primaryColor; ?>; font-size: 14px; text-decoration: none;">
														<?php esc_html_e( 'Tel.:', 'resa' ); ?> <?php echo esc_html( $agent_phone ); ?>
													</a>
												</td>
											</tr>
											<?php endif; ?>
											<?php if ( ! empty( $agent_email ) ) : ?>
											<tr>
												<td style="padding: 4px 0;">
													<a href="mailto:<?php echo esc_attr( $agent_email ); ?>" style="color: <?php echo $primaryColor; ?>; font-size: 14px; text-decoration: none;">
														<?php echo esc_html( $agent_email ); ?>
													</a>
												</td>
											</tr>
											<?php endif; ?>
										</table>
									</td>
								</tr>
							</table>
						</td>
					</tr>
					<?php endif; ?>

					<!-- CTA Button -->
					<?php if ( ! empty( $agent_phone ) ) : ?>
					<tr>
						<td style="padding: 10px 40px 30px; text-align: center;">
							<p style="margin: 0 0 15px; color: #475569; font-size: 14px;">
								<?php esc_html_e( 'Haben Sie Fragen zu Ihrer Analyse?', 'resa' ); ?>
							</p>
							<a href="tel:<?php echo esc_attr( $agent_phone ); ?>" style="display: inline-block; background-color: <?php echo $primaryColor; ?>; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 6px;">
								<?php esc_html_e( 'Jetzt anrufen', 'resa' ); ?>
							</a>
						</td>
					</tr>
					<?php endif; ?>

					<!-- Footer -->
					<tr>
						<td style="background-color: #f8fafc; padding: 25px 40px; border-top: 1px solid #e2e8f0;">
							<?php if ( ! empty( $branding['agent_company'] ) ) : ?>
								<p style="margin: 0 0 8px; color: #64748b; font-size: 13px; text-align: center; line-height: 1.6;">
									<?php echo esc_html( $branding['agent_company'] ); ?>
									<?php if ( ! empty( $branding['agent_website'] ) ) : ?>
										&middot; <a href="<?php echo esc_url( $branding['agent_website'] ); ?>" style="color: #64748b; text-decoration: underline;"><?php echo esc_html( $branding['agent_website'] ); ?></a>
									<?php endif; ?>
									<?php if ( ! empty( $branding['imprint_url'] ) ) : ?>
										&middot; <a href="<?php echo esc_url( $branding['imprint_url'] ); ?>" style="color: #64748b; text-decoration: underline;"><?php esc_html_e( 'Impressum', 'resa' ); ?></a>
									<?php endif; ?>
								</p>
							<?php endif; ?>
							<?php if ( $showPoweredBy ) : ?>
								<p style="margin: 0; color: #94a3b8; font-size: 11px; text-align: center;">
									<?php esc_html_e( 'Powered by RESA', 'resa' ); ?>
								</p>
							<?php endif; ?>
						</td>
					</tr>

				</table>
			</td>
		</tr>
	</table>
</body>
</html>
