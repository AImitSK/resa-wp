/**
 * Communication page — email templates, send log, SMTP setup.
 */

import { __ } from '@wordpress/i18n';
import { Mail, FileText, Server, Send, Clock } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function Communication() {
	return (
		<div className="resa-space-y-6">
			{/* Header */}
			<div>
				<h1 className="resa-text-2xl resa-font-bold resa-tracking-tight">
					{__('Kommunikation', 'resa')}
				</h1>
				<p className="resa-text-muted-foreground resa-mt-1">
					{__('E-Mail-Vorlagen, Versandlog und SMTP-Einstellungen.', 'resa')}
				</p>
			</div>

			{/* Tabs */}
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
					<div className="resa-grid resa-gap-4">
						{/* Template cards */}
						{[
							{
								title: __('Lead-Benachrichtigung', 'resa'),
								description: __('E-Mail an Makler bei neuem Lead.', 'resa'),
								status: 'active',
							},
							{
								title: __('Lead-PDF', 'resa'),
								description: __('PDF-Ergebnis an Interessenten.', 'resa'),
								status: 'active',
							},
							{
								title: __('Follow-up', 'resa'),
								description: __('Automatische Nachfass-E-Mail.', 'resa'),
								status: 'inactive',
							},
						].map((template, index) => (
							<Card
								key={index}
								className="hover:resa-shadow-md resa-transition-shadow"
							>
								<CardHeader className="resa-pb-2">
									<div className="resa-flex resa-items-center resa-justify-between">
										<div className="resa-flex resa-items-center resa-gap-3">
											<div className="resa-flex resa-size-10 resa-items-center resa-justify-center resa-rounded-lg resa-bg-muted">
												<Mail className="resa-size-5 resa-text-muted-foreground" />
											</div>
											<div>
												<CardTitle className="resa-text-base">
													{template.title}
												</CardTitle>
												<CardDescription className="resa-mt-0.5">
													{template.description}
												</CardDescription>
											</div>
										</div>
										<Badge
											variant={
												template.status === 'active'
													? 'default'
													: 'secondary'
											}
										>
											{template.status === 'active'
												? __('Aktiv', 'resa')
												: __('Inaktiv', 'resa')}
										</Badge>
									</div>
								</CardHeader>
							</Card>
						))}

						<div className="resa-text-center resa-py-4">
							<Badge variant="outline">
								{__(
									'Kommunikationszentrale wird in Phase 3.6 implementiert.',
									'resa',
								)}
							</Badge>
						</div>
					</div>
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
		</div>
	);
}
