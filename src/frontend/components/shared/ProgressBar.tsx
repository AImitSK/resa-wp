/**
 * Minimal progress bar for the wizard.
 *
 * Uses the shadcn/ui Progress component (Radix primitive).
 * Shows a single horizontal bar — no labels, no dots.
 */

import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
	/** Total number of steps. */
	steps: number;
	/** Current step index (0-based). */
	current: number;
	/** Optional labels (ignored — kept for API compat). */
	labels?: string[];
}

export function ProgressBar({ steps, current }: ProgressBarProps) {
	const percent = Math.round(((current + 1) / steps) * 100);

	return (
		<div className="resa-mt-4">
			<Progress value={percent} />
		</div>
	);
}
