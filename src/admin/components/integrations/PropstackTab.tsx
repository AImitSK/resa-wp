/**
 * Propstack CRM Integration Tab
 *
 * Follows the inline-styles pattern from RecaptchaTab and Analytics.
 * Concrete color values instead of Tailwind classes for WordPress compatibility.
 *
 * Uses Zod + React Hook Form for validation.
 * @see docs/design-system/patterns/form-validation.md
 */

import { useState, useEffect, type ReactNode } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { __ } from '@wordpress/i18n';
import { Eye, EyeOff, CheckCircle2, XCircle, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { LoadingState } from '../LoadingState';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	usePropstackSettings,
	useSavePropstackSettings,
	useTestPropstackConnection,
	usePropstackBrokers,
	usePropstackActivityTypes,
} from '../../hooks/usePropstack';
import { useLocations } from '../../hooks/useLocations';
import { toast } from '../../lib/toast';
import { propstackSettingsSchema, type PropstackSettingsFormData } from '../../schemas/propstack';

// ─── Design Tokens (concrete values) ─────────────────────

const colors = {
	primary: '#a9e43f',
	primaryForeground: '#1e303a',
	text: '#1e303a',
	textMuted: 'hsl(215.4 16.3% 46.9%)',
	border: 'hsl(214.3 31.8% 78%)',
	borderLight: 'hsl(214.3 31.8% 91.4%)',
	background: 'white',
	backgroundMuted: 'hsl(210 40% 96.1%)',
	error: '#ef4444',
	info: '#3b82f6',
};

// ─── Styles ──────────────────────────────────────────────

// H2 - Card headers
const sectionTitleStyles: React.CSSProperties = {
	margin: 0,
	fontSize: '16px',
	fontWeight: 600,
	color: colors.text,
};

// Bold text - Element titles in boxes
const elementTitleStyles: React.CSSProperties = {
	margin: 0,
	fontSize: '14px',
	fontWeight: 500,
	color: colors.text,
};

const sectionDescStyles: React.CSSProperties = {
	margin: '4px 0 0 0',
	fontSize: '13px',
	color: colors.textMuted,
};

const fieldGroupStyles: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: '6px',
};

const fieldDescStyles: React.CSSProperties = {
	margin: 0,
	fontSize: '12px',
	color: colors.textMuted,
};

const inputStyles: React.CSSProperties = {
	height: '36px',
	padding: '0 12px',
	fontSize: '14px',
	border: `1px solid ${colors.border}`,
	borderRadius: '6px',
	backgroundColor: colors.background,
	color: colors.text,
};

const selectTriggerStyles: React.CSSProperties = {
	width: '100%',
	height: '36px',
	backgroundColor: colors.background,
	border: `1px solid ${colors.border}`,
	borderRadius: '6px',
	fontSize: '14px',
};

const badgeStyles: React.CSSProperties = {
	display: 'inline-flex',
	alignItems: 'center',
	gap: '6px',
	padding: '6px 12px',
	fontSize: '13px',
	fontWeight: 500,
	borderRadius: '6px',
};

const successBadgeStyles: React.CSSProperties = {
	...badgeStyles,
	backgroundColor: 'hsl(142 76% 95%)',
	color: 'hsl(142 76% 30%)',
	border: '1px solid hsl(142 76% 80%)',
};

const errorBadgeStyles: React.CSSProperties = {
	...badgeStyles,
	backgroundColor: colors.error,
	color: 'white',
};

const infoBoxStyles: React.CSSProperties = {
	display: 'flex',
	gap: '12px',
	padding: '16px',
	backgroundColor: 'hsl(210 100% 97%)',
	border: '1px solid hsl(210 100% 90%)',
	borderRadius: '8px',
	fontSize: '13px',
	color: 'hsl(210 100% 30%)',
};

const toggleBoxStyles: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	padding: '16px',
	border: `1px solid ${colors.borderLight}`,
	borderRadius: '8px',
	backgroundColor: colors.backgroundMuted,
};

