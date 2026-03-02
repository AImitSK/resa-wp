import type { Config } from 'tailwindcss';

/**
 * Tailwind CSS — Shared Config (Frontend + Admin)
 *
 * - `resa-` Prefix auf alle Utility-Klassen (CSS-Isolation)
 * - `important: true` damit resa-* Klassen WordPress-Theme-Styles überschreiben
 * - Kein Preflight (Frontend: schützt Host-Theme, Admin: WP hat eigene Basis)
 * - CSS-Variablen für dynamisches Makler-Branding (shadcn/ui kompatibel)
 *
 * Durch den resa-Prefix betreffen !important-Utilities nur Elemente die
 * explizit resa-Klassen verwenden — kein Risiko für Host-Theme-Konflikte.
 */
export default {
	prefix: 'resa-',
	important: true,

	content: [
		'./src/components/**/*.{ts,tsx}',
		'./src/frontend/**/*.{ts,tsx}',
		'./src/admin/**/*.{ts,tsx}',
		'./src/lib/**/*.{ts,tsx}',
		'./modules/*/src/**/*.{ts,tsx}',
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
				sans: ['system-ui', '-apple-system', 'sans-serif'],
			},
		},
	},

	plugins: [require('tailwindcss-animate')],
} satisfies Config;
