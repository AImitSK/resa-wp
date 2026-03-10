/**
 * Property Value Widget — Orchestrates the full flow:
 *
 * 1. Load config (cities, subtypes, features)
 * 2. Render StepWizard with 10 steps (or 9 if city preset)
 * 3. POST /calculate → get result
 * 4. POST /leads/partial → save inputs + result
 * 5. Show LeadForm
 * 6. POST /leads/complete → save contact data
 * 7. Show PropertyValueResult
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
import { PropertySubtypeStep } from './steps/PropertySubtypeStep';
import { PropertyDetailsStep } from './steps/PropertyDetailsStep';
import { YearBuiltStep } from './steps/YearBuiltStep';
import { ConditionStep } from './steps/ConditionStep';
import { QualityStep } from './steps/QualityStep';
import { FeaturesStep } from './steps/FeaturesStep';
import { CityStep } from '@frontend/components/shared/steps/CityStep';
import { AddressStep } from '@frontend/components/shared/steps/AddressStep';
import { LocationRatingStep } from '@frontend/components/shared/steps/LocationRatingStep';
import { PropertyValueResult } from './result/PropertyValueResult';

import {
	getPropertyTypeSchema,
	getPropertySubtypeSchema,
	getPropertyDetailsSchema,
	getYearBuiltSchema,
	getConditionWithRentalSchema,
	getQualitySchema,
	getCitySchema,
	getAddressSchema,
	getLocationRatingSchema,
	getFeaturesSchema,
} from './validation/schemas';

import type {
	ModuleConfig,
	PropertyValueResult as PropertyValueResultType,
	PropertyValueData,
} from './types';

function isPropertyValueData(data: unknown): data is PropertyValueData {
	return typeof data === 'object' && data !== null;
}

type Phase = 'loading' | 'wizard' | 'calculating' | 'lead-form' | 'result' | 'error';

interface PropertyValueWidgetProps {
	presetCity?: string;
}

export function PropertyValueWidget({ presetCity }: PropertyValueWidgetProps) {
	const [phase, setPhase] = useState<Phase>('loading');
	const [config, setConfig] = useState<ModuleConfig | null>(null);
	const [wizardData, setWizardData] = useState<PropertyValueData>({});
	const [result, setResult] = useState<PropertyValueResultType | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	useEffect(() => {
		captureUrlParams();
	}, []);

	useEffect(() => {
		api.get<ModuleConfig>('modules/property-value/config')
			.then((cfg) => {
				setConfig(cfg);

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
				trackEvent('asset_view', 'property-value');
			})
			.catch(() => {
				setErrorMessage(__('Konfiguration konnte nicht geladen werden.', 'resa'));
				setPhase('error');
			});
	}, [presetCity]);

	const steps: StepConfig[] = useMemo(() => {
		if (!config) return [];

		const cities = config.cities;
		const features = config.features;
		const subtypesHouse = config.subtypes_house;
		const subtypesApartment = config.subtypes_apartment;

		const allSteps: StepConfig[] = [
			{
				id: 'property_type',
				label: __('Immobilienart', 'resa'),
				component: PropertyTypeStep,
				schema: getPropertyTypeSchema(),
			},
			{
				id: 'property_subtype',
				label: __('Unterart', 'resa'),
				component: (props) => (
					<PropertySubtypeStep
						{...props}
						subtypesHouse={subtypesHouse}
						subtypesApartment={subtypesApartment}
					/>
				),
				schema: getPropertySubtypeSchema(),
			},
			{
				id: 'details',
				label: __('Fläche & Zimmer', 'resa'),
				component: PropertyDetailsStep,
				schema: getPropertyDetailsSchema(),
			},
			{
				id: 'year_built',
				label: __('Baujahr', 'resa'),
				component: YearBuiltStep,
				schema: getYearBuiltSchema(),
			},
			{
				id: 'condition',
				label: __('Zustand & Nutzung', 'resa'),
				component: ConditionStep,
				schema: getConditionWithRentalSchema(),
			},
			{
				id: 'quality',
				label: __('Ausstattungsqualität', 'resa'),
				component: QualityStep,
				schema: getQualitySchema(),
			},
			{
				id: 'features',
				label: __('Extras', 'resa'),
				component: (props) => <FeaturesStep {...props} featureOptions={features} />,
				schema: getFeaturesSchema(),
			},
		];

		// City step — skip if preset.
		if (!presetCity || !wizardData.city_id) {
			allSteps.push({
				id: 'city',
				label: __('Standort', 'resa'),
				component: (props) => <CityStep {...props} cities={cities} />,
				schema: getCitySchema(),
			});
		}

		// Address step.
		allSteps.push({
			id: 'address',
			label: __('Adresse', 'resa'),
			component: (props: {
				data: WizardData;
				updateData: (data: Partial<WizardData>) => void;
				errors: Record<string, string>;
			}) => {
				const formData = props.data as PropertyValueData;
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
			schema: getAddressSchema(),
		});

		allSteps.push({
			id: 'location_rating',
			label: __('Lage', 'resa'),
			component: (props) => <LocationRatingStep {...props} />,
			schema: getLocationRatingSchema(),
		});

		return allSteps;
	}, [config, presetCity, wizardData.city_id]);

	const handleWizardComplete = useCallback(async (data: WizardData) => {
		if (!isPropertyValueData(data)) {
			setErrorMessage(__('Ungültige Formulardaten', 'resa'));
			setPhase('error');
			return;
		}
		const formData = data as PropertyValueData;
		setWizardData(formData);
		setPhase('calculating');

		trackEvent('asset_start', 'property-value', {
			location_id: formData.city_id,
		});

		try {
			const calcResult = await api.post<PropertyValueResultType>(
				'modules/property-value/calculate',
				{
					city_id: formData.city_id,
					size: formData.size,
					property_type: formData.property_type,
					property_subtype: formData.property_subtype,
					condition: formData.condition,
					quality: formData.quality,
					rental_status: formData.rental_status ?? 'owner_occupied',
					location_rating: formData.location_rating,
					features: formData.features ?? [],
					year_built: formData.year_built,
					plot_size: formData.plot_size,
					rooms: formData.rooms,
				},
			);
			setResult(calcResult);

			try {
				const sessionId = getSessionId();
				const urlParams = getCapturedParams();
				await api.postLead('leads/partial', {
					sessionId,
					assetType: 'property-value',
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
			} catch {
				console.warn('Partial lead creation failed');
			}

			trackEvent('form_view', 'property-value', {
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

	const handleLeadSubmit = useCallback(
		async (formData: Record<string, unknown>) => {
			setIsSubmitting(true);

			try {
				const sessionId = getSessionId();
				await api.postLead('leads/complete', {
					sessionId,
					...formData,
				});

				trackEvent('form_submit', 'property-value', {
					location_id: wizardData.city_id,
				});

				trackEvent('result_view', 'property-value', {
					location_id: wizardData.city_id,
				});

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
						{__('Immobilienwert wird berechnet...', 'resa')}
					</p>
				</div>
			);
		}

		if (phase === 'lead-form') {
			return <LeadForm onSubmit={handleLeadSubmit} isSubmitting={isSubmitting} />;
		}

		if (phase === 'result' && result) {
			return <PropertyValueResult result={result} inputs={wizardData} />;
		}

		return null;
	};

	return (
		<Card>
			<CardContent className="resa-pt-6">{renderContent()}</CardContent>
		</Card>
	);
}
