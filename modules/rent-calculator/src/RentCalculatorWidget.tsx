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
import { __ } from '@wordpress/i18n';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { StepWizard } from '@frontend/components/shared/StepWizard';
import { LeadForm } from '@frontend/components/shared/LeadForm';
import type { StepConfig, WizardData } from '@frontend/types/wizard';
import { api } from '@frontend/lib/api-client';
import { getSessionId, resetSession } from '@frontend/lib/session';
import { trackEvent } from '@frontend/lib/tracking';
import { captureUrlParams, getCapturedParams } from '@frontend/lib/url-params';

import { PropertyTypeStep } from './steps/PropertyTypeStep';
import { PropertyDetailsStep } from './steps/PropertyDetailsStep';
import { CityStep } from './steps/CityStep';
import { AddressStep } from './steps/AddressStep';
import { ConditionStep } from './steps/ConditionStep';
import { LocationRatingStep } from './steps/LocationRatingStep';
import { FeaturesStep } from './steps/FeaturesStep';
import { RentResult } from './result/RentResult';

import {
	propertyTypeSchema,
	propertyDetailsSchema,
	citySchema,
	addressSchema,
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

	// Capture URL parameters (GCLID, UTM, etc.) on mount.
	useEffect(() => {
		captureUrlParams();
	}, []);

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
							city_lat: city.latitude ?? undefined,
							city_lng: city.longitude ?? undefined,
						}));
					}
				}

				setPhase('wizard');
				trackEvent('asset_view', 'rent-calculator');
			})
			.catch(() => {
				setErrorMessage(__('Konfiguration konnte nicht geladen werden.', 'resa'));
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
				label: __('Immobilienart', 'resa'),
				component: PropertyTypeStep,
				schema: propertyTypeSchema,
			},
			{
				id: 'details',
				label: __('Grunddaten', 'resa'),
				component: PropertyDetailsStep,
				schema: propertyDetailsSchema,
			},
		];

		// Only include city step if no city preset and multiple cities available.
		if (!presetCity || !wizardData.city_id) {
			allSteps.push({
				id: 'city',
				label: __('Standort', 'resa'),
				component: (props) => <CityStep {...props} cities={cities} />,
				schema: citySchema,
			});
		}

		// Address step — bounded to selected city.
		allSteps.push({
			id: 'address',
			label: __('Adresse', 'resa'),
			component: (props: {
				data: WizardData;
				updateData: (data: Partial<WizardData>) => void;
				errors: Record<string, string>;
			}) => {
				const formData = props.data as RentCalculatorData;
				const cityBounds =
					formData.city_name && formData.city_lat && formData.city_lng
						? {
								name: formData.city_name,
								lat: formData.city_lat,
								lng: formData.city_lng,
							}
						: formData.city_name
							? { name: formData.city_name }
							: undefined;
				return <AddressStep {...props} cityBounds={cityBounds} />;
			},
			schema: addressSchema,
		});

		allSteps.push(
			{
				id: 'condition',
				label: __('Zustand', 'resa'),
				component: ConditionStep,
				schema: conditionSchema,
			},
			{
				id: 'location_rating',
				label: __('Lage', 'resa'),
				component: (props) => <LocationRatingStep {...props} />,
				schema: locationRatingSchema,
			},
			{
				id: 'features',
				label: __('Ausstattung', 'resa'),
				component: (props) => <FeaturesStep {...props} featureOptions={features} />,
				schema: featuresSchema,
			},
		);

		return allSteps;
	}, [config, presetCity, wizardData.city_id]);

	// Handle wizard completion → calculate + create partial lead.
	const handleWizardComplete = useCallback(async (data: WizardData) => {
		if (!isRentCalculatorData(data)) {
			setErrorMessage(__('Ungültige Formulardaten', 'resa'));
			setPhase('error');
			return;
		}
		// Cast to RentCalculatorData after validation (Zod schemas validate the actual values).
		const formData = data as RentCalculatorData;
		setWizardData(formData);
		setPhase('calculating');

		trackEvent('asset_start', 'rent-calculator', {
			location_id: formData.city_id,
		});

		try {
			// Calculate.
			const calcResult = await api.post<RentCalculationResult>(
				'modules/rent-calculator/calculate',
				{
					city_id: formData.city_id,
					size: formData.size,
					property_type: formData.property_type,
					condition: formData.condition,
					location_rating: formData.location_rating,
					features: formData.features ?? [],
					year_built: formData.year_built,
					rooms: formData.rooms,
				},
			);
			setResult(calcResult);

			// Create partial lead with captured URL parameters.
			const sessionId = getSessionId();
			const urlParams = getCapturedParams();
			await api.postLead('leads/partial', {
				sessionId,
				assetType: 'rent-calculator',
				locationId: formData.city_id ?? 0,
				inputs: formData,
				result: calcResult,
				gclid: urlParams.gclid,
				fbclid: urlParams.fbclid,
				msclkid: urlParams.msclkid,
				meta: {
					utm_source: urlParams.utm_source,
					utm_medium: urlParams.utm_medium,
					utm_campaign: urlParams.utm_campaign,
					utm_content: urlParams.utm_content,
					utm_term: urlParams.utm_term,
				},
			});

			trackEvent('form_view', 'rent-calculator', {
				location_id: formData.city_id,
			});

			setPhase('lead-form');
		} catch {
			setErrorMessage(
				__('Berechnung fehlgeschlagen. Bitte versuchen Sie es erneut.', 'resa'),
			);
			setPhase('error');
		}
	}, []);

	// Handle lead form submission.
	const handleLeadSubmit = useCallback(
		async (formData: Record<string, unknown>) => {
			setIsSubmitting(true);

			try {
				const sessionId = getSessionId();
				await api.postLead('leads/complete', {
					sessionId,
					...formData,
				});

				trackEvent('form_submit', 'rent-calculator', {
					location_id: wizardData.city_id,
				});

				trackEvent('result_view', 'rent-calculator', {
					location_id: wizardData.city_id,
				});

				// Reset session so next wizard run gets a fresh session ID.
				resetSession();

				setPhase('result');
			} catch {
				setErrorMessage(__('Formular konnte nicht gesendet werden.', 'resa'));
				setPhase('error');
			} finally {
				setIsSubmitting(false);
			}
		},
		[wizardData.city_id],
	);

	// Render content based on phase.
	const renderContent = () => {
		if (phase === 'loading') {
			return (
				<div className="resa-flex resa-items-center resa-justify-center resa-py-12 resa-gap-3">
					<Spinner className="resa-size-6" />
					<span className="resa-text-sm resa-text-muted-foreground">
						{__('Wird geladen...', 'resa')}
					</span>
				</div>
			);
		}

		if (phase === 'error') {
			return (
				<div className="resa-space-y-4">
					<Alert variant="destructive">
						<AlertCircle className="resa-h-4 resa-w-4" />
						<AlertTitle>{__('Fehler', 'resa')}</AlertTitle>
						<AlertDescription>{errorMessage}</AlertDescription>
					</Alert>
					<div className="resa-text-center">
						<Button variant="outline" onClick={() => setPhase('wizard')}>
							{__('Erneut versuchen', 'resa')}
						</Button>
					</div>
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
				<div className="resa-flex resa-flex-col resa-items-center resa-justify-center resa-py-12 resa-gap-3">
					<Spinner className="resa-size-8" />
					<p className="resa-text-sm resa-text-muted-foreground">
						{__('Mietpreis wird berechnet...', 'resa')}
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
	};

	return (
		<Card>
			<CardContent className="resa-pt-6">{renderContent()}</CardContent>
		</Card>
	);
}
