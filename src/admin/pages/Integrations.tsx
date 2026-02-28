/**
 * Integrations page — CRM, webhooks, tracking setup.
 */

import { __ } from '@wordpress/i18n';
import { AdminPageLayout } from '../components/AdminPageLayout';

export function Integrations() {
	return (
		<AdminPageLayout
			variant="overview"
			title={__('Integrationen', 'resa')}
			description={__('CRM-Anbindungen, Webhooks und Tracking konfigurieren.', 'resa')}
		>
			<div className="resa-rounded-lg resa-border resa-bg-card resa-p-6">
				<p className="resa-text-sm resa-text-muted-foreground">
					{__('Integrationen werden in einer späteren Phase implementiert.', 'resa')}
				</p>
			</div>
		</AdminPageLayout>
	);
}
