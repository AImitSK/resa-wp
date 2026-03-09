import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeadEmailLogSection } from '@admin/components/leads/LeadEmailLogSection';

const mockEmails = [
	{
		id: 1,
		subject: 'Ihre Mietpreisanalyse',
		recipient: 'max@example.com',
		status: 'sent' as const,
		sentAt: '2026-03-01T10:00:00Z',
	},
	{
		id: 2,
		subject: 'Follow-up',
		recipient: 'max@example.com',
		status: 'failed' as const,
		sentAt: '2026-03-02T14:00:00Z',
	},
];

vi.mock('@admin/hooks/useLeadEmails', () => ({
	useLeadEmails: vi.fn(() => ({
		data: mockEmails,
		isLoading: false,
	})),
}));

describe('LeadEmailLogSection', () => {
	it('zeigt Überschrift "E-Mail-Verlauf"', () => {
		render(<LeadEmailLogSection leadId={1} />);
		expect(screen.getByText('E-Mail-Verlauf')).toBeInTheDocument();
	});

	it('zeigt E-Mail-Betreffs', () => {
		render(<LeadEmailLogSection leadId={1} />);
		expect(screen.getByText('Ihre Mietpreisanalyse')).toBeInTheDocument();
		expect(screen.getByText('Follow-up')).toBeInTheDocument();
	});

	it('zeigt Empfänger-Adresse', () => {
		render(<LeadEmailLogSection leadId={1} />);
		const recipients = screen.getAllByText('max@example.com');
		expect(recipients.length).toBeGreaterThanOrEqual(1);
	});

	it('zeigt formatiertes Datum', () => {
		render(<LeadEmailLogSection leadId={1} />);
		expect(screen.getByText(/01\.03\.2026/)).toBeInTheDocument();
	});

	it('zeigt Lade-Zustand', async () => {
		const { useLeadEmails } = await import('@admin/hooks/useLeadEmails');
		vi.mocked(useLeadEmails).mockReturnValue({
			data: undefined,
			isLoading: true,
		} as ReturnType<typeof useLeadEmails>);

		render(<LeadEmailLogSection leadId={1} />);
		expect(screen.getByText('Lade E-Mails...')).toBeInTheDocument();
	});

	it('zeigt Empty State', async () => {
		const { useLeadEmails } = await import('@admin/hooks/useLeadEmails');
		vi.mocked(useLeadEmails).mockReturnValue({
			data: [],
			isLoading: false,
		} as ReturnType<typeof useLeadEmails>);

		render(<LeadEmailLogSection leadId={1} />);
		expect(screen.getByText('Noch keine E-Mails versendet.')).toBeInTheDocument();
	});
});
