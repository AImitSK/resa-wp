/**
 * Location values tab — Configure location-specific calculation values.
 * Uses TanStack Table for a modern data table experience.
 *
 * Uses Zod + React Hook Form for validation.
 * @see docs/design-system/patterns/form-validation.md
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { __, sprintf } from '@wordpress/i18n';
import {
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocations } from '../../hooks/useLocations';
import { locationValuesSchema, type LocationValuesFormData } from '../../schemas';
import type { LocationValue, ModuleSettingsData } from '../../hooks/useModuleSettings';

interface LocationValuesTabProps {
	settings: ModuleSettingsData;
	onSaveLocationValue: (locationId: number, values: LocationValue) => void;
	onDeleteLocationValue: (locationId: number) => void;
	isSaving: boolean;
}

interface LocationTableRow {
	id: number;
	name: string;
	bundesland: string | null;
	region_type: string;
	hasCustomValues: boolean;
	base_price: number | null;
	price_min: number | null;
	price_max: number | null;
}

// ─── Styles ─────────────────────────────────────────────

const inputStyles: React.CSSProperties = {
	height: '36px',
	padding: '0 12px',
	fontSize: '14px',
	border: '1px solid hsl(214.3 31.8% 78%)',
	borderRadius: '6px',
	backgroundColor: 'white',
};

export function LocationValuesTab({
	settings,
	onSaveLocationValue,
	onDeleteLocationValue,
	isSaving,
}: LocationValuesTabProps) {
	const { data: locations, isLoading: locationsLoading } = useLocations();
	const [sorting, setSorting] = useState<SortingState>([]);
	const [editingLocationId, setEditingLocationId] = useState<number | null>(null);
	const [cancelHover, setCancelHover] = useState(false);
	const [saveHover, setSaveHover] = useState(false);

	// React Hook Form Setup
	const form = useForm<LocationValuesFormData>({
		resolver: zodResolver(locationValuesSchema),
		defaultValues: {
			base_price: 0,
			price_min: 0,
			price_max: 0,
		},
		mode: 'onChange',
	});

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = form;

	// Memoize active locations to prevent re-renders
	const activeLocations = useMemo(() => {
		return locations?.filter((l) => l.is_active) ?? [];
	}, [locations]);

	// Translate region_type to German
	const regionTypeLabels = useMemo<Record<string, string>>(
		() => ({
			city_center: __('Innenstadt', 'resa'),
			urban: __('Städtisch', 'resa'),
			suburban: __('Stadtrand', 'resa'),
			small_town: __('Kleinstadt / Stadtrand', 'resa'),
			rural: __('Ländlich', 'resa'),
		}),
		[],
	);

	// Get default values from global factors
	const defaultValues = useMemo(() => {
		const factors = settings.factors as Record<string, number> | null;
		const basePrice = factors?.base_price ?? 0;
		// Calculate price range from base_price (±15%) if not explicitly set
		return {
			base_price: basePrice,
			price_min: factors?.price_min ?? basePrice * 0.85,
			price_max: factors?.price_max ?? basePrice * 1.15,
		};
	}, [settings.factors]);

	// Transform locations to table data
	const tableData = useMemo((): LocationTableRow[] => {
		return activeLocations.map((location) => {
			const values = settings.location_values?.[String(location.id)];
			const hasCustomValues = !!values;
			const basePrice = hasCustomValues
				? (values?.base_price ?? defaultValues.base_price)
				: defaultValues.base_price;
			return {
				id: location.id,
				name: location.name,
				bundesland: location.bundesland,
				region_type: location.region_type,
				hasCustomValues,
				// Show custom values if set, otherwise show default values
				base_price: basePrice,
				price_min: hasCustomValues
					? (values?.price_min ?? basePrice * 0.85)
					: defaultValues.price_min,
				price_max: hasCustomValues
					? (values?.price_max ?? basePrice * 1.15)
					: defaultValues.price_max,
			};
		});
	}, [activeLocations, settings.location_values, defaultValues]);

	const handleEdit = useCallback(
		(row: LocationTableRow) => {
			setEditingLocationId(row.id);
			// Reset form with current values (custom or default)
			reset({
				base_price: row.base_price ?? defaultValues.base_price,
				price_min: row.price_min ?? defaultValues.price_min,
				price_max: row.price_max ?? defaultValues.price_max,
			});
		},
		[defaultValues, reset],
	);

	const onSubmit = useCallback(
		(data: LocationValuesFormData) => {
			if (editingLocationId !== null) {
				onSaveLocationValue(editingLocationId, data);
				setEditingLocationId(null);
			}
		},
		[editingLocationId, onSaveLocationValue],
	);

	const handleCancel = useCallback(() => {
		setEditingLocationId(null);
	}, []);

	const handleDelete = useCallback(
		(locationId: number) => {
			onDeleteLocationValue(locationId);
		},
		[onDeleteLocationValue],
	);

	// Reset form when editing is cancelled externally (e.g., after save)
	useEffect(() => {
		if (editingLocationId === null) {
			reset({
				base_price: 0,
				price_min: 0,
				price_max: 0,
			});
		}
	}, [editingLocationId, reset]);

	const columns = useMemo<ColumnDef<LocationTableRow>[]>(
		() => [
			{
				accessorKey: 'name',
				header: ({ column }) => (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
						style={{ padding: '0', height: 'auto', fontWeight: 600, color: '#1e303a' }}
					>
						{__('Standort', 'resa')}
						<ArrowUpDown style={{ marginLeft: '8px', width: '14px', height: '14px' }} />
					</Button>
				),
				cell: ({ row }) => (
					<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
						<div
							style={{
								width: '32px',
								height: '32px',
								borderRadius: '6px',
								backgroundColor: 'hsl(210 40% 96.1%)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<MapPin
								style={{
									width: '16px',
									height: '16px',
									color: '#1e303a',
								}}
							/>
						</div>
						<div>
							<div style={{ fontWeight: 500, color: '#1e303a' }}>
								{row.original.name}
							</div>
							<div style={{ fontSize: '12px', color: '#1e303a' }}>
								{row.original.bundesland && `${row.original.bundesland} | `}
								{regionTypeLabels[row.original.region_type] ??
									row.original.region_type}
							</div>
						</div>
					</div>
				),
			},
			{
				accessorKey: 'hasCustomValues',
				header: __('Status', 'resa'),
				cell: ({ row }) => (
					<span
						style={{
							display: 'inline-block',
							fontSize: '11px',
							padding: '3px 10px',
							borderRadius: '9999px',
							backgroundColor: row.original.hasCustomValues ? '#a9e43f' : '#1e303a',
							color: row.original.hasCustomValues ? '#1e303a' : 'white',
							fontWeight: 500,
						}}
					>
						{row.original.hasCustomValues
							? __('Individuell', 'resa')
							: __('Standard', 'resa')}
					</span>
				),
			},
			{
				accessorKey: 'base_price',
				header: ({ column }) => (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
						style={{ padding: '0', height: 'auto', fontWeight: 600, color: '#1e303a' }}
					>
						{__('Basispreis', 'resa')}
						<ArrowUpDown style={{ marginLeft: '8px', width: '14px', height: '14px' }} />
					</Button>
				),
				cell: ({ row }) => (
					<div
						style={{
							fontWeight: row.original.hasCustomValues ? 600 : 400,
							color: row.original.hasCustomValues ? '#1e303a' : '#1e303a',
						}}
					>
						{row.original.base_price !== null && row.original.base_price !== 0 ? (
							<>
								{row.original.base_price.toLocaleString('de-DE', {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}{' '}
								EUR/m²
							</>
						) : (
							<span style={{ color: '#1e303a', fontStyle: 'italic' }}>
								{__('nicht konfiguriert', 'resa')}
							</span>
						)}
					</div>
				),
			},
			{
				id: 'range',
				header: __('Preisspanne', 'resa'),
				cell: ({ row }) => (
					<div
						style={{
							fontSize: '13px',
							color: row.original.hasCustomValues ? '#1e303a' : '#1e303a',
						}}
					>
						{row.original.price_min !== null &&
						row.original.price_max !== null &&
						(row.original.price_min !== 0 || row.original.price_max !== 0) ? (
							<>
								{row.original.price_min.toLocaleString('de-DE', {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}{' '}
								–{' '}
								{row.original.price_max.toLocaleString('de-DE', {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}{' '}
								EUR/m²
							</>
						) : (
							'—'
						)}
					</div>
				),
			},
			{
				id: 'actions',
				header: '',
				cell: ({ row }) => (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								style={{
									height: '32px',
									width: '32px',
									padding: '0',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<span className="resa-sr-only">{__('Menü öffnen', 'resa')}</span>
								<MoreHorizontal style={{ width: '16px', height: '16px' }} />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							style={{
								backgroundColor: 'white',
								border: '1px solid hsl(214.3 31.8% 91.4%)',
								borderRadius: '8px',
								boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
								minWidth: '160px',
							}}
						>
							<DropdownMenuLabel style={{ color: '#1e303a', fontWeight: 600 }}>
								{__('Aktionen', 'resa')}
							</DropdownMenuLabel>
							<DropdownMenuSeparator
								style={{ backgroundColor: 'hsl(214.3 31.8% 91.4%)' }}
							/>
							<DropdownMenuItem
								onClick={() => handleEdit(row.original)}
								style={{ cursor: 'pointer', color: '#1e303a' }}
							>
								<Pencil
									style={{ width: '14px', height: '14px', marginRight: '8px' }}
								/>
								{row.original.hasCustomValues
									? __('Bearbeiten', 'resa')
									: __('Anpassen', 'resa')}
							</DropdownMenuItem>
							{row.original.hasCustomValues && (
								<DropdownMenuItem
									onClick={() => handleDelete(row.original.id)}
									style={{ cursor: 'pointer', color: '#dc2626' }}
								>
									<Trash2
										style={{
											width: '14px',
											height: '14px',
											marginRight: '8px',
										}}
									/>
									{__('Zurücksetzen', 'resa')}
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				),
			},
		],
		[handleEdit, handleDelete],
	);

	const table = useReactTable({
		data: tableData,
		columns,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: {
			sorting,
		},
	});

	if (locationsLoading) {
		return (
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					padding: '48px 0',
					gap: '8px',
				}}
			>
				<Spinner style={{ width: '20px', height: '20px' }} />
				<span style={{ color: '#1e303a' }}>
					{__('Standorte werden geladen...', 'resa')}
				</span>
			</div>
		);
	}

	if (activeLocations.length === 0) {
		return (
			<div
				style={{
					backgroundColor: 'hsl(210 40% 96.1%)',
					borderRadius: '8px',
					padding: '40px 20px',
					textAlign: 'center',
				}}
			>
				<MapPin
					style={{
						width: '48px',
						height: '48px',
						color: '#1e303a',
						margin: '0 auto 16px',
					}}
				/>
				<div style={{ color: '#1e303a', fontWeight: 500, marginBottom: '8px' }}>
					{__('Keine aktiven Standorte vorhanden', 'resa')}
				</div>
				<p style={{ fontSize: '14px', color: '#1e303a', margin: 0 }}>
					{__('Erstelle zuerst einen Standort unter', 'resa')}{' '}
					<span style={{ fontWeight: 500, color: '#1e303a' }}>
						{__('Standorte', 'resa')}
					</span>
					{__(', um standortspezifische Werte zu konfigurieren.', 'resa')}
				</p>
			</div>
		);
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			{/* Page header */}
			<div>
				<h3
					style={{
						fontSize: '18px',
						fontWeight: 600,
						color: '#1e303a',
						margin: 0,
					}}
				>
					{__('Standort-Werte', 'resa')}
				</h3>
				<p
					style={{
						fontSize: '14px',
						color: '#1e303a',
						margin: '4px 0 0 0',
					}}
				>
					{__(
						'Individuelle Basiswerte pro Standort, die die globalen Einstellungen überschreiben.',
						'resa',
					)}
				</p>
			</div>

			{/* Edit form (shown when editing) */}
			{editingLocationId !== null && (
				<div
					style={{
						backgroundColor: 'rgba(169, 228, 63, 0.1)',
						border: '2px solid #a9e43f',
						borderRadius: '8px',
						padding: '20px',
					}}
				>
					<h4 style={{ margin: '0 0 16px 0', fontWeight: 600, color: '#1e303a' }}>
						{__('Werte bearbeiten', 'resa')}:{' '}
						{tableData.find((l) => l.id === editingLocationId)?.name}
					</h4>
					<form onSubmit={handleSubmit(onSubmit)} noValidate>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(3, 1fr)',
								gap: '16px',
								marginBottom: '16px',
							}}
						>
							<div>
								<label
									style={{
										display: 'block',
										fontSize: '12px',
										fontWeight: 500,
										color: '#1e303a',
										marginBottom: '6px',
									}}
								>
									{__('Basispreis (EUR/m²)', 'resa')}
								</label>
								<Input
									type="number"
									step="0.01"
									{...register('base_price', { valueAsNumber: true })}
									style={{
										...inputStyles,
										borderColor: errors.base_price ? '#ef4444' : undefined,
									}}
								/>
								{errors.base_price && (
									<p
										style={{
											fontSize: '13px',
											color: '#ef4444',
											margin: '4px 0 0 0',
										}}
									>
										{errors.base_price.message}
									</p>
								)}
							</div>
							<div>
								<label
									style={{
										display: 'block',
										fontSize: '12px',
										fontWeight: 500,
										color: '#1e303a',
										marginBottom: '6px',
									}}
								>
									{__('Min (EUR/m²)', 'resa')}
								</label>
								<Input
									type="number"
									step="0.01"
									{...register('price_min', { valueAsNumber: true })}
									style={{
										...inputStyles,
										borderColor: errors.price_min ? '#ef4444' : undefined,
									}}
								/>
								{errors.price_min && (
									<p
										style={{
											fontSize: '13px',
											color: '#ef4444',
											margin: '4px 0 0 0',
										}}
									>
										{errors.price_min.message}
									</p>
								)}
							</div>
							<div>
								<label
									style={{
										display: 'block',
										fontSize: '12px',
										fontWeight: 500,
										color: '#1e303a',
										marginBottom: '6px',
									}}
								>
									{__('Max (EUR/m²)', 'resa')}
								</label>
								<Input
									type="number"
									step="0.01"
									{...register('price_max', { valueAsNumber: true })}
									style={{
										...inputStyles,
										borderColor: errors.price_max ? '#ef4444' : undefined,
									}}
								/>
								{errors.price_max && (
									<p
										style={{
											fontSize: '13px',
											color: '#ef4444',
											margin: '4px 0 0 0',
										}}
									>
										{errors.price_max.message}
									</p>
								)}
							</div>
						</div>
						<div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
							<Button
								type="button"
								variant="outline"
								onClick={handleCancel}
								onMouseEnter={() => setCancelHover(true)}
								onMouseLeave={() => setCancelHover(false)}
								style={{
									backgroundColor: cancelHover ? 'hsl(210 40% 96.1%)' : 'white',
									color: '#1e303a',
									border: '1px solid hsl(214.3 31.8% 91.4%)',
									boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
									cursor: 'pointer',
								}}
							>
								{__('Abbrechen', 'resa')}
							</Button>
							<Button
								type="submit"
								disabled={isSaving}
								onMouseEnter={() => setSaveHover(true)}
								onMouseLeave={() => setSaveHover(false)}
								style={{
									backgroundColor: saveHover ? '#98d438' : '#a9e43f',
									color: '#1e303a',
									border: 'none',
									cursor: isSaving ? 'not-allowed' : 'pointer',
								}}
							>
								{isSaving && (
									<Spinner
										style={{
											marginRight: '8px',
											width: '14px',
											height: '14px',
										}}
									/>
								)}
								{isSaving ? __('Speichern...', 'resa') : __('Speichern', 'resa')}
							</Button>
						</div>
					</form>
				</div>
			)}

			{/* Data table */}
			<div
				style={{
					borderRadius: '8px',
					border: '1px solid hsl(214.3 31.8% 91.4%)',
					overflow: 'hidden',
				}}
			>
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow
								key={headerGroup.id}
								style={{ backgroundColor: 'hsl(210 40% 96.1%)' }}
							>
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										style={{
											padding: '12px 16px',
											fontWeight: 600,
											color: '#1e303a',
											borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
										}}
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									style={{
										backgroundColor: 'white',
										transition: 'background-color 150ms',
									}}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											style={{
												padding: '12px 16px',
												borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
											}}
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									style={{
										padding: '24px',
										textAlign: 'center',
										color: '#1e303a',
									}}
								>
									{__('Keine Standorte gefunden.', 'resa')}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Table footer info */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					fontSize: '13px',
					color: '#1e303a',
				}}
			>
				<span>
					{/* translators: 1: Anzahl individueller Standorte, 2: Gesamtanzahl Standorte */}
					{sprintf(
						__('%1$d von %2$d Standorten mit individuellen Werten', 'resa'),
						tableData.filter((r) => r.hasCustomValues).length,
						tableData.length,
					)}
				</span>
			</div>
		</div>
	);
}
