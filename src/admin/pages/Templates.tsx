/**
 * Templates page — PDF and email templates in one place.
 *
 * Two tabs: PDF-Vorlagen (base layout + live preview) and E-Mail-Vorlagen (template list + editor).
 */

import { useState } from 'react';
import { __ } from '@wordpress/i18n';

import { AdminPageLayout } from '../components/AdminPageLayout';
import { TemplatesTab } from '../components/communication/TemplatesTab';
import { TemplateEditor } from '../components/communication/TemplateEditor';
import { BaseLayoutTab } from './PdfTemplates';
import { usePdfSettings } from '../hooks/usePdfSettings';
import { useBranding } from '../hooks/useBranding';
import { useTeamMembers } from '../hooks/useTeam';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type View = { type: 'list' } | { type: 'editor'; templateId: string };

export function Templates() {
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
			title={__('Vorlagen', 'resa')}
			description={__('PDF- und E-Mail-Vorlagen konfigurieren.', 'resa')}
		>
			<Tabs defaultValue="pdf">
				<TabsList>
					<TabsTrigger value="pdf">{__('PDF-Vorlagen', 'resa')}</TabsTrigger>
					<TabsTrigger value="email">{__('E-Mail-Vorlagen', 'resa')}</TabsTrigger>
				</TabsList>

				<TabsContent value="pdf" className="resa-mt-4">
					<PdfTab />
				</TabsContent>

				<TabsContent value="email" className="resa-mt-4">
					<TemplatesTab onEdit={(id) => setView({ type: 'editor', templateId: id })} />
				</TabsContent>
			</Tabs>
		</AdminPageLayout>
	);
}

/**
 * PDF tab — loads settings and renders BaseLayoutTab.
 */
function PdfTab() {
	const { data: pdfSettings, isLoading, error } = usePdfSettings();
	const { data: branding } = useBranding();
	const { data: teamMembers } = useTeamMembers();

	if (isLoading) {
		return (
			<div className="resa-flex resa-items-center resa-justify-center resa-gap-2 resa-py-12">
				<Spinner className="resa-size-5" />
				<span className="resa-text-muted-foreground">
					{__('Lade PDF-Einstellungen...', 'resa')}
				</span>
			</div>
		);
	}

	if (error) {
		return (
			<Alert variant="destructive">
				<AlertTitle>{__('Fehler beim Laden', 'resa')}</AlertTitle>
				<AlertDescription>
					{__('Die PDF-Einstellungen konnten nicht geladen werden.', 'resa')}
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<BaseLayoutTab
			initialData={pdfSettings}
			logoUrl={branding?.logoUrl}
			teamMembers={teamMembers ?? []}
		/>
	);
}
