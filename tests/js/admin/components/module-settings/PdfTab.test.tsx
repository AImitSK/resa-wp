import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PdfTab } from '@admin/components/module-settings/PdfTab';

// ─── Mock Data ──────────────────────────────────────────

const mockPdfSettings = {
	showChart: true,
	showFactors: true,
	showMap: false,
	showCta: true,
	showDisclaimer: true,
	ctaTitle: 'Kontakt aufnehmen',
	ctaText: 'Lieber {name}, kontaktieren Sie uns!',
};

const mockSave = vi.fn();

// ─── Mocks ──────────────────────────────────────────────

vi.mock('@admin/hooks/useModulePdfSettings', () => ({
	useModulePdfSettings: vi.fn(() => ({
		data: mockPdfSettings,
		isLoading: false,
		error: null,
	})),
	useSaveModulePdfSettings: vi.fn(() => ({
		mutateAsync: mockSave,
		isPending: false,
	})),
}));

vi.mock('@admin/lib/toast', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── Tests ──────────────────────────────────────────────

describe('PdfTab', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('zeigt Überschrift', () => {
			render(<PdfTab slug="rent-calculator" />);
			expect(screen.getByText('PDF-Ausgabe')).toBeInTheDocument();
		});

		it('zeigt alle 5 Sektions-Toggles', () => {
			render(<PdfTab slug="rent-calculator" />);
			expect(screen.getByText('Marktvergleich-Diagramm')).toBeInTheDocument();
			expect(screen.getByText('Einflussfaktoren')).toBeInTheDocument();
			expect(screen.getByText('Standort-Karte')).toBeInTheDocument();
			expect(screen.getByText('Kontakt-CTA')).toBeInTheDocument();
			expect(screen.getByText('Hinweis / Disclaimer')).toBeInTheDocument();
		});

		it('zeigt Toggle-Buttons für Sektionen', () => {
			render(<PdfTab slug="rent-calculator" />);
			// Custom toggle buttons with aria-label
			const toggles = screen.getAllByRole('button', {
				name: /Marktvergleich|Einflussfaktoren|Standort|Kontakt|Hinweis/,
			});
			expect(toggles.length).toBeGreaterThanOrEqual(1);
		});

		it('zeigt Speichern-Button', () => {
			render(<PdfTab slug="rent-calculator" />);
			expect(screen.getByText(/Speichern/)).toBeInTheDocument();
		});
	});

	describe('CTA-Felder', () => {
		it('zeigt CTA-Felder wenn showCta aktiviert', () => {
			render(<PdfTab slug="rent-calculator" />);
			expect(screen.getByDisplayValue('Kontakt aufnehmen')).toBeInTheDocument();
		});
	});

	describe('Loading State', () => {
		it('zeigt Lade-Zustand', async () => {
			const { useModulePdfSettings } = await import('@admin/hooks/useModulePdfSettings');
			vi.mocked(useModulePdfSettings).mockReturnValue({
				data: undefined,
				isLoading: true,
				error: null,
			} as ReturnType<typeof useModulePdfSettings>);

			render(<PdfTab slug="rent-calculator" />);
			expect(screen.getByText(/Lade PDF/)).toBeInTheDocument();
		});
	});

	describe('Error State', () => {
		it('zeigt Fehler-Zustand', async () => {
			const { useModulePdfSettings } = await import('@admin/hooks/useModulePdfSettings');
			vi.mocked(useModulePdfSettings).mockReturnValue({
				data: undefined,
				isLoading: false,
				error: new Error('API Error'),
			} as ReturnType<typeof useModulePdfSettings>);

			render(<PdfTab slug="rent-calculator" />);
			expect(screen.getByText(/Fehler|Error/)).toBeInTheDocument();
		});
	});
});
