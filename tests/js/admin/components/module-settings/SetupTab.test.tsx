import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetupTab } from '@admin/components/module-settings/SetupTab';

// Mock FactorEditor (complex sub-component)
vi.mock('@admin/components/FactorEditor', () => ({
	FactorEditor: () => <div data-testid="factor-editor">Faktor-Editor</div>,
}));

const mockSettings = {
	setup_mode: 'pauschal' as const,
	region_preset: 'medium_city',
	factors: {},
	location_values: {},
};

const mockPresets = {
	rural: {
		base_price: 6.5,
		size_degression: 0.03,
		location_ratings: {},
		condition_multipliers: {},
		type_multipliers: {},
		feature_premiums: {},
		age_multipliers: {},
	},
	medium_city: {
		base_price: 10.0,
		size_degression: 0.05,
		location_ratings: {},
		condition_multipliers: {},
		type_multipliers: {},
		feature_premiums: {},
		age_multipliers: {},
	},
	large_city: {
		base_price: 14.0,
		size_degression: 0.06,
		location_ratings: {},
		condition_multipliers: {},
		type_multipliers: {},
		feature_premiums: {},
		age_multipliers: {},
	},
	premium_city: {
		base_price: 18.0,
		size_degression: 0.08,
		location_ratings: {},
		condition_multipliers: {},
		type_multipliers: {},
		feature_premiums: {},
		age_multipliers: {},
	},
};

describe('SetupTab', () => {
	const defaultProps = {
		settings: mockSettings,
		presets: mockPresets,
		onSave: vi.fn(),
		isSaving: false,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('zeigt Überschrift', () => {
			render(<SetupTab {...defaultProps} />);
			expect(screen.getByText('Einrichtung')).toBeInTheDocument();
		});

		it('zeigt Setup-Modus-Optionen', () => {
			render(<SetupTab {...defaultProps} />);
			expect(screen.getByText('Pauschal')).toBeInTheDocument();
			expect(screen.getByText('Individuell')).toBeInTheDocument();
		});

		it('zeigt Speichern-Button', () => {
			render(<SetupTab {...defaultProps} />);
			expect(screen.getByText(/Einstellungen speichern/)).toBeInTheDocument();
		});
	});

	describe('Pauschal-Modus', () => {
		it('zeigt Preset-Karten im Pauschal-Modus', () => {
			render(<SetupTab {...defaultProps} />);
			// Preset cards should be visible
			const container = screen.getByText(/Pauschal/).closest('div');
			expect(container).toBeInTheDocument();
		});
	});

	describe('Individuell-Modus', () => {
		it('zeigt FactorEditor im Individuell-Modus', async () => {
			const _user = userEvent.setup();
			render(
				<SetupTab
					{...defaultProps}
					settings={{ ...mockSettings, setup_mode: 'individuell' }}
				/>,
			);

			expect(screen.getByTestId('factor-editor')).toBeInTheDocument();
		});
	});

	describe('Saving State', () => {
		it('zeigt Spinner beim Speichern', () => {
			render(<SetupTab {...defaultProps} isSaving={true} />);
			expect(screen.getByText(/Speichern/)).toBeInTheDocument();
		});
	});
});
