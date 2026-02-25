/**
 * Step progress indicator for the wizard.
 *
 * Shows numbered dots connected by lines.
 * Current and completed steps are highlighted.
 */

interface ProgressBarProps {
	/** Total number of steps. */
	steps: number;
	/** Current step index (0-based). */
	current: number;
	/** Optional labels for each step. */
	labels?: string[];
}

export function ProgressBar({ steps, current, labels }: ProgressBarProps) {
	return (
		<div
			className="resa-mb-6"
			role="progressbar"
			aria-valuenow={current + 1}
			aria-valuemin={1}
			aria-valuemax={steps}
		>
			<div className="resa-flex resa-items-center resa-justify-between">
				{Array.from({ length: steps }, (_, i) => (
					<div
						key={i}
						className="resa-flex resa-items-center resa-flex-1 last:resa-flex-none"
					>
						{/* Step dot */}
						<div
							className={`resa-flex resa-items-center resa-justify-center resa-w-8 resa-h-8 resa-rounded-full resa-text-sm resa-font-medium resa-shrink-0 resa-transition-colors resa-duration-200 ${
								i < current
									? 'resa-bg-primary resa-text-primary-foreground'
									: i === current
										? 'resa-bg-primary resa-text-primary-foreground resa-ring-2 resa-ring-primary/30 resa-ring-offset-2'
										: 'resa-bg-muted resa-text-muted-foreground'
							}`}
						>
							{i < current ? (
								<svg
									className="resa-w-4 resa-h-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={3}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							) : (
								i + 1
							)}
						</div>

						{/* Connecting line (not after last dot) */}
						{i < steps - 1 && (
							<div
								className={`resa-flex-1 resa-h-0.5 resa-mx-2 resa-transition-colors resa-duration-200 ${
									i < current ? 'resa-bg-primary' : 'resa-bg-muted'
								}`}
							/>
						)}
					</div>
				))}
			</div>

			{/* Labels row */}
			{labels && labels.length > 0 && (
				<div className="resa-flex resa-justify-between resa-mt-2">
					{labels.map((label, i) => (
						<span
							key={i}
							className={`resa-text-xs resa-text-center ${
								i <= current
									? 'resa-text-foreground resa-font-medium'
									: 'resa-text-muted-foreground'
							}`}
							style={{ width: `${100 / steps}%` }}
						>
							{label}
						</span>
					))}
				</div>
			)}
		</div>
	);
}
