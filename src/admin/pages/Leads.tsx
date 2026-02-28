/**
 * Leads page — lead list with filters and search.
 */

import { __ } from '@wordpress/i18n';
import { Users, Search, Download, Filter, Mail, Phone, Clock } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function Leads() {
	// Mock data for visual preview
	const mockLeads = [
		{
			id: 1,
			name: 'Max Mustermann',
			email: 'max@example.com',
			phone: '+49 171 1234567',
			module: 'Mietpreis-Kalkulator',
			location: 'München',
			status: 'new',
			createdAt: 'Vor 2 Stunden',
		},
		{
			id: 2,
			name: 'Anna Schmidt',
			email: 'anna@example.com',
			phone: '+49 172 2345678',
			module: 'Immobilienwert-Rechner',
			location: 'Berlin',
			status: 'contacted',
			createdAt: 'Vor 5 Stunden',
		},
		{
			id: 3,
			name: 'Thomas Weber',
			email: 'thomas@example.com',
			phone: '+49 173 3456789',
			module: 'Mietpreis-Kalkulator',
			location: 'Hamburg',
			status: 'qualified',
			createdAt: 'Gestern',
		},
	];

	const statusLabels: Record<
		string,
		{ label: string; variant: 'default' | 'secondary' | 'outline' }
	> = {
		new: { label: __('Neu', 'resa'), variant: 'default' },
		contacted: { label: __('Kontaktiert', 'resa'), variant: 'secondary' },
		qualified: { label: __('Qualifiziert', 'resa'), variant: 'outline' },
	};

	return (
		<div className="resa-space-y-6">
			{/* Header */}
			<div className="resa-flex resa-items-center resa-justify-between">
				<div>
					<h1 className="resa-text-2xl resa-font-bold resa-tracking-tight">
						{__('Leads', 'resa')}
					</h1>
					<p className="resa-text-muted-foreground resa-mt-1">
						{__('Alle erfassten Leads mit Filterung, Suche und Export.', 'resa')}
					</p>
				</div>
				<Button variant="outline" className="resa-gap-2">
					<Download className="resa-size-4" />
					{__('Exportieren', 'resa')}
				</Button>
			</div>

			{/* Filter bar */}
			<div className="resa-flex resa-flex-wrap resa-items-center resa-gap-4">
				<Tabs defaultValue="all">
					<TabsList>
						<TabsTrigger value="all">{__('Alle (128)', 'resa')}</TabsTrigger>
						<TabsTrigger value="new">{__('Neu (24)', 'resa')}</TabsTrigger>
						<TabsTrigger value="contacted">
							{__('Kontaktiert (45)', 'resa')}
						</TabsTrigger>
						<TabsTrigger value="qualified">
							{__('Qualifiziert (59)', 'resa')}
						</TabsTrigger>
					</TabsList>
				</Tabs>

				<div className="resa-relative resa-flex-1 resa-max-w-xs">
					<Search className="resa-absolute resa-left-3 resa-top-1/2 -resa-translate-y-1/2 resa-size-4 resa-text-muted-foreground" />
					<Input
						type="search"
						placeholder={__('Suchen...', 'resa')}
						className="resa-pl-9"
					/>
				</div>

				<Button variant="outline" size="sm" className="resa-gap-1">
					<Filter className="resa-size-3" />
					{__('Filter', 'resa')}
				</Button>
			</div>

			{/* Lead list */}
			<Card>
				<CardHeader>
					<CardTitle className="resa-text-lg">{__('Neueste Leads', 'resa')}</CardTitle>
					<CardDescription>
						{__('Die letzten eingegangenen Anfragen deiner Smart Assets.', 'resa')}
					</CardDescription>
				</CardHeader>
				<CardContent className="resa-space-y-4">
					{mockLeads.map((lead) => (
						<div
							key={lead.id}
							className="resa-flex resa-items-center resa-justify-between resa-p-4 resa-rounded-lg resa-border hover:resa-bg-muted/50 resa-transition-colors"
						>
							<div className="resa-flex resa-items-center resa-gap-4">
								<div className="resa-flex resa-size-10 resa-items-center resa-justify-center resa-rounded-full resa-bg-primary/10">
									<Users className="resa-size-5 resa-text-primary" />
								</div>
								<div>
									<p className="resa-font-medium">{lead.name}</p>
									<div className="resa-flex resa-items-center resa-gap-3 resa-text-sm resa-text-muted-foreground">
										<span className="resa-flex resa-items-center resa-gap-1">
											<Mail className="resa-size-3" />
											{lead.email}
										</span>
										<span className="resa-flex resa-items-center resa-gap-1">
											<Phone className="resa-size-3" />
											{lead.phone}
										</span>
									</div>
								</div>
							</div>
							<div className="resa-flex resa-items-center resa-gap-4">
								<div className="resa-text-right">
									<p className="resa-text-sm">{lead.module}</p>
									<p className="resa-text-xs resa-text-muted-foreground">
										{lead.location}
									</p>
								</div>
								<Badge variant={statusLabels[lead.status].variant}>
									{statusLabels[lead.status].label}
								</Badge>
								<span className="resa-flex resa-items-center resa-gap-1 resa-text-xs resa-text-muted-foreground">
									<Clock className="resa-size-3" />
									{lead.createdAt}
								</span>
							</div>
						</div>
					))}

					<div className="resa-pt-4 resa-text-center">
						<p className="resa-text-sm resa-text-muted-foreground resa-mb-2">
							{__('Lead-Tabelle wird in Phase 3.4 implementiert.', 'resa')}
						</p>
						<Badge variant="outline">{__('Demo-Daten', 'resa')}</Badge>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
