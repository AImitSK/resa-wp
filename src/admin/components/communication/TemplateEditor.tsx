/**
 * Template editor — edit subject, body, active status.
 *
 * Resizable split layout: left editor, right live preview with draggable handle.
 * Footer: Reset, Test-Mail, Save.
 */

import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Paperclip } from 'lucide-react';

import { AdminPageLayout } from '../AdminPageLayout';
import { EmailEditor } from './tiptap/EmailEditor';
import { TemplatePreview } from './TemplatePreview';
import {
	useEmailTemplate,
	useSaveEmailTemplate,
	useResetEmailTemplate,
	useSendTestEmail,
} from '../../hooks/useEmailTemplates';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

interface TemplateEditorProps {
	templateId: string;
	onBack: () => void;
}

export function TemplateEditor({ templateId, onBack }: TemplateEditorProps) {
	const { data: template, isLoading } = useEmailTemplate(templateId);

	if (isLoading || !template) {
		return (
			<div className="resa-flex resa-items-center resa-justify-center resa-py-20">
				<Spinner />
			</div>
		);
	}

	// Render the inner editor once template data is available.
	// Key forces remount when template changes (e.g. after reset).
	return (
		<TemplateEditorInner
			key={`${templateId}-${template.subject}-${template.body}`}
			template={template}
			templateId={templateId}
			onBack={onBack}
		/>
	);
}

interface TemplateEditorInnerProps {
	template: NonNullable<ReturnType<typeof useEmailTemplate>['data']>;
	templateId: string;
	onBack: () => void;
}

