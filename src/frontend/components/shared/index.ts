/**
 * Shared components for RESA Frontend Widget.
 *
 * These components are used by all modules:
 * - StepWizard: Multi-step form framework
 * - LeadForm: Contact form with DSGVO consent
 * - ProgressBar: Visual step progress indicator
 * - AddressInput: Address autocomplete with map
 */

export { StepWizard } from './StepWizard';
export { LeadForm } from './LeadForm';
export { ProgressBar } from './ProgressBar';
export {
	AddressInput,
	type AddressInputProps,
	type AddressData,
	type AddressBounds,
} from './AddressInput';