const selectBoxStyles: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: '12px',
	padding: '16px',
	border: `1px solid ${colors.borderLight}`,
	borderRadius: '8px',
	backgroundColor: colors.backgroundMuted,
};

const tableStyles: React.CSSProperties = {
	width: '100%',
	borderCollapse: 'collapse',
	border: `1px solid ${colors.border}`,
	borderRadius: '8px',
	overflow: 'hidden',
};

const tableHeaderStyles: React.CSSProperties = {
	backgroundColor: colors.backgroundMuted,
	textAlign: 'left',
	padding: '12px 16px',
	fontSize: '13px',
	fontWeight: 500,
	color: colors.textMuted,
	borderBottom: `1px solid ${colors.border}`,
};

const tableCellStyles: React.CSSProperties = {
	padding: '12px 16px',
	fontSize: '14px',
	color: colors.text,
	borderBottom: `1px solid ${colors.borderLight}`,
};

const separatorStyles: React.CSSProperties = {
	height: '1px',
	backgroundColor: colors.borderLight,
	margin: '16px 0',
};

const cardStyles: React.CSSProperties = {
	border: `1px solid ${colors.borderLight}`,
	borderRadius: '8px',
	backgroundColor: colors.background,
	boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
};

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
					? colors.backgroundMuted
					: isHovered
						? '#98d438'
						: colors.primary,
				color: disabled ? colors.textMuted : colors.primaryForeground,
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
				backgroundColor: disabled
					? colors.backgroundMuted
					: isHovered
						? 'hsl(210 40% 96.1%)'
						: 'white',
				color: disabled ? colors.textMuted : colors.text,
				border: `1px solid ${colors.border}`,
				cursor: disabled ? 'not-allowed' : 'pointer',
				boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
				gap: '6px',
			}}
		>
			{children}
		</Button>
	);
}

// ─── Component ──────────────────────────────────────────

