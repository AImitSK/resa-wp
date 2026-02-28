/**
 * Dashboard page — KPIs, recent leads, quick actions.
 */

import { __ } from '@wordpress/i18n';
import { TrendingUp, TrendingDown, Users, Target, BarChart3, Zap } from 'lucide-react';
import { AdminPageLayout } from '../components/AdminPageLayout';
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function Dashboard() {
	return (
		<AdminPageLayout
			variant="overview"
			title={__('Dashboard', 'resa')}
			description={__('Übersicht über Leads, Conversions und aktive Assets.', 'resa')}
		>
			{/* KPI Cards */}
			<div className="resa-grid resa-grid-cols-1 md:resa-grid-cols-2 lg:resa-grid-cols-4 resa-gap-4">
				<Card>
					<CardHeader>
						<CardDescription>{__('Leads gesamt', 'resa')}</CardDescription>
						<CardTitle className="resa-text-3xl resa-tabular-nums">128</CardTitle>
						<CardAction>
							<Badge variant="secondary">
								<TrendingUp className="resa-size-3" />
								+12%
							</Badge>
						</CardAction>
					</CardHeader>
					<CardFooter className="resa-flex-col resa-items-start resa-gap-1 resa-text-sm">
						<div className="resa-flex resa-gap-2 resa-font-medium">
							{__('Steigend', 'resa')}
							<TrendingUp className="resa-size-4 resa-text-green-500" />
						</div>
						<div className="resa-text-muted-foreground">
							{__('Letzte 30 Tage', 'resa')}
						</div>
					</CardFooter>
				</Card>

				<Card>
					<CardHeader>
						<CardDescription>{__('Neue Leads', 'resa')}</CardDescription>
						<CardTitle className="resa-text-3xl resa-tabular-nums">24</CardTitle>
						<CardAction>
							<Badge variant="secondary">
								<TrendingUp className="resa-size-3" />
								+8%
							</Badge>
						</CardAction>
					</CardHeader>
					<CardFooter className="resa-flex-col resa-items-start resa-gap-1 resa-text-sm">
						<div className="resa-flex resa-gap-2 resa-font-medium">
							{__('Diese Woche', 'resa')}
							<Users className="resa-size-4 resa-text-blue-500" />
						</div>
						<div className="resa-text-muted-foreground">
							{__('vs. 22 letzte Woche', 'resa')}
						</div>
					</CardFooter>
				</Card>

				<Card>
					<CardHeader>
						<CardDescription>{__('Conversion-Rate', 'resa')}</CardDescription>
						<CardTitle className="resa-text-3xl resa-tabular-nums">34,2%</CardTitle>
						<CardAction>
							<Badge variant="secondary">
								<TrendingDown className="resa-size-3" />
								-2%
							</Badge>
						</CardAction>
					</CardHeader>
					<CardFooter className="resa-flex-col resa-items-start resa-gap-1 resa-text-sm">
						<div className="resa-flex resa-gap-2 resa-font-medium">
							{__('Leicht rückläufig', 'resa')}
							<Target className="resa-size-4 resa-text-orange-500" />
						</div>
						<div className="resa-text-muted-foreground">
							{__('Formular zu Lead', 'resa')}
						</div>
					</CardFooter>
				</Card>

				<Card>
					<CardHeader>
						<CardDescription>{__('Aktive Assets', 'resa')}</CardDescription>
						<CardTitle className="resa-text-3xl resa-tabular-nums">2</CardTitle>
						<CardAction>
							<Badge>{__('Free', 'resa')}</Badge>
						</CardAction>
					</CardHeader>
					<CardFooter className="resa-flex-col resa-items-start resa-gap-1 resa-text-sm">
						<div className="resa-flex resa-gap-2 resa-font-medium">
							{__('Mietpreis & Immobilienwert', 'resa')}
							<Zap className="resa-size-4 resa-text-primary" />
						</div>
						<div className="resa-text-muted-foreground">
							{__('6 weitere mit Pro', 'resa')}
						</div>
					</CardFooter>
				</Card>
			</div>

			{/* Quick Actions & Recent Leads */}
			<div className="resa-grid resa-grid-cols-1 lg:resa-grid-cols-3 resa-gap-6">
				{/* Quick Actions */}
				<Card>
					<CardHeader>
						<CardTitle className="resa-text-lg">
							{__('Schnellaktionen', 'resa')}
						</CardTitle>
					</CardHeader>
					<CardContent className="resa-space-y-2">
						<Button variant="outline" className="resa-w-full resa-justify-start">
							<BarChart3 className="resa-mr-2 resa-size-4" />
							{__('Neuen Standort anlegen', 'resa')}
						</Button>
						<Button variant="outline" className="resa-w-full resa-justify-start">
							<Zap className="resa-mr-2 resa-size-4" />
							{__('Asset konfigurieren', 'resa')}
						</Button>
						<Button variant="outline" className="resa-w-full resa-justify-start">
							<Users className="resa-mr-2 resa-size-4" />
							{__('Leads exportieren', 'resa')}
						</Button>
					</CardContent>
				</Card>

				{/* Recent Leads */}
				<Card className="lg:resa-col-span-2">
					<CardHeader>
						<CardTitle className="resa-text-lg">
							{__('Neueste Leads', 'resa')}
						</CardTitle>
						<CardDescription>
							{__('Die letzten eingegangenen Anfragen', 'resa')}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="resa-space-y-3">
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className="resa-flex resa-items-center resa-justify-between resa-rounded-lg resa-border resa-p-3"
								>
									<div className="resa-flex resa-items-center resa-gap-3">
										<div className="resa-flex resa-size-10 resa-items-center resa-justify-center resa-rounded-full resa-bg-primary/10">
											<Users className="resa-size-5 resa-text-primary" />
										</div>
										<div>
											<p className="resa-font-medium">Max Mustermann</p>
											<p className="resa-text-sm resa-text-muted-foreground">
												Mietpreis-Kalkulator • München
											</p>
										</div>
									</div>
									<div className="resa-text-right">
										<Badge variant="secondary">{__('Neu', 'resa')}</Badge>
										<p className="resa-text-xs resa-text-muted-foreground resa-mt-1">
											vor 2h
										</p>
									</div>
								</div>
							))}
						</div>
					</CardContent>
					<CardFooter>
						<Button variant="link" className="resa-ml-auto">
							{__('Alle Leads anzeigen', 'resa')} →
						</Button>
					</CardFooter>
				</Card>
			</div>
		</AdminPageLayout>
	);
}
