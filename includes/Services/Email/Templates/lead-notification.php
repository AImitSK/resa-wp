<?php
/**
 * Lead notification email template.
 *
 * Sent to agents when a new lead completes the form.
 *
 * Available variables (all escaped):
 *   $agent_name     — Agent's display name
 *   $lead_name      — Lead's full name
 *   $lead_email     — Lead's email address
 *   $lead_phone     — Lead's phone number
 *   $lead_company   — Lead's company
 *   $lead_message   — Lead's message
 *   $asset_type     — Module name (e.g. "Mietpreis-Kalkulator")
 *   $location_name  — Location/city name
 *   $result_summary — Formatted result (HTML)
 *   $admin_url      — Link to leads admin page
 *   $site_name      — Website name
 *   $created_at     — Formatted timestamp
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
	<title><?php esc_html_e( 'Neuer Lead', 'resa' ); ?></title>
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
								<?php esc_html_e( 'Neuer Lead eingegangen', 'resa' ); ?>
							</h1>
							<p style="margin: 10px 0 0; color: <?php echo $subColor; ?>; font-size: 14px;">
								<?php echo esc_html( $site_name ); ?>
							</p>
						</td>
					</tr>

					<!-- Greeting -->
					<tr>
						<td style="padding: 30px 40px 20px;">
							<p style="margin: 0; color: #334155; font-size: 16px; line-height: 1.5;">
								<?php
								/* translators: %s: Agent name */
								printf( esc_html__( 'Hallo %s,', 'resa' ), esc_html( $agent_name ) );
								?>
							</p>
							<p style="margin: 15px 0 0; color: #475569; font-size: 15px; line-height: 1.6;">
								<?php esc_html_e( 'ein neuer Lead hat soeben das Formular ausgefüllt. Hier sind die Details:', 'resa' ); ?>
							</p>
						</td>
					</tr>

					<!-- Lead Info Card -->
					<tr>
						<td style="padding: 0 40px;">
							<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
								<tr>
									<td style="padding: 25px;">

										<!-- Tool Badge -->
										<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
											<tr>
												<td>
													<span style="display: inline-block; background-color: <?php echo $primaryColor; ?>; color: #ffffff; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
														<?php echo esc_html( $asset_type ); ?>
													</span>
												</td>
											</tr>
										</table>

										<!-- Contact Details -->
										<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px;">
											<tr>
												<td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
													<span style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;"><?php esc_html_e( 'Name', 'resa' ); ?></span><br />
													<span style="color: #0f172a; font-size: 16px; font-weight: 600;"><?php echo esc_html( $lead_name ); ?></span>
												</td>
											</tr>
											<tr>
												<td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
													<span style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;"><?php esc_html_e( 'E-Mail', 'resa' ); ?></span><br />
													<a href="mailto:<?php echo esc_attr( $lead_email ); ?>" style="color: <?php echo $primaryColor; ?>; font-size: 15px; text-decoration: none;"><?php echo esc_html( $lead_email ); ?></a>
												</td>
											</tr>
											<?php if ( ! empty( $lead_phone ) ) : ?>
											<tr>
												<td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
													<span style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;"><?php esc_html_e( 'Telefon', 'resa' ); ?></span><br />
													<a href="tel:<?php echo esc_attr( $lead_phone ); ?>" style="color: <?php echo $primaryColor; ?>; font-size: 15px; text-decoration: none;"><?php echo esc_html( $lead_phone ); ?></a>
												</td>
											</tr>
											<?php endif; ?>
											<?php if ( ! empty( $lead_company ) ) : ?>
											<tr>
												<td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
													<span style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;"><?php esc_html_e( 'Unternehmen', 'resa' ); ?></span><br />
													<span style="color: #0f172a; font-size: 15px;"><?php echo esc_html( $lead_company ); ?></span>
												</td>
											</tr>
											<?php endif; ?>
											<tr>
												<td style="padding: 8px 0;">
													<span style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;"><?php esc_html_e( 'Standort', 'resa' ); ?></span><br />
													<span style="color: #0f172a; font-size: 15px;"><?php echo esc_html( $location_name ); ?></span>
												</td>
											</tr>
										</table>

									</td>
								</tr>
							</table>
						</td>
					</tr>

					<!-- Result Summary -->
					<tr>
						<td style="padding: 25px 40px;">
							<h3 style="margin: 0 0 15px; color: #0f172a; font-size: 16px; font-weight: 600;">
								<?php esc_html_e( 'Berechnungsergebnis', 'resa' ); ?>
							</h3>
							<div style="background-color: #ecfdf5; border-radius: 6px; padding: 15px 20px; border-left: 4px solid #10b981;">
								<p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.8;">
									<?php
									// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Already escaped in buildResultSummary().
									echo $result_summary;
									?>
								</p>
							</div>
						</td>
					</tr>

					<?php if ( ! empty( $lead_message ) ) : ?>
					<!-- Message -->
					<tr>
						<td style="padding: 0 40px 25px;">
							<h3 style="margin: 0 0 15px; color: #0f172a; font-size: 16px; font-weight: 600;">
								<?php esc_html_e( 'Nachricht des Leads', 'resa' ); ?>
							</h3>
							<div style="background-color: #f8fafc; border-radius: 6px; padding: 15px 20px; border: 1px solid #e2e8f0;">
								<p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6; font-style: italic;">
									"<?php echo esc_html( $lead_message ); ?>"
								</p>
							</div>
						</td>
					</tr>
					<?php endif; ?>

					<!-- CTA Button -->
					<tr>
						<td style="padding: 10px 40px 30px; text-align: center;">
							<a href="<?php echo esc_url( $admin_url ); ?>" style="display: inline-block; background-color: <?php echo $primaryColor; ?>; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 6px;">
								<?php esc_html_e( 'Lead im Admin ansehen', 'resa' ); ?>
							</a>
						</td>
					</tr>

					<!-- Timestamp -->
					<tr>
						<td style="padding: 0 40px 30px;">
							<p style="margin: 0; color: #94a3b8; font-size: 13px; text-align: center;">
								<?php
								/* translators: %s: Formatted date and time */
								printf( esc_html__( 'Eingegangen am %s', 'resa' ), esc_html( $created_at ) );
								?>
							</p>
						</td>
					</tr>

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
							<p style="margin: 0 0 4px; color: #64748b; font-size: 13px; text-align: center; line-height: 1.6;">
								<a href="<?php echo esc_url( admin_url( 'admin.php?page=resa-settings' ) ); ?>" style="color: <?php echo $primaryColor; ?>; text-decoration: none;">
									<?php esc_html_e( 'Benachrichtigungseinstellungen anpassen', 'resa' ); ?>
								</a>
							</p>
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
