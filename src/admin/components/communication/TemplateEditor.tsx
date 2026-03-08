/**
 * Template editor — edit subject, body, active status.
 *
 * Resizable split layout: left editor, right live preview with draggable handle.
 * Footer: Reset, Test-Mail, Save.
 *
 * Uses inline styles for consistent WP Admin styling.
 */

import { useState, useEffect, type ReactNode } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { __ } from '@wordpress/i18n';
import { Paperclip } from 'lucide-react';
import {
	emailTemplateSchema,
	type EmailTemplateFormData,
	testEmailSchema,
	type TestEmailFormData,
} from '../../schemas/emailTemplate';

import { AdminPageLayout } from '../AdminPageLayout';
import { EmailEditor } from './tiptap/EmailEditor';
import { TemplatePreview } from './TemplatePreview';
import {
	useEmailTemplate,
	useSaveEmailTemplate,
	useResetEmailTemplate,
	useSendTestEmail,
} from '../../hooks/useEmailTemplates';
import { toast } from '../../lib/toast';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
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

// ─── Styled Button Components ────────────────────────────

function PrimaryButton({
	children,
	onClick,
	disabled,
}: {
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
}) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<Button
			type="button"
			size="sm"
			onClick={onClick}
			disabled={disabled}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				backgroundColor: disabled
					? 'hsl(210 40% 96.1%)'
					: isHovered
						? '#98d438'
						: '#a9e43f',
				color: disabled ? 'hsl(215.4 16.3% 46.9%)' : '#1e303a',
				border: 'none',
				cursor: disabled ? 'not-allowed' : 'pointer',
				opacity: 1,
				gap: '6px',
			}}
		>
			{children}
		</Button>
	);
}

function OutlineButton({
	children,
	onClick,
	disabled,
}: {
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
}) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<Button
			type="button"
			size="sm"
			onClick={onClick}
			disabled={disabled}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				backgroundColor: isHovered ? 'hsl(210 40% 96.1%)' : 'white',
				color: '#1e303a',
				border: '1px solid hsl(214.3 31.8% 78%)',
				cursor: disabled ? 'not-allowed' : 'pointer',
				opacity: disabled ? 0.5 : 1,
				gap: '6px',
			}}
		>
			{children}
		</Button>
	);
}

function DestructiveButton({
	children,
	onClick,
	disabled,
}: {
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
}) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<Button
			type="button"
			size="sm"
			onClick={onClick}
			disabled={disabled}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				backgroundColor: disabled
					? 'hsl(210 40% 96.1%)'
					: isHovered
						? 'hsl(0 84.2% 50.2%)'
						: 'hsl(0 84.2% 60.2%)',
				color: disabled ? 'hsl(215.4 16.3% 46.9%)' : 'white',
				border: 'none',
				cursor: disabled ? 'not-allowed' : 'pointer',
				opacity: 1,
				gap: '6px',
			}}
		>
			{children}
		</Button>
	);
}

// ─── Styles ─────────────────────────────────────────────

const toggleBoxStyles: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	padding: '16px',
	border: '1px solid hsl(214.3 31.8% 91.4%)',
	borderRadius: '8px',
	backgroundColor: 'hsl(210 40% 96.1%)',
};

const inputStyles: React.CSSProperties = {
	height: '36px',
	padding: '0 12px',
	fontSize: '14px',
	border: '1px solid hsl(214.3 31.8% 78%)',
	borderRadius: '6px',
	backgroundColor: 'white',
};

const labelStyles: React.CSSProperties = {
	fontSize: '14px',
	fontWeight: 500,
	color: '#1e303a',
};

