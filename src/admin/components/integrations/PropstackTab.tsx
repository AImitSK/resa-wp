/**
 * Propstack CRM Integration Tab
 *
 * 4 Cards: Verbindung, Makler-Zuweisung, Aktivitäten, Newsletter
 * Conditional rendering: Cards 2-4 only visible wenn API verbunden
 */

import { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	usePropstackSettings,
	useSavePropstackSettings,
	useTestPropstackConnection,
	usePropstackBrokers,
	usePropstackContactSources,
	usePropstackActivityTypes,
} from '../../hooks/usePropstack';
import { useLocations } from '../../hooks/useLocations';
import type { PropstackSettings } from '../../types';

// ─── Styles ─────────────────────────────────────────────

const sectionTitleStyles: React.CSSProperties = {
	margin: 0,
	fontSize: '14px',
	fontWeight: 600,
	color: '#1e303a',
};

const sectionDescStyles: React.CSSProperties = {
	margin: 0,
	fontSize: '13px',
	color: 'hsl(215.4 16.3% 46.9%)',
	marginBottom: '16px',
};

const switchRowStyles: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: '16px',
};

const fieldGroupStyles: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: '8px',
};

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

	const [form, setForm] = useState<PropstackSettings>(defaults);
	const [isDirty, setIsDirty] = useState(false);
	const [showApiKey, setShowApiKey] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>(
		'unknown',
	);
	const [testError, setTestError] = useState<string>('');

	// Update form when settings load (initial only)
	useEffect(() => {
		if (settings) {
			setForm(settings);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [settings?.enabled, settings?.api_key]);

	const isConnected = connectionStatus === 'connected';

	// Only fetch dropdown data if API key is saved in settings (not just entered)
	const hasApiKeySaved = Boolean(settings?.api_key || settings?.api_key_masked);
	const shouldFetchDropdowns = isConnected && hasApiKeySaved;

	// Fetch dropdown data only wenn connected AND API key is saved
	const { data: brokers, isLoading: brokersLoading } = usePropstackBrokers(shouldFetchDropdowns);
	const { data: contactSources, isLoading: sourcesLoading } =
		usePropstackContactSources(shouldFetchDropdowns);
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
			},
		});
	};

	if (isLoading) {
		return (
			<div className="resa-flex resa-items-center resa-justify-center resa-gap-2 resa-py-12">
				<Spinner className="resa-size-5" />
				<span className="resa-text-muted-foreground">
					{__('Lade Propstack-Einstellungen...', 'resa-propstack')}
				</span>
			</div>
		);
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			{/* Card 1: Verbindung */}
			<Card>
				<CardContent style={{ padding: '20px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{/* Header + Switch */}
						<div style={switchRowStyles}>
							<div>
								<h3 style={sectionTitleStyles}>
									{__('Propstack-Integration', 'resa-propstack')}
								</h3>
								<p style={sectionDescStyles}>
									{__(
										'Synchronisiert Leads automatisch zu Propstack CRM.',
										'resa-propstack',
									)}
								</p>
							</div>
							<Switch
								checked={form.enabled}
								onCheckedChange={(checked) => updateField('enabled', checked)}
							/>
						</div>

						{/* API Key Field */}
						<div style={fieldGroupStyles}>
							<Label htmlFor="propstack-api-key">
								{__('API-Key', 'resa-propstack')}
							</Label>
							<div className="resa-flex resa-gap-2">
								<Input
									id="propstack-api-key"
									type={showApiKey ? 'text' : 'password'}
									value={form.api_key}
									onChange={(e) => updateField('api_key', e.target.value)}
									placeholder={
										settings?.api_key_masked ||
										__('Propstack API-Key eingeben', 'resa-propstack')
									}
								/>
								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={() => setShowApiKey(!showApiKey)}
								>
									{showApiKey ? '👁️' : '👁️‍🗨️'}
								</Button>
							</div>
						</div>

						{/* Test Connection Button + Status */}
						<div className="resa-flex resa-items-center resa-gap-3">
							<Button
								type="button"
								variant="outline"
								onClick={handleTestConnection}
								disabled={testMutation.isPending}
							>
								{testMutation.isPending && (
									<Spinner className="resa-mr-2 resa-size-4" />
								)}
								{__('Verbindung testen', 'resa-propstack')}
							</Button>

							{connectionStatus === 'connected' && (
								<Badge variant="default" className="resa-bg-green-600">
									✓ {__('Verbunden', 'resa-propstack')}
									{brokers && ` (${brokers.length} Makler)`}
								</Badge>
							)}

							{connectionStatus === 'error' && (
								<Badge variant="destructive">
									✗ {__('Nicht verbunden', 'resa-propstack')}
								</Badge>
							)}
						</div>

						{/* Error Alert */}
						{testError && (
							<Alert variant="destructive">
								<p className="resa-text-sm">{testError}</p>
							</Alert>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Cards 2-4: Nur wenn verbunden */}
			{isConnected && (
				<>
					{/* Card 2: Makler-Zuweisung */}
					<Card>
						<CardContent style={{ padding: '20px' }}>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
								<div>
									<h3 style={sectionTitleStyles}>
										{__('Makler-Zuweisung', 'resa-propstack')}
									</h3>
									<p style={sectionDescStyles}>
										{__(
											'Ordnen Sie Standorten einen Propstack-Makler zu.',
											'resa-propstack',
										)}
									</p>
								</div>

								{/* Default Broker */}
								<div style={fieldGroupStyles}>
									<Label htmlFor="default-broker">
										{__('Standard-Makler (Fallback)', 'resa-propstack')}
									</Label>
									<Select
										value={form.default_broker_id?.toString() || ''}
										onValueChange={(val) =>
											updateField(
												'default_broker_id',
												val ? parseInt(val, 10) : null,
											)
										}
									>
										<SelectTrigger id="default-broker">
											<SelectValue
												placeholder={__(
													'Makler auswählen',
													'resa-propstack',
												)}
											/>
										</SelectTrigger>
										<SelectContent>
											{brokersLoading && (
												<div className="resa-p-2 resa-text-center">
													<Spinner className="resa-size-4" />
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

								{/* Contact Source */}
								<div style={fieldGroupStyles}>
									<Label htmlFor="contact-source">
										{__('Kontaktquelle', 'resa-propstack')}
									</Label>
									<Select
										value={form.contact_source_id?.toString() || ''}
										onValueChange={(val) =>
											updateField(
												'contact_source_id',
												val ? parseInt(val, 10) : null,
											)
										}
									>
										<SelectTrigger id="contact-source">
											<SelectValue
												placeholder={__(
													'Optional: Quelle auswählen',
													'resa-propstack',
												)}
											/>
										</SelectTrigger>
										<SelectContent>
											{sourcesLoading && (
												<div className="resa-p-2 resa-text-center">
													<Spinner className="resa-size-4" />
												</div>
											)}
											{contactSources?.map((source) => (
												<SelectItem
													key={source.id}
													value={source.id.toString()}
												>
													{source.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* Location-Broker Mapping Table */}
								{locations && locations.length > 0 && (
									<div>
										<Label className="resa-mb-2 resa-block">
											{__('Makler pro Standort', 'resa-propstack')}
										</Label>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>
														{__('Standort', 'resa-propstack')}
													</TableHead>
													<TableHead>
														{__(
															'Zugewiesener Makler',
															'resa-propstack',
														)}
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{locations.map((location) => (
													<TableRow key={location.id}>
														<TableCell className="resa-font-medium">
															{location.name}
														</TableCell>
														<TableCell>
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
																	if (val && val !== '__none__') {
																		mapping[location.id] =
																			parseInt(val, 10);
																	} else {
																		delete mapping[location.id];
																	}
																	updateField(
																		'city_broker_mapping',
																		mapping,
																	);
																}}
															>
																<SelectTrigger>
																	<SelectValue
																		placeholder={__(
																			'Standard verwenden',
																			'resa-propstack',
																		)}
																	/>
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="__none__">
																		{__(
																			'Standard verwenden',
																			'resa-propstack',
																		)}
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
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Card 3: Aktivitäten */}
					<Card>
						<CardContent style={{ padding: '20px' }}>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
								{/* Header + Switch */}
								<div style={switchRowStyles}>
									<div>
										<h3 style={sectionTitleStyles}>
											{__('Aktivitäten erstellen', 'resa-propstack')}
										</h3>
										<p style={sectionDescStyles}>
											{__(
												'Erstellt automatisch eine Aktivität pro Lead.',
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

								{/* Activity Type */}
								{form.activity_enabled && (
									<>
										<div style={fieldGroupStyles}>
											<Label htmlFor="activity-type">
												{__('Aktivitäts-Typ', 'resa-propstack')}
											</Label>
											<Select
												value={form.activity_type_id?.toString() || ''}
												onValueChange={(val) =>
													updateField(
														'activity_type_id',
														val ? parseInt(val, 10) : null,
													)
												}
											>
												<SelectTrigger id="activity-type">
													<SelectValue
														placeholder={__(
															'Typ auswählen',
															'resa-propstack',
														)}
													/>
												</SelectTrigger>
												<SelectContent>
													{typesLoading && (
														<div className="resa-p-2 resa-text-center">
															<Spinner className="resa-size-4" />
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
										</div>

										{/* Create Task Checkbox */}
										<div className="resa-flex resa-items-center resa-gap-3">
											<Switch
												checked={form.activity_create_task}
												onCheckedChange={(checked) =>
													updateField('activity_create_task', checked)
												}
											/>
											<Label
												htmlFor="create-task"
												className="resa-cursor-pointer"
											>
												{__(
													'Als Aufgabe (Task) mit Fälligkeit erstellen',
													'resa-propstack',
												)}
											</Label>
										</div>

										{/* Task Due Days */}
										{form.activity_create_task && (
											<div style={fieldGroupStyles}>
												<Label htmlFor="task-due-days">
													{__('Fälligkeit (Werktage)', 'resa-propstack')}
												</Label>
												<Input
													id="task-due-days"
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
												/>
											</div>
										)}
									</>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Card 4: Newsletter */}
					<Card>
						<CardContent style={{ padding: '20px' }}>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
								<div>
									<h3 style={sectionTitleStyles}>
										{__('Newsletter-DOI', 'resa-propstack')}
									</h3>
									<p style={sectionDescStyles}>
										{__(
											'Newsletter Double-Opt-In E-Mail über Propstack versenden.',
											'resa-propstack',
										)}
									</p>
								</div>

								{/* Newsletter-Only Mode */}
								<div className="resa-flex resa-items-center resa-gap-3">
									<Switch
										checked={form.sync_newsletter_only}
										onCheckedChange={(checked) =>
											updateField('sync_newsletter_only', checked)
										}
									/>
									<Label className="resa-cursor-pointer">
										{__(
											'Nur Newsletter-DOI synchronisieren (keine Kontakt-Daten)',
											'resa-propstack',
										)}
									</Label>
								</div>

								{/* Newsletter Broker */}
								{form.sync_newsletter_only && (
									<div style={fieldGroupStyles}>
										<Label htmlFor="newsletter-broker">
											{__('Newsletter-Makler', 'resa-propstack')}
										</Label>
										<Select
											value={form.newsletter_broker_id?.toString() || ''}
											onValueChange={(val) =>
												updateField(
													'newsletter_broker_id',
													val ? parseInt(val, 10) : null,
												)
											}
										>
											<SelectTrigger id="newsletter-broker">
												<SelectValue
													placeholder={__(
														'Makler auswählen',
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
							</div>
						</CardContent>
					</Card>
				</>
			)}

			{/* Save Button */}
			<div className="resa-flex resa-justify-end">
				<Button
					type="button"
					onClick={handleSave}
					disabled={!isDirty || saveMutation.isPending}
				>
					{saveMutation.isPending && <Spinner className="resa-mr-2 resa-size-4" />}
					{__('Einstellungen speichern', 'resa-propstack')}
				</Button>
			</div>

			{/* Success Message */}
			{saveMutation.isSuccess && !isDirty && (
				<Alert className="resa-bg-green-50 resa-border-green-200">
					<p className="resa-text-sm resa-text-green-800">
						✓ {__('Einstellungen gespeichert.', 'resa-propstack')}
					</p>
				</Alert>
			)}
		</div>
	);
}
