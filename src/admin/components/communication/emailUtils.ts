/**
 * Client-side email template utilities for live preview.
 */

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
						<td style="background-color: #0f172a; padding: 24px 40px; text-align: center;">
							<p style="margin: 0; color: #94a3b8; font-size: 14px;">${siteName}</p>
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
							<p style="margin: 0; color: #64748b; font-size: 13px; text-align: center; line-height: 1.6;">
								Diese E-Mail wurde automatisch von RESA gesendet.
							</p>
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
