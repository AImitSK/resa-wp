/**
 * Dashboard page — KPIs, recent leads, quick actions.
 */

export function Dashboard() {
	return (
		<div>
			<h1 className="resa-text-2xl resa-font-bold resa-mb-4">Dashboard</h1>
			<p className="resa-text-muted-foreground">
				Übersicht über Leads, Conversions und aktive Assets.
			</p>

			<div className="resa-grid resa-grid-cols-4 resa-gap-4 resa-mt-6">
				<StatsCard label="Leads gesamt" value="—" />
				<StatsCard label="Neue Leads (30 Tage)" value="—" />
				<StatsCard label="Conversion-Rate" value="—" />
				<StatsCard label="Aktive Assets" value="—" />
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
