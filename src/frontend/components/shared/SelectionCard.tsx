/**
 * SelectionCard — Wiederverwendbare Auswahl-Kachel für Single-Select Steps.
 *
 * Verwendet von PropertyTypeStep, ConditionStep und zukünftigen Modulen.
 * Framer Motion für Hover/Tap/Selection-Animationen.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ResaIcon } from '@/components/icons/ResaIcon';
import { cn } from '@/lib/utils';

export interface SelectionCardProps {
	/** Semantic icon name for ResaIcon. */
	icon: string;
	/** Display label below the icon. */
	label: string;
	/** Whether this card is currently selected. */
	selected: boolean;
	/** Click handler. */
	onClick: () => void;
	/** Icon size in pixels. Default: 64. */
	iconSize?: number;
}

export function SelectionCard({
	icon,
	label,
	selected,
	onClick,
	iconSize = 64,
}: SelectionCardProps) {
	return (
		<motion.button
			type="button"
			onClick={onClick}
			whileHover={{
				scale: 1.03,
				zIndex: 10,
				...(!selected && {
					background: 'linear-gradient(to bottom, hsl(0 0% 100%), hsl(0 0% 96%))',
				}),
			}}
			whileTap={{ scale: 0.97 }}
			className={cn(
				'resa-relative resa-flex resa-aspect-square resa-flex-col resa-items-center resa-justify-center resa-gap-3 resa-rounded-xl resa-border resa-bg-card resa-p-4 resa-cursor-pointer resa-transition-colors',
				'focus-visible:resa-outline-none focus-visible:resa-ring-2 focus-visible:resa-ring-primary focus-visible:resa-ring-offset-2',
				selected
					? 'resa-border-2 resa-border-primary resa-bg-primary/10 resa-shadow-sm'
					: 'resa-border-input hover:resa-border-primary/40 hover:resa-shadow-md',
			)}
		>
			{/* Checkmark Badge */}
			<AnimatePresence>
				{selected && (
					<motion.span
						initial={{ scale: 0, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0, opacity: 0 }}
						transition={{ type: 'spring', stiffness: 500, damping: 30 }}
						className="resa-absolute resa-right-2 resa-top-2 resa-flex resa-h-5 resa-w-5 resa-items-center resa-justify-center resa-rounded-full resa-bg-primary resa-text-primary-foreground"
					>
						<svg
							width="12"
							height="12"
							viewBox="0 0 12 12"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<polyline points="2,6 5,9 10,3" />
						</svg>
					</motion.span>
				)}
			</AnimatePresence>

			<ResaIcon name={icon} size={iconSize} />
			<span className="resa-text-sm resa-font-medium">{label}</span>
		</motion.button>
	);
}
