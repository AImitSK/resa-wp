/**
 * Location values tab — Configure location-specific calculation values.
 * Uses TanStack Table for a modern data table experience.
 */

import { useState, useMemo, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
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

export function LocationValuesTab({
	settings,
	onSaveLocationValue,
	onDeleteLocationValue,
	isSaving,
}: LocationValuesTabProps) {
	const { data: locations, isLoading: locationsLoading } = useLocations();
	const [sorting, setSorting] = useState<SortingState>([]);
	const [editingLocationId, setEditingLocationId] = useState<number | null>(null);
	const [formValues, setFormValues] = useState<LocationValue>({
		base_price: 0,
		price_min: 0,
		price_max: 0,
	});

	// Memoize active locations to prevent re-renders
	const activeLocations = useMemo(() => {
		return locations?.filter((l) => l.is_active) ?? [];
	}, [locations]);

	// Translate region_type to German
	const regionTypeLabels: Record<string, string> = {
		city_center: __('Innenstadt', 'resa'),
		urban: __('Städtisch', 'resa'),
		suburban: __('Stadtrand', 'resa'),
		small_town: __('Kleinstadt / Stadtrand', 'resa'),
		rural: __('Ländlich', 'resa'),
	};

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
			// Pre-fill with current values (custom or default)
			setFormValues({
				base_price: row.base_price ?? defaultValues.base_price,
				price_min: row.price_min ?? defaultValues.price_min,
				price_max: row.price_max ?? defaultValues.price_max,
			});
		},
		[defaultValues],
	);

	const handleSave = useCallback(() => {
		if (editingLocationId !== null) {
			onSaveLocationValue(editingLocationId, formValues);
			setEditingLocationId(null);
		}
	}, [editingLocationId, formValues, onSaveLocationValue]);

	const handleCancel = useCallback(() => {
		setEditingLocationId(null);
	}, []);

	const handleDelete = useCallback(
		(locationId: number) => {
			onDeleteLocationValue(locationId);
		},
		[onDeleteLocationValue],
	);

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
								backgroundColor: row.original.hasCustomValues
									? '#a9e43f'
									: 'hsl(210 40% 96.1%)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<MapPin
								style={{
									width: '16px',
									height: '16px',
									color: row.original.hasCustomValues
										? '#1e303a'
										: 'hsl(215.4 16.3% 46.9%)',
								}}
							/>
						</div>
						<div>
							<div style={{ fontWeight: 500, color: '#1e303a' }}>
								{row.original.name}
							</div>
							<div style={{ fontSize: '12px', color: 'hsl(215.4 16.3% 46.9%)' }}>
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
							backgroundColor: '#1e303a',
							color: row.original.hasCustomValues ? '#a9e43f' : 'white',
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
							color: row.original.hasCustomValues
								? '#1e303a'
								: 'hsl(215.4 16.3% 46.9%)',
						}}
					>
						{row.original.base_price !== null && row.original.base_price !== 0 ? (
							<>{row.original.base_price.toFixed(2)} €/m²</>
						) : (
							<span style={{ color: 'hsl(215.4 16.3% 60%)', fontStyle: 'italic' }}>
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
							color: row.original.hasCustomValues
								? '#1e303a'
								: 'hsl(215.4 16.3% 46.9%)',
						}}
					>
						{row.original.price_min !== null &&
						row.original.price_max !== null &&
						(row.original.price_min !== 0 || row.original.price_max !== 0) ? (
							<>
								{row.original.price_min.toFixed(2)} –{' '}
								{row.original.price_max.toFixed(2)} €/m²
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
								<span className="resa-sr-only">Open menu</span>
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
				<span style={{ color: 'hsl(215.4 16.3% 46.9%)' }}>
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
						color: 'hsl(215.4 16.3% 46.9%)',
						margin: '0 auto 16px',
					}}
				/>
				<div style={{ color: '#1e303a', fontWeight: 500, marginBottom: '8px' }}>
					{__('Keine aktiven Standorte vorhanden', 'resa')}
				</div>
				<p style={{ fontSize: '14px', color: 'hsl(215.4 16.3% 46.9%)', margin: 0 }}>
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
			{/* Info text */}
			<p
				style={{
					fontSize: '14px',
					color: 'hsl(215.4 16.3% 46.9%)',
					margin: 0,
					lineHeight: 1.6,
				}}
			>
				{__(
					'Hier kannst du für jeden Standort individuelle Basiswerte festlegen. Diese überschreiben die globalen Einstellungen für den jeweiligen Standort.',
					'resa',
				)}
			</p>

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
								{__('Basispreis (€/m²)', 'resa')}
							</label>
							<Input
								type="number"
								step="0.01"
								value={formValues.base_price}
								onChange={(e) =>
									setFormValues((prev) => ({
										...prev,
										base_price: Number(e.target.value),
									}))
								}
								style={{ backgroundColor: 'white' }}
							/>
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
								{__('Min (€/m²)', 'resa')}
							</label>
							<Input
								type="number"
								step="0.01"
								value={formValues.price_min ?? 0}
								onChange={(e) =>
									setFormValues((prev) => ({
										...prev,
										price_min: Number(e.target.value),
									}))
								}
								style={{ backgroundColor: 'white' }}
							/>
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
								{__('Max (€/m²)', 'resa')}
							</label>
							<Input
								type="number"
								step="0.01"
								value={formValues.price_max ?? 0}
								onChange={(e) =>
									setFormValues((prev) => ({
										...prev,
										price_max: Number(e.target.value),
									}))
								}
								style={{ backgroundColor: 'white' }}
							/>
						</div>
					</div>
					<div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
						<Button
							variant="outline"
							onClick={handleCancel}
							style={{
								backgroundColor: 'white',
								color: '#1e303a',
								border: '1px solid hsl(214.3 31.8% 91.4%)',
							}}
						>
							{__('Abbrechen', 'resa')}
						</Button>
						<Button
							onClick={handleSave}
							disabled={isSaving}
							style={{ backgroundColor: '#a9e43f', color: '#1e303a', border: 'none' }}
						>
							{isSaving && (
								<Spinner
									style={{ marginRight: '8px', width: '14px', height: '14px' }}
								/>
							)}
							{isSaving ? __('Speichern...', 'resa') : __('Speichern', 'resa')}
						</Button>
					</div>
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
										color: 'hsl(215.4 16.3% 46.9%)',
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
					color: 'hsl(215.4 16.3% 46.9%)',
				}}
			>
				<span>
					{tableData.filter((r) => r.hasCustomValues).length} {__('von', 'resa')}{' '}
					{tableData.length} {__('Standorten mit individuellen Werten', 'resa')}
				</span>
			</div>
		</div>
	);
}
