/**
 * Shortcode Generator page — visual builder for [resa] shortcodes.
 */

import { __ } from '@wordpress/i18n';
import { AdminPageLayout } from '../components/AdminPageLayout';

export function ShortcodeGenerator() {
	return (
		<AdminPageLayout
			variant="overview"
			title={__('Shortcode Generator', 'resa')}
			description={__('Visueller Builder zum Erstellen von [resa] Shortcodes.', 'resa')}
		>
			<div className="resa-rounded-lg resa-border resa-bg-card resa-p-6">
				<p className="resa-text-sm resa-text-muted-foreground">
					{__('Shortcode Generator wird in einer späteren Phase implementiert.', 'resa')}
				</p>
			</div>
		</AdminPageLayout>
	);
}
