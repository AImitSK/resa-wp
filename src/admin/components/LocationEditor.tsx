/**
 * Location editor — Create/edit a location.
 *
 * Simplified version: Only basic location info (name, region, taxes).
 * Calculation factors are now managed in module settings.
 * Now includes map picker for setting coordinates.
 */

import { useState, useCallback, type ReactNode } from 'react';
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

interface LocationEditorProps {
	initialData?: LocationFormData;
	onSave: (data: LocationFormData) => void;
	onCancel: () => void;
	isSaving: boolean;
}

export interface LocationFormData {
	name: string;
	slug: string;
	country: string;
	bundesland: string;
	region_type: string;
	latitude?: number | null;
	longitude?: number | null;
	zoom_level?: number;
	data: {
		grunderwerbsteuer?: number;
		maklerprovision?: number;
		[key: string]: unknown;
	};
}

/** Region types for selection. */
const REGION_TYPES = [
	{ value: 'rural', label: 'Ländlich' },
	{ value: 'small_town', label: 'Kleinstadt / Stadtrand' },
	{ value: 'medium_city', label: 'Mittelstadt' },
	{ value: 'large_city', label: 'Großstadt / Zentrum' },
];

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

const emptyForm: LocationFormData = {
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
	const [form, setForm] = useState<LocationFormData>(initialData ?? emptyForm);
	const [autoSlug, setAutoSlug] = useState(!initialData);

	const updateName = (name: string) => {
		setForm((prev) => ({
			...prev,
			name,
			slug: autoSlug ? slugify(name) : prev.slug,
		}));
	};

	const handleCoordinatesChange = useCallback(
		(lat: number | null, lng: number | null, zoom: number) => {
			setForm((prev) => ({
				...prev,
				latitude: lat,
				longitude: lng,
				zoom_level: zoom,
			}));
		},
		[],
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSave(form);
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

	return (
		<form
			onSubmit={handleSubmit}
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
							value={form.name}
							onChange={(e) => updateName(e.target.value)}
							placeholder={__('z.B. München', 'resa')}
							required
							style={{ backgroundColor: 'white' }}
						/>
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
						<Label htmlFor="location-slug" style={{ color: '#1e303a' }}>
							{__('Slug', 'resa')}
						</Label>
						<Input
							id="location-slug"
							value={form.slug}
							onChange={(e) => {
								setAutoSlug(false);
								setForm((prev) => ({ ...prev, slug: e.target.value }));
							}}
							placeholder={__('z.B. muenchen', 'resa')}
							style={{ backgroundColor: 'white' }}
						/>
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
						<Label htmlFor="location-country" style={{ color: '#1e303a' }}>
							{__('Land', 'resa')} *
						</Label>
						<Input
							id="location-country"
							value={form.country}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, country: e.target.value }))
							}
							placeholder={__('z.B. Deutschland, Österreich, Rumänien...', 'resa')}
							required
							style={{ backgroundColor: 'white' }}
						/>
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
						<Label htmlFor="location-bundesland" style={{ color: '#1e303a' }}>
							{__('Region / Bundesland', 'resa')}
						</Label>
						<Input
							id="location-bundesland"
							value={form.bundesland}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, bundesland: e.target.value }))
							}
							placeholder={__('z.B. Bayern, Wien, București...', 'resa')}
							style={{ backgroundColor: 'white' }}
						/>
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
						<Label htmlFor="location-region-type" style={{ color: '#1e303a' }}>
							{__('Regionstyp', 'resa')}
						</Label>
						<select
							id="location-region-type"
							style={{
								height: '36px',
								width: '100%',
								borderRadius: '6px',
								border: '1px solid hsl(214.3 31.8% 78%)',
								backgroundColor: 'white',
								padding: '0 12px',
								fontSize: '14px',
								color: '#1e303a',
								boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
							}}
							value={form.region_type}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, region_type: e.target.value }))
							}
						>
							{REGION_TYPES.map((rt) => (
								<option key={rt.value} value={rt.value}>
									{rt.label}
								</option>
							))}
						</select>
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
					latitude={form.latitude}
					longitude={form.longitude}
					zoomLevel={form.zoom_level ?? 13}
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
						<Input
							id="location-grest"
							type="number"
							step="0.1"
							min="0"
							max="10"
							value={form.data.grunderwerbsteuer ?? 5.0}
							onChange={(e) =>
								setForm((prev) => ({
									...prev,
									data: {
										...prev.data,
										grunderwerbsteuer: Number(e.target.value),
									},
								}))
							}
							style={{ backgroundColor: 'white' }}
						/>
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
						<Label htmlFor="location-makler" style={{ color: '#1e303a' }}>
							{__('Maklerprovision (%)', 'resa')}
						</Label>
						<Input
							id="location-makler"
							type="number"
							step="0.01"
							min="0"
							max="10"
							value={form.data.maklerprovision ?? 3.57}
							onChange={(e) =>
								setForm((prev) => ({
									...prev,
									data: {
										...prev.data,
										maklerprovision: Number(e.target.value),
									},
								}))
							}
							style={{ backgroundColor: 'white' }}
						/>
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
				<PrimaryButton type="submit" disabled={isSaving || !form.name}>
					{isSaving && <Spinner className="resa-mr-2" />}
					{isSaving ? __('Speichern...', 'resa') : __('Speichern', 'resa')}
				</PrimaryButton>
			</div>
		</form>
	);
}
