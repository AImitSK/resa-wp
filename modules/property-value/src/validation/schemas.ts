/**
 * Zod validation schemas for Property Value wizard steps.
 */

import { __ } from '@wordpress/i18n';
import { z } from 'zod';

export const getPropertyTypeSchema = () =>
	z.object({
		property_type: z.enum(['apartment', 'house'], {
			message: __('Bitte wählen Sie eine Immobilienart.', 'resa'),
		}),
	});

export const getPropertySubtypeSchema = () => {
	const allSubtypes = [
		'efh',
		'rh',
		'dhh',
		'zfh',
		'mfh',
		'eg',
		'etage',
		'dg',
		'maisonette',
		'penthouse',
	] as const;

	return z.object({
		property_subtype: z.enum(allSubtypes, {
			message: __('Bitte wählen Sie eine Unterart.', 'resa'),
		}),
	});
};

export const getPropertyDetailsSchema = () =>
	z.object({
		size: z
			.number({ error: __('Wohnfläche ist erforderlich.', 'resa') })
			.min(10, __('Mindestens 10 m².', 'resa'))
			.max(10000, __('Maximal 10.000 m².', 'resa')),
		plot_size: z.number().min(0).max(100000).optional(),
		rooms: z.number().optional(),
	});

export const getYearBuiltSchema = () =>
	z.object({
		year_built: z
			.number({ error: __('Baujahr ist erforderlich.', 'resa') })
			.min(1800, __('Frühestens 1800.', 'resa'))
			.max(new Date().getFullYear() + 5, __('Ungültiges Baujahr.', 'resa')),
	});

export const getConditionSchema = () =>
	z.object({
		condition: z.enum(['new', 'renovated', 'good', 'needs_renovation'], {
			message: __('Bitte wählen Sie den Zustand.', 'resa'),
		}),
	});

export const getRentalStatusSchema = () =>
	z.object({
		rental_status: z.enum(['owner_occupied', 'rented', 'vacant']).default('owner_occupied'),
	});

export const getQualitySchema = () =>
	z.object({
		quality: z.enum(['premium', 'normal', 'basic'], {
			message: __('Bitte wählen Sie die Ausstattungsqualität.', 'resa'),
		}),
	});

export const getCitySchema = () =>
	z.object({
		city_id: z
			.number({ error: __('Bitte wählen Sie einen Standort.', 'resa') })
			.positive(__('Bitte wählen Sie einen Standort.', 'resa')),
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

export const getAddressSchema = () =>
	z
		.object({
			address: z.string().optional(),
			address_lat: z.number().min(-90).max(90).optional(),
			address_lng: z.number().min(-180).max(180).optional(),
		})
		.refine(
			(data) => {
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

// Pre-built instances for convenience.
export const propertyTypeSchema = getPropertyTypeSchema();
export const propertyDetailsSchema = getPropertyDetailsSchema();
export const yearBuiltSchema = getYearBuiltSchema();
export const qualitySchema = getQualitySchema();
export const citySchema = getCitySchema();
export const locationRatingSchema = getLocationRatingSchema();
export const featuresSchema = getFeaturesSchema();
export const addressSchema = getAddressSchema();
