/**
 * Live email template preview in an iframe.
 *
 * Replaces {{variable}} and <span data-variable> with example values.
 * Debounced updates (500ms), 600px max-width, rendered in resizable panel.
 */

import { useState, useEffect, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import { EmailService } from './emailUtils';

interface TemplatePreviewProps {
	subject: string;
	body: string;
	exampleValues: Record<string, string>;
}

export function TemplatePreview({ subject, body, exampleValues }: TemplatePreviewProps) {
	const [previewHtml, setPreviewHtml] = useState('');
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
		}

		timerRef.current = setTimeout(() => {
			const renderedSubject = EmailService.renderVariables(subject, exampleValues);
			const renderedBody = EmailService.renderVariables(
				EmailService.stripVariableSpans(body),
				exampleValues,
			);

			const html = EmailService.wrapInLayout(renderedBody, renderedSubject);
			setPreviewHtml(html);
		}, 500);

		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, [subject, body, exampleValues]);

	return (
		<div className="resa-flex resa-flex-col resa-h-full resa-space-y-3">
			<h3 className="resa-text-sm resa-font-medium">{__('Vorschau', 'resa')}</h3>
			<div className="resa-flex-1 resa-overflow-hidden resa-rounded-lg resa-border resa-bg-muted/30">
				<iframe
					srcDoc={previewHtml}
					title={__('E-Mail-Vorschau', 'resa')}
					className="resa-w-full resa-h-full resa-border-0"
					style={{ minHeight: '500px' }}
					sandbox="allow-same-origin"
				/>
			</div>
		</div>
	);
}
