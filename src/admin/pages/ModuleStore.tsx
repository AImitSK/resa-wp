/**
 * Smart Assets page — module store with card grid.
 *
 * Shows all available modules with their flag (free/pro/paid),
 * activation toggle, and link to settings.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ModuleSummary } from '../types';

type FilterOption = 'all' | 'active' | 'inactive';

/**
 * Placeholder modules until REST API delivers real data.
 */
const PLACEHOLDER_MODULES: ModuleSummary[] = [
	{
		slug: 'rent-calculator',
		name: 'Mietpreis-Kalkulator',
		description:
			'Berechnet die marktubliche Miete basierend auf Lage, Ausstattung und Zustand.',
		icon: 'haus',
		category: 'calculator',
		flag: 'free',
		active: true,
	},
	{
		slug: 'value-calculator',
		name: 'Immobilienwert-Kalkulator',
		description: 'Ermittelt den geschatzten Marktwert einer Immobilie.',
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
	const [filter, setFilter] = useState<FilterOption>('all');
	const [searchQuery, setSearchQuery] = useState('');

	// Sort: active modules first, then by name
	const filteredModules = useMemo(() => {
		let modules = [...PLACEHOLDER_MODULES];

		// Apply filter
		if (filter === 'active') {
			modules = modules.filter((m) => m.active);
		} else if (filter === 'inactive') {
			modules = modules.filter((m) => !m.active);
		}

		// Apply search
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			modules = modules.filter(
				(m) =>
					m.name.toLowerCase().includes(query) ||
					m.description.toLowerCase().includes(query),
			);
		}

		// Sort: active first, then alphabetically
		modules.sort((a, b) => {
			if (a.active !== b.active) {
				return a.active ? -1 : 1;
			}
			return a.name.localeCompare(b.name, 'de');
		});

		return modules;
	}, [filter, searchQuery]);

	const activeCount = PLACEHOLDER_MODULES.filter((m) => m.active).length;
	const inactiveCount = PLACEHOLDER_MODULES.filter((m) => !m.active).length;

	return (
		<div>
			<h1 className="resa-text-2xl resa-font-bold resa-mb-4">Smart Assets</h1>
			<p className="resa-text-muted-foreground resa-mb-6">
				Aktiviere und konfiguriere deine Lead-Tools.
			</p>

			{/* Filter bar */}
			<div className="resa-flex resa-items-center resa-gap-4 resa-mb-6">
				{/* Filter tabs */}
				<div className="resa-flex resa-gap-1 resa-bg-muted resa-rounded-lg resa-p-1">
					<FilterButton
						active={filter === 'all'}
						onClick={() => setFilter('all')}
						label={`Alle (${PLACEHOLDER_MODULES.length})`}
					/>
					<FilterButton
						active={filter === 'active'}
						onClick={() => setFilter('active')}
						label={`Aktiv (${activeCount})`}
					/>
					<FilterButton
						active={filter === 'inactive'}
						onClick={() => setFilter('inactive')}
						label={`Inaktiv (${inactiveCount})`}
					/>
				</div>

				{/* Search */}
				<div className="resa-flex-1 resa-max-w-xs">
					<input
						type="search"
						placeholder="Suchen..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="resa-w-full resa-px-3 resa-py-1.5 resa-text-sm resa-rounded-md resa-border resa-border-input resa-bg-background focus:resa-outline-none focus:resa-ring-2 focus:resa-ring-ring"
					/>
				</div>
			</div>

			{/* Module grid */}
			{filteredModules.length === 0 ? (
				<div className="resa-text-center resa-py-12 resa-text-muted-foreground">
					Keine Module gefunden.
				</div>
			) : (
				<div className="resa-grid resa-grid-cols-1 md:resa-grid-cols-2 lg:resa-grid-cols-3 resa-gap-4">
					{filteredModules.map((module) => (
						<ModuleCard key={module.slug} module={module} />
					))}
				</div>
			)}
		</div>
	);
}

function FilterButton({
	active,
	onClick,
	label,
}: {
	active: boolean;
	onClick: () => void;
	label: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`resa-px-3 resa-py-1 resa-text-sm resa-rounded-md resa-transition-colors ${
				active
					? 'resa-bg-background resa-shadow-sm resa-font-medium'
					: 'resa-text-muted-foreground hover:resa-text-foreground'
			}`}
		>
			{label}
		</button>
	);
}

function ModuleCard({ module }: { module: ModuleSummary }) {
	const navigate = useNavigate();
	const canAccess = module.flag === 'free' || module.active;

	const handleSettingsClick = () => {
		navigate(`/modules/${module.slug}/settings`);
	};

	return (
		<div
			className={`resa-rounded-lg resa-border resa-bg-card resa-p-5 ${
				module.active ? 'resa-border-primary/30' : ''
			}`}
		>
			<div className="resa-flex resa-items-start resa-justify-between resa-mb-3">
				<div className="resa-flex resa-items-center resa-gap-2">
					<h3 className="resa-font-semibold">{module.name}</h3>
					{module.active && (
						<button
							type="button"
							onClick={handleSettingsClick}
							className="resa-p-1 resa-rounded resa-text-muted-foreground hover:resa-text-foreground hover:resa-bg-muted"
							title="Einstellungen"
						>
							<SettingsIcon />
						</button>
					)}
				</div>
				<FlagBadge flag={module.flag} />
			</div>

			<p className="resa-text-sm resa-text-muted-foreground resa-mb-4">
				{module.description}
			</p>

			<div className="resa-flex resa-items-center resa-justify-between">
				<span
					className={`resa-text-xs ${
						module.active
							? 'resa-text-emerald-600 resa-font-medium'
							: 'resa-text-muted-foreground'
					}`}
				>
					{module.active ? 'Aktiv' : 'Inaktiv'}
				</span>

				{module.flag === 'pro' && !module.active ? (
					<span className="resa-text-xs resa-font-medium resa-text-muted-foreground">
						Premium erforderlich
					</span>
				) : canAccess ? (
					<div className="resa-flex resa-gap-2">
						{module.active && (
							<button
								type="button"
								onClick={handleSettingsClick}
								className="resa-text-sm resa-font-medium resa-text-primary hover:resa-underline"
							>
								Einstellungen
							</button>
						)}
						<button
							type="button"
							className={`resa-text-sm resa-font-medium hover:resa-underline ${
								module.active ? 'resa-text-muted-foreground' : 'resa-text-primary'
							}`}
						>
							{module.active ? 'Deaktivieren' : 'Aktivieren'}
						</button>
					</div>
				) : null}
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

function SettingsIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			className="resa-w-4 resa-h-4"
		>
			<path
				fillRule="evenodd"
				d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z"
				clipRule="evenodd"
			/>
		</svg>
	);
}
