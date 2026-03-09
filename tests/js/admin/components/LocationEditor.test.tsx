import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationEditor } from '@admin/components/LocationEditor';

// Mock LocationMapPicker (uses Leaflet)
vi.mock('@admin/components/LocationMapPicker', () => ({
	LocationMapPicker: () => <div data-testid="map-picker">Map Picker</div>,
}));

describe('LocationEditor', () => {
	const defaultProps = {
		onSave: vi.fn(),
		onCancel: vi.fn(),
		isSaving: false,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Create Mode', () => {
		it('zeigt "Neuer Standort" als Überschrift', () => {
			render(<LocationEditor {...defaultProps} />);
			expect(screen.getByText('Neuer Standort')).toBeInTheDocument();
		});

		it('zeigt Beschreibungstext', () => {
			render(<LocationEditor {...defaultProps} />);
			expect(
				screen.getByText('Konfiguriere die Grunddaten und regionalen Einstellungen.'),
			).toBeInTheDocument();
		});

		it('zeigt 3 Sektionen', () => {
			render(<LocationEditor {...defaultProps} />);
			expect(screen.getByText('Grunddaten')).toBeInTheDocument();
			expect(screen.getByText('Kartenposition')).toBeInTheDocument();
			expect(screen.getByText('Regionale Kostensätze')).toBeInTheDocument();
		});

		it('zeigt Formular-Felder', () => {
			render(<LocationEditor {...defaultProps} />);
			expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
			expect(screen.getByLabelText(/Slug/)).toBeInTheDocument();
			expect(screen.getByLabelText(/Land/)).toBeInTheDocument();
			expect(screen.getByLabelText(/Regionstyp/)).toBeInTheDocument();
		});

		it('zeigt Kostensatz-Felder', () => {
			render(<LocationEditor {...defaultProps} />);
			expect(screen.getByLabelText(/Grunderwerbsteuer/)).toBeInTheDocument();
			expect(screen.getByLabelText(/Maklerprovision/)).toBeInTheDocument();
		});

		it('rendert Map-Picker', () => {
			render(<LocationEditor {...defaultProps} />);
			expect(screen.getByTestId('map-picker')).toBeInTheDocument();
		});

		it('zeigt Speichern und Abbrechen Buttons', () => {
			render(<LocationEditor {...defaultProps} />);
			expect(screen.getByText('Speichern')).toBeInTheDocument();
			expect(screen.getByText('Abbrechen')).toBeInTheDocument();
		});

		it('generiert Slug automatisch aus Name', async () => {
			const user = userEvent.setup();
			render(<LocationEditor {...defaultProps} />);

			const nameInput = screen.getByLabelText(/Name/);
			await user.type(nameInput, 'München');

			const slugInput = screen.getByLabelText(/Slug/) as HTMLInputElement;
			await waitFor(() => {
				expect(slugInput.value).toBe('muenchen');
			});
		});

		it('ruft onCancel beim Abbrechen auf', async () => {
			const user = userEvent.setup();
			render(<LocationEditor {...defaultProps} />);
			await user.click(screen.getByText('Abbrechen'));
			expect(defaultProps.onCancel).toHaveBeenCalled();
		});
	});

	describe('Edit Mode', () => {
		const editData = {
			name: 'Berlin',
			slug: 'berlin',
			country: 'Deutschland',
			bundesland: 'Berlin',
			region_type: 'large_city' as const,
			latitude: 52.52,
			longitude: 13.405,
			zoom_level: 13,
			data: {
				grunderwerbsteuer: 6.0,
				maklerprovision: 3.57,
			},
		};

		it('zeigt "Standort bearbeiten" als Überschrift', () => {
			render(<LocationEditor {...defaultProps} initialData={editData} />);
			expect(screen.getByText('Standort bearbeiten')).toBeInTheDocument();
		});

		it('befüllt Felder mit initialData', () => {
			render(<LocationEditor {...defaultProps} initialData={editData} />);
			// Berlin appears in both name and bundesland fields
			const berlinFields = screen.getAllByDisplayValue('Berlin');
			expect(berlinFields.length).toBeGreaterThanOrEqual(1);
			expect(screen.getByDisplayValue('berlin')).toBeInTheDocument();
			expect(screen.getByDisplayValue('Deutschland')).toBeInTheDocument();
		});
	});

	describe('Saving State', () => {
		it('zeigt "Speichern..." wenn isSaving', () => {
			render(<LocationEditor {...defaultProps} isSaving={true} />);
			expect(screen.getByText('Speichern...')).toBeInTheDocument();
		});

		it('deaktiviert Speichern-Button wenn isSaving', () => {
			render(<LocationEditor {...defaultProps} isSaving={true} />);
			const saveButton = screen.getByText('Speichern...');
			expect(saveButton.closest('button')).toBeDisabled();
		});
	});
});
