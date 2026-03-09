import type { APIRequestContext } from '@playwright/test';

const BASE_URL = process.env.WP_URL || 'http://localhost:8080';
const REST_BASE = `${BASE_URL}/wp-json/resa/v1`;

/**
 * Seed a test lead via REST API (requires authenticated context).
 */
export async function createTestLead(
	request: APIRequestContext,
	data?: Partial<{
		email: string;
		firstName: string;
		lastName: string;
		phone: string;
		module: string;
	}>,
) {
	const leadData = {
		email: data?.email || `test-${Date.now()}@e2e-test.local`,
		firstName: data?.firstName || 'E2E',
		lastName: data?.lastName || 'Testuser',
		phone: data?.phone || '+49 170 1234567',
		module: data?.module || 'rent-calculator',
	};

	const response = await request.post(`${REST_BASE}/admin/leads`, {
		data: leadData,
	});

	return response.json();
}

/**
 * Delete test leads matching e2e-test.local email pattern.
 */
export async function cleanupTestLeads(request: APIRequestContext) {
	try {
		const response = await request.get(`${REST_BASE}/admin/leads`, {
			params: { search: '@e2e-test.local', per_page: '100' },
		});
		const leads = await response.json();

		if (Array.isArray(leads)) {
			for (const lead of leads) {
				await request.delete(`${REST_BASE}/admin/leads/${lead.id}`);
			}
		}
	} catch {
		// Cleanup is best-effort
	}
}

/**
 * Create a test location via REST API.
 */
export async function createTestLocation(
	request: APIRequestContext,
	data?: Partial<{
		name: string;
		zipCode: string;
		region: string;
	}>,
) {
	const locationData = {
		name: data?.name || `E2E Test Ort ${Date.now()}`,
		zipCode: data?.zipCode || '12345',
		region: data?.region || 'Berlin',
	};

	const response = await request.post(`${REST_BASE}/admin/locations`, {
		data: locationData,
	});

	return response.json();
}

/**
 * Delete a test location by ID.
 */
export async function deleteTestLocation(request: APIRequestContext, locationId: number) {
	await request.delete(`${REST_BASE}/admin/locations/${locationId}`);
}
