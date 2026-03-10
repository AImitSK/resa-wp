/**
 * Client-side email template utilities for live preview.
 */

/**
 * Calculate contrast color (light or dark text) for a given background.
 */
function getContrastColor(hex: string): string {
	const h = hex.replace('#', '');
	const expanded = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h;
	const r = parseInt(expanded.substring(0, 2), 16) / 255;
	const g = parseInt(expanded.substring(2, 4), 16) / 255;
	const b = parseInt(expanded.substring(4, 6), 16) / 255;
	const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
	const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
	return luminance > 0.179 ? '#1e293b' : '#ffffff';
}

export const EmailService = {
	/**
	 * Replace {{variable}} placeholders with values.
	 */
	renderVariables(template: string, vars: Record<string, string>): string {
		let result = template;
		for (const [key, value] of Object.entries(vars)) {
			result = result.replaceAll(`{{${key}}}`, value);
		}
		return result;
	},

	/**
	 * Strip <span data-variable="...">...</span> wrappers, keeping inner text.
	 */
	stripVariableSpans(html: string): string {
		return html.replace(/<span\s+data-variable="[^"]*">(.*?)<\/span>/gi, '$1');
	},

	/**
	 * Wrap body HTML in the email layout (matches PHP EmailService::wrapInLayout).
	 */
	wrapInLayout(bodyHtml: string, subject?: string): string {
		const siteName = window.resaAdmin?.siteName || 'RESA';
		const branding = window.resaAdmin?.branding;
		const headerBg = branding?.emailHeaderBg || '#ffffff';
		const logoUrl = branding?.logoUrl || '';
		const headerColor = getContrastColor(headerBg);
		const subColor = headerColor === '#ffffff' ? 'rgba(255,255,255,0.6)' : 'rgba(30,41,59,0.5)';

		const logoHtml = logoUrl
			? `<img src="${logoUrl}" alt="${siteName}" style="max-height: 50px; max-width: 200px; margin-bottom: 8px;" /><br />`
			: '';

		// Footer company info.
		const company = branding?.agentCompany || '';
		const website = branding?.agentWebsite || '';
		const imprintUrl = branding?.imprintUrl || '';
		const showPoweredBy = branding?.showPoweredBy ?? true;

		const footerParts: string[] = [];
		if (company) footerParts.push(company);
		if (website)
			footerParts.push(
				`<a href="${website}" style="color: #64748b; text-decoration: underline;">${website}</a>`,
			);
		if (imprintUrl)
			footerParts.push(
				`<a href="${imprintUrl}" style="color: #64748b; text-decoration: underline;">Impressum</a>`,
			);

		const footerCompanyHtml = footerParts.length
			? `<p style="margin: 0 0 8px; color: #64748b; font-size: 13px; text-align: center; line-height: 1.6;">${footerParts.join(' &middot; ')}</p>`
			: '';

		const poweredByHtml = showPoweredBy
			? '<p style="margin: 0; color: #94a3b8; font-size: 11px; text-align: center;">Powered by RESA</p>'
			: '';

		return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	${subject ? `<title>${subject}</title>` : ''}
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
	<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5;">
		<tr>
			<td style="padding: 40px 20px;">
				<table role="presentation" cellpadding="0" cellspacing="0" width="600" align="center" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
					<!-- Header -->
					<tr>
						<td style="background-color: ${headerBg}; padding: 24px 40px; text-align: center;">
							${logoHtml}
							<p style="margin: 0; color: ${subColor}; font-size: 14px;">${siteName}</p>
						</td>
					</tr>
					<!-- Body -->
					<tr>
						<td style="padding: 30px 40px; color: #334155; font-size: 15px; line-height: 1.6;">
							${bodyHtml}
						</td>
					</tr>
					<!-- Footer -->
					<tr>
						<td style="background-color: #f8fafc; padding: 25px 40px; border-top: 1px solid #e2e8f0;">
							${footerCompanyHtml}
							${poweredByHtml}
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`;
	},
};
