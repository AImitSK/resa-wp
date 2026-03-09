import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDeleteDialog } from '@admin/components/ConfirmDeleteDialog';

describe('ConfirmDeleteDialog', () => {
	const defaultProps = {
		open: true,
		onOpenChange: vi.fn(),
		title: 'Webhook löschen?',
		description: 'Der Webhook wird unwiderruflich gelöscht.',
		onConfirm: vi.fn(),
	};

	it('rendert Titel und Beschreibung', () => {
		render(<ConfirmDeleteDialog {...defaultProps} />);
		expect(screen.getByText('Webhook löschen?')).toBeInTheDocument();
		expect(screen.getByText(/Der Webhook wird unwiderruflich gelöscht/)).toBeInTheDocument();
	});

	it('zeigt Standard-Buttons "Abbrechen" und "Löschen"', () => {
		render(<ConfirmDeleteDialog {...defaultProps} />);
		expect(screen.getByText('Abbrechen')).toBeInTheDocument();
		expect(screen.getByText('Löschen')).toBeInTheDocument();
	});

	it('zeigt custom Button-Texte', () => {
		render(
			<ConfirmDeleteDialog {...defaultProps} confirmText="Ja, entfernen" cancelText="Nein" />,
		);
		expect(screen.getByText('Nein')).toBeInTheDocument();
		expect(screen.getByText('Ja, entfernen')).toBeInTheDocument();
	});

	it('zeigt itemName wenn angegeben', () => {
		render(<ConfirmDeleteDialog {...defaultProps} itemName="Mein Webhook" />);
		expect(screen.getByText('Mein Webhook')).toBeInTheDocument();
	});

	it('ruft onConfirm beim Klick auf Löschen', async () => {
		const user = userEvent.setup();
		const onConfirm = vi.fn();
		render(<ConfirmDeleteDialog {...defaultProps} onConfirm={onConfirm} />);

		await user.click(screen.getByText('Löschen'));
		expect(onConfirm).toHaveBeenCalled();
	});

	it('ruft onOpenChange(false) beim Abbrechen', async () => {
		const user = userEvent.setup();
		const onOpenChange = vi.fn();
		render(<ConfirmDeleteDialog {...defaultProps} onOpenChange={onOpenChange} />);

		await user.click(screen.getByText('Abbrechen'));
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it('zeigt keinen Dialog wenn open=false', () => {
		render(<ConfirmDeleteDialog {...defaultProps} open={false} />);
		expect(screen.queryByText('Webhook löschen?')).not.toBeInTheDocument();
	});

	it('deaktiviert Buttons bei isLoading', () => {
		render(<ConfirmDeleteDialog {...defaultProps} isLoading={true} />);
		// Both buttons should be disabled
		const buttons = screen.getAllByRole('button');
		buttons.forEach((btn) => {
			expect(btn).toBeDisabled();
		});
	});
});
