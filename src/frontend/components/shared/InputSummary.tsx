/**
 * InputSummary — Collapsible summary of user inputs.
 *
 * Shows a compact summary that can be expanded to see all details.
 */

import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { ResaIcon } from '@/components/icons';

interface InputSummaryProps {
	/** Summary items to display */
	items: {
		label: string;
		value: string | number;
		icon?: string;
	}[];
	/** Initially collapsed? */
	defaultCollapsed?: boolean;
}

export function InputSummary({ items, defaultCollapsed = true }: InputSummaryProps) {
	const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

	// Show first 2 items in collapsed state
	const previewItems = items.slice(0, 2);
	const hasMore = items.length > 2;

	return (
		<div className="resa-bg-muted/30 resa-rounded-lg resa-border resa-border-border resa-overflow-hidden">
			{/* Clickable header with preview */}
			<button
				type="button"
				onClick={() => setIsCollapsed(!isCollapsed)}
				className="resa-w-full resa-flex resa-items-center resa-justify-between resa-gap-3 resa-p-4 resa-text-left hover:resa-bg-muted/50 resa-transition-colors resa-cursor-pointer"
			>
				<div className="resa-flex-1 resa-min-w-0">
					<div className="resa-text-xs resa-font-medium resa-text-muted-foreground resa-mb-1">
						{__('Ihre Eingaben', 'resa')}
					</div>
					{isCollapsed && (
						<p className="resa-text-sm resa-truncate">
							{previewItems.map((item) => item.value).join(' · ')}
							{hasMore && ` · +${items.length - 2} ${__('weitere', 'resa')}`}
						</p>
					)}
				</div>
				<div className="resa-flex resa-items-center resa-gap-2 resa-shrink-0">
					<span className="resa-text-xs resa-text-primary resa-font-medium">
						{isCollapsed ? __('Details anzeigen', 'resa') : __('Ausblenden', 'resa')}
					</span>
					<motion.div
						animate={{ rotate: isCollapsed ? 0 : 180 }}
						transition={{ duration: 0.2 }}
						className="resa-text-primary"
					>
						<ResaIcon name="chevron-down" size={16} />
					</motion.div>
				</div>
			</button>

			{/* Expanded content */}
			<AnimatePresence initial={false}>
				{!isCollapsed && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="resa-overflow-hidden"
					>
						<div className="resa-px-4 resa-pb-4 resa-border-t resa-border-border">
							<div className="resa-pt-3 resa-space-y-2">
								{items.map((item, index) => (
									<div
										key={index}
										className="resa-flex resa-items-center resa-gap-3 resa-text-sm"
									>
										{item.icon && (
											<ResaIcon
												name={item.icon}
												size={16}
												className="resa-text-muted-foreground resa-shrink-0"
											/>
										)}
										<span className="resa-text-muted-foreground resa-shrink-0">
											{item.label}:
										</span>
										<span className="resa-font-medium resa-truncate">
											{item.value}
										</span>
									</div>
								))}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
