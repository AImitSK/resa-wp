import { wpCli } from './helpers/wp-cli';

async function globalTeardown() {
	console.log('[E2E] Global teardown: Cleaning up test page...');
	try {
		const pageId = wpCli('post list --post_type=page --name=resa-e2e-test --field=ID');
		if (pageId) {
			wpCli(`post delete ${pageId} --force`);
			console.log(`[E2E] Test page deleted (ID: ${pageId})`);
		}
	} catch {
		console.log('[E2E] No test page to clean up');
	}
}

export default globalTeardown;
