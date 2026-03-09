import { execSync } from 'child_process';

/**
 * Execute a WP-CLI command inside the Docker WordPress container.
 */
export function wpCli(command: string): string {
	const fullCommand = `docker compose exec -T wordpress wp ${command} --allow-root`;
	try {
		return execSync(fullCommand, {
			cwd: process.env.PROJECT_ROOT || process.cwd(),
			encoding: 'utf-8',
			timeout: 30_000,
		}).trim();
	} catch (error) {
		const err = error as { stderr?: string; stdout?: string };
		console.error(`WP-CLI error: ${err.stderr || err.stdout || error}`);
		throw error;
	}
}

/**
 * Create a WordPress page with given title and content.
 * Returns the page ID.
 */
export function createPage(title: string, content: string): number {
	const result = wpCli(
		`post create --post_type=page --post_status=publish --post_title="${title}" --post_content='${content}' --porcelain`,
	);
	return parseInt(result, 10);
}

/**
 * Delete a WordPress page by ID.
 */
export function deletePage(pageId: number): void {
	wpCli(`post delete ${pageId} --force`);
}

/**
 * Get the URL of a post/page by ID.
 */
export function getPermalink(postId: number): string {
	return wpCli(`post list --post__in=${postId} --field=url`);
}

/**
 * Activate the RESA plugin if not already active.
 */
export function activatePlugin(): void {
	try {
		wpCli('plugin activate resa');
	} catch {
		// Already active
	}
}
