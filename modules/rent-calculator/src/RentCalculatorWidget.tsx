/**
 * Rent Calculator Widget — Orchestrates the full flow:
 *
 * 1. Load config (cities list)
 * 2. Render StepWizard with 6 steps (or 5 if city preset)
 * 3. POST /calculate → get result
 * 4. POST /leads/partial → save inputs + result
 * 5. Show LeadForm
 * 6. POST /leads/complete → save contact data
 * 7. Show RentResult
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { StepWizard } from '@frontend/components/shared/StepWizard';
import { LeadForm } from '@frontend/components/shared/LeadForm';
import type { StepConfig, WizardData } from '@frontend/types/wizard';
import { api } from '@frontend/lib/api-client';
import { getSessionId } from '@frontend/lib/session';
import { trackEvent } from '@frontend/lib/tracking';

import { PropertyTypeStep } from './steps/PropertyTypeStep';
import { PropertyDetailsStep } from './steps/PropertyDetailsStep';
import { CityStep } from './steps/CityStep';
import { ConditionStep } from './steps/ConditionStep';
import { LocationRatingStep } from './steps/LocationRatingStep';
import { FeaturesStep } from './steps/FeaturesStep';
import { RentResult } from './result/RentResult';

import {
	propertyTypeSchema,
	propertyDetailsSchema,
	citySchema,
	conditionSchema,
	locationRatingSchema,
	featuresSchema,
} from './validation/schemas';

import type { ModuleConfig, RentCalculationResult, RentCalculatorData } from './types';

/**
 * Type guard to validate wizard data conforms to RentCalculatorData.
 * Since all fields are optional, we just verify it's a valid object.
 */
function isRentCalculatorData(data: unknown): data is RentCalculatorData {
	return typeof data === 'object' && data !== null;
}

type Phase = 'loading' | 'wizard' | 'calculating' | 'lead-form' | 'result' | 'error';

interface RentCalculatorWidgetProps {
	/** Pre-selected city slug from shortcode attribute. */
	presetCity?: string;
}

