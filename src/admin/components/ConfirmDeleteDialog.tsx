/**
 * ConfirmDeleteDialog — Reusable confirmation dialog for delete actions.
 *
 * Uses AlertDialog (prevents closing by clicking outside).
 * Follows RESA Design System with inline styles.
 *
 * @example
 * ```tsx
 * <ConfirmDeleteDialog
 *   open={deleteDialogOpen}
 *   onOpenChange={setDeleteDialogOpen}
 *   title={__('Webhook löschen?', 'resa')}
 *   description={__('Der Webhook wird unwiderruflich gelöscht.', 'resa')}
 *   onConfirm={handleDelete}
 *   isLoading={deleteMutation.isPending}
 * />
 * ```
 */

import { useState, type ReactNode } from 'react';
import { __ } from '@wordpress/i18n';
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface ConfirmDeleteDialogProps {
	/** Controls dialog visibility */
	open: boolean;
	/** Callback when open state changes */
	onOpenChange: (open: boolean) => void;
	/** Dialog title */
	title: string;
	/** Dialog description/warning text */
	description: string;
	/** Callback when user confirms deletion */
	onConfirm: () => void | Promise<void>;
	/** Show loading spinner on confirm button */
	isLoading?: boolean;
	/** Custom confirm button text (default: "Löschen") */
	confirmText?: string;
	/** Custom cancel button text (default: "Abbrechen") */
	cancelText?: string;
	/** Item name to display (optional, for context) */
	itemName?: string;
}

// ─── Styled Button Components ────────────────────────────

function OutlineButton({
	children,
	onClick,
	disabled,
}: {
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
}) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<Button
			type="button"
			size="sm"
			onClick={onClick}
			disabled={disabled}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				backgroundColor: isHovered ? 'hsl(210 40% 96.1%)' : 'white',
				color: '#1e303a',
				border: '1px solid hsl(214.3 31.8% 78%)',
				cursor: disabled ? 'not-allowed' : 'pointer',
				opacity: disabled ? 0.5 : 1,
				gap: '6px',
			}}
		>
			{children}
		</Button>
	);
}

function DestructiveButton({
	children,
	onClick,
	disabled,
}: {
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
}) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<Button
			type="button"
			size="sm"
			onClick={onClick}
			disabled={disabled}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				backgroundColor: disabled
					? 'hsl(210 40% 96.1%)'
					: isHovered
						? 'hsl(0 84.2% 50.2%)'
						: 'hsl(0 84.2% 60.2%)',
				color: disabled ? 'hsl(215.4 16.3% 46.9%)' : 'white',
				border: 'none',
				cursor: disabled ? 'not-allowed' : 'pointer',
				opacity: 1,
				gap: '6px',
			}}
		>
			{children}
		</Button>
	);
}

export function ConfirmDeleteDialog({
	open,
	onOpenChange,
	title,
	description,
	onConfirm,
	isLoading = false,
	confirmText,
	cancelText,
	itemName,
}: ConfirmDeleteDialogProps) {
	const handleConfirm = async () => {
		await onConfirm();
		// Dialog closes after successful deletion (handled by parent via onOpenChange)
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent
				style={{
					backgroundColor: 'white',
					borderRadius: '12px',
					padding: '24px',
					maxWidth: '420px',
				}}
			>
				<AlertDialogHeader>
					<AlertDialogTitle
						style={{
							fontSize: '18px',
							fontWeight: 600,
							color: '#1e303a',
							margin: 0,
						}}
					>
						{title}
					</AlertDialogTitle>
					<AlertDialogDescription
						style={{
							fontSize: '14px',
							color: 'hsl(215.4 16.3% 46.9%)',
							marginTop: '8px',
						}}
					>
						{description}
						{itemName && (
							<span
								style={{
									display: 'block',
									marginTop: '8px',
									padding: '8px 12px',
									backgroundColor: 'hsl(210 40% 96.1%)',
									borderRadius: '6px',
									fontWeight: 500,
									color: '#1e303a',
								}}
							>
								{itemName}
							</span>
						)}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter style={{ marginTop: '16px', gap: '8px' }}>
					<OutlineButton onClick={() => onOpenChange(false)} disabled={isLoading}>
						{cancelText ?? __('Abbrechen', 'resa')}
					</OutlineButton>
					<DestructiveButton onClick={handleConfirm} disabled={isLoading}>
						{isLoading && (
							<Spinner
								style={{ width: '14px', height: '14px', marginRight: '8px' }}
							/>
						)}
						{confirmText ?? __('Löschen', 'resa')}
					</DestructiveButton>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
