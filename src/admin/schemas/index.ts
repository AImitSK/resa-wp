/**
 * Schema exports für Admin-Formulare.
 *
 * Alle Zod-Schemas für Admin-Komponenten werden hier zentral exportiert.
 */

export { gdprSettingsSchema, type GdprSettingsFormData } from './gdpr';
export { apiKeyCreateSchema, type ApiKeyCreateFormData } from './apiKey';
export { recaptchaSettingsSchema, type RecaptchaSettingsFormData } from './recaptcha';
export { locationValuesSchema, type LocationValuesFormData } from './locationValues';
export { moduleSetupSchema, type ModuleSetupFormData } from './moduleSetup';
export {
	emailTemplateSchema,
	type EmailTemplateFormData,
	testEmailSchema,
	type TestEmailFormData,
} from './emailTemplate';
export { pdfSettingsSchema, type PdfSettingsFormData } from './pdfSettings';
export { messengerFormSchema, messengerPlatformSchema, type MessengerFormData } from './messenger';
export { webhookSchema, type WebhookFormData } from './webhook';
export { trackingSettingsSchema, type TrackingSettingsFormData } from './tracking';
export { propstackSettingsSchema, type PropstackSettingsFormData } from './propstack';
export { locationSchema, type LocationFormData } from './location';
export { factorSchema, type FactorFormData, defaultFactors } from './factor';
export { pdfTemplateSchema, type PdfTemplateFormData } from './pdfTemplate';
export {
	agentDataSchema,
	brandingSchema,
	generalSettingsSchema,
	type AgentDataFormData,
	type BrandingFormData,
	type GeneralSettingsFormData,
} from './generalSettings';
