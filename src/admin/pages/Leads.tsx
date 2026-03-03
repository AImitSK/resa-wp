/**
 * Leads page — lead management with filtering, search, and detail view.
 *
 * Design matches Smart Assets page (single Card, dark footer).
 * Table follows shadcn Tasks example pattern.
 */

import { useState, useCallback, useMemo } from 'react';
import { __, sprintf, _n } from '@wordpress/i18n';
import {
	Search,
	Download,
	MoreHorizontal,
	Mail,
	Phone,
	Trash2,
	Crown,
	ArrowLeft,
	Eye,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Building2,
	Users,
	User,
	Calendar,
	MapPin,
	Calculator,
	CheckCircle2,
	XCircle,
} from 'lucide-react';

import {
	useLeads,
	useLead,
	useLeadStats,
	useUpdateLead,
	useDeleteLead,
	useExportLeads,
	type LeadsFilter,
	type LeadStatus,
	type LeadAdmin,
} from '../hooks/useLeads';
import { useLocations } from '../hooks/useLocations';
import { useFeatures } from '../hooks/useFeatures';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { LeadEmailLogSection } from '../components/leads/LeadEmailLogSection';
import { LeafletMapWrapper } from '../components/map/LeafletMapWrapper';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─── Types ──────────────────────────────────────────────

type View = 'list' | 'detail';
type StatusFilter = 'all' | LeadStatus;

// ─── Constants ──────────────────────────────────────────

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
	new: { label: __('Neu', 'resa'), color: '#22c55e' },
	contacted: { label: __('Kontaktiert', 'resa'), color: '#6b7280' },
	qualified: { label: __('Qualifiziert', 'resa'), color: '#3b82f6' },
	completed: { label: __('Abgeschlossen', 'resa'), color: '#1e303a' },
	lost: { label: __('Verloren', 'resa'), color: '#ef4444' },
};

const MODULE_NAMES: Record<string, string> = {
	'rent-calculator': __('Mietpreis-Kalkulator', 'resa'),
	'value-calculator': __('Immobilienwert-Rechner', 'resa'),
	'purchase-costs': __('Kaufnebenkosten-Rechner', 'resa'),
	'budget-calculator': __('Budgetrechner', 'resa'),
	'roi-calculator': __('Renditerechner', 'resa'),
	'energy-check': __('Energieeffizienz-Check', 'resa'),
	'seller-checklist': __('Verkäufer-Checkliste', 'resa'),
	'buyer-checklist': __('Käufer-Checkliste', 'resa'),
};

// ─── Styles ─────────────────────────────────────────────

const counterBadgeStyle: React.CSSProperties = {
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	height: '18px',
	minWidth: '18px',
	padding: '0 5px',
	marginLeft: '6px',
	borderRadius: '9999px',
	backgroundColor: 'hsl(210 40% 90%)',
	color: 'hsl(215.4 16.3% 46.9%)',
	fontSize: '11px',
	fontFamily: 'ui-monospace, monospace',
	fontWeight: 500,
};

// ─── Helper Functions ───────────────────────────────────

function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

