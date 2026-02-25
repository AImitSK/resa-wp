/**
 * Multi-step wizard — core framework for all RESA calculator modules.
 *
 * Renders steps sequentially with animated transitions (Framer Motion),
 * validates each step via Zod before advancing, and collects data
 * across all steps into a single record.
 */

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ZodError } from 'zod';
import { ProgressBar } from './ProgressBar';
import type { StepWizardProps, WizardData } from '../../types/wizard';

/** Slide direction: +1 = forward, -1 = backward. */
const variants = {
	enter: (direction: number) => ({
		x: direction > 0 ? 200 : -200,
		opacity: 0,
	}),
	center: {
		x: 0,
		opacity: 1,
	},
	exit: (direction: number) => ({
		x: direction > 0 ? -200 : 200,
		opacity: 0,
	}),
};

const transition = { duration: 0.25, ease: 'easeInOut' as const };

export function StepWizard({
	steps,
	onComplete,
	initialData = {},
	backLabel = 'Zurück',
	nextLabel = 'Weiter',
	completeLabel = 'Ergebnis anzeigen',
}: StepWizardProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [direction, setDirection] = useState(1);
	const [data, setData] = useState<WizardData>(initialData);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const currentStep = steps[currentIndex];
	const isFirst = currentIndex === 0;
	const isLast = currentIndex === steps.length - 1;

	const updateData = useCallback((partial: WizardData) => {
		setData((prev) => ({ ...prev, ...partial }));
		// Clear errors for updated fields.
		setErrors((prev) => {
			const next = { ...prev };
			for (const key of Object.keys(partial)) {
				delete next[key];
			}
			return next;
		});
	}, []);

	const validate = useCallback(async (): Promise<boolean> => {
		const { schema } = currentStep;
		if (!schema) return true;

		try {
			await schema.parseAsync(data);
			setErrors({});
			return true;
		} catch (err) {
			const zodError = err as ZodError;
			const fieldErrors: Record<string, string> = {};
			for (const issue of zodError.issues) {
				const key = issue.path.join('.');
				if (!fieldErrors[key]) {
					fieldErrors[key] = issue.message;
				}
			}
			setErrors(fieldErrors);
			return false;
		}
	}, [currentStep, data]);

	const goNext = useCallback(async () => {
		const valid = await validate();
		if (!valid) return;

		if (isLast) {
			onComplete(data);
			return;
		}

		setDirection(1);
		setErrors({});
		setCurrentIndex((i) => i + 1);
	}, [validate, isLast, onComplete, data]);

	const goBack = useCallback(() => {
		if (isFirst) return;
		setDirection(-1);
		setErrors({});
		setCurrentIndex((i) => i - 1);
	}, [isFirst]);

	const StepComponent = currentStep.component;

	return (
		<div className="resa-w-full">
			<ProgressBar
				steps={steps.length}
				current={currentIndex}
				labels={steps.map((s) => s.label)}
			/>

			<div className="resa-relative resa-overflow-hidden resa-min-h-[200px]">
				<AnimatePresence mode="wait" custom={direction}>
					<motion.div
						key={currentStep.id}
						custom={direction}
						variants={variants}
						initial="enter"
						animate="center"
						exit="exit"
						transition={transition}
					>
						<StepComponent data={data} updateData={updateData} errors={errors} />
					</motion.div>
				</AnimatePresence>
			</div>

			<div className="resa-flex resa-justify-between resa-mt-6">
				<button
					type="button"
					onClick={goBack}
					disabled={isFirst}
					className={`resa-px-4 resa-py-2 resa-rounded-md resa-text-sm resa-font-medium resa-transition-colors ${
						isFirst
							? 'resa-text-muted-foreground resa-cursor-not-allowed resa-opacity-50'
							: 'resa-text-foreground resa-bg-muted hover:resa-bg-muted/80'
					}`}
				>
					{backLabel}
				</button>

				<button
					type="button"
					onClick={goNext}
					className="resa-px-6 resa-py-2 resa-rounded-md resa-text-sm resa-font-medium resa-bg-primary resa-text-primary-foreground hover:resa-bg-primary/90 resa-transition-colors"
				>
					{isLast ? completeLabel : nextLabel}
				</button>
			</div>
		</div>
	);
}
