/// <reference types="vite/client" />

/**
 * Vite raw SVG imports — returns the SVG content as a string.
 */
declare module '*.svg?raw' {
	const content: string;
	export default content;
}
