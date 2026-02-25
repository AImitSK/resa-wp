/**
 * Admin shell layout — sidebar navigation + content area.
 *
 * The sidebar mirrors the WP-Admin submenus but navigates
 * via React Router (no page reloads).
 */

import { NavLink, Outlet } from 'react-router-dom';

interface NavItem {
	to: string;
	label: string;
}

const NAV_ITEMS: NavItem[] = [
	{ to: '/', label: 'Dashboard' },
	{ to: '/leads', label: 'Leads' },
	{ to: '/modules', label: 'Smart Assets' },
	{ to: '/locations', label: 'Locations' },
	{ to: '/communication', label: 'Kommunikation' },
	{ to: '/pdf', label: 'PDF-Vorlagen' },
	{ to: '/shortcode', label: 'Shortcode' },
	{ to: '/integrations', label: 'Integrationen' },
	{ to: '/settings', label: 'Einstellungen' },
];

export function Layout() {
	return (
		<div className="resa-flex resa-gap-6 resa-mt-4">
			<nav className="resa-w-52 resa-shrink-0">
				<ul className="resa-space-y-1">
					{NAV_ITEMS.map((item) => (
						<li key={item.to}>
							<NavLink
								to={item.to}
								end={item.to === '/'}
								className={({ isActive }) =>
									`resa-block resa-px-3 resa-py-2 resa-rounded-md resa-text-sm resa-font-medium resa-no-underline ${
										isActive
											? 'resa-bg-primary resa-text-primary-foreground'
											: 'resa-text-muted-foreground hover:resa-bg-muted hover:resa-text-foreground'
									}`
								}
							>
								{item.label}
							</NavLink>
						</li>
					))}
				</ul>
			</nav>

			<main className="resa-flex-1 resa-min-w-0">
				<Outlet />
			</main>
		</div>
	);
}
