/**
 * PDF Templates page — base layout and per-asset block editor.
 */

import { __ } from '@wordpress/i18n';
import { AdminPageLayout } from '../components/AdminPageLayout';

export function PdfTemplates() {
	return (
		<AdminPageLayout
			variant="overview"
			title={__('PDF-Vorlagen', 'resa')}
			description={__(
				'Basis-Layout und Asset-spezifische PDF-Vorlagen konfigurieren.',
				'resa',
			)}
		>
			<div className="resa-rounded-lg resa-border resa-bg-card resa-p-6">
				<p className="resa-text-sm resa-text-muted-foreground">
					{__('PDF-Designer wird in Phase 3.5 implementiert.', 'resa')}
				</p>
			</div>
		</AdminPageLayout>
	);
}
