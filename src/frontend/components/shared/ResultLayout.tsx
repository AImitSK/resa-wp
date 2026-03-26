/**
 * ResultLayout — Shared layout wrapper for module result pages.
 *
 * Provides consistent structure, animations, and styling for all
 * calculator result displays. Uses slot-based composition.
 */

import { ReactNode } from 'react';
import { __ } from '@wordpress/i18n';
import { motion } from 'framer-motion';
import { ResaIcon } from '@/components/icons';
import { ResaMap } from '@frontend/components/map';

interface AgentInfo {
	name?: string;
	photo_url?: string;
	phone?: string;
}

interface LocationInfo {
	lat: number;
	lng: number;
	address?: string;
}

interface ResultLayoutProps {
	/** Hero section with main result value */
	hero: ReactNode;
	/** Stats cards section */
	stats?: ReactNode;
	/** Market position gauge */
	marketPosition?: ReactNode;
	/** Market comparison chart */
	comparison?: ReactNode;
	/** Additional content (e.g., factor breakdown) */
	extraContent?: ReactNode;
	/** Input summary section */
	inputSummary?: ReactNode;
	/** Location for map display */
	location?: LocationInfo;
	/** Agent info for personalized CTA */
	agent?: AgentInfo;
	/** Custom CTA content (overrides default) */
	customCta?: ReactNode;
}

const stagger = {
	hidden: {},
	show: {
		transition: {
			staggerChildren: 0.1,
		},
	},
};

