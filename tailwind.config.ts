import type { Config } from 'tailwindcss';

/**
 * Tailwind CSS — Shared Config (Frontend + Admin)
 *
 * - `resa-` Prefix auf alle Utility-Klassen (CSS-Isolation)
 * - Kein Preflight (Frontend: schützt Host-Theme, Admin: WP hat eigene Basis)
 * - CSS-Variablen für dynamisches Makler-Branding (shadcn/ui kompatibel)
 *
 * Hinweis: `important` Scoping (.resa-widget-root) wird bewusst NICHT gesetzt,
 * da Vite PostCSS-Config nur einmal lädt und nicht pro Entry unterscheiden kann.
 * Der `resa-` Prefix + Widget Mini-Reset bieten ausreichende Isolation.
 * Falls nötig, kann ein Custom-PostCSS-Plugin das Scoping nachrüsten.
 */
export default {
	prefix: 'resa-',

	content: [
		'./src/frontend/**/*.{ts,tsx}',
		'./src/admin/**/*.{ts,tsx}',
		'./src/lib/**/*.{ts,tsx}',
	],

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
				sans: [ 'system-ui', '-apple-system', 'sans-serif' ],
			},
		},
	},

	plugins: [],
} satisfies Config;
