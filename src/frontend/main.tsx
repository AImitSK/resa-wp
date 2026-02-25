/**
 * Frontend Entry Point — Module Loader.
 *
 * Reads data-module from each .resa-widget-root container
 * and renders the corresponding module widget.
 */

import { createRoot } from 'react-dom/client';
import './styles/frontend.css';
import './types/index'; // Window augmentation

import { RentCalculatorWidget } from '@modules/rent-calculator/src/RentCalculatorWidget';

/** Map of module slug → React component. */
const modules: Record<string, React.ComponentType<{ presetCity?: string }>> = {
	'rent-calculator': RentCalculatorWidget,
};

document.querySelectorAll<HTMLElement>('.resa-widget-root').forEach((container) => {
	const moduleSlug = container.dataset.module;
	const presetCity = container.dataset.city;

	if (!moduleSlug) {
		return;
	}

	const ModuleComponent = modules[moduleSlug];

	if (!ModuleComponent) {
		if (import.meta.env.DEV) {
			console.warn(`RESA: Unknown module "${moduleSlug}"`);
		}
		return;
	}

	createRoot(container).render(<ModuleComponent presetCity={presetCity} />);
});
