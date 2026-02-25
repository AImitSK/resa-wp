/**
 * Admin SPA root — React Router + React Query providers.
 *
 * Uses MemoryRouter because WordPress admin submenus cause full
 * page reloads. The PHP-injected `window.resaAdmin.page` slug
 * determines the initial route on each mount.
 */

import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Leads } from './pages/Leads';
import { ModuleStore } from './pages/ModuleStore';
import { Locations } from './pages/Locations';
import { Communication } from './pages/Communication';
import { PdfTemplates } from './pages/PdfTemplates';
import { ShortcodeGenerator } from './pages/ShortcodeGenerator';
import { Integrations } from './pages/Integrations';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			retry: 1,
		},
	},
});

/**
 * Map WordPress admin page slugs to React Router paths.
 */
const PAGE_ROUTES: Record<string, string> = {
	resa: '/',
	'resa-leads': '/leads',
	'resa-modules': '/modules',
	'resa-locations': '/locations',
	'resa-communication': '/communication',
	'resa-pdf': '/pdf',
	'resa-shortcode': '/shortcode',
	'resa-integrations': '/integrations',
	'resa-settings': '/settings',
};

function getInitialRoute(): string {
	const page = window.resaAdmin?.page ?? 'resa';
	return PAGE_ROUTES[page] ?? '/';
}

export function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<MemoryRouter initialEntries={[getInitialRoute()]}>
				<Routes>
					<Route element={<Layout />}>
						<Route index element={<Dashboard />} />
						<Route path="leads" element={<Leads />} />
						<Route path="modules" element={<ModuleStore />} />
						<Route path="locations" element={<Locations />} />
						<Route path="communication" element={<Communication />} />
						<Route path="pdf" element={<PdfTemplates />} />
						<Route path="shortcode" element={<ShortcodeGenerator />} />
						<Route path="integrations" element={<Integrations />} />
						<Route path="settings" element={<Settings />} />
						<Route path="*" element={<Navigate to="/" replace />} />
					</Route>
				</Routes>
			</MemoryRouter>
		</QueryClientProvider>
	);
}
