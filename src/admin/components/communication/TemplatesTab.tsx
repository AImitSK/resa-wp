/**
 * Templates tab — list of all email templates with status badges.
 */

import { __ } from '@wordpress/i18n';
import { Mail } from 'lucide-react';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TemplatesTabProps {
	onEdit: (templateId: string) => void;
}

export function TemplatesTab({ onEdit }: TemplatesTabProps) {
	const { data: templates, isLoading } = useEmailTemplates();

	if (isLoading) {
		return (
			<div className="resa-flex resa-items-center resa-justify-center resa-py-12">
				<Spinner />
			</div>
		);
	}

	if (!templates || templates.length === 0) {
		return (
			<p className="resa-text-center resa-text-muted-foreground resa-py-8">
				{__('Keine Vorlagen vorhanden.', 'resa')}
			</p>
		);
	}

	return (
		<div className="resa-grid resa-gap-4">
			{templates.map((template) => (
				<Card key={template.id} className="hover:resa-shadow-md resa-transition-shadow">
					<CardHeader className="resa-pb-3">
						<div className="resa-flex resa-items-start resa-justify-between resa-gap-4">
							<div className="resa-flex resa-items-start resa-gap-3">
								<div className="resa-flex resa-size-10 resa-shrink-0 resa-items-center resa-justify-center resa-rounded-lg resa-bg-muted">
									<Mail className="resa-size-5 resa-text-muted-foreground" />
								</div>
								<div className="resa-min-w-0">
									<div className="resa-flex resa-items-center resa-gap-2">
										<CardTitle className="resa-text-base">
											{template.name}
										</CardTitle>
										<Badge
											variant={template.is_active ? 'default' : 'secondary'}
										>
											{template.is_active
												? __('Aktiv', 'resa')
												: __('Inaktiv', 'resa')}
										</Badge>
									</div>
									<CardDescription className="resa-mt-0.5">
										{template.description}
									</CardDescription>
									<p className="resa-mt-2 resa-text-sm resa-text-muted-foreground resa-truncate">
										{__('Betreff:', 'resa')}{' '}
										<span className="resa-text-foreground">
											{template.subject}
										</span>
									</p>
								</div>
							</div>
							<Button variant="outline" size="sm" onClick={() => onEdit(template.id)}>
								{__('Bearbeiten', 'resa')}
							</Button>
						</div>
					</CardHeader>
				</Card>
			))}
		</div>
	);
}
