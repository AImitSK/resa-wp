/**
 * Communication page — email templates, send log, SMTP setup.
 *
 * Two views: list (tabs with templates/log/smtp) and editor (template detail).
 */

import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { FileText, Server, Send, Clock } from 'lucide-react';

import { AdminPageLayout } from '../components/AdminPageLayout';
import { TemplatesTab } from '../components/communication/TemplatesTab';
import { TemplateEditor } from '../components/communication/TemplateEditor';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type View = { type: 'list' } | { type: 'editor'; templateId: string };

export function Communication() {
	const [view, setView] = useState<View>({ type: 'list' });

	// Editor view.
	if (view.type === 'editor') {
		return (
			<TemplateEditor templateId={view.templateId} onBack={() => setView({ type: 'list' })} />
		);
	}

	// List view.
	return (
		<AdminPageLayout
			variant="overview"
			title={__('Kommunikation', 'resa')}
			description={__('E-Mail-Vorlagen, Versandlog und SMTP-Einstellungen.', 'resa')}
		>
			<Tabs defaultValue="templates">
				<TabsList>
					<TabsTrigger value="templates" className="resa-gap-1">
						<FileText className="resa-size-3" />
						{__('Vorlagen', 'resa')}
					</TabsTrigger>
					<TabsTrigger value="log" className="resa-gap-1">
						<Send className="resa-size-3" />
						{__('Versandlog', 'resa')}
					</TabsTrigger>
					<TabsTrigger value="smtp" className="resa-gap-1">
						<Server className="resa-size-3" />
						{__('SMTP', 'resa')}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="templates" className="resa-mt-4">
					<TemplatesTab onEdit={(id) => setView({ type: 'editor', templateId: id })} />
				</TabsContent>

				<TabsContent value="log" className="resa-mt-4">
					<Card>
						<CardHeader>
							<CardTitle className="resa-text-lg">
								{__('Versandlog', 'resa')}
							</CardTitle>
							<CardDescription>
								{__('Übersicht aller versendeten E-Mails.', 'resa')}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="resa-space-y-3">
								{[1, 2, 3].map((i) => (
									<div
										key={i}
										className="resa-flex resa-items-center resa-justify-between resa-p-3 resa-rounded-lg resa-border"
									>
										<div className="resa-flex resa-items-center resa-gap-3">
											<Send className="resa-size-4 resa-text-green-500" />
											<div>
												<p className="resa-font-medium">max@example.com</p>
												<p className="resa-text-sm resa-text-muted-foreground">
													{__('Lead-Benachrichtigung', 'resa')}
												</p>
											</div>
										</div>
										<div className="resa-flex resa-items-center resa-gap-2 resa-text-sm resa-text-muted-foreground">
											<Clock className="resa-size-3" />
											{__('Vor 2 Stunden', 'resa')}
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="smtp" className="resa-mt-4">
					<Card>
						<CardHeader>
							<CardTitle className="resa-text-lg">
								{__('SMTP-Einstellungen', 'resa')}
							</CardTitle>
							<CardDescription>
								{__('Konfiguriere deinen E-Mail-Server für den Versand.', 'resa')}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="resa-flex resa-items-center resa-gap-3 resa-p-4 resa-rounded-lg resa-border resa-bg-muted/30">
								<Server className="resa-size-5 resa-text-muted-foreground" />
								<div>
									<p className="resa-font-medium">
										{__('WordPress Standard', 'resa')}
									</p>
									<p className="resa-text-sm resa-text-muted-foreground">
										{__('E-Mails werden über wp_mail() versendet.', 'resa')}
									</p>
								</div>
								<Badge variant="secondary" className="resa-ml-auto">
									{__('Aktiv', 'resa')}
								</Badge>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</AdminPageLayout>
	);
}
