/**
 * Overview tab — Module info and status display.
 */

import type { ModuleInfo } from '../../hooks/useModuleSettings';

interface OverviewTabProps {
	module: ModuleInfo;
}

export function OverviewTab({ module }: OverviewTabProps) {
	return (
		<div className="resa-space-y-6">
			{/* Module info card */}
			<div className="resa-rounded-lg resa-border resa-bg-card resa-p-6">
				<div className="resa-flex resa-items-start resa-gap-4">
					<div className="resa-w-12 resa-h-12 resa-rounded-lg resa-bg-primary/10 resa-flex resa-items-center resa-justify-center">
						<span className="resa-text-2xl">
							{module.icon === 'haus' ? '🏠' : '📊'}
						</span>
					</div>
					<div className="resa-flex-1">
						<h2 className="resa-text-xl resa-font-semibold">{module.name}</h2>
						<p className="resa-text-muted-foreground resa-mt-1">{module.description}</p>
						<div className="resa-flex resa-gap-2 resa-mt-3">
							<FlagBadge flag={module.flag} />
							<StatusBadge active={module.active} />
						</div>
					</div>
				</div>
			</div>

			{/* Quick stats */}
			<div className="resa-grid resa-grid-cols-3 resa-gap-4">
				<StatCard
					label="Kategorie"
					value={module.category === 'calculator' ? 'Kalkulator' : module.category}
				/>
				<StatCard label="Status" value={module.active ? 'Aktiv' : 'Inaktiv'} />
				<StatCard
					label="Plan"
					value={
						module.flag === 'free' ? 'Free' : module.flag === 'pro' ? 'Pro' : 'Add-on'
					}
				/>
			</div>

			{/* Documentation link */}
			<div className="resa-rounded-lg resa-border resa-bg-muted/50 resa-p-4">
				<h3 className="resa-font-medium resa-mb-2">Dokumentation</h3>
				<p className="resa-text-sm resa-text-muted-foreground">
					Weitere Informationen zur Konfiguration und Verwendung dieses Moduls findest du
					in der{' '}
					<a href="#" className="resa-text-primary hover:resa-underline">
						Dokumentation
					</a>
					.
				</p>
			</div>
		</div>
	);
}

function FlagBadge({ flag }: { flag: string }) {
	const styles: Record<string, string> = {
		free: 'resa-bg-green-100 resa-text-green-800',
		pro: 'resa-bg-blue-100 resa-text-blue-800',
		paid: 'resa-bg-purple-100 resa-text-purple-800',
	};

	return (
		<span
			className={`resa-text-xs resa-font-medium resa-px-2 resa-py-0.5 resa-rounded-full ${styles[flag] ?? ''}`}
		>
			{flag === 'free' ? 'Free' : flag === 'pro' ? 'Pro' : 'Add-on'}
		</span>
	);
}

function StatusBadge({ active }: { active: boolean }) {
	return (
		<span
			className={`resa-text-xs resa-font-medium resa-px-2 resa-py-0.5 resa-rounded-full ${
				active
					? 'resa-bg-emerald-100 resa-text-emerald-800'
					: 'resa-bg-gray-100 resa-text-gray-600'
			}`}
		>
			{active ? 'Aktiv' : 'Inaktiv'}
		</span>
	);
}

function StatCard({ label, value }: { label: string; value: string }) {
	return (
		<div className="resa-rounded-lg resa-border resa-bg-card resa-p-4">
			<div className="resa-text-xs resa-text-muted-foreground resa-uppercase resa-tracking-wide">
				{label}
			</div>
			<div className="resa-text-lg resa-font-semibold resa-mt-1">{value}</div>
		</div>
	);
}