const descStyles: React.CSSProperties = {
	margin: '2px 0 0 0',
	fontSize: '12px',
	color: 'hsl(215.4 16.3% 46.9%)',
};

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

	// React Hook Form for template data
	const form = useForm<EmailTemplateFormData>({
		resolver: zodResolver(emailTemplateSchema),
		defaultValues: {
			subject: template.subject,
			body: template.body,
			is_active: template.is_active,
		},
		mode: 'onChange',
	});

	// React Hook Form for test email dialog
	const testForm = useForm<TestEmailFormData>({
		resolver: zodResolver(testEmailSchema),
		defaultValues: {
			email: '',
		},
		mode: 'onChange',
	});

	// Sync server data when template changes (e.g. after reset via query invalidation)
	useEffect(() => {
		form.reset({
			subject: template.subject,
			body: template.body,
			is_active: template.is_active,
		});
	}, [template, form]);

	// Dialog states
	const [resetDialogOpen, setResetDialogOpen] = useState(false);
	const [testDialogOpen, setTestDialogOpen] = useState(false);

	const {
		formState: { isDirty, errors },
		watch,
	} = form;

	// Watch values for live preview
	const watchedSubject = watch('subject');
	const watchedBody = watch('body');

	const onSubmit = (data: EmailTemplateFormData) => {
		saveMutation.mutate(data, {
			onSuccess: () => {
				form.reset(data);
				toast.success(__('Vorlage gespeichert.', 'resa'));
			},
			onError: () => {
				toast.error(__('Fehler beim Speichern.', 'resa'));
			},
		});
	};

	const handleReset = async () => {
		try {
			await resetMutation.mutateAsync();
			setResetDialogOpen(false);
			toast.success(__('Vorlage zurückgesetzt.', 'resa'));
		} catch {
			toast.error(__('Fehler beim Zurücksetzen.', 'resa'));
		}
	};

	const onTestSubmit = (data: TestEmailFormData) => {
		testMutation.mutate(data.email, {
			onSuccess: () => {
				setTestDialogOpen(false);
				testForm.reset();
				toast.success(__('Test-Mail gesendet.', 'resa'));
			},
			onError: (e) => {
				toast.error(e instanceof Error ? e.message : __('Fehler beim Versand.', 'resa'));
			},
		});
	};

	return (
		<AdminPageLayout
			variant="detail"
			breadcrumbs={[
				{ label: __('Vorlagen', 'resa'), onClick: onBack },
				{ label: template.name },
			]}
			onBack={onBack}
		>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
				{/* Resizable split: Editor | Preview */}
				<ResizablePanelGroup
					orientation="horizontal"
					style={{
						width: '100%',
						overflow: 'hidden',
					}}
				>
					{/* Left panel: Editor */}
					<ResizablePanel defaultSize={55} minSize={20}>
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								gap: '16px',
								paddingRight: '20px',
								overflowY: 'auto',
							}}
						>
							{/* Active toggle */}
							<div style={toggleBoxStyles}>
								<div>
									<p style={{ margin: 0, ...labelStyles }}>
										{__('Vorlage aktiv', 'resa')}
									</p>
									<p style={descStyles}>
										{__(
											'Deaktivierte Vorlagen werden nicht versendet.',
											'resa',
										)}
									</p>
								</div>
								<Controller
									name="is_active"
									control={form.control}
									render={({ field }) => (
										<Switch
											id="template-active"
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									)}
								/>
							</div>

							{/* Subject */}
							<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
								<Label htmlFor="template-subject" style={labelStyles}>
									{__('Betreff', 'resa')}
								</Label>
								<Input
									id="template-subject"
									{...form.register('subject')}
									placeholder={__('E-Mail-Betreff...', 'resa')}
									style={{
										...inputStyles,
										borderColor: errors.subject ? '#ef4444' : undefined,
									}}
								/>
								{errors.subject && (
									<p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>
										{errors.subject.message}
									</p>
								)}
							</div>

							{/* Body Editor */}
							<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
								<Label style={labelStyles}>{__('Inhalt', 'resa')}</Label>
								<Controller
									name="body"
									control={form.control}
									render={({ field }) => (
										<EmailEditor
											content={field.value}
											onUpdate={field.onChange}
											availableVariables={template.available_variables}
											variableLabels={template.variable_labels}
											variableGroups={template.variable_groups}
										/>
									)}
								/>
								{errors.body && (
									<p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>
										{errors.body.message}
									</p>
								)}
							</div>

							{/* Attachment info */}
							{template.has_attachment && (
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										padding: '12px',
										border: '1px solid hsl(214.3 31.8% 91.4%)',
										borderRadius: '8px',
										backgroundColor: 'hsl(210 40% 98%)',
									}}
								>
									<Paperclip
										style={{
											width: '16px',
											height: '16px',
											color: 'hsl(215.4 16.3% 46.9%)',
										}}
									/>
									<span
										style={{
											fontSize: '13px',
											color: 'hsl(215.4 16.3% 46.9%)',
										}}
									>
										{__(
											'PDF-Ergebnis wird automatisch als Anhang beigefügt.',
											'resa',
										)}
									</span>
									<span
										style={{
											marginLeft: 'auto',
											padding: '2px 8px',
											fontSize: '11px',
											fontWeight: 500,
											borderRadius: '4px',
											backgroundColor: 'hsl(210 40% 96.1%)',
											color: '#1e303a',
										}}
									>
										PDF
									</span>
								</div>
							)}
						</div>
					</ResizablePanel>

					<ResizableHandle withHandle />

					{/* Right panel: Preview */}
					<ResizablePanel defaultSize={45} minSize={20}>
						<div style={{ paddingLeft: '20px', height: '100%' }}>
							<TemplatePreview
								subject={watchedSubject}
								body={watchedBody}
								exampleValues={template.example_values}
							/>
						</div>
					</ResizablePanel>
				</ResizablePanelGroup>

				{/* Footer actions */}
				<div
					style={{
						display: 'flex',
						flexWrap: 'wrap',
						alignItems: 'center',
						gap: '12px',
					}}
				>
					<OutlineButton
						onClick={() => setResetDialogOpen(true)}
						disabled={!template.is_modified && !isDirty}
					>
						{__('Auf Standard zurücksetzen', 'resa')}
					</OutlineButton>
					<OutlineButton onClick={() => setTestDialogOpen(true)}>
						{__('Test-Mail senden', 'resa')}
					</OutlineButton>
					<div style={{ marginLeft: 'auto' }}>
						<PrimaryButton
							onClick={form.handleSubmit(onSubmit)}
							disabled={saveMutation.isPending || !isDirty}
						>
							{saveMutation.isPending && (
								<Spinner
									style={{ width: '14px', height: '14px', marginRight: '8px' }}
								/>
							)}
							{__('Speichern', 'resa')}
						</PrimaryButton>
					</div>
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
						<OutlineButton onClick={() => setResetDialogOpen(false)}>
							{__('Abbrechen', 'resa')}
						</OutlineButton>
						<DestructiveButton onClick={handleReset} disabled={resetMutation.isPending}>
							{resetMutation.isPending && (
								<Spinner
									style={{ width: '14px', height: '14px', marginRight: '8px' }}
								/>
							)}
							{__('Zurücksetzen', 'resa')}
						</DestructiveButton>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Test Email Dialog */}
			<Dialog
				open={testDialogOpen}
				onOpenChange={(open) => {
					setTestDialogOpen(open);
					if (open) {
						// Pre-fill with admin email when opening
						testForm.reset({ email: window.resaAdmin?.adminEmail || '' });
					}
				}}
			>
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
					<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
						<Label htmlFor="test-email" style={labelStyles}>
							{__('Empfänger', 'resa')}
						</Label>
						<Input
							id="test-email"
							type="email"
							{...testForm.register('email')}
							placeholder="test@example.com"
							style={{
								...inputStyles,
								borderColor: testForm.formState.errors.email
									? '#ef4444'
									: undefined,
							}}
						/>
						{testForm.formState.errors.email && (
							<p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>
								{testForm.formState.errors.email.message}
							</p>
						)}
					</div>
					<DialogFooter>
						<OutlineButton onClick={() => setTestDialogOpen(false)}>
							{__('Schließen', 'resa')}
						</OutlineButton>
						<PrimaryButton
							onClick={testForm.handleSubmit(onTestSubmit)}
							disabled={testMutation.isPending}
						>
							{testMutation.isPending && (
								<Spinner
									style={{ width: '14px', height: '14px', marginRight: '8px' }}
								/>
							)}
							{__('Senden', 'resa')}
						</PrimaryButton>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</AdminPageLayout>
	);
}
