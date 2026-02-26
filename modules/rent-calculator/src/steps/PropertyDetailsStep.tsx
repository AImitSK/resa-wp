/**
 * Step 2: Grunddaten — Wohnfläche, Zimmer, Baujahr.
 */

import { __ } from '@wordpress/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { StepProps } from '@frontend/types/wizard';

const roomOptions = ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '6+'];

export function PropertyDetailsStep({ data, updateData, errors }: StepProps) {
	return (
		<div className="resa-space-y-4">
			<div className="resa-text-center">
				<h3 className="resa-text-lg resa-font-semibold">
					{__('Grunddaten der Immobilie', 'resa')}
				</h3>
				<p className="resa-text-sm resa-text-muted-foreground resa-mt-1">
					{__('Geben Sie die wichtigsten Eckdaten ein.', 'resa')}
				</p>
			</div>

			<div className="resa-space-y-4">
				{/* Wohnfläche */}
				<div>
					<Label htmlFor="resa-size">
						{__('Wohnfläche (m²)', 'resa')}{' '}
						<span className="resa-text-destructive">*</span>
					</Label>
					<div className="resa-relative resa-mt-1">
						<Input
							id="resa-size"
							type="number"
							min={10}
							max={10000}
							placeholder="z.B. 70"
							value={data.size !== undefined ? String(data.size) : ''}
							onChange={(e) => {
								const val = e.target.value;
								updateData({ size: val === '' ? undefined : Number(val) });
							}}
							aria-invalid={!!errors.size}
						/>
						<span className="resa-absolute resa-right-3 resa-top-1/2 -resa-translate-y-1/2 resa-text-sm resa-text-muted-foreground">
							m²
						</span>
					</div>
					{errors.size && (
						<p role="alert" className="resa-text-xs resa-text-destructive resa-mt-1">
							{errors.size}
						</p>
					)}
				</div>

				{/* Zimmer */}
				<div>
					<Label htmlFor="resa-rooms">{__('Zimmer', 'resa')}</Label>
					<Select
						id="resa-rooms"
						value={data.rooms !== undefined ? String(data.rooms) : ''}
						onChange={(e) => {
							const val = e.target.value;
							updateData({ rooms: val === '' ? undefined : Number(val) });
						}}
						className="resa-mt-1"
					>
						<option value="">{__('Bitte wählen', 'resa')}</option>
						{roomOptions.map((r) => (
							<option key={r} value={r === '6+' ? '6' : r}>
								{r}
							</option>
						))}
					</Select>
				</div>

				{/* Baujahr */}
				<div>
					<Label htmlFor="resa-year">{__('Baujahr', 'resa')}</Label>
					<Input
						id="resa-year"
						type="number"
						min={1800}
						max={new Date().getFullYear() + 5}
						placeholder="z.B. 1990"
						value={data.year_built !== undefined ? String(data.year_built) : ''}
						onChange={(e) => {
							const val = e.target.value;
							updateData({ year_built: val === '' ? undefined : Number(val) });
						}}
						className="resa-mt-1"
						aria-invalid={!!errors.year_built}
					/>
					{errors.year_built && (
						<p role="alert" className="resa-text-xs resa-text-destructive resa-mt-1">
							{errors.year_built}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
