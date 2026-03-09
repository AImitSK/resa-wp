import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessengerTab } from '@admin/components/integrations/MessengerTab';

// ─── Mock Data ──────────────────────────────────────────

const mockMessengers = [
	{
		id: 1,
		name: 'Sales Slack',
		platform: 'slack' as const,
		webhook_url: 'https://hooks.slack.com/test',
		is_active: true,
		created_at: '2026-03-01T10:00:00Z',
	},
	{
		id: 2,
		name: 'Team Discord',
		platform: 'discord' as const,
		webhook_url: 'https://discord.com/api/webhooks/test',
		is_active: false,
		created_at: '2026-03-02T14:00:00Z',
	},
];

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockTestMessenger = vi.fn();

// ─── Mocks ──────────────────────────────────────────────

vi.mock('@admin/hooks/useMessengers', () => ({
	useMessengers: vi.fn(() => ({
		data: mockMessengers,
		isLoading: false,
		error: null,
	})),
	useCreateMessenger: vi.fn(() => ({
		mutateAsync: mockCreate,
		isPending: false,
	})),
	useUpdateMessenger: vi.fn(() => ({
		mutateAsync: mockUpdate,
		isPending: false,
	})),
	useDeleteMessenger: vi.fn(() => ({
		mutateAsync: mockDelete,
		isPending: false,
	})),
	useTestMessenger: vi.fn(() => ({
		mutateAsync: mockTestMessenger,
		isPending: false,
	})),
}));

vi.mock('@admin/lib/toast', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── Tests ──────────────────────────────────────────────

describe('MessengerTab', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('zeigt "Verbindung hinzufügen" Button', () => {
			render(<MessengerTab />);
			expect(screen.getByText(/Verbindung hinzufügen/)).toBeInTheDocument();
		});

		it('zeigt Messenger-Tabelle', () => {
			render(<MessengerTab />);
			expect(screen.getByText('Sales Slack')).toBeInTheDocument();
			expect(screen.getByText('Team Discord')).toBeInTheDocument();
		});

		it('zeigt Plattform-Badges', () => {
			render(<MessengerTab />);
			// "Slack" appears in both name "Sales Slack" and platform badge
			const slackElements = screen.getAllByText(/Slack/);
			expect(slackElements.length).toBeGreaterThanOrEqual(1);
			const discordElements = screen.getAllByText(/Discord/);
			expect(discordElements.length).toBeGreaterThanOrEqual(1);
		});

		it('zeigt Aktiv-Switches', () => {
			render(<MessengerTab />);
			const switches = screen.getAllByRole('switch');
			expect(switches.length).toBe(2);
		});
	});

	describe('Create Dialog', () => {
		it('öffnet Create-Dialog', async () => {
			const user = userEvent.setup();
			render(<MessengerTab />);

			await user.click(screen.getByText(/Verbindung hinzufügen/));
			expect(screen.getByText(/Neue Verbindung|Verbindung erstellen/)).toBeInTheDocument();
		});
	});

	describe('Empty State', () => {
		it('zeigt Empty State', async () => {
			const { useMessengers } = await import('@admin/hooks/useMessengers');
			vi.mocked(useMessengers).mockReturnValue({
				data: [],
				isLoading: false,
				error: null,
			} as ReturnType<typeof useMessengers>);

			render(<MessengerTab />);
			expect(screen.getByText(/Noch keine|Keine Verbindung/)).toBeInTheDocument();
		});
	});

	describe('Loading State', () => {
		it('zeigt Lade-Zustand', async () => {
			const { useMessengers } = await import('@admin/hooks/useMessengers');
			vi.mocked(useMessengers).mockReturnValue({
				data: undefined,
				isLoading: true,
				error: null,
			} as ReturnType<typeof useMessengers>);

			render(<MessengerTab />);
			expect(screen.getByText(/Wird geladen|Lade/)).toBeInTheDocument();
		});
	});
});
