import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrackingTab } from '@admin/components/settings/TrackingTab';

// ─── Mock Data ──────────────────────────────────────────

const mockTrackingSettings = {
	fv_id: '',
	fv_label: '',
	fs_id: '',
	fs_label: '',
	datalayer_enabled: false,
	enhanced_conversions_enabled: false,
	gclid_enabled: false,
	utm_enabled: false,
	partial_leads_enabled: false,
};

const mockSave = vi.fn();

// ─── Mocks ──────────────────────────────────────────────

vi.mock('@admin/hooks/useTrackingSettings', () => ({
	useTrackingSettings: vi.fn(() => ({
		data: mockTrackingSettings,
		isLoading: false,
		error: null,
	})),
	useSaveTrackingSettings: vi.fn(() => ({
		mutateAsync: mockSave,
		isPending: false,
	})),
}));

vi.mock('@admin/hooks/useFeatures', () => ({
	useFeatures: vi.fn(() => ({
		plan: 'premium',
		can_use_advanced_tracking: true,
	})),
}));

vi.mock('@admin/lib/toast', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── Tests ──────────────────────────────────────────────

describe('TrackingTab', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('zeigt Google Ads Sektion', () => {
			render(<TrackingTab />);
			expect(screen.getByText('Google Ads Conversions')).toBeInTheDocument();
		});

		it('zeigt dataLayer / GTM Sektion', () => {
			render(<TrackingTab />);
			expect(screen.getByText('dataLayer / GTM Events')).toBeInTheDocument();
		});

		it('zeigt Erweiterte Optionen Sektion', () => {
			render(<TrackingTab />);
			expect(screen.getByText('Erweiterte Optionen')).toBeInTheDocument();
		});

		it('zeigt Speichern-Button', () => {
			render(<TrackingTab />);
			expect(screen.getByText(/Speichern/)).toBeInTheDocument();
		});
	});

	describe('Google Ads Felder', () => {
		it('zeigt Conversion-ID Eingabefelder', () => {
			render(<TrackingTab />);
			// Google Ads Conversions card has input fields for IDs and labels
			const inputs = screen.getAllByRole('textbox');
			expect(inputs.length).toBeGreaterThanOrEqual(1);
		});
	});

	describe('dataLayer Toggle', () => {
		it('zeigt dataLayer-Toggle', () => {
			render(<TrackingTab />);
			const switches = screen.getAllByRole('switch');
			expect(switches.length).toBeGreaterThanOrEqual(1);
		});
	});

	describe('Loading State', () => {
		it('zeigt Lade-Zustand', async () => {
			const { useTrackingSettings } = await import('@admin/hooks/useTrackingSettings');
			vi.mocked(useTrackingSettings).mockReturnValue({
				data: undefined,
				isLoading: true,
				error: null,
			} as ReturnType<typeof useTrackingSettings>);

			render(<TrackingTab />);
			expect(screen.getByText(/Wird geladen|Lade/)).toBeInTheDocument();
		});
	});
});
