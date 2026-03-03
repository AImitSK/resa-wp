import type { Config } from 'tailwindcss';

/**
 * Tailwind CSS — Shared Base Config (Frontend + Admin)
 *
 * Enthält nur Prefix, corePlugins und Theme-Definition.
 * Kein `important`, kein `content`, kein `plugins` — das setzen
 * tailwind.config.frontend.ts und tailwind.config.admin.ts individuell.
 */
export const baseConfig: Omit<Config, 'content'> = {
	prefix: 'resa-',

	corePlugins: {
		preflight: false,
	},

	theme: {
		extend: {
			colors: {
				border: 'hsl(var(--resa-border))',
				input: 'hsl(var(--resa-input))',
				ring: 'hsl(var(--resa-ring))',
				background: 'hsl(var(--resa-background))',
				foreground: 'hsl(var(--resa-foreground))',
				primary: {
					DEFAULT: 'hsl(var(--resa-primary))',
					foreground: 'hsl(var(--resa-primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--resa-secondary))',
					foreground: 'hsl(var(--resa-secondary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--resa-destructive))',
					foreground: 'hsl(var(--resa-destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--resa-muted))',
					foreground: 'hsl(var(--resa-muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--resa-accent))',
					foreground: 'hsl(var(--resa-accent-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--resa-popover))',
					foreground: 'hsl(var(--resa-popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--resa-card))',
					foreground: 'hsl(var(--resa-card-foreground))',
				},
			},
			borderRadius: {
				lg: 'var(--resa-radius)',
				md: 'calc(var(--resa-radius) - 2px)',
				sm: 'calc(var(--resa-radius) - 4px)',
			},
			fontFamily: {
				sans: ['system-ui', '-apple-system', 'sans-serif'],
			},
		},
	},
};
