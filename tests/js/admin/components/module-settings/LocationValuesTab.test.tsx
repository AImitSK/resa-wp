import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LocationValuesTab } from '@admin/components/module-settings/LocationValuesTab';

// ─── Mock Data ──────────────────────────────────────────

const mockLocations = [
	{
		id: 1,
		name: 'Berlin',
		slug: 'berlin',
		is_active: true,
		bundesland: 'Berlin',
		region_type: 'large_city',
	},
	{
		id: 2,
		name: 'München',
		slug: 'muenchen',
		is_active: true,
		bundesland: 'Bayern',
		region_type: 'large_city',
	},
	{
		id: 3,
		name: 'Dormagen',
		slug: 'dormagen',
		is_active: false,
		bundesland: 'NRW',
		region_type: 'small_town',
	},
];

const mockSettings = {
	setup_mode: 'pauschal' as const,
	region_preset: 'medium_city',
	factors: {},
	location_values: {
		1: { base_price: 14.0, price_min: 8.0, price_max: 22.0 },
	},
};

// ─── Mocks ──────────────────────────────────────────────

vi.mock('@admin/hooks/useLocations', () => ({
	useLocations: vi.fn(() => ({
		data: mockLocations,
		isLoading: false,
	})),
}));

// ─── Tests ──────────────────────────────────────────────

describe('LocationValuesTab', () => {
	const defaultProps = {
		settings: mockSettings,
		onSaveLocationValue: vi.fn(),
		onDeleteLocationValue: vi.fn(),
		isSaving: false,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('zeigt Überschrift', () => {
			render(<LocationValuesTab {...defaultProps} />);
			expect(screen.getByText(/Standort-Werte|Standortspezifisch/)).toBeInTheDocument();
		});

		it('zeigt aktive Standorte in der Tabelle', () => {
			render(<LocationValuesTab {...defaultProps} />);
			expect(screen.getByText('Berlin')).toBeInTheDocument();
			expect(screen.getByText('München')).toBeInTheDocument();
		});

		it('zeigt keine inaktiven Standorte', () => {
			render(<LocationValuesTab {...defaultProps} />);
			expect(screen.queryByText('Dormagen')).not.toBeInTheDocument();
		});

		it('zeigt Status-Badge "Individuell" für Berlin', () => {
			render(<LocationValuesTab {...defaultProps} />);
			expect(screen.getByText('Individuell')).toBeInTheDocument();
		});

		it('zeigt Status-Badge "Standard" für München', () => {
			render(<LocationValuesTab {...defaultProps} />);
			expect(screen.getByText('Standard')).toBeInTheDocument();
		});
	});

	describe('Interaktion', () => {
		it('zeigt Tabellen-Header', () => {
			render(<LocationValuesTab {...defaultProps} />);
			expect(screen.getByText('Standort')).toBeInTheDocument();
			expect(screen.getByText('Status')).toBeInTheDocument();
			expect(screen.getByText(/Basispreis/)).toBeInTheDocument();
		});
	});

	describe('Footer', () => {
		it('zeigt Zusammenfassung der individuellen Werte', () => {
			render(<LocationValuesTab {...defaultProps} />);
			expect(screen.getByText(/von.*Standorten/)).toBeInTheDocument();
		});
	});

	describe('Loading State', () => {
		it('zeigt Lade-Zustand wenn Standorte laden', async () => {
			const { useLocations } = await import('@admin/hooks/useLocations');
			vi.mocked(useLocations).mockReturnValue({
				data: undefined,
				isLoading: true,
			} as ReturnType<typeof useLocations>);

			render(<LocationValuesTab {...defaultProps} />);
			expect(screen.getByText(/Standorte werden geladen/)).toBeInTheDocument();
		});
	});
});
