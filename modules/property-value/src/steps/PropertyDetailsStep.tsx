/**
 * Step 3: Fläche & Zimmer — Wohnfläche, Grundstück (bei Haus), Zimmer.
 */

import { __ } from '@wordpress/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import type { StepProps } from '@frontend/types/wizard';

const roomOptions = ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5', '6+'];

export function PropertyDetailsStep({ data, updateData, errors }: StepProps) {
	const isHouse = data.property_type === 'house';

	return (
		<div className="resa-space-y-4">
			<div className="resa-text-center">
				<h3 className="resa-text-lg resa-font-semibold">
					{__('Fläche und Zimmer', 'resa')}
				</h3>
			</div>

			<div className="resa-space-y-4">
				{/* Wohnfläche */}
				<div>
					<Label htmlFor="resa-pv-size">
						{__('Wohnfläche (m²)', 'resa')}{' '}
						<span className="resa-text-destructive">*</span>
					</Label>
					<div className="resa-relative resa-mt-1">
						<Input
							id="resa-pv-size"
							type="number"
							min={10}
							max={10000}
							placeholder={__('z.B. 120', 'resa')}
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

				{/* Grundstücksfläche — nur bei Haus */}
				{isHouse && (
					<div>
						<Label htmlFor="resa-pv-plot">{__('Grundstücksfläche (m²)', 'resa')}</Label>
						<div className="resa-relative resa-mt-1">
							<Input
								id="resa-pv-plot"
								type="number"
								min={0}
								max={100000}
								placeholder={__('z.B. 500', 'resa')}
								value={data.plot_size !== undefined ? String(data.plot_size) : ''}
								onChange={(e) => {
									const val = e.target.value;
									updateData({ plot_size: val === '' ? undefined : Number(val) });
								}}
								aria-invalid={!!errors.plot_size}
							/>
							<span className="resa-absolute resa-right-3 resa-top-1/2 -resa-translate-y-1/2 resa-text-sm resa-text-muted-foreground">
								m²
							</span>
						</div>
						{errors.plot_size && (
							<p
								role="alert"
								className="resa-text-xs resa-text-destructive resa-mt-1"
							>
								{errors.plot_size}
							</p>
						)}
					</div>
				)}

				{/* Zimmer */}
				<div>
					<Label htmlFor="resa-pv-rooms">{__('Zimmer', 'resa')}</Label>
					<Select
						value={data.rooms !== undefined ? String(data.rooms) : ''}
						onValueChange={(val) =>
							updateData({ rooms: val === '' ? undefined : Number(val) })
						}
					>
						<SelectTrigger id="resa-pv-rooms" className="resa-mt-1">
							<SelectValue placeholder={__('Bitte wählen', 'resa')} />
						</SelectTrigger>
						<SelectContent>
							{roomOptions.map((r) => (
								<SelectItem key={r} value={r === '6+' ? '6' : r}>
									{r}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>
	);
}
