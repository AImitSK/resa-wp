/**
 * Smart Assets page — module store with card grid.
 *
 * Shows all available modules with their flag (free/pro/paid),
 * activation toggle, and link to settings.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { __, sprintf } from '@wordpress/i18n';
import { useModules, useToggleModule } from '../hooks/useModules';
import type { ModuleSummary } from '../types';

type FilterOption = 'all' | 'active' | 'inactive';

export function ModuleStore() {
	const [filter, setFilter] = useState<FilterOption>('all');
	const [searchQuery, setSearchQuery] = useState('');

	const { data: modules, isLoading, error } = useModules();
	const toggleMutation = useToggleModule();

	// Sort: active modules first, then by name
	const filteredModules = useMemo(() => {
		if (!modules) return [];

		let result = [...modules];

		// Apply filter
		if (filter === 'active') {
			result = result.filter((m) => m.active);
		} else if (filter === 'inactive') {
			result = result.filter((m) => !m.active);
		}

		// Apply search
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(m) =>
					m.name.toLowerCase().includes(query) ||
					m.description.toLowerCase().includes(query),
			);
		}

		// Sort: active first, then alphabetically
		result.sort((a, b) => {
			if (a.active !== b.active) {
				return a.active ? -1 : 1;
			}
			return a.name.localeCompare(b.name, 'de');
		});

		return result;
	}, [modules, filter, searchQuery]);

	const activeCount = modules?.filter((m) => m.active).length ?? 0;
	const inactiveCount = modules?.filter((m) => !m.active).length ?? 0;
	const totalCount = modules?.length ?? 0;

	const handleToggle = (slug: string) => {
		toggleMutation.mutate(slug);
	};

	if (isLoading) {
		return (
			<div className="resa-flex resa-items-center resa-justify-center resa-py-12">
				<div className="resa-text-muted-foreground">
					{__('Module werden geladen...', 'resa')}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="resa-rounded-lg resa-border resa-border-destructive/50 resa-bg-destructive/10 resa-p-6">
				<h2 className="resa-text-lg resa-font-semibold resa-text-destructive">
					{__('Fehler beim Laden', 'resa')}
				</h2>
				<p className="resa-text-sm resa-text-muted-foreground resa-mt-2">
					{__('Die Module konnten nicht geladen werden.', 'resa')}
				</p>
			</div>
		);
	}

	return (
		<div>
			<h1 className="resa-text-2xl resa-font-bold resa-mb-4">{__('Smart Assets', 'resa')}</h1>
			<p className="resa-text-muted-foreground resa-mb-6">
				{__('Aktiviere und konfiguriere deine Lead-Tools.', 'resa')}
			</p>

			{/* Filter bar */}
			<div className="resa-flex resa-items-center resa-gap-4 resa-mb-6">
				{/* Filter tabs */}
				<div className="resa-flex resa-gap-1 resa-bg-muted resa-rounded-lg resa-p-1">
					<FilterButton
						active={filter === 'all'}
						onClick={() => setFilter('all')}
						label={sprintf(__('Alle (%d)', 'resa'), totalCount)}
					/>
					<FilterButton
						active={filter === 'active'}
						onClick={() => setFilter('active')}
						label={sprintf(__('Aktiv (%d)', 'resa'), activeCount)}
					/>
					<FilterButton
						active={filter === 'inactive'}
						onClick={() => setFilter('inactive')}
						label={sprintf(__('Inaktiv (%d)', 'resa'), inactiveCount)}
					/>
				</div>

				{/* Search */}
				<div className="resa-flex-1 resa-max-w-xs">
					<input
						type="search"
						placeholder={__('Suchen...', 'resa')}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="resa-w-full resa-px-3 resa-py-1.5 resa-text-sm resa-rounded-md resa-border resa-border-input resa-bg-background focus:resa-outline-none focus:resa-ring-2 focus:resa-ring-ring"
					/>
				</div>
			</div>

			{/* Module grid */}
			{filteredModules.length === 0 ? (
				<div className="resa-text-center resa-py-12 resa-text-muted-foreground">
					{modules?.length === 0
						? __('Keine Module registriert.', 'resa')
						: __('Keine Module gefunden.', 'resa')}
				</div>
			) : (
				<div className="resa-grid resa-grid-cols-1 md:resa-grid-cols-2 lg:resa-grid-cols-3 resa-gap-4">
					{filteredModules.map((module) => (
						<ModuleCard
							key={module.slug}
							module={module}
							onToggle={handleToggle}
							isToggling={toggleMutation.isPending}
						/>
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

function ModuleCard({
	module,
	onToggle,
	isToggling,
}: {
	module: ModuleSummary;
	onToggle: (slug: string) => void;
	isToggling: boolean;
}) {
	const navigate = useNavigate();
	const canAccess = module.flag === 'free' || module.active;

	const handleSettingsClick = () => {
		navigate(`/modules/${module.slug}/settings`);
	};

	const handleToggleClick = () => {
		onToggle(module.slug);
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
							title={__('Einstellungen', 'resa')}
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
					{module.active ? __('Aktiv', 'resa') : __('Inaktiv', 'resa')}
				</span>

				{module.flag === 'pro' && !module.active ? (
					<span className="resa-text-xs resa-font-medium resa-text-muted-foreground">
						{__('Premium erforderlich', 'resa')}
					</span>
				) : canAccess ? (
					<div className="resa-flex resa-gap-2">
						{module.active && (
							<button
								type="button"
								onClick={handleSettingsClick}
								className="resa-text-sm resa-font-medium resa-text-primary hover:resa-underline"
							>
								{__('Einstellungen', 'resa')}
							</button>
						)}
						<button
							type="button"
							onClick={handleToggleClick}
							disabled={isToggling}
							className={`resa-text-sm resa-font-medium hover:resa-underline disabled:resa-opacity-50 ${
								module.active ? 'resa-text-muted-foreground' : 'resa-text-primary'
							}`}
						>
							{module.active ? __('Deaktivieren', 'resa') : __('Aktivieren', 'resa')}
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
			{flag === 'free'
				? __('Free', 'resa')
				: flag === 'pro'
					? __('Pro', 'resa')
					: __('Add-on', 'resa')}
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