const fadeUp = {
	hidden: { opacity: 0, y: 12 },
	show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export function ResultLayout({
	hero,
	stats,
	marketPosition,
	comparison,
	extraContent,
	inputSummary,
	location,
	agent,
	customCta,
}: ResultLayoutProps) {
	return (
		<motion.div className="resa-space-y-6" variants={stagger} initial="hidden" animate="show">
			{/* Hero section */}
			<motion.div variants={fadeUp}>{hero}</motion.div>

			{/* Stats */}
			{stats && <motion.div variants={fadeUp}>{stats}</motion.div>}

			{/* Market position */}
			{marketPosition && (
				<motion.div
					variants={fadeUp}
					className="resa-border-b resa-border-border resa-pb-6"
				>
					<div className="resa-text-xs resa-text-muted-foreground resa-text-center resa-mb-2">
						{__('Marktposition', 'resa')}
					</div>
					{marketPosition}
				</motion.div>
			)}

			{/* Market comparison */}
			{comparison && (
				<motion.div
					variants={fadeUp}
					className="resa-border-b resa-border-border resa-pb-6"
				>
					{comparison}
				</motion.div>
			)}

			{/* Extra content slot */}
			{extraContent && (
				<motion.div
					variants={fadeUp}
					className="resa-border-b resa-border-border resa-pb-6"
				>
					{extraContent}
				</motion.div>
			)}

			{/* Input summary */}
			{inputSummary && <motion.div variants={fadeUp}>{inputSummary}</motion.div>}

			{/* Location map */}
			{location && (
				<motion.div
					variants={fadeUp}
					className="resa-border-b resa-border-border resa-pb-6"
				>
					<div className="resa-text-xs resa-font-medium resa-text-muted-foreground resa-mb-2">
						{__('Standort', 'resa')}
					</div>
					<div className="resa-rounded-lg resa-overflow-hidden">
						<ResaMap
							center={{ lat: location.lat, lng: location.lng }}
							zoom={15}
							showMarker
							height={180}
							lazyLoad={false}
						/>
					</div>
					{location.address && (
						<p className="resa-text-xs resa-text-muted-foreground resa-text-center resa-mt-2">
							{location.address}
						</p>
					)}
				</motion.div>
			)}

			{/* Agent CTA */}
			<motion.div
				variants={fadeUp}
				className="resa-bg-primary resa-text-primary-foreground resa-rounded-xl resa-p-5"
			>
				{customCta ? (
					customCta
				) : agent?.name ? (
					<div className="resa-flex resa-items-center resa-gap-4">
						{agent.photo_url ? (
							<img
								src={agent.photo_url}
								alt={agent.name}
								className="resa-w-14 resa-h-14 resa-rounded-full resa-object-cover resa-border-2 resa-border-primary-foreground/20 resa-shrink-0"
							/>
						) : (
							<div className="resa-w-14 resa-h-14 resa-rounded-full resa-bg-primary-foreground/20 resa-flex resa-items-center resa-justify-center resa-shrink-0">
								<ResaIcon name="user" size={24} />
							</div>
						)}
						<div className="resa-flex-1 resa-min-w-0">
							<p className="resa-text-sm resa-opacity-90">
								{__('Ihr Ansprechpartner', 'resa')}
							</p>
							<p className="resa-font-semibold resa-truncate">{agent.name}</p>
							{agent.phone && (
								<p className="resa-text-sm resa-font-medium resa-mt-1">
									{agent.phone}
								</p>
							)}
						</div>
					</div>
				) : (
					<div className="resa-flex resa-flex-col resa-items-center resa-text-center resa-gap-3">
						<div className="resa-w-12 resa-h-12 resa-rounded-full resa-bg-primary-foreground/20 resa-flex resa-items-center resa-justify-center">
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="3"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<polyline points="20 6 9 17 4 12" />
							</svg>
						</div>
						<div>
							<p className="resa-font-semibold resa-text-base resa-mb-1">
								{__('Vielen Dank für Ihre Anfrage!', 'resa')}
							</p>
							<p className="resa-text-sm resa-opacity-90">
								{__(
									'Ein Immobilienexperte analysiert Ihre Daten und meldet sich in Kürze bei Ihnen.',
									'resa',
								)}
							</p>
						</div>
					</div>
				)}
			</motion.div>
		</motion.div>
	);
}

/**
 * ResultHero — Gradient hero section with main value display.
 */
interface ResultHeroProps {
	/** Icon name */
	icon: string;
	/** Label above the main value */
	label: string;
	/** Main value to display */
	value: string;
	/** Range or subtitle below the value */
	subtitle?: string;
}

export function ResultHero({ icon, label, value, subtitle }: ResultHeroProps) {
	return (
		<div
			className="resa-relative resa-overflow-hidden resa-rounded-2xl resa-p-8 resa-text-center"
			style={{
				background:
					'linear-gradient(135deg, hsl(var(--resa-primary) / 0.08) 0%, hsl(var(--resa-primary) / 0.18) 100%)',
			}}
		>
			{/* Decorative circles */}
			<div
				className="resa-absolute resa-w-32 resa-h-32 resa-rounded-full resa-opacity-20 resa-pointer-events-none"
				style={{
					background: 'hsl(var(--resa-primary))',
					top: '-4rem',
					right: '-4rem',
				}}
			/>
			<div
				className="resa-absolute resa-w-24 resa-h-24 resa-rounded-full resa-opacity-10 resa-pointer-events-none"
				style={{
					background: 'hsl(var(--resa-primary))',
					bottom: '-3rem',
					left: '-3rem',
				}}
			/>

			<div className="resa-relative">
				<div className="resa-inline-flex resa-items-center resa-gap-2 resa-text-sm resa-text-muted-foreground resa-mb-3">
					<ResaIcon name={icon} size={16} className="resa-text-primary" />
					{label}
				</div>
				<motion.div
					className="resa-text-5xl resa-font-bold resa-text-primary resa-tracking-tight"
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
				>
					{value}
				</motion.div>
				{subtitle && (
					<div className="resa-text-sm resa-text-muted-foreground resa-mt-3 resa-font-medium">
						{subtitle}
					</div>
				)}
			</div>
		</div>
	);
}

/**
 * ResultStatCard — Single stat display card.
 */
interface ResultStatCardProps {
	icon: string;
	label: string;
	value: string;
}

export function ResultStatCard({ icon, label, value }: ResultStatCardProps) {
	return (
		<div className="resa-bg-muted/30 resa-rounded-lg resa-p-4 resa-flex resa-items-center resa-gap-3">
			<ResaIcon name={icon} size={28} className="resa-text-muted-foreground resa-shrink-0" />
			<div>
				<div className="resa-text-xs resa-text-muted-foreground">{label}</div>
				<div className="resa-text-lg resa-font-semibold">{value}</div>
			</div>
		</div>
	);
}
