<?php

declare( strict_types=1 );

namespace Resa\Models;

/**
 * Email template model — CRUD for editable email templates.
 *
 * Templates are stored in wp_options as `resa_email_template_{id}`.
 * When no custom template exists, the hardcoded defaults are used.
 */
final class EmailTemplate {

	/**
	 * All known template definitions with defaults.
	 *
	 * @var array<string,array<string,mixed>>
	 */
	private const TEMPLATES = [
		'lead-notification' => [
			'name'           => 'Lead-Benachrichtigung',
			'description'    => 'E-Mail an Makler bei neuem Lead.',
			'subject'        => 'Neuer Lead: {{lead_name}} — {{asset_type}}',
			'body'           => '<p>Neuer Lead über den {{asset_type}}:</p><p><strong>Name:</strong> {{lead_name}}<br><strong>E-Mail:</strong> {{lead_email}}<br><strong>Telefon:</strong> {{lead_phone}}<br><strong>Standort:</strong> {{location_name}}</p><p>Zum Lead im Dashboard:<br>{{admin_url}}</p>',
			'has_attachment'  => false,
			'variables'      => [
				'lead_name',
				'lead_email',
				'lead_phone',
				'asset_type',
				'location_name',
				'admin_url',
			],
		],
		'lead-result'       => [
			'name'           => 'Lead-Ergebnis-PDF',
			'description'    => 'PDF-Ergebnis an Interessenten.',
			'subject'        => 'Ihre persönliche {{asset_type}}-Analyse',
			'body'           => '<p>Guten Tag {{lead_name}},</p><p>vielen Dank für Ihr Interesse an unserem {{asset_type}}.</p><p>Anbei erhalten Sie Ihre persönliche Analyse als PDF-Dokument.</p><p>Gerne besprechen wir die Ergebnisse in einem persönlichen Gespräch.</p><p>{{agent_name}}<br>{{agent_phone}}<br>{{agent_email}}</p>',
			'has_attachment'  => true,
			'variables'      => [
				'lead_name',
				'asset_type',
				'agent_name',
				'agent_phone',
				'agent_email',
			],
		],
	];

	/**
	 * Example values for template preview.
	 *
	 * @var array<string,string>
	 */
	public const EXAMPLE_VALUES = [
		'lead_name'     => 'Lisa Beispiel',
		'lead_email'    => 'lisa@example.com',
		'lead_phone'    => '+49 123 456789',
		'asset_type'    => 'Mietpreis-Kalkulator',
		'location_name' => 'München',
		'admin_url'     => '#',
		'agent_name'    => 'Max Muster',
		'agent_phone'   => '+49 89 123456',
		'agent_email'   => 'max@immobilien.de',
	];

	/**
	 * Variable labels grouped by category.
	 *
	 * @var array<string,array<string,string>>
	 */
	public const VARIABLE_LABELS = [
		'lead_name'     => 'Name des Leads',
		'lead_email'    => 'E-Mail des Leads',
		'lead_phone'    => 'Telefon des Leads',
		'asset_type'    => 'Name des Moduls',
		'location_name' => 'Standortname',
		'admin_url'     => 'Link zum Lead im Dashboard',
		'agent_name'    => 'Name des Maklers',
		'agent_phone'   => 'Telefon des Maklers',
		'agent_email'   => 'E-Mail des Maklers',
	];

	/**
	 * Variable groups for the editor dropdown.
	 *
	 * @var array<string,array<string,string[]>>
	 */
	public const VARIABLE_GROUPS = [
		'Lead'   => [ 'lead_name', 'lead_email', 'lead_phone' ],
		'Modul'  => [ 'asset_type', 'location_name' ],
		'Makler' => [ 'agent_name', 'agent_phone', 'agent_email' ],
		'System' => [ 'admin_url' ],
	];

	/**
	 * Get a single template by ID (merged with any saved overrides).
	 *
	 * @param string $id Template ID.
	 * @return array<string,mixed>|null Template data or null if unknown ID.
	 */
	public static function get( string $id ): ?array {
		$defaults = self::TEMPLATES[ $id ] ?? null;

		if ( $defaults === null ) {
			return null;
		}

		$template = array_merge( $defaults, [ 'id' => $id ] );

		$saved = get_option( "resa_email_template_{$id}" );

		if ( is_array( $saved ) ) {
			if ( isset( $saved['subject'] ) ) {
				$template['subject'] = $saved['subject'];
			}
			if ( isset( $saved['body'] ) ) {
				$template['body'] = $saved['body'];
			}
			if ( isset( $saved['is_active'] ) ) {
				$template['is_active'] = (bool) $saved['is_active'];
			}
		}

		if ( ! isset( $template['is_active'] ) ) {
			$template['is_active'] = true;
		}

		$template['is_modified'] = self::isModified( $id );

		return $template;
	}

	/**
	 * Get all templates.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public static function getAll(): array {
		$templates = [];

		foreach ( array_keys( self::TEMPLATES ) as $id ) {
			$templates[] = self::get( $id );
		}

		return $templates;
	}

	/**
	 * Save a template override to wp_options.
	 *
	 * @param string              $id   Template ID.
	 * @param array<string,mixed> $data Data to save (subject, body, is_active).
	 * @return bool True on success.
	 */
	public static function save( string $id, array $data ): bool {
		if ( ! isset( self::TEMPLATES[ $id ] ) ) {
			return false;
		}

		$saveData = [];

		if ( isset( $data['subject'] ) ) {
			$saveData['subject'] = sanitize_text_field( $data['subject'] );
		}

		if ( isset( $data['body'] ) ) {
			$saveData['body'] = wp_kses_post( $data['body'] );
		}

		if ( isset( $data['is_active'] ) ) {
			$saveData['is_active'] = (bool) $data['is_active'];
		}

		if ( empty( $saveData ) ) {
			return false;
		}

		// Merge with existing saved data.
		$existing = get_option( "resa_email_template_{$id}" );
		if ( is_array( $existing ) ) {
			$saveData = array_merge( $existing, $saveData );
		}

		return update_option( "resa_email_template_{$id}", $saveData );
	}

	/**
	 * Reset a template to defaults by deleting the wp_options override.
	 *
	 * @param string $id Template ID.
	 * @return bool True on success.
	 */
	public static function reset( string $id ): bool {
		if ( ! isset( self::TEMPLATES[ $id ] ) ) {
			return false;
		}

		return delete_option( "resa_email_template_{$id}" );
	}

	/**
	 * Check if a template has been modified (has a saved override).
	 *
	 * @param string $id Template ID.
	 * @return bool True if modified.
	 */
	public static function isModified( string $id ): bool {
		return get_option( "resa_email_template_{$id}" ) !== false;
	}

	/**
	 * Get default template data (without any overrides).
	 *
	 * @param string $id Template ID.
	 * @return array<string,mixed>|null
	 */
	public static function getDefaults( string $id ): ?array {
		$defaults = self::TEMPLATES[ $id ] ?? null;

		if ( $defaults === null ) {
			return null;
		}

		return array_merge( $defaults, [
			'id'        => $id,
			'is_active' => true,
		] );
	}
}
