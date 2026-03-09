import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WebhooksTab } from '@admin/components/integrations/WebhooksTab';

// ─── Mock Data ──────────────────────────────────────────

const mockWebhooks = [
	{
		id: 1,
		name: 'CRM Webhook',
		url: 'https://crm.example.com/hook',
		secret: 'secret-123',
		events: ['lead.created', 'lead.updated'],
		is_active: true,
		created_at: '2026-03-01T10:00:00Z',
	},
	{
		id: 2,
		name: 'Slack Notification',
		url: 'https://hooks.slack.com/test',
		secret: 'secret-456',
		events: ['lead.created'],
		is_active: false,
		created_at: '2026-03-02T14:00:00Z',
	},
];

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockTest = vi.fn();

// ─── Mocks ──────────────────────────────────────────────

vi.mock('@admin/hooks/useWebhooks', () => ({
	useWebhooks: vi.fn(() => ({
		data: mockWebhooks,
		isLoading: false,
		error: null,
	})),
	useCreateWebhook: vi.fn(() => ({
		mutateAsync: mockCreate,
		isPending: false,
	})),
	useUpdateWebhook: vi.fn(() => ({
		mutateAsync: mockUpdate,
		isPending: false,
	})),
	useDeleteWebhook: vi.fn(() => ({
		mutateAsync: mockDelete,
		isPending: false,
	})),
	useTestWebhook: vi.fn(() => ({
		mutateAsync: mockTest,
		isPending: false,
	})),
}));

vi.mock('@admin/lib/toast', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── Tests ──────────────────────────────────────────────

describe('WebhooksTab', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('zeigt "Webhook hinzufügen" Button', () => {
			render(<WebhooksTab />);
			expect(screen.getByText(/Webhook hinzufügen/)).toBeInTheDocument();
		});

		it('zeigt Webhook-Tabelle mit Namen', () => {
			render(<WebhooksTab />);
			expect(screen.getByText('CRM Webhook')).toBeInTheDocument();
			expect(screen.getByText('Slack Notification')).toBeInTheDocument();
		});

		it('zeigt Webhook-URLs', () => {
			render(<WebhooksTab />);
			expect(screen.getByText(/crm\.example\.com/)).toBeInTheDocument();
			expect(screen.getByText(/hooks\.slack\.com/)).toBeInTheDocument();
		});

		it('zeigt Event-Badges', () => {
			render(<WebhooksTab />);
			const createdBadges = screen.getAllByText(/lead\.created/);
			expect(createdBadges.length).toBeGreaterThanOrEqual(1);
		});

		it('zeigt Aktiv-Switches', () => {
			render(<WebhooksTab />);
			const switches = screen.getAllByRole('switch');
			expect(switches.length).toBe(2);
		});
	});

	describe('Create Dialog', () => {
		it('öffnet Create-Dialog beim Klick', async () => {
			const user = userEvent.setup();
			render(<WebhooksTab />);

			await user.click(screen.getByText(/Webhook hinzufügen/));
			expect(screen.getByText(/Webhook erstellen|Neuer Webhook/)).toBeInTheDocument();
		});
	});

	describe('Empty State', () => {
		it('zeigt Empty State wenn keine Webhooks', async () => {
			const { useWebhooks } = await import('@admin/hooks/useWebhooks');
			vi.mocked(useWebhooks).mockReturnValue({
				data: [],
				isLoading: false,
				error: null,
			} as ReturnType<typeof useWebhooks>);

			render(<WebhooksTab />);
			expect(screen.getByText(/Noch keine Webhooks|Kein Webhook/)).toBeInTheDocument();
		});
	});

	describe('Loading State', () => {
		it('zeigt Lade-Zustand', async () => {
			const { useWebhooks } = await import('@admin/hooks/useWebhooks');
			vi.mocked(useWebhooks).mockReturnValue({
				data: undefined,
				isLoading: true,
				error: null,
			} as ReturnType<typeof useWebhooks>);

			render(<WebhooksTab />);
			expect(screen.getByText(/Wird geladen|Lade/)).toBeInTheDocument();
		});
	});
});
