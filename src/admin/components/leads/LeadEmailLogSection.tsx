/**
 * Lead email log section — shows sent emails for a specific lead.
 */

import { __ } from '@wordpress/i18n';
import { Send, AlertCircle, Clock, Mail } from 'lucide-react';
import { useLeadEmails } from '../../hooks/useLeadEmails';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

interface LeadEmailLogSectionProps {
	leadId: number;
}

function formatDateTime(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

export function LeadEmailLogSection({ leadId }: LeadEmailLogSectionProps) {
	const { data: emails, isLoading } = useLeadEmails(leadId);

	return (
		<div
			style={{
				borderRadius: '8px',
				border: '1px solid hsl(214.3 31.8% 91.4%)',
				overflow: 'hidden',
			}}
		>
			<div
				style={{
					padding: '12px 16px',
					backgroundColor: 'hsl(210 40% 96.1%)',
					borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
				}}
			>
				<span style={{ fontWeight: 600, color: '#1e303a' }}>
					{__('E-Mail-Verlauf', 'resa')}
				</span>
			</div>
			<div style={{ padding: '16px' }}>
				{isLoading ? (
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '8px',
							padding: '12px',
						}}
					>
						<Spinner style={{ width: '16px', height: '16px' }} />
						<span style={{ fontSize: '13px', color: 'hsl(215.4 16.3% 46.9%)' }}>
							{__('Lade E-Mails...', 'resa')}
						</span>
					</div>
				) : !emails || emails.length === 0 ? (
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							padding: '8px 0',
							color: 'hsl(215.4 16.3% 46.9%)',
							fontSize: '13px',
						}}
					>
						<Mail style={{ width: '14px', height: '14px' }} />
						{__('Noch keine E-Mails versendet.', 'resa')}
					</div>
				) : (
					<Table>
						<TableBody>
							{emails.map((email, index) => (
								<TableRow key={email.id}>
									<TableCell
										style={{
											padding: '10px 0',
											width: '28px',
											borderBottom:
												index < emails.length - 1
													? '1px solid hsl(214.3 31.8% 91.4%)'
													: 'none',
										}}
									>
										{email.status === 'failed' ? (
											<AlertCircle
												style={{
													width: '16px',
													height: '16px',
													color: '#ef4444',
												}}
											/>
										) : (
											<Send
												style={{
													width: '16px',
													height: '16px',
													color: '#22c55e',
												}}
											/>
										)}
									</TableCell>
									<TableCell
										style={{
											padding: '10px 8px',
											fontSize: '13px',
											borderBottom:
												index < emails.length - 1
													? '1px solid hsl(214.3 31.8% 91.4%)'
													: 'none',
										}}
									>
										<div style={{ fontWeight: 500, color: '#1e303a' }}>
											{email.subject}
										</div>
										<div
											style={{
												fontSize: '12px',
												color: 'hsl(215.4 16.3% 46.9%)',
												marginTop: '2px',
											}}
										>
											{email.recipient}
										</div>
									</TableCell>
									<TableCell
										style={{
											padding: '10px 0',
											fontSize: '12px',
											color: 'hsl(215.4 16.3% 46.9%)',
											textAlign: 'right',
											whiteSpace: 'nowrap',
											borderBottom:
												index < emails.length - 1
													? '1px solid hsl(214.3 31.8% 91.4%)'
													: 'none',
										}}
									>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'flex-end',
												gap: '4px',
											}}
										>
											<Clock style={{ width: '12px', height: '12px' }} />
											{formatDateTime(email.sentAt)}
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>
		</div>
	);
}