function TemplateEditorInner({ template, templateId, onBack }: TemplateEditorInnerProps) {
	const saveMutation = useSaveEmailTemplate(templateId);
	const resetMutation = useResetEmailTemplate(templateId);
	const testMutation = useSendTestEmail(templateId);

	// Local editor state — initialized from API data.
	const [subject, setSubject] = useState(template.subject);
	const [body, setBody] = useState(template.body);
	const [isActive, setIsActive] = useState(template.is_active);
	const [isDirty, setIsDirty] = useState(false);

	// Dialog states.
	const [resetDialogOpen, setResetDialogOpen] = useState(false);
	const [testDialogOpen, setTestDialogOpen] = useState(false);
	const [testEmail, setTestEmail] = useState('');
	const [testMessage, setTestMessage] = useState('');

	const handleSave = async () => {
		await saveMutation.mutateAsync({ subject, body, is_active: isActive });
		setIsDirty(false);
	};

	const handleReset = async () => {
		await resetMutation.mutateAsync();
		setResetDialogOpen(false);
		setIsDirty(false);
	};

	const handleTest = async () => {
		setTestMessage('');
		try {
			const result = await testMutation.mutateAsync(testEmail);
			setTestMessage(result.message);
		} catch (e) {
			setTestMessage(e instanceof Error ? e.message : __('Fehler beim Versand.', 'resa'));
		}
	};

	return (
		<AdminPageLayout
			variant="detail"
			breadcrumbs={[
				{ label: __('Kommunikation', 'resa'), onClick: onBack },
				{ label: template.name },
			]}
			onBack={onBack}
		>
			<div className="resa-space-y-6">
				{/* Resizable split: Editor | Preview */}
				<ResizablePanelGroup
					orientation="horizontal"
					className="resa-rounded-lg resa-border"
				>
					{/* Left panel: Editor */}
					<ResizablePanel defaultSize={55} minSize={20}>
						<div className="resa-space-y-4 resa-p-4 resa-overflow-y-auto">
							{/* Active toggle */}
							<div className="resa-flex resa-items-center resa-justify-between">
								<div className="resa-space-y-0.5">
									<Label
										htmlFor="template-active"
										className="resa-text-sm resa-font-medium"
									>
										{__('Vorlage aktiv', 'resa')}
									</Label>
									<p className="resa-text-sm resa-text-muted-foreground">
										{__(
											'Deaktivierte Vorlagen werden nicht versendet.',
											'resa',
										)}
									</p>
								</div>
								<Switch
									id="template-active"
									checked={isActive}
									onCheckedChange={(checked) => {
										setIsActive(checked);
										setIsDirty(true);
									}}
								/>
							</div>

							{/* Subject */}
							<div className="resa-space-y-2">
								<Label htmlFor="template-subject">{__('Betreff', 'resa')}</Label>
								<Input
									id="template-subject"
									value={subject}
									onChange={(e) => {
										setSubject(e.target.value);
										setIsDirty(true);
									}}
									placeholder={__('E-Mail-Betreff...', 'resa')}
								/>
							</div>

							{/* Body Editor */}
							<div className="resa-space-y-2">
								<Label>{__('Inhalt', 'resa')}</Label>
								<EmailEditor
									content={body}
									onUpdate={(html) => {
										setBody(html);
										setIsDirty(true);
									}}
									availableVariables={template.available_variables}
									variableLabels={template.variable_labels}
									variableGroups={template.variable_groups}
								/>
							</div>

							{/* Attachment info */}
							{template.has_attachment && (
								<div className="resa-flex resa-items-center resa-gap-2 resa-rounded-lg resa-border resa-p-3 resa-bg-muted/30">
									<Paperclip className="resa-size-4 resa-text-muted-foreground" />
									<span className="resa-text-sm resa-text-muted-foreground">
										{__(
											'PDF-Ergebnis wird automatisch als Anhang beigefügt.',
											'resa',
										)}
									</span>
									<Badge variant="secondary" className="resa-ml-auto">
										PDF
									</Badge>
								</div>
							)}
						</div>
					</ResizablePanel>

					<ResizableHandle withHandle />

					{/* Right panel: Preview */}
					<ResizablePanel defaultSize={45} minSize={20}>
						<div className="resa-p-4 resa-h-full">
							<TemplatePreview
								subject={subject}
								body={body}
								exampleValues={template.example_values}
							/>
						</div>
					</ResizablePanel>
				</ResizablePanelGroup>

				{/* Footer actions */}
				<div className="resa-flex resa-flex-wrap resa-items-center resa-gap-3 resa-border-t resa-pt-4">
					<Button
						variant="outline"
						onClick={() => setResetDialogOpen(true)}
						disabled={!template.is_modified && !isDirty}
					>
						{__('Auf Standard zurücksetzen', 'resa')}
					</Button>
					<Button
						variant="outline"
						onClick={() => {
							setTestEmail(window.resaAdmin?.adminEmail || '');
							setTestMessage('');
							setTestDialogOpen(true);
						}}
					>
						{__('Test-Mail senden', 'resa')}
					</Button>
					<Button
						className="resa-ml-auto"
						onClick={handleSave}
						disabled={saveMutation.isPending || !isDirty}
					>
						{saveMutation.isPending ? <Spinner className="resa-mr-2" /> : null}
						{__('Speichern', 'resa')}
					</Button>
				</div>
			</div>

			{/* Reset Confirmation Dialog */}
			<Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{__('Auf Standard zurücksetzen?', 'resa')}</DialogTitle>
						<DialogDescription>
							{__(
								'Alle Änderungen an dieser Vorlage werden verworfen und die Standard-Texte wiederhergestellt.',
								'resa',
							)}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setResetDialogOpen(false)}>
							{__('Abbrechen', 'resa')}
						</Button>
						<Button
							variant="destructive"
							onClick={handleReset}
							disabled={resetMutation.isPending}
						>
							{resetMutation.isPending ? <Spinner className="resa-mr-2" /> : null}
							{__('Zurücksetzen', 'resa')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Test Email Dialog */}
			<Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{__('Test-Mail senden', 'resa')}</DialogTitle>
						<DialogDescription>
							{__(
								'Sende eine Test-Mail mit Beispieldaten an die angegebene Adresse.',
								'resa',
							)}
						</DialogDescription>
					</DialogHeader>
					<div className="resa-space-y-4">
						<div className="resa-space-y-2">
							<Label htmlFor="test-email">{__('Empfänger', 'resa')}</Label>
							<Input
								id="test-email"
								type="email"
								value={testEmail}
								onChange={(e) => setTestEmail(e.target.value)}
								placeholder="test@example.com"
							/>
						</div>
						{testMessage && (
							<p className="resa-text-sm resa-text-muted-foreground">{testMessage}</p>
						)}
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setTestDialogOpen(false)}>
							{__('Schließen', 'resa')}
						</Button>
						<Button
							onClick={handleTest}
							disabled={testMutation.isPending || !testEmail}
						>
							{testMutation.isPending ? <Spinner className="resa-mr-2" /> : null}
							{__('Senden', 'resa')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</AdminPageLayout>
	);
}
