/**
 * Integrations page — tab-based navigation for webhooks, API, notifications, and add-ons.
 *
 * Follows the Settings.tsx pattern: controlled Tabs with tabStyle() helper.
 */

import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { MessageSquare, Puzzle } from 'lucide-react';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { useIsPremium } from '../hooks/useFeatures';
import { WebhooksTab } from '../components/integrations/WebhooksTab';
import { ApiKeysTab } from '../components/integrations/ApiKeysTab';
import type { IntegrationTab } from '../types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type FixedTab = 'webhooks' | 'api' | 'slack-teams';
type IntegrationsTab = FixedTab | string;

export function Integrations() {
	const [activeTab, setActiveTab] = useState<IntegrationsTab>('webhooks');
	const isPremium = useIsPremium();

	const addonTabs: IntegrationTab[] = window.resaAdmin?.integrationTabs ?? [];

	const tabStyle = (isActive: boolean): React.CSSProperties => ({
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		whiteSpace: 'nowrap',
		borderRadius: '6px',
		padding: '6px 12px',
		fontSize: '14px',
		fontWeight: 500,
		gap: '6px',
		transition: 'all 150ms',
		backgroundColor: isActive ? 'white' : 'transparent',
		color: isActive ? '#1e303a' : 'hsl(215.4 16.3% 46.9%)',
		boxShadow: isActive ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none',
		cursor: 'pointer',
	});

	const renderTabContent = () => {
		if (!isPremium) {
			return <UpgradeNotice />;
		}

		switch (activeTab) {
			case 'webhooks':
				return <WebhooksTab />;
			case 'api':
				return <ApiKeysTab />;
			case 'slack-teams':
				return <SlackTeamsTab />;
			default: {
				const addon = addonTabs.find((t) => t.slug === activeTab);
				return addon ? <AddonTab name={addon.label} /> : null;
			}
		}
	};

	return (
		<AdminPageLayout
			variant="overview"
			title={__('Integrationen', 'resa')}
			description={__(
				'Webhooks, API-Zugang, Benachrichtigungen und Add-on-Integrationen verwalten.',
				'resa',
			)}
		>
			{/* Tab Navigation */}
			<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as IntegrationsTab)}>
				<TabsList
					style={{
						display: 'inline-flex',
						height: '40px',
						alignItems: 'center',
						justifyContent: 'center',
						borderRadius: '8px',
						backgroundColor: 'hsl(210 40% 96.1%)',
						padding: '4px',
					}}
				>
					<TabsTrigger value="webhooks" style={tabStyle(activeTab === 'webhooks')}>
						{__('Webhooks', 'resa')}
					</TabsTrigger>
					<TabsTrigger value="api" style={tabStyle(activeTab === 'api')}>
						{__('API', 'resa')}
					</TabsTrigger>
					<TabsTrigger value="slack-teams" style={tabStyle(activeTab === 'slack-teams')}>
						{__('Slack / Teams', 'resa')}
					</TabsTrigger>
					{addonTabs.map((tab) => (
						<TabsTrigger
							key={tab.slug}
							value={tab.slug}
							style={tabStyle(activeTab === tab.slug)}
						>
							{tab.label}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>

			{/* Tab Content */}
			{renderTabContent()}
		</AdminPageLayout>
	);
}

/**
 * Upgrade notice for free users — shown instead of tab content.
 */
function UpgradeNotice() {
	return (
		<Alert>
			<AlertTitle>{__('Premium erforderlich', 'resa')}</AlertTitle>
			<AlertDescription className="resa-flex resa-flex-col resa-gap-3">
				<p>
					{__(
						'Integrationen sind nur mit einem Premium-Plan verfügbar. Upgrade jetzt, um Webhooks, API-Zugang und Benachrichtigungen zu nutzen.',
						'resa',
					)}
				</p>
				<div>
					<Button
						size="sm"
						onClick={() => {
							if (typeof window.resaAdmin?.adminUrl === 'string') {
								window.location.href = `${window.resaAdmin.adminUrl}?page=resa-settings&tab=license`;
							}
						}}
					>
						{__('Auf Premium upgraden', 'resa')}
					</Button>
				</div>
			</AlertDescription>
		</Alert>
	);
}

/**
 * Slack / Teams tab — placeholder.
 */
function SlackTeamsTab() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="resa-flex resa-items-center resa-gap-2">
					<MessageSquare className="resa-h-5 resa-w-5" />
					{__('Slack / Teams', 'resa')}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="resa-text-sm resa-text-muted-foreground">
					{__('Slack/Teams-Benachrichtigungen werden hier implementiert.', 'resa')}
				</p>
			</CardContent>
		</Card>
	);
}

/**
 * Generic add-on tab — rendered for dynamically registered integration tabs.
 */
function AddonTab({ name }: { name: string }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="resa-flex resa-items-center resa-gap-2">
					<Puzzle className="resa-h-5 resa-w-5" />
					{name}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="resa-text-sm resa-text-muted-foreground">
					{/* translators: %s: Add-on name */}
					{__('Konfiguration für %s wird vom Add-on bereitgestellt.', 'resa').replace(
						'%s',
						name,
					)}
				</p>
			</CardContent>
		</Card>
	);
}
