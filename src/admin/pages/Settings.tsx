/**
 * Settings page — agent data, branding, license, GDPR.
 */

import { __ } from '@wordpress/i18n';
import { User, Palette, Key, Shield, ChevronRight } from 'lucide-react';
import { AdminPageLayout } from '../components/AdminPageLayout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function Settings() {
	const settingsSections = [
		{
			icon: User,
			title: __('Maklerdaten', 'resa'),
			description: __('Name, Kontaktdaten und Firmeninfos für PDF und E-Mails.', 'resa'),
			status: 'pending',
		},
		{
			icon: Palette,
			title: __('Branding & Design', 'resa'),
			description: __('Logo, Farben und Schriftarten für deine Smart Assets.', 'resa'),
			status: 'pending',
		},
		{
			icon: Key,
			title: __('Lizenz', 'resa'),
			description: __('Plan-Details, Lizenzschlüssel und Account-Verwaltung.', 'resa'),
			status: 'active',
		},
		{
			icon: Shield,
			title: __('Datenschutz (DSGVO)', 'resa'),
			description: __('Einwilligungstexte, Aufbewahrungsfristen und Datenlöschung.', 'resa'),
			status: 'pending',
		},
	];

	return (
		<AdminPageLayout
			variant="overview"
			title={__('Einstellungen', 'resa')}
			description={__('Maklerdaten, Branding, Lizenz und Datenschutz-Einstellungen.', 'resa')}
		>
			{/* Settings grid */}
			<div className="resa-grid resa-gap-4">
				{settingsSections.map((section, index) => {
					const IconComponent = section.icon;
					return (
						<Card
							key={index}
							className="resa-cursor-pointer hover:resa-shadow-md resa-transition-shadow"
						>
							<CardHeader className="resa-pb-2">
								<div className="resa-flex resa-items-center resa-justify-between">
									<div className="resa-flex resa-items-center resa-gap-3">
										<div className="resa-flex resa-size-10 resa-items-center resa-justify-center resa-rounded-lg resa-bg-muted">
											<IconComponent className="resa-size-5 resa-text-muted-foreground" />
										</div>
										<div>
											<CardTitle className="resa-text-base">
												{section.title}
											</CardTitle>
											<CardDescription className="resa-mt-0.5">
												{section.description}
											</CardDescription>
										</div>
									</div>
									<div className="resa-flex resa-items-center resa-gap-2">
										{section.status === 'pending' && (
											<Badge variant="secondary">
												{__('Kommt bald', 'resa')}
											</Badge>
										)}
										<ChevronRight className="resa-size-4 resa-text-muted-foreground" />
									</div>
								</div>
							</CardHeader>
						</Card>
					);
				})}
			</div>

			<Separator />

			{/* License info */}
			<Card>
				<CardHeader>
					<CardTitle className="resa-text-lg">
						{__('Lizenzinformationen', 'resa')}
					</CardTitle>
					<CardDescription>
						{__('Details zu deinem aktuellen Plan und deiner Installation.', 'resa')}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="resa-grid resa-grid-cols-2 md:resa-grid-cols-4 resa-gap-4">
						<div className="resa-space-y-1">
							<p className="resa-text-sm resa-text-muted-foreground">
								{__('Version', 'resa')}
							</p>
							<p className="resa-font-medium">{window.resaAdmin?.version ?? '—'}</p>
						</div>
						<div className="resa-space-y-1">
							<p className="resa-text-sm resa-text-muted-foreground">
								{__('Plan', 'resa')}
							</p>
							<div className="resa-flex resa-items-center resa-gap-2">
								<p className="resa-font-medium">{__('Free', 'resa')}</p>
								<Badge variant="secondary">{__('Aktiv', 'resa')}</Badge>
							</div>
						</div>
						<div className="resa-space-y-1">
							<p className="resa-text-sm resa-text-muted-foreground">
								{__('Aktive Module', 'resa')}
							</p>
							<p className="resa-font-medium">2 / 2</p>
						</div>
						<div className="resa-space-y-1">
							<p className="resa-text-sm resa-text-muted-foreground">
								{__('Leads diesen Monat', 'resa')}
							</p>
							<p className="resa-font-medium">24 / 50</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</AdminPageLayout>
	);
}
