import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
	// Base configs.
	js.configs.recommended,
	...tseslint.configs.recommended,
	prettierConfig,

	// Global settings.
	{
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			parserOptions: {
				ecmaFeatures: { jsx: true },
			},
		},
		settings: {
			react: { version: 'detect' },
		},
	},

	// React for TSX files.
	{
		files: [ '**/*.tsx' ],
		plugins: {
			react: reactPlugin,
			'react-hooks': reactHooksPlugin,
		},
		rules: {
			...reactPlugin.configs.recommended.rules,
			...reactPlugin.configs[ 'jsx-runtime' ].rules,
			...reactHooksPlugin.configs.recommended.rules,
		},
	},

	// Test files — relaxed rules.
	{
		files: [ 'tests/**/*.{ts,tsx}' ],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},

	// Ignored paths.
	{
		ignores: [ 'dist/', 'vendor/', 'node_modules/', '*.config.{js,ts}' ],
	},
);
