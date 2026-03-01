/**
 * MapPlaceholder — Lazy loading wrapper for map components.
 *
 * Uses Intersection Observer to load the map only when visible.
 * Shows a skeleton placeholder while the map is not yet loaded.
 */

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { __ } from '@wordpress/i18n';

interface MapPlaceholderProps {
	/** Height in pixels */
	height?: number;
	/** Children to render when visible */
	children: ReactNode;
	/** Additional CSS class */
	className?: string;
	/** Threshold for intersection (0-1) */
	threshold?: number;
	/** Root margin for earlier loading */
	rootMargin?: string;
}

// Check if IntersectionObserver is available (once at module load)
const supportsIntersectionObserver =
	typeof window !== 'undefined' && 'IntersectionObserver' in window;

export function MapPlaceholder({
	height = 250,
	children,
	className = '',
	threshold = 0.1,
	rootMargin = '100px',
}: MapPlaceholderProps) {
	// If IntersectionObserver is not supported, render immediately
	const [isVisible, setIsVisible] = useState(!supportsIntersectionObserver);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// Skip if already visible or IntersectionObserver not supported
		if (isVisible || !supportsIntersectionObserver) return;

		const element = containerRef.current;
		if (!element) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry.isIntersecting) {
					setIsVisible(true);
					observer.disconnect();
				}
			},
			{
				threshold,
				rootMargin,
			},
		);

		observer.observe(element);

		return () => {
			observer.disconnect();
		};
	}, [threshold, rootMargin, isVisible]);

	return (
		<div ref={containerRef} className={className}>
			{isVisible ? children : <MapSkeleton height={height} />}
		</div>
	);
}

/**
 * Skeleton placeholder shown while map is loading.
 */
function MapSkeleton({ height }: { height: number }) {
	return (
		<div
			className="resa-map-skeleton"
			style={{
				height: `${height}px`,
				width: '100%',
				borderRadius: 'var(--resa-radius)',
				backgroundColor: 'hsl(var(--resa-muted))',
				border: '1px solid hsl(var(--resa-border))',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: '12px',
				color: 'hsl(var(--resa-muted-foreground))',
			}}
		>
			{/* Map icon */}
			<svg
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
				style={{ opacity: 0.5 }}
			>
				<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
				<circle cx="12" cy="10" r="3" />
			</svg>

			{/* Loading text */}
			<span style={{ fontSize: '14px', opacity: 0.7 }}>
				{__('Karte wird geladen…', 'resa')}
			</span>

			{/* Animated loading bar */}
			<div
				style={{
					width: '120px',
					height: '4px',
					backgroundColor: 'hsl(var(--resa-border))',
					borderRadius: '2px',
					overflow: 'hidden',
				}}
			>
				<div
					className="resa-map-skeleton-bar"
					style={{
						width: '40%',
						height: '100%',
						backgroundColor: 'hsl(var(--resa-primary))',
						borderRadius: '2px',
						animation: 'resa-skeleton-slide 1.2s ease-in-out infinite',
					}}
				/>
			</div>

			{/* Animation keyframes */}
			<style>
				{`
					@keyframes resa-skeleton-slide {
						0% { transform: translateX(-100%); }
						100% { transform: translateX(350%); }
					}
				`}
			</style>
		</div>
	);
}
