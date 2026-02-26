/**
 * Universal lead form — used as the final step in every calculator wizard.
 *
 * Renders fields dynamically based on config (admin-configurable).
 * Validates via Zod, manages state via React Hook Form.
 * Handles DSGVO consent and trust badge.
 */

import { __ } from '@wordpress/i18n';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { buildLeadSchema } from '../../lib/validation';
import type { FieldConfig, LeadFormConfig } from '../../types/lead-form';
import { DEFAULT_LEAD_FORM_CONFIG } from '../../types/lead-form';

export interface LeadFormProps {
	/** Form field configuration. Falls back to balanced preset. */
	config?: LeadFormConfig;
	/** Called with form data on successful submission. */
	onSubmit: (data: Record<string, unknown>) => void;
	/** Shows loading spinner on button. */
	isSubmitting?: boolean;
}

export function LeadForm({
	config = DEFAULT_LEAD_FORM_CONFIG,
	onSubmit,
	isSubmitting = false,
}: LeadFormProps) {
	const activeFields = config.fields
		.filter((f) => f.status !== 'hidden')
		.sort((a, b) => a.order - b.order);

	const inputFields = activeFields.filter((f) => f.type !== 'checkbox');
	const checkboxFields = activeFields.filter((f) => f.type === 'checkbox');

	const schema = buildLeadSchema(config.fields);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(schema),
		defaultValues: buildDefaults(activeFields),
	});

	return (
		<form
			onSubmit={handleSubmit((data) => onSubmit(data))}
			noValidate
			className="resa-space-y-4"
		>
			<div className="resa-text-center resa-mb-6">
				<h3 className="resa-text-lg resa-font-semibold">
					{__('Ihre Ergebnisse sind fertig!', 'resa')}
				</h3>
				<p className="resa-text-sm resa-text-muted-foreground resa-mt-1">
					{__(
						'Geben Sie Ihre Daten ein, um Ihre persönliche Analyse zu erhalten.',
						'resa',
					)}
				</p>
			</div>

			{/* Input fields */}
			<div className="resa-space-y-3">
				{inputFields.map((field) => (
					<FormField
						key={field.slug}
						field={field}
						register={register}
						error={errors[field.slug]?.message}
					/>
				))}
			</div>

			{/* Checkboxes (consent always last) */}
			<div className="resa-space-y-3 resa-mt-4">
				{checkboxFields.map((field) => (
					<CheckboxField
						key={field.slug}
						field={field}
						privacyUrl={config.privacyUrl}
						register={register}
						error={errors[field.slug]?.message}
					/>
				))}
			</div>

			{/* Submit button */}
			<button
				type="submit"
				disabled={isSubmitting}
				className="resa-w-full resa-py-3 resa-px-6 resa-rounded-md resa-text-sm resa-font-medium resa-bg-primary resa-text-primary-foreground hover:resa-bg-primary/90 resa-transition-colors disabled:resa-opacity-50 disabled:resa-cursor-not-allowed"
			>
				{isSubmitting ? (
					<span className="resa-inline-flex resa-items-center resa-gap-2">
						<LoadingSpinner />
						{__('Wird gesendet…', 'resa')}
					</span>
				) : (
					<span className="resa-inline-flex resa-items-center resa-gap-1">
						{config.buttonText}
						<span aria-hidden="true">&rarr;</span>
					</span>
				)}
			</button>

			{/* Trust badge */}
			{config.trustBadgeText && (
				<p className="resa-text-xs resa-text-muted-foreground resa-text-center resa-mt-2">
					<span aria-hidden="true">🔒 </span>
					{config.trustBadgeText}
				</p>
			)}
		</form>
	);
}

/* ---------- Sub-components ---------- */

interface FormFieldProps {
	field: FieldConfig;
	register: ReturnType<typeof useForm>['register'];
	error?: string;
}

function FormField({ field, register, error }: FormFieldProps) {
	const isRequired = field.status === 'required';
	const inputClasses =
		'resa-w-full resa-px-3 resa-py-2 resa-rounded-md resa-border resa-bg-background resa-text-sm resa-text-foreground placeholder:resa-text-muted-foreground focus:resa-outline-none focus:resa-ring-2 focus:resa-ring-ring';

	return (
		<div>
			<label
				htmlFor={`resa-${field.slug}`}
				className="resa-block resa-text-sm resa-font-medium resa-mb-1"
			>
				{field.label}
				{isRequired && <span className="resa-text-destructive resa-ml-0.5">*</span>}
				{field.status === 'optional' && field.hint && (
					<span className="resa-text-muted-foreground resa-font-normal resa-ml-1">
						{field.hint}
					</span>
				)}
			</label>

			{field.type === 'textarea' ? (
				<textarea
					id={`resa-${field.slug}`}
					rows={3}
					placeholder={field.placeholder}
					className={inputClasses}
					aria-invalid={!!error}
					{...register(field.slug)}
				/>
			) : field.type === 'select' ? (
				<select
					id={`resa-${field.slug}`}
					className={inputClasses}
					aria-invalid={!!error}
					{...register(field.slug)}
				>
					<option value="">{field.placeholder ?? __('Bitte wählen', 'resa')}</option>
					{field.options?.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
			) : (
				<input
					id={`resa-${field.slug}`}
					type={field.type}
					placeholder={field.placeholder}
					className={inputClasses}
					aria-invalid={!!error}
					{...register(field.slug)}
				/>
			)}

			{error && (
				<p role="alert" className="resa-text-xs resa-text-destructive resa-mt-1">
					{error}
				</p>
			)}
		</div>
	);
}

interface CheckboxFieldProps {
	field: FieldConfig;
	privacyUrl: string;
	register: ReturnType<typeof useForm>['register'];
	error?: string;
}

function CheckboxField({ field, privacyUrl, register, error }: CheckboxFieldProps) {
	const label =
		field.slug === 'consent'
			? field.label.replace(
					'[Datenschutzerklärung]',
					`<a href="${privacyUrl}" target="_blank" rel="noopener noreferrer" class="resa-underline resa-text-primary hover:resa-text-primary/80">Datenschutzerklärung</a>`,
				)
			: field.label;

	return (
		<div>
			<label
				htmlFor={`resa-${field.slug}`}
				className="resa-flex resa-items-start resa-gap-2 resa-cursor-pointer"
			>
				<input
					id={`resa-${field.slug}`}
					type="checkbox"
					className="resa-mt-1 resa-shrink-0"
					aria-invalid={!!error}
					{...register(field.slug)}
				/>
				<span
					className="resa-text-sm resa-text-foreground"
					dangerouslySetInnerHTML={{ __html: label }}
				/>
			</label>

			{error && (
				<p role="alert" className="resa-text-xs resa-text-destructive resa-mt-1 resa-ml-6">
					{error}
				</p>
			)}
		</div>
	);
}

function LoadingSpinner() {
	return (
		<svg className="resa-animate-spin resa-h-4 resa-w-4" viewBox="0 0 24 24" fill="none">
			<circle
				cx="12"
				cy="12"
				r="10"
				stroke="currentColor"
				strokeWidth="3"
				strokeDasharray="60"
				strokeDashoffset="20"
				strokeLinecap="round"
			/>
		</svg>
	);
}

/* ---------- Helpers ---------- */

function buildDefaults(fields: FieldConfig[]): Record<string, unknown> {
	const defaults: Record<string, unknown> = {};

	for (const field of fields) {
		if (field.type === 'checkbox') {
			defaults[field.slug] = false;
		} else {
			defaults[field.slug] = '';
		}
	}

	return defaults;
}
