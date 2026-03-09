import { wpCli, activatePlugin } from './helpers/wp-cli';

async function globalSetup() {
	console.log('[E2E] Global setup: Ensuring RESA plugin is active...');
	activatePlugin();

	console.log('[E2E] Creating test page with [resa] shortcode...');
	try {
		// Check if test page already exists
		const existingId = wpCli('post list --post_type=page --name=resa-e2e-test --field=ID');
		if (existingId) {
			console.log(`[E2E] Test page already exists (ID: ${existingId})`);
			process.env.E2E_TEST_PAGE_ID = existingId;
			return;
		}
	} catch {
		// Page doesn't exist yet
	}

	const pageId = wpCli(
		'post create --post_type=page --post_status=publish --post_title="RESA E2E Test" --post_name="resa-e2e-test" --post_content="[resa module=rent-calculator]" --porcelain',
	);

	console.log(`[E2E] Test page created (ID: ${pageId})`);
	process.env.E2E_TEST_PAGE_ID = pageId;
}

export default globalSetup;
