/**
 * Admin shell layout — content wrapper.
 *
 * Navigation is handled by the WordPress admin sidebar submenus.
 * Each submenu click triggers a full page reload; the PHP-injected
 * `window.resaAdmin.page` slug determines the initial React route.
 */

import { Outlet } from 'react-router-dom';

export function Layout() {
	return (
		<main className="resa-mt-4">
			<Outlet />
		</main>
	);
}
