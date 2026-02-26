/**
 * Leads page — lead list with filters and search.
 */

import { __ } from '@wordpress/i18n';

export function Leads() {
	return (
		<div>
			<h1 className="resa-text-2xl resa-font-bold resa-mb-4">{__('Leads', 'resa')}</h1>
			<p className="resa-text-muted-foreground">
				{__('Alle erfassten Leads mit Filterung, Suche und Export.', 'resa')}
			</p>

			<div className="resa-mt-6 resa-rounded-lg resa-border resa-bg-card resa-p-6">
				<p className="resa-text-sm resa-text-muted-foreground">
					{__('Lead-Tabelle wird in Phase 3.4 implementiert.', 'resa')}
				</p>
			</div>
		</div>
	);
}
