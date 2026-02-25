/**
 * Smart Assets page — module store with card grid.
 *
 * Shows all available modules with their flag (free/pro/paid),
 * activation toggle, and link to settings.
 */

import type { ModuleSummary } from '../types';

/**
 * Placeholder modules until REST API delivers real data.
 */
const PLACEHOLDER_MODULES: ModuleSummary[] = [
	{
		slug: 'rent-calculator',
		name: 'Mietpreis-Kalkulator',
		description:
			'Berechnet die marktübliche Miete basierend auf Lage, Ausstattung und Zustand.',
		icon: 'haus',
		category: 'calculator',
		flag: 'free',
		active: false,
	},
	{
		slug: 'value-calculator',
		name: 'Immobilienwert-Kalkulator',
		description: 'Ermittelt den geschätzten Marktwert einer Immobilie.',
		icon: 'wohnung',
		category: 'calculator',
		flag: 'free',
		active: false,
	},
	{
		slug: 'cost-calculator',
		name: 'Kaufnebenkosten-Rechner',
		description: 'Berechnet Grunderwerbsteuer, Notar- und Maklerkosten.',
		icon: 'kaufen',
		category: 'calculator',
		flag: 'pro',
		active: false,
	},
	{
		slug: 'budget-calculator',
		name: 'Budgetrechner',
		description: 'Ermittelt das maximale Kaufbudget basierend auf Einkommen und Eigenkapital.',
		icon: 'gewerbe',
		category: 'calculator',
		flag: 'pro',
		active: false,
	},
];

export function ModuleStore() {
	return (
		<div>
			<h1 className="resa-text-2xl resa-font-bold resa-mb-4">Smart Assets</h1>
			<p className="resa-text-muted-foreground resa-mb-6">
				Aktiviere und konfiguriere deine Lead-Tools.
			</p>

			<div className="resa-grid resa-grid-cols-1 md:resa-grid-cols-2 lg:resa-grid-cols-3 resa-gap-4">
				{PLACEHOLDER_MODULES.map((module) => (
					<ModuleCard key={module.slug} module={module} />
				))}
			</div>
		</div>
	);
}

function ModuleCard({ module }: { module: ModuleSummary }) {
	return (
		<div className="resa-rounded-lg resa-border resa-bg-card resa-p-5">
			<div className="resa-flex resa-items-start resa-justify-between resa-mb-3">
				<h3 className="resa-font-semibold">{module.name}</h3>
				<FlagBadge flag={module.flag} />
			</div>

			<p className="resa-text-sm resa-text-muted-foreground resa-mb-4">
				{module.description}
			</p>

			<div className="resa-flex resa-items-center resa-justify-between">
				<span className="resa-text-xs resa-text-muted-foreground">
					{module.active ? 'Aktiv' : 'Inaktiv'}
				</span>
				{module.flag === 'pro' ? (
					<span className="resa-text-xs resa-font-medium resa-text-muted-foreground">
						Premium erforderlich
					</span>
				) : (
					<button
						type="button"
						className="resa-text-sm resa-font-medium resa-text-primary hover:resa-underline"
					>
						{module.active ? 'Einstellungen' : 'Aktivieren'}
					</button>
				)}
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
