/**
 * Zod validation schemas for each wizard step.
 *
 * Uses Zod v4 API (error/message instead of required_error).
 * Schema factories allow i18n evaluation at runtime.
 */

import { __ } from '@wordpress/i18n';
import { z } from 'zod';

export const getPropertyTypeSchema = () =>
	z.object({
		property_type: z.enum(['apartment', 'house'], {
			message: __('Bitte wählen Sie eine Immobilienart.', 'resa'),
		}),
	});

export const getPropertyDetailsSchema = () =>
	z.object({
		size: z
			.number({ error: __('Wohnfläche ist erforderlich.', 'resa') })
			.min(10, __('Mindestens 10 m².', 'resa'))
			.max(10000, __('Maximal 10.000 m².', 'resa')),
		rooms: z.number().optional(),
		year_built: z
			.number()
			.min(1800, __('Frühestens 1800.', 'resa'))
			.max(new Date().getFullYear() + 5, __('Ungültiges Baujahr.', 'resa'))
			.optional(),
	});

export const getCitySchema = () =>
	z.object({
		city_id: z
			.number({ error: __('Bitte wählen Sie einen Standort.', 'resa') })
			.positive(__('Bitte wählen Sie einen Standort.', 'resa')),
	});

export const getConditionSchema = () =>
	z.object({
		condition: z.enum(['new', 'renovated', 'good', 'needs_renovation'], {
			message: __('Bitte wählen Sie den Zustand.', 'resa'),
		}),
	});

export const getLocationRatingSchema = () =>
	z.object({
		location_rating: z
			.number({ error: __('Bitte bewerten Sie die Lage.', 'resa') })
			.min(1, __('Mindestens 1.', 'resa'))
			.max(5, __('Maximal 5.', 'resa')),
	});

export const getFeaturesSchema = () =>
	z.object({
		features: z.array(z.string()).default([]),
		additional_features: z.string().optional(),
	});

/**
 * Address step schema.
 *
 * Address is optional — user can skip this step.
 * But if provided, coordinates must also be present.
 */
export const getAddressSchema = () =>
	z
		.object({
			address: z.string().optional(),
			address_lat: z.number().min(-90).max(90).optional(),
			address_lng: z.number().min(-180).max(180).optional(),
		})
		.refine(
			(data) => {
				// If address is provided, coordinates should also be present.
				if (data.address && data.address.length > 0) {
					return data.address_lat !== undefined && data.address_lng !== undefined;
				}
				return true;
			},
			{
				message: __('Bitte wählen Sie eine Adresse aus den Vorschlägen.', 'resa'),
				path: ['address'],
			},
		);

// Legacy exports for backwards compatibility
export const propertyTypeSchema = getPropertyTypeSchema();
export const propertyDetailsSchema = getPropertyDetailsSchema();
export const citySchema = getCitySchema();
export const conditionSchema = getConditionSchema();
export const locationRatingSchema = getLocationRatingSchema();
export const featuresSchema = getFeaturesSchema();
export const addressSchema = getAddressSchema();
