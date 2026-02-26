/**
 * Dashboard page — KPIs, recent leads, quick actions.
 */

import { __ } from '@wordpress/i18n';

export function Dashboard() {
	return (
		<div>
			<h1 className="resa-text-2xl resa-font-bold resa-mb-4">{__('Dashboard', 'resa')}</h1>
			<p className="resa-text-muted-foreground">
				{__('Übersicht über Leads, Conversions und aktive Assets.', 'resa')}
			</p>

			<div className="resa-grid resa-grid-cols-4 resa-gap-4 resa-mt-6">
				<StatsCard label={__('Leads gesamt', 'resa')} value="—" />
				<StatsCard label={__('Neue Leads (30 Tage)', 'resa')} value="—" />
				<StatsCard label={__('Conversion-Rate', 'resa')} value="—" />
				<StatsCard label={__('Aktive Assets', 'resa')} value="—" />
			</div>
		</div>
	);
}

function StatsCard({ label, value }: { label: string; value: string }) {
	return (
		<div className="resa-rounded-lg resa-border resa-bg-card resa-p-4">
			<p className="resa-text-sm resa-text-muted-foreground">{label}</p>
			<p className="resa-text-2xl resa-font-bold resa-mt-1">{value}</p>
		</div>
	);
}
