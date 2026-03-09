import { test as base, expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

type ResaFixtures = {
	/** Authenticated API request context for seeding/cleanup */
	apiHelper: APIRequestContext;
	/** URL of the test page with [resa] shortcode */
	testPageUrl: string;
};

export const test = base.extend<ResaFixtures>({
	apiHelper: async ({ request }, use) => {
		await use(request);
	},

	// eslint-disable-next-line no-empty-pattern
	testPageUrl: async ({}, use) => {
		// Read from env, set by global-setup
		const url = process.env.E2E_TEST_PAGE_URL || '/resa-e2e-test/';
		await use(url);
	},
});

export { expect };
