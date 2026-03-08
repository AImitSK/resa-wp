/**
 * Location editor — Create/edit a location.
 *
 * Simplified version: Only basic location info (name, region, taxes).
 * Calculation factors are now managed in module settings.
 * Now includes map picker for setting coordinates.
 *
 * Uses Zod + React Hook Form for validation.
 * @see docs/design-system/patterns/form-validation.md
 */

import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { __ } from '@wordpress/i18n';

import { Button } from '@/components/ui/button';

// ─── Styled Button Components ────────────────────────────

function PrimaryButton({
	children,
	onClick,
	disabled,
	type = 'button',
}: {
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	type?: 'button' | 'submit';
}) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<Button
			type={type}
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
	type = 'button',
}: {
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	type?: 'button' | 'submit';
}) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<Button
			type={type}
			onClick={onClick}
			disabled={disabled}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				backgroundColor: isHovered ? 'hsl(210 40% 96.1%)' : 'white',
				color: '#1e303a',
				border: '1px solid #e8e8e8',
				boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
				cursor: disabled ? 'not-allowed' : 'pointer',
			}}
		>
			{children}
		</Button>
	);
}
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { LocationMapPicker } from './LocationMapPicker';
import { locationSchema, type LocationFormData } from '../schemas/location';

interface LocationEditorProps {
	initialData?: LocationFormData;
	onSave: (data: LocationFormData) => void;
	onCancel: () => void;
	isSaving: boolean;
}

// Re-export für externe Nutzung
export type { LocationFormData } from '../schemas/location';

/** Region types for selection. */
const REGION_TYPES = [
	{ value: 'rural', label: 'Ländlich' },
	{ value: 'small_town', label: 'Kleinstadt / Stadtrand' },
	{ value: 'medium_city', label: 'Mittelstadt' },
	{ value: 'large_city', label: 'Großstadt / Zentrum' },
] as const;

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/ä/g, 'ae')
		.replace(/ö/g, 'oe')
		.replace(/ü/g, 'ue')
		.replace(/ß/g, 'ss')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

const defaultValues: LocationFormData = {
	name: '',
	slug: '',
	country: '',
	bundesland: '',
	region_type: 'medium_city',
	latitude: null,
	longitude: null,
	zoom_level: 13,
	data: {
		grunderwerbsteuer: 5.0,
		maklerprovision: 3.57,
	},
};

