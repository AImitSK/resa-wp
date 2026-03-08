/**
 * Zod Schema fuer API-Key Erstellung.
 *
 * @see src/admin/components/integrations/ApiKeysTab.tsx
 */

import { z } from 'zod';
import { __ } from '@wordpress/i18n';

/**
 * Schema fuer API-Key Erstellung (Create-Dialog).
 */
export const apiKeyCreateSchema = z.object({
	/** Name zur Identifikation des API-Keys */
	name: z
		.string()
		.min(1, __('Name ist erforderlich', 'resa'))
		.max(100, __('Name darf maximal 100 Zeichen haben', 'resa')),
});

/**
 * TypeScript-Typ abgeleitet aus dem Schema.
 */
export type ApiKeyCreateFormData = z.infer<typeof apiKeyCreateSchema>;
