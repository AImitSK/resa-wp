import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiKeysTab } from '@admin/components/integrations/ApiKeysTab';

// ─── Mock Data ──────────────────────────────────────────

const mockApiKeys = [
	{
		id: 1,
		name: 'Website Integration',
		keyPrefix: 'resa_abc1',
		is_active: true,
		last_used_at: '2026-03-01T10:00:00Z',
		created_at: '2026-02-15T10:00:00Z',
	},
	{
		id: 2,
		name: 'Test Key',
		keyPrefix: 'resa_xyz2',
		is_active: false,
		last_used_at: null,
		created_at: '2026-03-01T10:00:00Z',
	},
];

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

// ─── Mocks ──────────────────────────────────────────────

vi.mock('@admin/hooks/useApiKeys', () => ({
	useApiKeys: vi.fn(() => ({
		data: mockApiKeys,
		isLoading: false,
		error: null,
	})),
	useCreateApiKey: vi.fn(() => ({
		mutateAsync: mockCreate,
		isPending: false,
	})),
	useUpdateApiKey: vi.fn(() => ({
		mutateAsync: mockUpdate,
		isPending: false,
	})),
	useDeleteApiKey: vi.fn(() => ({
		mutateAsync: mockDelete,
		isPending: false,
	})),
}));

vi.mock('@admin/lib/toast', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── Tests ──────────────────────────────────────────────

describe('ApiKeysTab', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('zeigt "API-Schlüssel erstellen" Button', () => {
			render(<ApiKeysTab />);
			expect(screen.getByText(/API-Schlüssel erstellen/)).toBeInTheDocument();
		});

		it('zeigt API-Key-Tabelle', () => {
			render(<ApiKeysTab />);
			expect(screen.getByText('Website Integration')).toBeInTheDocument();
			expect(screen.getByText('Test Key')).toBeInTheDocument();
		});

		it('zeigt maskierte Key-Prefixe', () => {
			render(<ApiKeysTab />);
			// Key prefix is displayed with "..." suffix in a Badge
			expect(screen.getByText(/resa_abc1/)).toBeInTheDocument();
			expect(screen.getByText(/resa_xyz2/)).toBeInTheDocument();
		});

		it('zeigt Aktiv-Switches', () => {
			render(<ApiKeysTab />);
			const switches = screen.getAllByRole('switch');
			expect(switches.length).toBe(2);
		});
	});

	describe('Create Dialog', () => {
		it('öffnet Create-Dialog', async () => {
			const user = userEvent.setup();
			render(<ApiKeysTab />);

			await user.click(screen.getByText(/API-Schlüssel erstellen/));
			// Dialog should show a name input
			const inputs = screen.getAllByRole('textbox');
			expect(inputs.length).toBeGreaterThanOrEqual(1);
		});
	});

	describe('Endpoint Documentation', () => {
		it('zeigt API-Dokumentation', () => {
			render(<ApiKeysTab />);
			expect(screen.getByText(/API-Endpunkte|Endpoint|Quick Start/)).toBeInTheDocument();
		});
	});

	describe('Empty State', () => {
		it('zeigt Empty State', async () => {
			const { useApiKeys } = await import('@admin/hooks/useApiKeys');
			vi.mocked(useApiKeys).mockReturnValue({
				data: [],
				isLoading: false,
				error: null,
			} as ReturnType<typeof useApiKeys>);

			render(<ApiKeysTab />);
			expect(screen.getByText(/Noch kein|Keine API/)).toBeInTheDocument();
		});
	});

	describe('Loading State', () => {
		it('zeigt Lade-Zustand', async () => {
			const { useApiKeys } = await import('@admin/hooks/useApiKeys');
			vi.mocked(useApiKeys).mockReturnValue({
				data: undefined,
				isLoading: true,
				error: null,
			} as ReturnType<typeof useApiKeys>);

			render(<ApiKeysTab />);
			expect(screen.getByText(/Wird geladen|Lade/)).toBeInTheDocument();
		});
	});
});