export function PropstackTab() {
	const { data: settings, isLoading } = usePropstackSettings();
	const saveMutation = useSavePropstackSettings();
	const testMutation = useTestPropstackConnection();
	const { data: locations } = useLocations();

	const defaults: PropstackSettingsFormData = {
		enabled: false,
		api_key: '',
		city_broker_mapping: {},
		default_broker_id: null,
		contact_source_id: null,
		activity_enabled: false,
		activity_type_id: null,
		activity_create_task: false,
		activity_task_due_days: 3,
		sync_newsletter_only: false,
		newsletter_broker_id: null,
	};

	const form = useForm<PropstackSettingsFormData>({
		resolver: zodResolver(propstackSettingsSchema),
		defaultValues: defaults,
		mode: 'onChange',
	});

	const [showApiKey, setShowApiKey] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>(
		'unknown',
	);
	const [testError, setTestError] = useState<string>('');

	// Sync server data when loaded
	useEffect(() => {
		if (settings) {
			form.reset(settings);
			if (settings.api_key) {
				setConnectionStatus('connected');
			}
		}
	}, [settings, form]);

	const isConnected = connectionStatus === 'connected';
	const shouldFetchDropdowns = isConnected;

	const { data: brokers, isLoading: brokersLoading } = usePropstackBrokers(shouldFetchDropdowns);
	const { data: activityTypes, isLoading: typesLoading } =
		usePropstackActivityTypes(shouldFetchDropdowns);

	// Watch form values for conditional rendering
	const watchEnabled = form.watch('enabled');
	const watchActivityEnabled = form.watch('activity_enabled');
	const watchActivityCreateTask = form.watch('activity_create_task');
	const watchSyncNewsletterOnly = form.watch('sync_newsletter_only');
	const watchApiKey = form.watch('api_key');

	const handleTestConnection = async () => {
		if (!watchApiKey) {
			setTestError(__('Bitte API-Key eingeben.', 'resa'));
			setConnectionStatus('error');
			return;
		}

		try {
			const result = await testMutation.mutateAsync(watchApiKey);
			if (result.success) {
				setConnectionStatus('connected');
				setTestError('');
			} else {
				setConnectionStatus('error');
				setTestError(result.error || __('Verbindung fehlgeschlagen.', 'resa'));
			}
		} catch {
			setConnectionStatus('error');
			setTestError(__('Verbindung fehlgeschlagen.', 'resa'));
		}
	};

	const onSubmit = (data: PropstackSettingsFormData) => {
		saveMutation.mutate(data, {
			onSuccess: () => {
				form.reset(data);
				if (data.api_key) {
					setConnectionStatus('connected');
				}
				toast.success(__('Einstellungen gespeichert.', 'resa'));
			},
			onError: () => {
				toast.error(__('Fehler beim Speichern.', 'resa'));
			},
		});
	};

	if (isLoading) {
		return <LoadingState message={__('Lade Propstack-Einstellungen...', 'resa')} />;
	}

	const {
		formState: { isDirty, errors },
	} = form;

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			{/* Card 1: Verbindung */}
			<Card style={cardStyles}>
				<CardContent style={{ padding: '20px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{/* Card Header */}
						<div>
							<h2 style={sectionTitleStyles}>{__('Verbindung', 'resa')}</h2>
							<p style={sectionDescStyles}>
								{__('Verbinde RESA mit deinem Propstack CRM-Account.', 'resa')}
							</p>
						</div>

						{/* Enable Switch */}
						<div style={toggleBoxStyles}>
							<div>
								<p style={elementTitleStyles}>
									{__('Integration aktivieren', 'resa')}
								</p>
								<p style={{ ...fieldDescStyles, marginTop: '2px' }}>
									{__('Synchronisiert Leads automatisch zu Propstack.', 'resa')}
								</p>
							</div>
							<Controller
								name="enabled"
								control={form.control}
								render={({ field }) => (
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								)}
							/>
						</div>

						{/* API Key - nur wenn enabled */}
						{watchEnabled && (
							<>
								<div style={fieldGroupStyles}>
									<Label htmlFor="propstack-api-key">
										{__('API-Key', 'resa')}
									</Label>
									<div style={{ display: 'flex', gap: '8px' }}>
										<Input
											id="propstack-api-key"
											type={showApiKey ? 'text' : 'password'}
											placeholder={__('Propstack API-Key eingeben', 'resa')}
											{...form.register('api_key')}
											style={{
												...inputStyles,
												flex: 1,
												fontFamily: 'monospace',
												borderColor: errors.api_key
													? colors.error
													: undefined,
											}}
										/>
										<Button
											type="button"
											variant="outline"
											onClick={() => setShowApiKey(!showApiKey)}
											style={{
												width: '36px',
												height: '36px',
												padding: 0,
												border: `1px solid ${colors.border}`,
											}}
										>
											{showApiKey ? (
												<EyeOff style={{ width: '16px', height: '16px' }} />
											) : (
												<Eye style={{ width: '16px', height: '16px' }} />
											)}
										</Button>
									</div>
									{errors.api_key && (
										<p
											style={{
												fontSize: '13px',
												color: colors.error,
												margin: 0,
											}}
										>
											{errors.api_key.message}
										</p>
									)}
									<p style={fieldDescStyles}>
										{__(
											'Den API-Key findest du in Propstack unter Einstellungen -> API.',
											'resa',
										)}
									</p>
								</div>

								{/* Test Connection */}
								<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
									<OutlineButton
										onClick={handleTestConnection}
										disabled={testMutation.isPending || !watchApiKey}
									>
										{testMutation.isPending && (
											<Spinner
												style={{
													width: '14px',
													height: '14px',
													marginRight: '8px',
												}}
											/>
										)}
										{__('Verbindung testen', 'resa')}
									</OutlineButton>

									{connectionStatus === 'connected' && (
										<span style={successBadgeStyles}>
											<CheckCircle2
												style={{ width: '14px', height: '14px' }}
											/>
											{__('Verbunden', 'resa')}
											{brokers && ` (${brokers.length} Makler)`}
										</span>
									)}

									{connectionStatus === 'error' && (
										<span style={errorBadgeStyles}>
											<XCircle style={{ width: '14px', height: '14px' }} />
											{__('Nicht verbunden', 'resa')}
										</span>
									)}
								</div>

								{/* Error */}
								{testError && (
									<div
										style={{
											padding: '12px 16px',
											backgroundColor: 'hsl(0 100% 97%)',
											border: '1px solid hsl(0 100% 90%)',
											borderRadius: '6px',
											color: colors.error,
											fontSize: '13px',
										}}
									>
										{testError}
									</div>
								)}
							</>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Cards 2-4: Nur wenn aktiviert UND verbunden */}
			{watchEnabled && isConnected && (
				<>
					{/* Card 2: Makler-Zuweisung */}
					<Card style={cardStyles}>
						<CardContent style={{ padding: '20px' }}>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
								<div>
									<h2 style={sectionTitleStyles}>
										{__('Makler-Zuweisung', 'resa')}
									</h2>
									<p style={sectionDescStyles}>
										{__(
											'Lege fest, welcher Propstack-Makler die Leads erhält.',
											'resa',
										)}
									</p>
								</div>

								{/* Standard-Makler */}
								<div style={selectBoxStyles}>
									<div>
										<p style={elementTitleStyles}>
											{__('Standard-Makler', 'resa')}
										</p>
										<p style={{ ...fieldDescStyles, marginTop: '2px' }}>
											{__(
												'Dieser Makler erhält alle Leads, für die kein spezifischer Makler zugewiesen ist.',
												'resa',
											)}
										</p>
									</div>
									<Controller
										name="default_broker_id"
										control={form.control}
										render={({ field }) => (
											<Select
												value={field.value?.toString() || ''}
												onValueChange={(val) =>
													field.onChange(val ? parseInt(val, 10) : null)
												}
											>
												<SelectTrigger
													style={{
														...selectTriggerStyles,
														maxWidth: '300px',
													}}
												>
													<SelectValue
														placeholder={__(
															'Makler auswählen...',
															'resa',
														)}
													/>
												</SelectTrigger>
												<SelectContent>
													{brokersLoading && (
														<div
															style={{
																padding: '8px',
																textAlign: 'center',
															}}
														>
															<Spinner
																style={{
																	width: '16px',
																	height: '16px',
																}}
															/>
														</div>
													)}
													{brokers?.map((broker) => (
														<SelectItem
															key={broker.id}
															value={broker.id.toString()}
														>
															{broker.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									/>
								</div>

								{/* Makler pro Standort */}
								{locations && locations.length > 0 && (
									<>
										<div style={separatorStyles} />

										<div style={fieldGroupStyles}>
											<Label>{__('Makler pro Standort', 'resa')}</Label>
											<p style={{ ...fieldDescStyles, marginBottom: '8px' }}>
												{__(
													'Optional: Weise einzelnen Standorten einen spezifischen Makler zu.',
													'resa',
												)}
											</p>

											<table style={tableStyles}>
												<thead>
													<tr>
														<th style={tableHeaderStyles}>
															{__('Standort', 'resa')}
														</th>
														<th style={tableHeaderStyles}>
															{__('Zugewiesener Makler', 'resa')}
														</th>
													</tr>
												</thead>
												<tbody>
													{locations.map((location, idx) => (
														<tr key={location.id}>
															<td
																style={{
																	...tableCellStyles,
																	fontWeight: 500,
																	borderBottom:
																		idx === locations.length - 1
																			? 'none'
																			: tableCellStyles.borderBottom,
																}}
															>
																{location.name}
															</td>
															<td
																style={{
																	...tableCellStyles,
																	borderBottom:
																		idx === locations.length - 1
																			? 'none'
																			: tableCellStyles.borderBottom,
																}}
															>
																<Controller
																	name="city_broker_mapping"
																	control={form.control}
																	render={({ field }) => (
																		<Select
																			value={
																				field.value[
																					location.id
																				]?.toString() ||
																				'__none__'
																			}
																			onValueChange={(
																				val,
																			) => {
																				const mapping = {
																					...field.value,
																				};
																				if (
																					val &&
																					val !==
																						'__none__'
																				) {
																					mapping[
																						location.id
																					] = parseInt(
																						val,
																						10,
																					);
																				} else {
																					delete mapping[
																						location.id
																					];
																				}
																				field.onChange(
																					mapping,
																				);
																			}}
																		>
																			<SelectTrigger
																				style={
																					selectTriggerStyles
																				}
																			>
																				<SelectValue />
																			</SelectTrigger>
																			<SelectContent>
																				<SelectItem value="__none__">
																					<span
																						style={{
																							color: colors.textMuted,
																						}}
																					>
																						{__(
																							'Standard verwenden',
																							'resa',
																						)}
																					</span>
																				</SelectItem>
																				{brokers?.map(
																					(broker) => (
																						<SelectItem
																							key={
																								broker.id
																							}
																							value={broker.id.toString()}
																						>
																							{
																								broker.name
																							}
																						</SelectItem>
																					),
																				)}
																			</SelectContent>
																		</Select>
																	)}
																/>
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Card 3: Aktivitäten */}
					<Card style={cardStyles}>
						<CardContent style={{ padding: '20px' }}>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
								{/* Card Header */}
								<div>
									<h2 style={sectionTitleStyles}>{__('Aktivitäten', 'resa')}</h2>
									<p style={sectionDescStyles}>
										{__(
											'Erstelle automatisch Aktivitäten und Aufgaben in Propstack.',
											'resa',
										)}
									</p>
								</div>

								{/* Enable Switch */}
								<div style={toggleBoxStyles}>
									<div>
										<p style={elementTitleStyles}>
											{__('Aktivitäten erstellen', 'resa')}
										</p>
										<p style={{ ...fieldDescStyles, marginTop: '2px' }}>
											{__(
												'Erstellt automatisch eine Aktivität für jeden neuen Lead.',
												'resa',
											)}
										</p>
									</div>
									<Controller
										name="activity_enabled"
										control={form.control}
										render={({ field }) => (
											<Switch
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										)}
									/>
								</div>

								{/* Activity Settings */}
								{watchActivityEnabled && (
									<>
										<div style={fieldGroupStyles}>
											<Label>{__('Aktivitäts-Typ', 'resa')}</Label>
											<Controller
												name="activity_type_id"
												control={form.control}
												render={({ field }) => (
													<Select
														value={field.value?.toString() || ''}
														onValueChange={(val) =>
															field.onChange(
																val ? parseInt(val, 10) : null,
															)
														}
													>
														<SelectTrigger
															style={{
																...selectTriggerStyles,
																maxWidth: '300px',
															}}
														>
															<SelectValue
																placeholder={__(
																	'Typ auswählen...',
																	'resa',
																)}
															/>
														</SelectTrigger>
														<SelectContent>
															{typesLoading && (
																<div
																	style={{
																		padding: '8px',
																		textAlign: 'center',
																	}}
																>
																	<Spinner
																		style={{
																			width: '16px',
																			height: '16px',
																		}}
																	/>
																</div>
															)}
															{activityTypes?.map((type) => (
																<SelectItem
																	key={type.id}
																	value={type.id.toString()}
																>
																	{type.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												)}
											/>
											<p style={fieldDescStyles}>
												{__(
													'Wähle den Typ der Aktivität, die in Propstack erstellt wird.',
													'resa',
												)}
											</p>
										</div>

										<div style={separatorStyles} />

										{/* Create Task Toggle */}
										<div style={toggleBoxStyles}>
											<div>
												<p style={elementTitleStyles}>
													{__('Als Aufgabe erstellen', 'resa')}
												</p>
												<p style={{ ...fieldDescStyles, marginTop: '2px' }}>
													{__(
														'Erstellt die Aktivität als Aufgabe mit Fälligkeitsdatum.',
														'resa',
													)}
												</p>
											</div>
											<Controller
												name="activity_create_task"
												control={form.control}
												render={({ field }) => (
													<Switch
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												)}
											/>
										</div>

										{/* Task Due Days */}
										{watchActivityCreateTask && (
											<div style={fieldGroupStyles}>
												<Label>{__('Fälligkeit (Werktage)', 'resa')}</Label>
												<Controller
													name="activity_task_due_days"
													control={form.control}
													render={({ field }) => (
														<Input
															type="number"
															min="1"
															max="30"
															value={field.value}
															onChange={(e) =>
																field.onChange(
																	parseInt(e.target.value, 10) ||
																		3,
																)
															}
															style={{
																...inputStyles,
																width: '100px',
																borderColor:
																	errors.activity_task_due_days
																		? colors.error
																		: undefined,
															}}
														/>
													)}
												/>
												{errors.activity_task_due_days && (
													<p
														style={{
															fontSize: '13px',
															color: colors.error,
															margin: 0,
														}}
													>
														{errors.activity_task_due_days.message}
													</p>
												)}
												<p style={fieldDescStyles}>
													{__(
														'Anzahl der Werktage bis zur Fälligkeit der Aufgabe.',
														'resa',
													)}
												</p>
											</div>
										)}
									</>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Card 4: Newsletter */}
					<Card style={cardStyles}>
						<CardContent style={{ padding: '20px' }}>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
								<div>
									<h2 style={sectionTitleStyles}>
										{__('Newsletter-Einstellungen', 'resa')}
									</h2>
									<p style={sectionDescStyles}>
										{__(
											'Konfiguriere die Newsletter Double-Opt-In Synchronisation.',
											'resa',
										)}
									</p>
								</div>

								{/* Newsletter-Only Toggle */}
								<div style={toggleBoxStyles}>
									<div>
										<p style={elementTitleStyles}>
											{__('Nur Newsletter-DOI synchronisieren', 'resa')}
										</p>
										<p style={{ ...fieldDescStyles, marginTop: '2px' }}>
											{__(
												'Synchronisiert nur den Newsletter-Status, keine Kontaktdaten.',
												'resa',
											)}
										</p>
									</div>
									<Controller
										name="sync_newsletter_only"
										control={form.control}
										render={({ field }) => (
											<Switch
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										)}
									/>
								</div>

								{/* Newsletter Broker */}
								{watchSyncNewsletterOnly && (
									<div style={selectBoxStyles}>
										<div>
											<p style={elementTitleStyles}>
												{__('Newsletter-Makler', 'resa')}
											</p>
											<p style={{ ...fieldDescStyles, marginTop: '2px' }}>
												{__(
													'Makler, der die Newsletter-Anmeldungen verwaltet.',
													'resa',
												)}
											</p>
										</div>
										<Controller
											name="newsletter_broker_id"
											control={form.control}
											render={({ field }) => (
												<Select
													value={field.value?.toString() || ''}
													onValueChange={(val) =>
														field.onChange(
															val ? parseInt(val, 10) : null,
														)
													}
												>
													<SelectTrigger
														style={{
															...selectTriggerStyles,
															maxWidth: '300px',
														}}
													>
														<SelectValue
															placeholder={__(
																'Makler auswählen...',
																'resa',
															)}
														/>
													</SelectTrigger>
													<SelectContent>
														{brokers?.map((broker) => (
															<SelectItem
																key={broker.id}
																value={broker.id.toString()}
															>
																{broker.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											)}
										/>
									</div>
								)}

								{/* Info Box */}
								<div style={infoBoxStyles}>
									<Info
										style={{
											width: '20px',
											height: '20px',
											flexShrink: 0,
											marginTop: '1px',
										}}
									/>
									<p style={{ margin: 0 }}>
										{__(
											'Newsletter-Anmeldungen werden über die Propstack E-Mail-Workflows versendet. Stelle sicher, dass in Propstack ein entsprechender Workflow eingerichtet ist.',
											'resa',
										)}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</>
			)}

			{/* Save Footer */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'flex-end',
				}}
			>
				<PrimaryButton
					onClick={form.handleSubmit(onSubmit)}
					disabled={!isDirty || saveMutation.isPending}
				>
					{saveMutation.isPending && (
						<Spinner style={{ width: '14px', height: '14px', marginRight: '8px' }} />
					)}
					{__('Speichern', 'resa')}
				</PrimaryButton>
			</div>
		</div>
	);
}
