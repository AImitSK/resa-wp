import type { ZodSchema } from 'zod';

/**
 * Data collected across all wizard steps.
 */
export type WizardData = Record<string, unknown>;

/**
 * Props passed to every step component.
 */
export interface StepProps {
	/** Current collected data for this step. */
	data: WizardData;
	/** Update data — merges with existing. */
	updateData: (partial: WizardData) => void;
	/** Validation errors keyed by field name. */
	errors: Record<string, string>;
}

/**
 * Configuration for a single wizard step.
 */
export interface StepConfig {
	/** Unique identifier for the step. */
	id: string;
	/** Display label (used in progress bar). */
	label: string;
	/** React component rendered for this step. */
	component: React.ComponentType<StepProps>;
	/** Optional Zod schema — validated before advancing. */
	schema?: ZodSchema;
}

/**
 * Props for the StepWizard component.
 */
export interface StepWizardProps {
	/** Ordered list of steps to render. */
	steps: StepConfig[];
	/** Called when the user completes the last step. */
	onComplete: (data: WizardData) => void;
	/** Pre-populated data (e.g. from URL params). */
	initialData?: WizardData;
	/** Label for the back button. */
	backLabel?: string;
	/** Label for the next button. */
	nextLabel?: string;
	/** Label for the complete/submit button on the last step. */
	completeLabel?: string;
}
