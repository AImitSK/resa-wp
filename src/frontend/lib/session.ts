/**
 * Session management for two-phase lead capture.
 *
 * Generates a UUID v4 and persists it in sessionStorage
 * so the same session ID is used across partial → complete.
 */

const SESSION_KEY = 'resa_session_id';

function generateUUID(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	// Fallback for older browsers.
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

export function getSessionId(): string {
	let id = sessionStorage.getItem(SESSION_KEY);
	if (!id) {
		id = generateUUID();
		sessionStorage.setItem(SESSION_KEY, id);
	}
	return id;
}

export function resetSession(): void {
	sessionStorage.removeItem(SESSION_KEY);
}