export function LocationEditor({ initialData, onSave, onCancel, isSaving }: LocationEditorProps) {
	const [autoSlug, setAutoSlug] = useState(!initialData);

	const form = useForm<LocationFormData>({
		resolver: zodResolver(locationSchema),
		defaultValues: initialData ?? defaultValues,
	});

	// Sync server data when loaded (for edit mode)
	useEffect(() => {
		if (initialData) {
			form.reset(initialData);
		}
	}, [initialData, form]);

	const {
		formState: { errors },
	} = form;

	// Watch name field for auto-slug generation
	const watchedName = form.watch('name');

	// Auto-generate slug when name changes (only if autoSlug is enabled)
	useEffect(() => {
		if (autoSlug && watchedName) {
			form.setValue('slug', slugify(watchedName), { shouldDirty: true });
		}
	}, [watchedName, autoSlug, form]);

	const handleCoordinatesChange = useCallback(
		(lat: number | null, lng: number | null, zoom: number) => {
			form.setValue('latitude', lat, { shouldDirty: true });
			form.setValue('longitude', lng, { shouldDirty: true });
			form.setValue('zoom_level', zoom, { shouldDirty: true });
		},
		[form],
	);

	const onSubmit = (data: LocationFormData) => {
		onSave(data);
	};

	const cardStyle: React.CSSProperties = {
		backgroundColor: 'hsl(210 40% 96.1%)',
		borderRadius: '8px',
		padding: '20px',
	};

	const cardHeaderStyle: React.CSSProperties = {
		fontSize: '15px',
		fontWeight: 600,
		color: '#1e303a',
		margin: 0,
	};

	const cardSublineStyle: React.CSSProperties = {
		fontSize: '13px',
		color: '#1e303a',
		margin: '4px 0 16px 0',
	};

	const inputStyle: React.CSSProperties = {
		backgroundColor: 'white',
	};

	const errorStyle: React.CSSProperties = {
		fontSize: '13px',
		color: '#ef4444',
		margin: '4px 0 0 0',
	};

	return (
		<form
			onSubmit={form.handleSubmit(onSubmit)}
			style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
		>
			{/* Page header */}
			<div>
				<h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e303a', margin: 0 }}>
					{initialData ? __('Standort bearbeiten', 'resa') : __('Neuer Standort', 'resa')}
				</h3>
				<p style={{ fontSize: '14px', color: '#1e303a', margin: '4px 0 0 0' }}>
					{__('Konfiguriere die Grunddaten und regionalen Einstellungen.', 'resa')}
				</p>
			</div>

			{/* Box 1: Grunddaten */}
			<div style={cardStyle}>
				<h4 style={cardHeaderStyle}>{__('Grunddaten', 'resa')}</h4>
				<p style={cardSublineStyle}>
					{__('Name, Slug und Regionsinformationen des Standorts.', 'resa')}
				</p>

				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
						<Label htmlFor="location-name" style={{ color: '#1e303a' }}>
							{__('Name', 'resa')} *
						</Label>
						<Input
							id="location-name"
							{...form.register('name')}
							placeholder={__('z.B. München', 'resa')}
							style={{
								...inputStyle,
								borderColor: errors.name ? '#ef4444' : undefined,
							}}
						/>
						{errors.name && <p style={errorStyle}>{errors.name.message}</p>}
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
						<Label htmlFor="location-slug" style={{ color: '#1e303a' }}>
							{__('Slug', 'resa')}
						</Label>
						<Input
							id="location-slug"
							{...form.register('slug', {
								onChange: () => setAutoSlug(false),
							})}
							placeholder={__('z.B. muenchen', 'resa')}
							style={{
								...inputStyle,
								borderColor: errors.slug ? '#ef4444' : undefined,
							}}
						/>
						{errors.slug && <p style={errorStyle}>{errors.slug.message}</p>}
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
						<Label htmlFor="location-country" style={{ color: '#1e303a' }}>
							{__('Land', 'resa')} *
						</Label>
						<Input
							id="location-country"
							{...form.register('country')}
							placeholder={__('z.B. Deutschland, Österreich, Rumänien...', 'resa')}
							style={{
								...inputStyle,
								borderColor: errors.country ? '#ef4444' : undefined,
							}}
						/>
						{errors.country && <p style={errorStyle}>{errors.country.message}</p>}
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
						<Label htmlFor="location-bundesland" style={{ color: '#1e303a' }}>
							{__('Region / Bundesland', 'resa')}
						</Label>
						<Input
							id="location-bundesland"
							{...form.register('bundesland')}
							placeholder={__('z.B. Bayern, Wien, București...', 'resa')}
							style={{
								...inputStyle,
								borderColor: errors.bundesland ? '#ef4444' : undefined,
							}}
						/>
						{errors.bundesland && <p style={errorStyle}>{errors.bundesland.message}</p>}
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
						<Label htmlFor="location-region-type" style={{ color: '#1e303a' }}>
							{__('Regionstyp', 'resa')}
						</Label>
						<Controller
							name="region_type"
							control={form.control}
							render={({ field }) => (
								<select
									id="location-region-type"
									value={field.value}
									onChange={(e) =>
										field.onChange(
											e.target.value as LocationFormData['region_type'],
										)
									}
									style={{
										height: '36px',
										width: '100%',
										borderRadius: '6px',
										border: `1px solid ${errors.region_type ? '#ef4444' : 'hsl(214.3 31.8% 78%)'}`,
										backgroundColor: 'white',
										padding: '0 12px',
										fontSize: '14px',
										color: '#1e303a',
										boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
									}}
								>
									{REGION_TYPES.map((rt) => (
										<option key={rt.value} value={rt.value}>
											{rt.label}
										</option>
									))}
								</select>
							)}
						/>
						{errors.region_type && (
							<p style={errorStyle}>{errors.region_type.message}</p>
						)}
					</div>
				</div>
			</div>

			{/* Box 2: Kartenposition */}
			<div style={cardStyle}>
				<h4 style={cardHeaderStyle}>{__('Kartenposition', 'resa')}</h4>
				<p style={cardSublineStyle}>
					{__('Position auf der Karte für Standortanzeige im Widget.', 'resa')}
				</p>

				<LocationMapPicker
					latitude={form.watch('latitude')}
					longitude={form.watch('longitude')}
					zoomLevel={form.watch('zoom_level') ?? 13}
					onCoordinatesChange={handleCoordinatesChange}
				/>
			</div>

			{/* Box 3: Regionale Kostensätze */}
			<div style={cardStyle}>
				<h4 style={cardHeaderStyle}>{__('Regionale Kostensätze', 'resa')}</h4>
				<p style={cardSublineStyle}>
					{__('Grunderwerbsteuer und Maklerprovision für diesen Standort.', 'resa')}
				</p>

				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
						<Label htmlFor="location-grest" style={{ color: '#1e303a' }}>
							{__('Grunderwerbsteuer (%)', 'resa')}
						</Label>
						<Controller
							name="data.grunderwerbsteuer"
							control={form.control}
							render={({ field }) => (
								<Input
									id="location-grest"
									type="number"
									step="0.1"
									min="0"
									max="10"
									value={field.value ?? 5.0}
									onChange={(e) => field.onChange(Number(e.target.value))}
									style={{
										...inputStyle,
										borderColor: errors.data?.grunderwerbsteuer
											? '#ef4444'
											: undefined,
									}}
								/>
							)}
						/>
						{errors.data?.grunderwerbsteuer && (
							<p style={errorStyle}>{errors.data.grunderwerbsteuer.message}</p>
						)}
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
						<Label htmlFor="location-makler" style={{ color: '#1e303a' }}>
							{__('Maklerprovision (%)', 'resa')}
						</Label>
						<Controller
							name="data.maklerprovision"
							control={form.control}
							render={({ field }) => (
								<Input
									id="location-makler"
									type="number"
									step="0.01"
									min="0"
									max="10"
									value={field.value ?? 3.57}
									onChange={(e) => field.onChange(Number(e.target.value))}
									style={{
										...inputStyle,
										borderColor: errors.data?.maklerprovision
											? '#ef4444'
											: undefined,
									}}
								/>
							)}
						/>
						{errors.data?.maklerprovision && (
							<p style={errorStyle}>{errors.data.maklerprovision.message}</p>
						)}
						<p style={{ fontSize: '12px', color: '#1e303a', margin: '4px 0 0 0' }}>
							{__('Standard: 3,57% (inkl. MwSt.)', 'resa')}
						</p>
					</div>
				</div>
			</div>

			{/* Actions */}
			<div
				style={{
					display: 'flex',
					gap: '12px',
					justifyContent: 'flex-end',
					paddingTop: '8px',
				}}
			>
				<OutlineButton onClick={onCancel}>{__('Abbrechen', 'resa')}</OutlineButton>
				<PrimaryButton type="submit" disabled={isSaving || !form.watch('name')}>
					{isSaving && <Spinner className="resa-mr-2" />}
					{isSaving ? __('Speichern...', 'resa') : __('Speichern', 'resa')}
				</PrimaryButton>
			</div>
		</form>
	);
}
