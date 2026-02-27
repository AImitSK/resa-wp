/**
 * Admin shell layout — content wrapper with logo in page headers.
 *
 * Navigation is handled by the WordPress admin sidebar submenus.
 * Each submenu click triggers a full page reload; the PHP-injected
 * `window.resaAdmin.page` slug determines the initial React route.
 */

import { Outlet } from 'react-router-dom';

export function Layout() {
	return (
		<main className="resa-max-w-6xl resa-ml-0 resa-mr-auto resa-pr-4 resa-py-6">
			<Outlet />
		</main>
	);
}

/**
 * Page header component with logo on the right.
 * Use this in each page for consistent header styling.
 */
export function PageHeader({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children?: React.ReactNode;
}) {
	const pluginUrl = window.resaAdmin?.pluginUrl ?? '';
	const logoUrl = `${pluginUrl}assets/images/resa-smart-assets.png`;

	return (
		<div className="resa-flex resa-items-start resa-justify-between resa-mb-6">
			<div>
				<h1 className="resa-text-2xl resa-font-bold resa-tracking-tight">{title}</h1>
				{description && (
					<p className="resa-text-muted-foreground resa-mt-1">{description}</p>
				)}
				{children}
			</div>
			<img
				src={logoUrl}
				alt="RESA Smart Assets"
				className="resa-h-14 resa-w-auto resa-ml-4"
				style={{ height: '56px', width: 'auto' }}
			/>
		</div>
	);
}