export function RentCalculatorWidget({ presetCity }: RentCalculatorWidgetProps) {
	const [phase, setPhase] = useState<Phase>('loading');
	const [config, setConfig] = useState<ModuleConfig | null>(null);
	const [wizardData, setWizardData] = useState<RentCalculatorData>({});
	const [result, setResult] = useState<RentCalculationResult | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	// Load module config on mount.
	useEffect(() => {
		api.get<ModuleConfig>('modules/rent-calculator/config')
			.then((cfg) => {
				setConfig(cfg);

				// Pre-select city if provided via shortcode.
				if (presetCity && cfg.cities.length > 0) {
					const city = cfg.cities.find((c) => c.slug === presetCity);
					if (city) {
						setWizardData((prev) => ({
							...prev,
							city_id: city.id,
							city_name: city.name,
							city_slug: city.slug,
						}));
					}
				}

				setPhase('wizard');
				trackEvent('asset_view', 'rent-calculator');
			})
			.catch(() => {
				setErrorMessage('Konfiguration konnte nicht geladen werden.');
				setPhase('error');
			});
	}, [presetCity]);

	// Build steps dynamically (skip city step if preset).
	const steps: StepConfig[] = useMemo(() => {
		if (!config) return [];

		const cities = config.cities;
		const features = config.features;

		const allSteps: StepConfig[] = [
			{
				id: 'property_type',
				label: 'Immobilienart',
				component: PropertyTypeStep,
				schema: propertyTypeSchema,
			},
			{
				id: 'details',
				label: 'Grunddaten',
				component: PropertyDetailsStep,
				schema: propertyDetailsSchema,
			},
		];

		// Only include city step if no city preset and multiple cities available.
		if (!presetCity || !wizardData.city_id) {
			allSteps.push({
				id: 'city',
				label: 'Standort',
				component: (props) => <CityStep {...props} cities={cities} />,
				schema: citySchema,
			});
		}

		allSteps.push(
			{
				id: 'condition',
				label: 'Zustand',
				component: ConditionStep,
				schema: conditionSchema,
			},
			{
				id: 'location_rating',
				label: 'Lage',
				component: (props) => <LocationRatingStep {...props} />,
				schema: locationRatingSchema,
			},
			{
				id: 'features',
				label: 'Ausstattung',
				component: (props) => <FeaturesStep {...props} featureOptions={features} />,
				schema: featuresSchema,
			},
		);

		return allSteps;
	}, [config, presetCity, wizardData.city_id]);

	// Handle wizard completion → calculate + create partial lead.
	const handleWizardComplete = useCallback(async (data: WizardData) => {
		if (!isRentCalculatorData(data)) {
			setErrorMessage('Ungültige Formulardaten');
			setPhase('error');
			return;
		}
		setWizardData(data);
		setPhase('calculating');

		trackEvent('asset_start', 'rent-calculator', {
			location_id: data.city_id,
		});

		try {
			// Calculate.
			const calcResult = await api.post<RentCalculationResult>(
				'modules/rent-calculator/calculate',
				{
					city_id: data.city_id,
					size: data.size,
					property_type: data.property_type,
					condition: data.condition,
					location_rating: data.location_rating,
					features: data.features ?? [],
					year_built: data.year_built,
					rooms: data.rooms,
				},
			);
			setResult(calcResult);

			// Create partial lead.
			const sessionId = getSessionId();
			await api.post('leads/partial', {
				sessionId,
				assetType: 'rent-calculator',
				locationId: data.city_id ?? 0,
				inputs: data,
				result: calcResult,
			});

			trackEvent('form_view', 'rent-calculator', {
				location_id: data.city_id,
			});

			setPhase('lead-form');
		} catch {
			setErrorMessage('Berechnung fehlgeschlagen. Bitte versuchen Sie es erneut.');
			setPhase('error');
		}
	}, []);

	// Handle lead form submission.
	const handleLeadSubmit = useCallback(
		async (formData: Record<string, unknown>) => {
			setIsSubmitting(true);

			try {
				const sessionId = getSessionId();
				await api.post('leads/complete', {
					sessionId,
					...formData,
				});

				trackEvent('form_submit', 'rent-calculator', {
					location_id: wizardData.city_id,
				});

				trackEvent('result_view', 'rent-calculator', {
					location_id: wizardData.city_id,
				});

				setPhase('result');
			} catch {
				setErrorMessage('Formular konnte nicht gesendet werden.');
				setPhase('error');
			} finally {
				setIsSubmitting(false);
			}
		},
		[wizardData.city_id],
	);

	// Render based on phase.
	if (phase === 'loading') {
		return (
			<div className="resa-flex resa-items-center resa-justify-center resa-p-8">
				<div className="resa-animate-spin resa-h-8 resa-w-8 resa-rounded-full resa-border-4 resa-border-primary resa-border-t-transparent" />
			</div>
		);
	}

	if (phase === 'error') {
		return (
			<div className="resa-rounded-lg resa-border resa-border-destructive/50 resa-bg-destructive/5 resa-p-6 resa-text-center">
				<p className="resa-text-sm resa-text-destructive">{errorMessage}</p>
				<button
					type="button"
					onClick={() => setPhase('wizard')}
					className="resa-mt-3 resa-text-sm resa-text-primary resa-underline"
				>
					Erneut versuchen
				</button>
			</div>
		);
	}

	if (phase === 'wizard') {
		return (
			<StepWizard
				steps={steps}
				onComplete={handleWizardComplete}
				initialData={wizardData as WizardData}
			/>
		);
	}

	if (phase === 'calculating') {
		return (
			<div className="resa-flex resa-flex-col resa-items-center resa-justify-center resa-p-8 resa-space-y-3">
				<div className="resa-animate-spin resa-h-8 resa-w-8 resa-rounded-full resa-border-4 resa-border-primary resa-border-t-transparent" />
				<p className="resa-text-sm resa-text-muted-foreground">
					Mietpreis wird berechnet...
				</p>
			</div>
		);
	}

	if (phase === 'lead-form') {
		return <LeadForm onSubmit={handleLeadSubmit} isSubmitting={isSubmitting} />;
	}

	if (phase === 'result' && result) {
		return <RentResult result={result} inputs={wizardData} />;
	}

	return null;
}
