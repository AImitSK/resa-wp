/**
 * Propstack CRM Integration Tab
 *
 * Follows the inline-styles pattern from RecaptchaTab and Analytics.
 * Concrete color values instead of Tailwind classes for WordPress compatibility.
 */

import { useState, useEffect, type ReactNode } from 'react';
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
import type { PropstackSettings } from '../../types';
import { toast } from '../../lib/toast';

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

	const defaults: PropstackSettings = {
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

	// Initialize form with settings or defaults
	const initialForm = settings ?? defaults;
	const initialConnectionStatus = settings?.api_key ? 'connected' : 'unknown';

	const [form, setForm] = useState<PropstackSettings>(initialForm);
	const [isDirty, setIsDirty] = useState(false);
	const [showApiKey, setShowApiKey] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>(
		initialConnectionStatus,
	);
	const [testError, setTestError] = useState<string>('');

	// Sync form when settings change (e.g., after refetch)
	// This is intentional: we need to sync server state to local form state
	const settingsKey = settings ? JSON.stringify(settings) : null;
	useEffect(() => {
		if (settings && !isDirty) {
			setForm(settings);
			if (settings.api_key) {
				setConnectionStatus('connected');
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [settingsKey]);

	const isConnected = connectionStatus === 'connected';
	const shouldFetchDropdowns = isConnected;

	const { data: brokers, isLoading: brokersLoading } = usePropstackBrokers(shouldFetchDropdowns);
	const { data: activityTypes, isLoading: typesLoading } =
		usePropstackActivityTypes(shouldFetchDropdowns);

	const updateField = <K extends keyof PropstackSettings>(
		key: K,
		value: PropstackSettings[K],
	) => {
		setForm((prev) => ({ ...prev, [key]: value }));
		setIsDirty(true);
	};

	const handleTestConnection = async () => {
		if (!form.api_key) {
			setTestError(__('Bitte API-Key eingeben.', 'resa-propstack'));
			setConnectionStatus('error');
			return;
		}

		try {
			const result = await testMutation.mutateAsync(form.api_key);
			if (result.success) {
				setConnectionStatus('connected');
				setTestError('');
			} else {
				setConnectionStatus('error');
				setTestError(result.error || __('Verbindung fehlgeschlagen.', 'resa-propstack'));
			}
		} catch {
			setConnectionStatus('error');
			setTestError(__('Verbindung fehlgeschlagen.', 'resa-propstack'));
		}
	};

	const handleSave = () => {
		saveMutation.mutate(form, {
			onSuccess: () => {
				setIsDirty(false);
				if (form.api_key) {
					setConnectionStatus('connected');
				}
				toast.success(__('Einstellungen gespeichert.', 'resa-propstack'));
			},
			onError: () => {
				toast.error(__('Fehler beim Speichern.', 'resa-propstack'));
			},
		});
	};

	if (isLoading) {
		return <LoadingState message={__('Lade Propstack-Einstellungen...', 'resa-propstack')} />;
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			{/* Card 1: Verbindung */}
			<Card style={cardStyles}>
				<CardContent style={{ padding: '20px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{/* Card Header */}
						<div>
							<h2 style={sectionTitleStyles}>{__('Verbindung', 'resa-propstack')}</h2>
							<p style={sectionDescStyles}>
								{__(
									'Verbinde RESA mit deinem Propstack CRM-Account.',
									'resa-propstack',
								)}
							</p>
						</div>

						{/* Enable Switch */}
						<div style={toggleBoxStyles}>
							<div>
								<p style={elementTitleStyles}>
									{__('Integration aktivieren', 'resa-propstack')}
								</p>
								<p style={{ ...fieldDescStyles, marginTop: '2px' }}>
									{__(
										'Synchronisiert Leads automatisch zu Propstack.',
										'resa-propstack',
									)}
								</p>
							</div>
							<Switch
								checked={form.enabled}
								onCheckedChange={(checked) => updateField('enabled', checked)}
							/>
						</div>

						{/* API Key - nur wenn enabled */}
						{form.enabled && (
							<>
								<div style={fieldGroupStyles}>
									<Label htmlFor="propstack-api-key">
										{__('API-Key', 'resa-propstack')}
									</Label>
									<div style={{ display: 'flex', gap: '8px' }}>
										<Input
											id="propstack-api-key"
											type={showApiKey ? 'text' : 'password'}
											value={form.api_key}
											onChange={(e) => updateField('api_key', e.target.value)}
											placeholder={__(
												'Propstack API-Key eingeben',
												'resa-propstack',
											)}
											style={{
												...inputStyles,
												flex: 1,
												fontFamily: 'monospace',
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
									<p style={fieldDescStyles}>
										{__(
											'Den API-Key findest du in Propstack unter Einstellungen → API.',
											'resa-propstack',
										)}
									</p>
								</div>

								{/* Test Connection */}
								<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
									<OutlineButton
										onClick={handleTestConnection}
										disabled={testMutation.isPending || !form.api_key}
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
										{__('Verbindung testen', 'resa-propstack')}
									</OutlineButton>

									{connectionStatus === 'connected' && (
										<span style={successBadgeStyles}>
											<CheckCircle2
												style={{ width: '14px', height: '14px' }}
											/>
											{__('Verbunden', 'resa-propstack')}
											{brokers && ` (${brokers.length} Makler)`}
										</span>
									)}

									{connectionStatus === 'error' && (
										<span style={errorBadgeStyles}>
											<XCircle style={{ width: '14px', height: '14px' }} />
											{__('Nicht verbunden', 'resa-propstack')}
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
			{form.enabled && isConnected && (
				<>
					{/* Card 2: Makler-Zuweisung */}
					<Card style={cardStyles}>
						<CardContent style={{ padding: '20px' }}>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
								<div>
									<h2 style={sectionTitleStyles}>
										{__('Makler-Zuweisung', 'resa-propstack')}
									</h2>
									<p style={sectionDescStyles}>
										{__(
											'Lege fest, welcher Propstack-Makler die Leads erhält.',
											'resa-propstack',
										)}
									</p>
								</div>

								{/* Standard-Makler */}
								<div style={selectBoxStyles}>
									<div>
										<p style={elementTitleStyles}>
											{__('Standard-Makler', 'resa-propstack')}
										</p>
										<p style={{ ...fieldDescStyles, marginTop: '2px' }}>
											{__(
												'Dieser Makler erhält alle Leads, für die kein spezifischer Makler zugewiesen ist.',
												'resa-propstack',
											)}
										</p>
									</div>
									<Select
										value={form.default_broker_id?.toString() || ''}
										onValueChange={(val) =>
											updateField(
												'default_broker_id',
												val ? parseInt(val, 10) : null,
											)
										}
									>
										<SelectTrigger
											style={{ ...selectTriggerStyles, maxWidth: '300px' }}
										>
											<SelectValue
												placeholder={__(
													'Makler auswählen...',
													'resa-propstack',
												)}
											/>
										</SelectTrigger>
										<SelectContent>
											{brokersLoading && (
												<div
													style={{ padding: '8px', textAlign: 'center' }}
												>
													<Spinner
														style={{ width: '16px', height: '16px' }}
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
								</div>

								{/* Makler pro Standort */}
								{locations && locations.length > 0 && (
									<>
										<div style={separatorStyles} />

										<div style={fieldGroupStyles}>
											<Label>
												{__('Makler pro Standort', 'resa-propstack')}
											</Label>
											<p style={{ ...fieldDescStyles, marginBottom: '8px' }}>
												{__(
													'Optional: Weise einzelnen Standorten einen spezifischen Makler zu.',
													'resa-propstack',
												)}
											</p>

											<table style={tableStyles}>
												<thead>
													<tr>
														<th style={tableHeaderStyles}>
															{__('Standort', 'resa-propstack')}
														</th>
														<th style={tableHeaderStyles}>
															{__(
																'Zugewiesener Makler',
																'resa-propstack',
															)}
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
																<Select
																	value={
																		form.city_broker_mapping[
																			location.id
																		]?.toString() || '__none__'
																	}
																	onValueChange={(val) => {
																		const mapping = {
																			...form.city_broker_mapping,
																		};
																		if (
																			val &&
																			val !== '__none__'
																		) {
																			mapping[location.id] =
																				parseInt(val, 10);
																		} else {
																			delete mapping[
																				location.id
																			];
																		}
																		updateField(
																			'city_broker_mapping',
																			mapping,
																		);
																	}}
																>
																	<SelectTrigger
																		style={selectTriggerStyles}
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
																					'resa-propstack',
																				)}
																			</span>
																		</SelectItem>
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
									<h2 style={sectionTitleStyles}>
										{__('Aktivitäten', 'resa-propstack')}
									</h2>
									<p style={sectionDescStyles}>
										{__(
											'Erstelle automatisch Aktivitäten und Aufgaben in Propstack.',
											'resa-propstack',
										)}
									</p>
								</div>

								{/* Enable Switch */}
								<div style={toggleBoxStyles}>
									<div>
										<p style={elementTitleStyles}>
											{__('Aktivitäten erstellen', 'resa-propstack')}
										</p>
										<p style={{ ...fieldDescStyles, marginTop: '2px' }}>
											{__(
												'Erstellt automatisch eine Aktivität für jeden neuen Lead.',
												'resa-propstack',
											)}
										</p>
									</div>
									<Switch
										checked={form.activity_enabled}
										onCheckedChange={(checked) =>
											updateField('activity_enabled', checked)
										}
									/>
								</div>

								{/* Activity Settings */}
								{form.activity_enabled && (
									<>
										<div style={fieldGroupStyles}>
											<Label>{__('Aktivitäts-Typ', 'resa-propstack')}</Label>
											<Select
												value={form.activity_type_id?.toString() || ''}
												onValueChange={(val) =>
													updateField(
														'activity_type_id',
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
															'resa-propstack',
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
											<p style={fieldDescStyles}>
												{__(
													'Wähle den Typ der Aktivität, die in Propstack erstellt wird.',
													'resa-propstack',
												)}
											</p>
										</div>

										<div style={separatorStyles} />

										{/* Create Task Toggle */}
										<div style={toggleBoxStyles}>
											<div>
												<p style={elementTitleStyles}>
													{__('Als Aufgabe erstellen', 'resa-propstack')}
												</p>
												<p style={{ ...fieldDescStyles, marginTop: '2px' }}>
													{__(
														'Erstellt die Aktivität als Aufgabe mit Fälligkeitsdatum.',
														'resa-propstack',
													)}
												</p>
											</div>
											<Switch
												checked={form.activity_create_task}
												onCheckedChange={(checked) =>
													updateField('activity_create_task', checked)
												}
											/>
										</div>

										{/* Task Due Days */}
										{form.activity_create_task && (
											<div style={fieldGroupStyles}>
												<Label>
													{__('Fälligkeit (Werktage)', 'resa-propstack')}
												</Label>
												<Input
													type="number"
													min="1"
													max="30"
													value={form.activity_task_due_days}
													onChange={(e) =>
														updateField(
															'activity_task_due_days',
															parseInt(e.target.value, 10) || 3,
														)
													}
													style={{ ...inputStyles, width: '100px' }}
												/>
												<p style={fieldDescStyles}>
													{__(
														'Anzahl der Werktage bis zur Fälligkeit der Aufgabe.',
														'resa-propstack',
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
										{__('Newsletter-Einstellungen', 'resa-propstack')}
									</h2>
									<p style={sectionDescStyles}>
										{__(
											'Konfiguriere die Newsletter Double-Opt-In Synchronisation.',
											'resa-propstack',
										)}
									</p>
								</div>

								{/* Newsletter-Only Toggle */}
								<div style={toggleBoxStyles}>
									<div>
										<p style={elementTitleStyles}>
											{__(
												'Nur Newsletter-DOI synchronisieren',
												'resa-propstack',
											)}
										</p>
										<p style={{ ...fieldDescStyles, marginTop: '2px' }}>
											{__(
												'Synchronisiert nur den Newsletter-Status, keine Kontaktdaten.',
												'resa-propstack',
											)}
										</p>
									</div>
									<Switch
										checked={form.sync_newsletter_only}
										onCheckedChange={(checked) =>
											updateField('sync_newsletter_only', checked)
										}
									/>
								</div>

								{/* Newsletter Broker */}
								{form.sync_newsletter_only && (
									<div style={selectBoxStyles}>
										<div>
											<p style={elementTitleStyles}>
												{__('Newsletter-Makler', 'resa-propstack')}
											</p>
											<p style={{ ...fieldDescStyles, marginTop: '2px' }}>
												{__(
													'Makler, der die Newsletter-Anmeldungen verwaltet.',
													'resa-propstack',
												)}
											</p>
										</div>
										<Select
											value={form.newsletter_broker_id?.toString() || ''}
											onValueChange={(val) =>
												updateField(
													'newsletter_broker_id',
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
														'resa-propstack',
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
											'resa-propstack',
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
				<PrimaryButton onClick={handleSave} disabled={!isDirty || saveMutation.isPending}>
					{saveMutation.isPending && (
						<Spinner style={{ width: '14px', height: '14px', marginRight: '8px' }} />
					)}
					{__('Speichern', 'resa-propstack')}
				</PrimaryButton>
			</div>
		</div>
	);
}