function formatDateTime(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

// ─── Component ──────────────────────────────────────────

export function Leads() {
	const [view, setView] = useState<View>('list');
	const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
	const [filters, setFilters] = useState<LeadsFilter>({ page: 1, perPage: 25 });
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
	const [searchInput, setSearchInput] = useState('');
	const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
	const [notes, setNotes] = useState('');
	const [notesChanged, setNotesChanged] = useState(false);

	// Queries
	const { data: leadsData, isLoading, error } = useLeads(filters);
	const { data: stats } = useLeadStats();
	const { data: locations } = useLocations();
	const { data: selectedLead, isLoading: isLoadingDetail } = useLead(selectedLeadId);
	const features = useFeatures();

	// Mutations
	const updateMutation = useUpdateLead();
	const deleteMutation = useDeleteLead();
	const exportMutation = useExportLeads();

	const isPremium = features.plan === 'premium';
	const canExport = features.can_export_leads;
	const leadLimit = features.max_leads ?? 50;

	// ─── Handlers ───────────────────────────────────────

	const handleStatusFilter = useCallback((status: string) => {
		setStatusFilter(status as StatusFilter);
		setFilters((prev) => ({
			...prev,
			status: status === 'all' ? undefined : (status as LeadStatus),
			page: 1,
		}));
	}, []);

	const handleSearch = useCallback(() => {
		setFilters((prev) => ({
			...prev,
			search: searchInput || undefined,
			page: 1,
		}));
	}, [searchInput]);

	const handleSearchKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter') {
				handleSearch();
			}
		},
		[handleSearch],
	);

	const handleLocationFilter = useCallback((locationId: string) => {
		setFilters((prev) => ({
			...prev,
			locationId: locationId === 'all' ? undefined : Number(locationId),
			page: 1,
		}));
	}, []);

	const handleAssetTypeFilter = useCallback((assetType: string) => {
		setFilters((prev) => ({
			...prev,
			assetType: assetType === 'all' ? undefined : assetType,
			page: 1,
		}));
	}, []);

	const handlePageChange = useCallback((page: number) => {
		setFilters((prev) => ({ ...prev, page }));
	}, []);

	const handleViewDetail = useCallback((lead: LeadAdmin) => {
		setSelectedLeadId(lead.id);
		setNotes('');
		setNotesChanged(false);
		setView('detail');
	}, []);

	const handleBackToList = useCallback(() => {
		setSelectedLeadId(null);
		setView('list');
	}, []);

	const handleStatusChange = useCallback(
		async (newStatus: LeadStatus) => {
			if (!selectedLeadId) return;
			await updateMutation.mutateAsync({ id: selectedLeadId, data: { status: newStatus } });
		},
		[selectedLeadId, updateMutation],
	);

	const handleSaveNotes = useCallback(async () => {
		if (!selectedLeadId) return;
		await updateMutation.mutateAsync({ id: selectedLeadId, data: { notes } });
		setNotesChanged(false);
	}, [selectedLeadId, notes, updateMutation]);

	const handleDelete = useCallback(
		async (id: number, name: string) => {
			if (
				!window.confirm(
					sprintf(
						__(
							'Lead "%s" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
							'resa',
						),
						name,
					),
				)
			) {
				return;
			}
			await deleteMutation.mutateAsync(id);
			if (view === 'detail') {
				handleBackToList();
			}
		},
		[deleteMutation, view, handleBackToList],
	);

	const handleExport = useCallback(async () => {
		await exportMutation.mutateAsync(filters);
	}, [exportMutation, filters]);

	const handleBulkDelete = useCallback(async () => {
		if (selectedRows.size === 0) return;
		if (
			!window.confirm(
				sprintf(
					_n(
						'%d Lead wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
						'%d Leads wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
						selectedRows.size,
						'resa',
					),
					selectedRows.size,
				),
			)
		) {
			return;
		}
		for (const id of selectedRows) {
			await deleteMutation.mutateAsync(id);
		}
		setSelectedRows(new Set());
	}, [selectedRows, deleteMutation]);

	const handleRowSelect = useCallback((id: number, checked: boolean) => {
		setSelectedRows((prev) => {
			const next = new Set(prev);
			if (checked) {
				next.add(id);
			} else {
				next.delete(id);
			}
			return next;
		});
	}, []);

	const handleSelectAll = useCallback(
		(checked: boolean) => {
			if (checked && leadsData?.items) {
				setSelectedRows(new Set(leadsData.items.map((l) => l.id)));
			} else {
				setSelectedRows(new Set());
			}
		},
		[leadsData],
	);

	// Initialize notes when detail loads.
	if (selectedLead && !notesChanged && notes !== (selectedLead.notes ?? '')) {
		setNotes(selectedLead.notes ?? '');
	}

	const allSelected = useMemo(() => {
		if (!leadsData?.items.length) return false;
		return leadsData.items.every((l) => selectedRows.has(l.id));
	}, [leadsData, selectedRows]);

	const someSelected = useMemo(() => {
		if (!leadsData?.items.length) return false;
		return leadsData.items.some((l) => selectedRows.has(l.id)) && !allSelected;
	}, [leadsData, selectedRows, allSelected]);

	// ─── Detail View ────────────────────────────────────

	if (view === 'detail') {
		const detailFullName = selectedLead
			? [selectedLead.firstName, selectedLead.lastName].filter(Boolean).join(' ')
			: '';

		const detailBreadcrumbs = [
			{ label: __('Leads', 'resa'), onClick: handleBackToList },
			{ label: detailFullName || __('Lead', 'resa') },
		];

		if (isLoadingDetail) {
			return (
				<AdminPageLayout
					variant="detail"
					breadcrumbs={detailBreadcrumbs}
					onBack={handleBackToList}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							padding: '48px',
							gap: '8px',
						}}
					>
						<Spinner style={{ width: '20px', height: '20px' }} />
						<span style={{ color: 'hsl(215.4 16.3% 46.9%)' }}>
							{__('Lade Lead...', 'resa')}
						</span>
					</div>
				</AdminPageLayout>
			);
		}

		if (!selectedLead) {
			return (
				<AdminPageLayout
					variant="detail"
					breadcrumbs={detailBreadcrumbs}
					onBack={handleBackToList}
				>
					<Alert variant="destructive">
						<AlertTitle>{__('Lead nicht gefunden', 'resa')}</AlertTitle>
						<AlertDescription>
							{__('Der angeforderte Lead konnte nicht gefunden werden.', 'resa')}
						</AlertDescription>
					</Alert>
					<Button variant="link" onClick={handleBackToList} style={{ marginTop: '16px' }}>
						<ArrowLeft style={{ width: '16px', height: '16px', marginRight: '4px' }} />
						{__('Zurück zur Liste', 'resa')}
					</Button>
				</AdminPageLayout>
			);
		}

		const fullName = [selectedLead.firstName, selectedLead.lastName].filter(Boolean).join(' ');
		const moduleName = MODULE_NAMES[selectedLead.assetType] || selectedLead.assetType;
		const locationName = locations?.find((l) => l.id === selectedLead.locationId)?.name || '—';
		const statusConfig = STATUS_CONFIG[selectedLead.status] || STATUS_CONFIG.new;

		// Format input keys for display
		const INPUT_LABELS: Record<string, string> = {
			property_type: __('Immobilientyp', 'resa'),
			size: __('Wohnfläche', 'resa'),
			rooms: __('Zimmer', 'resa'),
			year_built: __('Baujahr', 'resa'),
			condition: __('Zustand', 'resa'),
			location_rating: __('Lage-Bewertung', 'resa'),
			features: __('Ausstattung', 'resa'),
			additional_features: __('Zusatzausstattung', 'resa'),
			city_id: __('Stadt-ID', 'resa'),
			city_name: __('Stadt', 'resa'),
			city_slug: __('Stadt-Slug', 'resa'),
			address: __('Adresse', 'resa'),
			address_lat: __('Breitengrad', 'resa'),
			address_lng: __('Längengrad', 'resa'),
		};

		// Translations for feature values
		const FEATURE_LABELS: Record<string, string> = {
			garage: __('Garage', 'resa'),
			parking: __('Stellplatz', 'resa'),
			balcony: __('Balkon', 'resa'),
			terrace: __('Terrasse', 'resa'),
			garden: __('Garten', 'resa'),
			elevator: __('Aufzug', 'resa'),
			cellar: __('Keller', 'resa'),
			fitted_kitchen: __('Einbauküche', 'resa'),
			guest_wc: __('Gäste-WC', 'resa'),
			floor_heating: __('Fußbodenheizung', 'resa'),
			'Smart Home': __('Smart Home', 'resa'),
			Heliport: __('Heliport', 'resa'),
		};

		const formatInputValue = (key: string, value: unknown): string => {
			if (value === null || value === undefined) return '—';
			if (Array.isArray(value)) {
				return value.map((v) => FEATURE_LABELS[String(v)] || String(v)).join(', ');
			}
			if (typeof value === 'boolean') return value ? __('Ja', 'resa') : __('Nein', 'resa');
			if (key === 'size') return `${value} m²`;
			if (key === 'condition') {
				const conditions: Record<string, string> = {
					new: __('Neubau', 'resa'),
					renovated: __('Renoviert', 'resa'),
					good: __('Gut', 'resa'),
					needs_renovation: __('Renovierungsbedürftig', 'resa'),
				};
				return conditions[String(value)] || String(value);
			}
			if (key === 'property_type') {
				const types: Record<string, string> = {
					apartment: __('Wohnung', 'resa'),
					house: __('Haus', 'resa'),
				};
				return types[String(value)] || String(value);
			}
			if (key === 'features' || key === 'additional_features') {
				// Handle comma-separated string
				if (typeof value === 'string') {
					return value
						.split(',')
						.map((v) => FEATURE_LABELS[v.trim()] || v.trim())
						.join(', ');
				}
			}
			return String(value);
		};

		return (
			<AdminPageLayout
				variant="detail"
				breadcrumbs={[
					{ label: __('Leads', 'resa'), onClick: handleBackToList },
					{ label: fullName },
				]}
				onBack={handleBackToList}
			>
				{/* Lead Header */}
				<div style={{ marginBottom: '24px' }}>
					<div
						style={{
							display: 'flex',
							alignItems: 'flex-start',
							justifyContent: 'space-between',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
							{/* Avatar */}
							<div
								style={{
									display: 'flex',
									width: '56px',
									height: '56px',
									alignItems: 'center',
									justifyContent: 'center',
									borderRadius: '12px',
									backgroundColor: '#a9e43f',
									color: '#1e303a',
								}}
							>
								<User style={{ width: '28px', height: '28px' }} />
							</div>
							<div>
								<h1
									style={{
										fontSize: '24px',
										fontWeight: 600,
										lineHeight: 1,
										margin: 0,
										padding: 0,
										color: '#1e303a',
									}}
								>
									{fullName}
								</h1>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '12px',
										marginTop: '8px',
										flexWrap: 'wrap',
									}}
								>
									<Badge
										style={{
											backgroundColor: statusConfig.color,
											color: 'white',
											fontSize: '11px',
											padding: '3px 10px',
										}}
									>
										{statusConfig.label}
									</Badge>
									<span
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '4px',
											fontSize: '13px',
											color: 'hsl(215.4 16.3% 46.9%)',
										}}
									>
										<Calculator style={{ width: '14px', height: '14px' }} />
										{moduleName}
									</span>
									<span
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '4px',
											fontSize: '13px',
											color: 'hsl(215.4 16.3% 46.9%)',
										}}
									>
										<MapPin style={{ width: '14px', height: '14px' }} />
										{locationName}
									</span>
									<span
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '4px',
											fontSize: '13px',
											color: 'hsl(215.4 16.3% 46.9%)',
										}}
									>
										<Calendar style={{ width: '14px', height: '14px' }} />
										{formatDateTime(selectedLead.createdAt)}
									</span>
								</div>
							</div>
						</div>

						{/* Actions */}
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<Select value={selectedLead.status} onValueChange={handleStatusChange}>
								<SelectTrigger
									style={{
										width: '160px',
										height: '36px',
										backgroundColor: 'white',
										paddingLeft: '12px',
										paddingRight: '12px',
										border: '1px solid hsl(214.3 31.8% 91.4%)',
										borderRadius: '6px',
									}}
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent style={{ backgroundColor: 'white' }}>
									{Object.entries(STATUS_CONFIG).map(([status, config]) => (
										<SelectItem key={status} value={status}>
											{config.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button
								variant="outline"
								onClick={() => handleDelete(selectedLead.id, fullName)}
								disabled={deleteMutation.isPending}
								style={{
									height: '36px',
									color: '#ef4444',
									borderColor: '#fecaca',
									backgroundColor: 'white',
								}}
							>
								<Trash2 style={{ width: '16px', height: '16px' }} />
							</Button>
						</div>
					</div>
				</div>

				{/* Content */}
				<div>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
						{/* Left Column */}
						<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
							{/* Contact Data Table */}
							<div
								style={{
									borderRadius: '8px',
									border: '1px solid hsl(214.3 31.8% 91.4%)',
									overflow: 'hidden',
								}}
							>
								<div
									style={{
										padding: '12px 16px',
										backgroundColor: 'hsl(210 40% 96.1%)',
										borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
									}}
								>
									<span style={{ fontWeight: 600, color: '#1e303a' }}>
										{__('Kontaktdaten', 'resa')}
									</span>
								</div>
								<Table>
									<TableBody>
										<TableRow>
											<TableCell
												style={{
													padding: '12px 16px',
													width: '140px',
													color: 'hsl(215.4 16.3% 46.9%)',
													borderBottom:
														'1px solid hsl(214.3 31.8% 91.4%)',
												}}
											>
												<div
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: '8px',
													}}
												>
													<Mail
														style={{ width: '14px', height: '14px' }}
													/>
													{__('E-Mail', 'resa')}
												</div>
											</TableCell>
											<TableCell
												style={{
													padding: '12px 16px',
													fontWeight: 500,
													borderBottom:
														'1px solid hsl(214.3 31.8% 91.4%)',
												}}
											>
												<a
													href={`mailto:${selectedLead.email}`}
													style={{
														color: '#3b82f6',
														textDecoration: 'none',
													}}
												>
													{selectedLead.email}
												</a>
											</TableCell>
										</TableRow>
										{selectedLead.phone && (
											<TableRow>
												<TableCell
													style={{
														padding: '12px 16px',
														color: 'hsl(215.4 16.3% 46.9%)',
														borderBottom:
															'1px solid hsl(214.3 31.8% 91.4%)',
													}}
												>
													<div
														style={{
															display: 'flex',
															alignItems: 'center',
															gap: '8px',
														}}
													>
														<Phone
															style={{
																width: '14px',
																height: '14px',
															}}
														/>
														{__('Telefon', 'resa')}
													</div>
												</TableCell>
												<TableCell
													style={{
														padding: '12px 16px',
														fontWeight: 500,
														borderBottom:
															'1px solid hsl(214.3 31.8% 91.4%)',
													}}
												>
													<a
														href={`tel:${selectedLead.phone}`}
														style={{
															color: '#3b82f6',
															textDecoration: 'none',
														}}
													>
														{selectedLead.phone}
													</a>
												</TableCell>
											</TableRow>
										)}
										{selectedLead.company && (
											<TableRow>
												<TableCell
													style={{
														padding: '12px 16px',
														color: 'hsl(215.4 16.3% 46.9%)',
														borderBottom:
															'1px solid hsl(214.3 31.8% 91.4%)',
													}}
												>
													<div
														style={{
															display: 'flex',
															alignItems: 'center',
															gap: '8px',
														}}
													>
														<Building2
															style={{
																width: '14px',
																height: '14px',
															}}
														/>
														{__('Firma', 'resa')}
													</div>
												</TableCell>
												<TableCell
													style={{
														padding: '12px 16px',
														fontWeight: 500,
														borderBottom:
															'1px solid hsl(214.3 31.8% 91.4%)',
													}}
												>
													{selectedLead.company}
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</div>

							{/* Message (if exists) */}
							{selectedLead.message && (
								<div
									style={{
										borderRadius: '8px',
										border: '1px solid hsl(214.3 31.8% 91.4%)',
										overflow: 'hidden',
									}}
								>
									<div
										style={{
											padding: '12px 16px',
											backgroundColor: 'hsl(210 40% 96.1%)',
											borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										<span style={{ fontWeight: 600, color: '#1e303a' }}>
											{__('Nachricht', 'resa')}
										</span>
									</div>
									<div style={{ padding: '16px' }}>
										<p
											style={{
												margin: 0,
												fontSize: '14px',
												lineHeight: 1.6,
												color: '#1e303a',
											}}
										>
											{selectedLead.message}
										</p>
									</div>
								</div>
							)}

							{/* GDPR */}
							<div
								style={{
									borderRadius: '8px',
									border: '1px solid hsl(214.3 31.8% 91.4%)',
									overflow: 'hidden',
								}}
							>
								<div
									style={{
										padding: '12px 16px',
										backgroundColor: 'hsl(210 40% 96.1%)',
										borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
									}}
								>
									<span style={{ fontWeight: 600, color: '#1e303a' }}>
										{__('Datenschutz', 'resa')}
									</span>
								</div>
								<div style={{ padding: '16px' }}>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '10px',
										}}
									>
										{selectedLead.consentGiven ? (
											<CheckCircle2
												style={{
													width: '20px',
													height: '20px',
													color: '#22c55e',
												}}
											/>
										) : (
											<XCircle
												style={{
													width: '20px',
													height: '20px',
													color: '#ef4444',
												}}
											/>
										)}
										<div>
											<div style={{ fontWeight: 500, color: '#1e303a' }}>
												{selectedLead.consentGiven
													? __('Einwilligung erteilt', 'resa')
													: __('Keine Einwilligung', 'resa')}
											</div>
											{selectedLead.consentDate && (
												<div
													style={{
														fontSize: '13px',
														color: 'hsl(215.4 16.3% 46.9%)',
													}}
												>
													{formatDateTime(selectedLead.consentDate)}
												</div>
											)}
										</div>
									</div>
								</div>
							</div>

							{/* Address Map */}
							{selectedLead.inputs?.address_lat != null &&
							selectedLead.inputs?.address_lng != null ? (
								<div
									style={{
										borderRadius: '8px',
										border: '1px solid hsl(214.3 31.8% 91.4%)',
										overflow: 'hidden',
									}}
								>
									<div
										style={{
											padding: '12px 16px',
											backgroundColor: 'hsl(210 40% 96.1%)',
											borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										<span style={{ fontWeight: 600, color: '#1e303a' }}>
											{__('Standort', 'resa')}
										</span>
									</div>
									<div style={{ padding: '0' }}>
										<LeafletMapWrapper
											center={{
												lat: Number(selectedLead.inputs.address_lat),
												lng: Number(selectedLead.inputs.address_lng),
											}}
											zoom={15}
											markerPosition={{
												lat: Number(selectedLead.inputs.address_lat),
												lng: Number(selectedLead.inputs.address_lng),
											}}
											height={200}
											clickToPlace={false}
										/>
									</div>
									{selectedLead.inputs?.address != null ? (
										<div
											style={{
												padding: '10px 16px',
												borderTop: '1px solid hsl(214.3 31.8% 91.4%)',
												fontSize: '13px',
												color: '#1e303a',
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
											}}
										>
											<MapPin
												style={{
													width: '14px',
													height: '14px',
													color: 'hsl(215.4 16.3% 46.9%)',
												}}
											/>
											{String(selectedLead.inputs.address)}
										</div>
									) : null}
								</div>
							) : null}

							{/* Notes */}
							<div
								style={{
									borderRadius: '8px',
									border: '1px solid hsl(214.3 31.8% 91.4%)',
									overflow: 'hidden',
								}}
							>
								<div
									style={{
										padding: '12px 16px',
										backgroundColor: 'hsl(210 40% 96.1%)',
										borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
									}}
								>
									<span style={{ fontWeight: 600, color: '#1e303a' }}>
										{__('Interne Notizen', 'resa')}
									</span>
								</div>
								<div style={{ padding: '16px' }}>
									<Textarea
										value={notes}
										onChange={(e) => {
											setNotes(e.target.value);
											setNotesChanged(true);
										}}
										placeholder={__(
											'Notizen zu diesem Lead hinzufügen...',
											'resa',
										)}
										rows={4}
										style={{
											backgroundColor: 'white',
											border: '1px solid hsl(214.3 31.8% 91.4%)',
											borderRadius: '6px',
											resize: 'vertical',
										}}
									/>
									<div
										style={{
											display: 'flex',
											justifyContent: 'flex-end',
											marginTop: '12px',
										}}
									>
										<Button
											onClick={handleSaveNotes}
											disabled={!notesChanged || updateMutation.isPending}
											style={{
												backgroundColor: notesChanged
													? '#a9e43f'
													: 'hsl(210 40% 96.1%)',
												color: '#1e303a',
												border: 'none',
											}}
										>
											{updateMutation.isPending && (
												<Spinner
													style={{
														width: '14px',
														height: '14px',
														marginRight: '6px',
													}}
												/>
											)}
											{__('Speichern', 'resa')}
										</Button>
									</div>
								</div>
							</div>
						</div>

						{/* Right Column */}
						<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
							{/* Inputs Table */}
							{Object.keys(selectedLead.inputs ?? {}).length > 0 ? (
								<div
									style={{
										borderRadius: '8px',
										border: '1px solid hsl(214.3 31.8% 91.4%)',
										overflow: 'hidden',
									}}
								>
									<div
										style={{
											padding: '12px 16px',
											backgroundColor: 'hsl(210 40% 96.1%)',
											borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										<span style={{ fontWeight: 600, color: '#1e303a' }}>
											{__('Eingabedaten', 'resa')}
										</span>
									</div>
									<Table>
										<TableBody>
											{Object.entries(selectedLead.inputs)
												.filter(
													([key]) =>
														!['city_id', 'city_slug'].includes(key),
												)
												.map(([key, value], index, arr) => (
													<TableRow key={key}>
														<TableCell
															style={{
																padding: '10px 16px',
																width: '160px',
																color: 'hsl(215.4 16.3% 46.9%)',
																fontSize: '13px',
																borderBottom:
																	index < arr.length - 1
																		? '1px solid hsl(214.3 31.8% 91.4%)'
																		: 'none',
															}}
														>
															{INPUT_LABELS[key] || key}
														</TableCell>
														<TableCell
															style={{
																padding: '10px 16px',
																fontWeight: 500,
																fontSize: '13px',
																color: '#1e303a',
																borderBottom:
																	index < arr.length - 1
																		? '1px solid hsl(214.3 31.8% 91.4%)'
																		: 'none',
															}}
														>
															{formatInputValue(key, value)}
														</TableCell>
													</TableRow>
												))}
										</TableBody>
									</Table>
								</div>
							) : null}

							{/* Email Log */}
							<LeadEmailLogSection leadId={selectedLead.id} />
						</div>
					</div>
				</div>
			</AdminPageLayout>
		);
	}

	// ─── List View ──────────────────────────────────────

	return (
		<AdminPageLayout
			variant="overview"
			title={__('Leads', 'resa')}
			description={__('Verwalte und bearbeite deine eingegangenen Leads.', 'resa')}
		>
			{/* Lead limit warning for free plan */}
			{!isPremium && stats && stats.all >= leadLimit && (
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						padding: '12px 16px',
						backgroundColor: 'rgba(169, 228, 63, 0.1)',
						borderRadius: '8px',
						border: '1px solid rgba(169, 228, 63, 0.3)',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
						<Crown style={{ width: '20px', height: '20px', color: '#a9e43f' }} />
						<div>
							<div style={{ fontWeight: 500, color: '#1e303a', fontSize: '14px' }}>
								{sprintf(
									__('Lead-Limit erreicht (%d von %d)', 'resa'),
									leadLimit,
									stats.all,
								)}
							</div>
							<div style={{ fontSize: '13px', color: 'hsl(215.4 16.3% 46.9%)' }}>
								{__(
									'Upgrade auf Premium für unbegrenzte Leads und CSV-Export',
									'resa',
								)}
							</div>
						</div>
					</div>
					<Button
						variant="outline"
						size="sm"
						style={{
							borderColor: '#a9e43f',
							color: '#1e303a',
							backgroundColor: 'white',
						}}
						onClick={() => window.open('https://resa-wp.com/pricing', '_blank')}
					>
						<Crown
							style={{
								width: '14px',
								height: '14px',
								marginRight: '6px',
								color: '#a9e43f',
							}}
						/>
						{__('Upgraden', 'resa')}
					</Button>
				</div>
			)}

			{/* Bulk Actions Bar */}
			{selectedRows.size > 0 && (
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						padding: '12px 16px',
						backgroundColor: 'hsl(210 40% 96.1%)',
						borderRadius: '8px',
					}}
				>
					<span style={{ fontSize: '14px', fontWeight: 500, color: '#1e303a' }}>
						{sprintf(
							_n(
								'%d Lead ausgewählt',
								'%d Leads ausgewählt',
								selectedRows.size,
								'resa',
							),
							selectedRows.size,
						)}
					</span>
					<div style={{ display: 'flex', gap: '8px' }}>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setSelectedRows(new Set())}
							style={{ backgroundColor: 'white' }}
						>
							{__('Auswahl aufheben', 'resa')}
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={handleBulkDelete}
							disabled={deleteMutation.isPending}
							style={{
								backgroundColor: 'white',
								color: '#ef4444',
								borderColor: '#ef4444',
							}}
						>
							<Trash2 style={{ width: '14px', height: '14px', marginRight: '6px' }} />
							{__('Ausgewählte löschen', 'resa')}
						</Button>
					</div>
				</div>
			)}

			{/* Toolbar */}
			<div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
				{/* Filter tabs */}
				<Tabs value={statusFilter} onValueChange={handleStatusFilter}>
					<TabsList
						style={{
							display: 'inline-flex',
							height: '36px',
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: '8px',
							backgroundColor: 'hsl(210 40% 96.1%)',
							padding: '4px',
						}}
					>
						<TabsTrigger
							value="all"
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								whiteSpace: 'nowrap',
								borderRadius: '6px',
								padding: '6px 12px',
								fontSize: '14px',
								fontWeight: 500,
								transition: 'all 150ms',
								backgroundColor: statusFilter === 'all' ? 'white' : 'transparent',
								color:
									statusFilter === 'all' ? '#1e303a' : 'hsl(215.4 16.3% 46.9%)',
								boxShadow:
									statusFilter === 'all'
										? '0 1px 2px 0 rgb(0 0 0 / 0.05)'
										: 'none',
							}}
						>
							{__('alle', 'resa')}
							<span style={counterBadgeStyle}>{stats?.all ?? 0}</span>
						</TabsTrigger>
						<TabsTrigger
							value="new"
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								whiteSpace: 'nowrap',
								borderRadius: '6px',
								padding: '6px 12px',
								fontSize: '14px',
								fontWeight: 500,
								transition: 'all 150ms',
								backgroundColor: statusFilter === 'new' ? 'white' : 'transparent',
								color:
									statusFilter === 'new' ? '#1e303a' : 'hsl(215.4 16.3% 46.9%)',
								boxShadow:
									statusFilter === 'new'
										? '0 1px 2px 0 rgb(0 0 0 / 0.05)'
										: 'none',
							}}
						>
							{__('neu', 'resa')}
							<span style={counterBadgeStyle}>{stats?.new ?? 0}</span>
						</TabsTrigger>
						<TabsTrigger
							value="contacted"
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								whiteSpace: 'nowrap',
								borderRadius: '6px',
								padding: '6px 12px',
								fontSize: '14px',
								fontWeight: 500,
								transition: 'all 150ms',
								backgroundColor:
									statusFilter === 'contacted' ? 'white' : 'transparent',
								color:
									statusFilter === 'contacted'
										? '#1e303a'
										: 'hsl(215.4 16.3% 46.9%)',
								boxShadow:
									statusFilter === 'contacted'
										? '0 1px 2px 0 rgb(0 0 0 / 0.05)'
										: 'none',
							}}
						>
							{__('kontaktiert', 'resa')}
							<span style={counterBadgeStyle}>{stats?.contacted ?? 0}</span>
						</TabsTrigger>
						<TabsTrigger
							value="qualified"
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								whiteSpace: 'nowrap',
								borderRadius: '6px',
								padding: '6px 12px',
								fontSize: '14px',
								fontWeight: 500,
								transition: 'all 150ms',
								backgroundColor:
									statusFilter === 'qualified' ? 'white' : 'transparent',
								color:
									statusFilter === 'qualified'
										? '#1e303a'
										: 'hsl(215.4 16.3% 46.9%)',
								boxShadow:
									statusFilter === 'qualified'
										? '0 1px 2px 0 rgb(0 0 0 / 0.05)'
										: 'none',
							}}
						>
							{__('qualifiziert', 'resa')}
							<span style={counterBadgeStyle}>{stats?.qualified ?? 0}</span>
						</TabsTrigger>
					</TabsList>
				</Tabs>

				{/* Search */}
				<div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
					<Search
						style={{
							position: 'absolute',
							left: '12px',
							top: '50%',
							transform: 'translateY(-50%)',
							width: '16px',
							height: '16px',
							color: 'hsl(215.4 16.3% 46.9%)',
						}}
					/>
					<Input
						type="search"
						placeholder={__('Suchen...', 'resa')}
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						onKeyDown={handleSearchKeyDown}
						onBlur={handleSearch}
						style={{
							paddingLeft: '40px',
							height: '36px',
							backgroundColor: 'white',
							border: '1px solid hsl(214.3 31.8% 91.4%)',
							borderRadius: '6px',
						}}
					/>
				</div>

				{/* Location filter */}
				<Select
					value={String(filters.locationId ?? 'all')}
					onValueChange={handleLocationFilter}
				>
					<SelectTrigger
						style={{
							width: '160px',
							height: '36px',
							backgroundColor: 'white',
							paddingLeft: '12px',
							paddingRight: '12px',
							border: '1px solid hsl(214.3 31.8% 91.4%)',
							borderRadius: '6px',
						}}
					>
						<SelectValue placeholder={__('Standort', 'resa')} />
					</SelectTrigger>
					<SelectContent style={{ backgroundColor: 'white' }}>
						<SelectItem value="all">{__('Alle Standorte', 'resa')}</SelectItem>
						{locations?.map((loc) => (
							<SelectItem key={loc.id} value={String(loc.id)}>
								{loc.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Module filter */}
				<Select value={filters.assetType ?? 'all'} onValueChange={handleAssetTypeFilter}>
					<SelectTrigger
						style={{
							width: '200px',
							height: '36px',
							backgroundColor: 'white',
							paddingLeft: '12px',
							paddingRight: '12px',
							border: '1px solid hsl(214.3 31.8% 91.4%)',
							borderRadius: '6px',
						}}
					>
						<SelectValue placeholder={__('Modul', 'resa')} />
					</SelectTrigger>
					<SelectContent style={{ backgroundColor: 'white' }}>
						<SelectItem value="all">{__('Alle Module', 'resa')}</SelectItem>
						{Object.entries(MODULE_NAMES).map(([slug, name]) => (
							<SelectItem key={slug} value={slug}>
								{name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Export button */}
				<div style={{ marginLeft: 'auto' }}>
					{canExport ? (
						<Button
							variant="outline"
							onClick={handleExport}
							disabled={exportMutation.isPending}
							style={{
								gap: '6px',
								height: '36px',
								paddingLeft: '12px',
								paddingRight: '12px',
							}}
						>
							{exportMutation.isPending ? (
								<Spinner style={{ width: '14px', height: '14px' }} />
							) : (
								<Download style={{ width: '14px', height: '14px' }} />
							)}
							{__('CSV Export', 'resa')}
						</Button>
					) : (
						<Button
							variant="outline"
							disabled
							title={__('CSV-Export ist nur mit Premium verfügbar', 'resa')}
							style={{
								gap: '6px',
								height: '36px',
								paddingLeft: '12px',
								paddingRight: '12px',
							}}
						>
							<Crown style={{ width: '14px', height: '14px' }} />
							{__('CSV Export', 'resa')}
						</Button>
					)}
				</div>
			</div>

			{/* Loading state */}
			{isLoading && (
				<div className="resa-py-12 resa-flex resa-items-center resa-justify-center resa-gap-2">
					<Spinner className="resa-size-5" />
					<span className="resa-text-muted-foreground">
						{__('Lade Leads...', 'resa')}
					</span>
				</div>
			)}

			{/* Error state */}
			{error && (
				<Alert variant="destructive">
					<AlertTitle>{__('Fehler beim Laden', 'resa')}</AlertTitle>
					<AlertDescription>
						{__('Die Leads konnten nicht geladen werden.', 'resa')}
					</AlertDescription>
				</Alert>
			)}

			{/* Empty state */}
			{leadsData && leadsData.items.length === 0 && (
				<div className="resa-py-12 resa-text-center">
					<div
						style={{
							width: '48px',
							height: '48px',
							margin: '0 auto 16px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: '50%',
							backgroundColor: 'hsl(210 40% 96.1%)',
						}}
					>
						<Users
							style={{
								width: '24px',
								height: '24px',
								color: 'hsl(215.4 16.3% 46.9%)',
							}}
						/>
					</div>
					<h3 style={{ fontWeight: 600, marginBottom: '4px' }}>
						{filters.search || filters.status || filters.locationId || filters.assetType
							? __('Keine passenden Leads', 'resa')
							: __('Noch keine Leads', 'resa')}
					</h3>
					<p style={{ color: 'hsl(215.4 16.3% 46.9%)' }}>
						{filters.search || filters.status || filters.locationId || filters.assetType
							? __('Versuche andere Filterkriterien.', 'resa')
							: __(
									'Leads werden hier angezeigt, sobald Besucher die Formulare ausfüllen.',
									'resa',
								)}
					</p>
				</div>
			)}

			{/* Table */}
			{leadsData && leadsData.items.length > 0 && (
				<>
					<div
						style={{
							border: '1px solid hsl(214.3 31.8% 91.4%)',
							borderRadius: '8px',
						}}
					>
						<Table>
							<TableHeader>
								<TableRow style={{ backgroundColor: 'hsl(210 40% 96.1%)' }}>
									<TableHead
										style={{
											width: '48px',
											paddingLeft: '16px',
											paddingTop: '12px',
											paddingBottom: '12px',
											borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										<Checkbox
											checked={allSelected}
											onCheckedChange={handleSelectAll}
											aria-label={__('Alle auswählen', 'resa')}
											{...(someSelected
												? { 'data-state': 'indeterminate' }
												: {})}
										/>
									</TableHead>
									<TableHead
										style={{
											paddingTop: '12px',
											paddingBottom: '12px',
											borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										{__('Name', 'resa')}
									</TableHead>
									<TableHead
										style={{
											paddingTop: '12px',
											paddingBottom: '12px',
											borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										{__('E-Mail', 'resa')}
									</TableHead>
									<TableHead
										style={{
											paddingTop: '12px',
											paddingBottom: '12px',
											borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										{__('Modul', 'resa')}
									</TableHead>
									<TableHead
										style={{
											paddingTop: '12px',
											paddingBottom: '12px',
											borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										{__('Standort', 'resa')}
									</TableHead>
									<TableHead
										style={{
											paddingTop: '12px',
											paddingBottom: '12px',
											borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										{__('Status', 'resa')}
									</TableHead>
									<TableHead
										style={{
											paddingTop: '12px',
											paddingBottom: '12px',
											borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										{__('Datum', 'resa')}
									</TableHead>
									<TableHead
										style={{
											width: '40px',
											paddingTop: '12px',
											paddingBottom: '12px',
											borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{leadsData.items.map((lead) => {
									const fullName = [lead.firstName, lead.lastName]
										.filter(Boolean)
										.join(' ');
									const statusConfig =
										STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
									const moduleName =
										MODULE_NAMES[lead.assetType] || lead.assetType;

									return (
										<TableRow
											key={lead.id}
											onClick={(e) => {
												// Prevent row click when clicking checkbox or dropdown
												if (
													(e.target as HTMLElement).closest(
														'button, [role="checkbox"], [data-radix-collection-item]',
													)
												) {
													return;
												}
												handleViewDetail(lead);
											}}
											style={{ cursor: 'pointer' }}
										>
											<TableCell
												style={{
													paddingLeft: '16px',
													paddingTop: '12px',
													paddingBottom: '12px',
													borderBottom:
														'1px solid hsl(214.3 31.8% 91.4%)',
												}}
											>
												<Checkbox
													checked={selectedRows.has(lead.id)}
													onCheckedChange={(checked) =>
														handleRowSelect(lead.id, checked === true)
													}
													aria-label={sprintf(
														__('Lead %s auswählen', 'resa'),
														fullName,
													)}
												/>
											</TableCell>
											<TableCell
												style={{
													fontWeight: 500,
													paddingTop: '12px',
													paddingBottom: '12px',
													borderBottom:
														'1px solid hsl(214.3 31.8% 91.4%)',
												}}
											>
												{fullName}
											</TableCell>
											<TableCell
												style={{
													color: 'hsl(215.4 16.3% 46.9%)',
													paddingTop: '12px',
													paddingBottom: '12px',
													borderBottom:
														'1px solid hsl(214.3 31.8% 91.4%)',
												}}
											>
												{lead.email}
											</TableCell>
											<TableCell
												style={{
													paddingTop: '12px',
													paddingBottom: '12px',
													borderBottom:
														'1px solid hsl(214.3 31.8% 91.4%)',
												}}
											>
												{moduleName}
											</TableCell>
											<TableCell
												style={{
													color: 'hsl(215.4 16.3% 46.9%)',
													paddingTop: '12px',
													paddingBottom: '12px',
													borderBottom:
														'1px solid hsl(214.3 31.8% 91.4%)',
												}}
											>
												{lead.locationName || '—'}
											</TableCell>
											<TableCell
												style={{
													paddingTop: '12px',
													paddingBottom: '12px',
													borderBottom:
														'1px solid hsl(214.3 31.8% 91.4%)',
												}}
											>
												<Badge
													style={{
														backgroundColor: statusConfig.color,
														color: 'white',
														fontSize: '11px',
														padding: '2px 8px',
													}}
												>
													{statusConfig.label}
												</Badge>
											</TableCell>
											<TableCell
												style={{
													color: 'hsl(215.4 16.3% 46.9%)',
													paddingTop: '12px',
													paddingBottom: '12px',
													borderBottom:
														'1px solid hsl(214.3 31.8% 91.4%)',
												}}
											>
												{formatDate(lead.createdAt)}
											</TableCell>
											<TableCell
												style={{
													paddingTop: '12px',
													paddingBottom: '12px',
													borderBottom:
														'1px solid hsl(214.3 31.8% 91.4%)',
												}}
											>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="sm"
															style={{ padding: '4px' }}
														>
															<MoreHorizontal
																style={{
																	width: '16px',
																	height: '16px',
																}}
															/>
															<span className="resa-sr-only">
																{__('Menü öffnen', 'resa')}
															</span>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent
														align="end"
														style={{
															backgroundColor: 'white',
															padding: '4px',
														}}
													>
														<DropdownMenuLabel>
															{__('Aktionen', 'resa')}
														</DropdownMenuLabel>
														<DropdownMenuItem
															onClick={() => handleViewDetail(lead)}
														>
															<Eye
																style={{
																	width: '14px',
																	height: '14px',
																	marginRight: '8px',
																}}
															/>
															{__('Details', 'resa')}
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																(window.location.href = `mailto:${lead.email}`)
															}
														>
															<Mail
																style={{
																	width: '14px',
																	height: '14px',
																	marginRight: '8px',
																}}
															/>
															{__('E-Mail senden', 'resa')}
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={() =>
																handleDelete(lead.id, fullName)
															}
															style={{ color: '#ef4444' }}
														>
															<Trash2
																style={{
																	width: '14px',
																	height: '14px',
																	marginRight: '8px',
																}}
															/>
															{__('Löschen', 'resa')}
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>

					{/* Pagination */}
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							paddingTop: '16px',
						}}
					>
						<p style={{ fontSize: '13px', color: 'hsl(215.4 16.3% 46.9%)' }}>
							{selectedRows.size > 0
								? sprintf(
										_n(
											'%d von %d Zeile ausgewählt',
											'%d von %d Zeilen ausgewählt',
											leadsData.total,
											'resa',
										),
										selectedRows.size,
										leadsData.total,
									)
								: sprintf(
										_n(
											'%d Zeile insgesamt',
											'%d Zeilen insgesamt',
											leadsData.total,
											'resa',
										),
										leadsData.total,
									)}
						</p>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<p style={{ fontSize: '13px', color: 'hsl(215.4 16.3% 46.9%)' }}>
								{sprintf(
									__('Seite %1$d von %2$d', 'resa'),
									leadsData.page,
									leadsData.totalPages,
								)}
							</p>
							<div style={{ display: 'flex', gap: '4px' }}>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(1)}
									disabled={leadsData.page <= 1}
									style={{ padding: '0 8px' }}
								>
									<ChevronsLeft style={{ width: '16px', height: '16px' }} />
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(leadsData.page - 1)}
									disabled={leadsData.page <= 1}
									style={{ padding: '0 8px' }}
								>
									<ChevronLeft style={{ width: '16px', height: '16px' }} />
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(leadsData.page + 1)}
									disabled={leadsData.page >= leadsData.totalPages}
									style={{ padding: '0 8px' }}
								>
									<ChevronRight style={{ width: '16px', height: '16px' }} />
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(leadsData.totalPages)}
									disabled={leadsData.page >= leadsData.totalPages}
									style={{ padding: '0 8px' }}
								>
									<ChevronsRight style={{ width: '16px', height: '16px' }} />
								</Button>
							</div>
						</div>
					</div>
				</>
			)}
		</AdminPageLayout>
	);
}
