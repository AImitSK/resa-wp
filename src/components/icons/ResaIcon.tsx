/**
 * ResaIcon — Central icon component for the RESA plugin.
 *
 * Renders custom SVG icons from the registry by semantic name.
 * Icons support CSS variable theming via --resa-icon-* variables.
 *
 * Usage:
 *   <ResaIcon name="haus" size={48} />
 *   <ResaIcon name="balkon" className="resa-text-blue-600" />
 */

import { getIcon } from './registry';

export interface ResaIconProps {
	/** Semantic icon name (e.g. 'haus', 'balkon', 'einfamilienhaus'). */
	name: string;
	/** Icon size in pixels (applied as width and height). Default: 24. */
	size?: number;
	/** Additional CSS class names. */
	className?: string;
	/** Accessible label. If omitted, icon is decorative (aria-hidden). */
	label?: string;
}

export function ResaIcon({ name, size = 24, className, label }: ResaIconProps) {
	const svg = getIcon(name);

	if (!svg) {
		if (import.meta.env.DEV) {
			console.warn(`ResaIcon: Unknown icon "${name}"`);
		}
		return null;
	}

	return (
		<span
			className={`resa-icon ${className ?? ''}`}
			style={{
				display: 'inline-flex',
				width: size,
				height: size,
			}}
			role={label ? 'img' : 'presentation'}
			aria-label={label}
			aria-hidden={label ? undefined : true}
			dangerouslySetInnerHTML={{ __html: svg }}
		/>
	);
}
