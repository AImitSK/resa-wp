<?php

declare( strict_types=1 );

namespace Resa\Services\Notifications;

use Resa\Models\EmailTemplate;
use Resa\Models\Lead;
use Resa\Models\Location;
use Resa\Services\Email\EmailService;

/**
 * Lead notification service — sends email notifications to agents when leads complete.
 *
 * Notifies the assigned agent (via Location.agent_id -> WP User) or falls back
 * to a configured fallback email or the site admin.
 */
final class LeadNotificationService {

	/**
	 * Template identifier for logging.
	 */
	private const TEMPLATE_ID = 'lead-notification';

	/**
	 * Email service instance.
	 *
	 * @var EmailService
	 */
	private EmailService $emailService;

	/**
	 * Constructor.
	 *
	 * @param EmailService $emailService Email service for sending.
	 */
	public function __construct( EmailService $emailService ) {
		$this->emailService = $emailService;
	}

	/**
	 * Notify the assigned agent about a new lead.
	 *
	 * @param int $leadId Lead ID.
	 * @return bool True on success, false on failure.
	 */
	public function notifyAgent( int $leadId ): bool {
		// Check if notifications are enabled.
		if ( ! $this->isEnabled() ) {
			return false;
		}

		// Check if template is active.
		$template = EmailTemplate::get( self::TEMPLATE_ID );
		if ( $template !== null && ( $template['is_active'] ?? true ) === false ) {
			return false;
		}

		$lead = Lead::findById( $leadId );
		if ( $lead === null ) {
			return false;
		}

		$location = $this->getLocation( (int) ( $lead->location_id ?? 0 ) );

		$agentEmail = $this->getAgentEmail( $location );
		if ( $agentEmail === null ) {
			return false;
		}

		$agentName = $this->getAgentName( $location );
		$vars      = $this->buildTemplateVariables( $lead, $location, $agentName );

		// Build subject and body from DB template (with variable replacement).
		if ( $template !== null && $template['is_modified'] ) {
			$subject = EmailService::renderVariables( $template['subject'], $vars );
			$body    = EmailService::renderVariables( $template['body'], $vars );
			$body    = $this->stripVariableSpans( $body );
			$html    = EmailService::wrapInLayout( $body );
		} else {
			// Legacy: use PHP template file.
			$subject = $this->buildSubject( $lead );
			$html    = $this->buildEmailContent( $lead, $location, $agentName );
		}

		try {
			return $this->emailService->send(
				$leadId,
				self::TEMPLATE_ID,
				$agentEmail,
				$subject,
				$html
			);
		} catch ( \RuntimeException $e ) {
			// Log error but don't propagate — lead completion should not fail.
			return false;
		}
	}

	/**
	 * Strip data-variable spans, keeping their inner text content.
	 *
	 * @param string $html HTML string.
	 * @return string Cleaned HTML.
	 */
	private function stripVariableSpans( string $html ): string {
		return preg_replace(
			'/<span\s+data-variable="[^"]*">(.*?)<\/span>/i',
			'$1',
			$html
		) ?? $html;
	}

	/**
	 * Check if lead notifications are enabled.
	 *
	 * @return bool
	 */
	private function isEnabled(): bool {
		return (bool) get_option( 'resa_notification_enabled', true );
	}

	/**
	 * Get location by ID (or null for no location).
	 *
	 * @param int $locationId Location ID.
	 * @return object|null
	 */
	private function getLocation( int $locationId ): ?object {
		if ( $locationId <= 0 ) {
			return null;
		}

		return Location::findById( $locationId );
	}

	/**
	 * Get the email address to notify.
	 *
	 * Priority:
	 *  1. Agent from Location.agent_id (WP User email)
	 *  2. Fallback email from settings
	 *  3. Site admin email
	 *
	 * @param object|null $location Location row.
	 * @return string|null Email or null if none available.
	 */
	private function getAgentEmail( ?object $location ): ?string {
		// 1. Try agent from location.
		if ( $location !== null && ! empty( $location->agent_id ) ) {
			$user = get_user_by( 'ID', (int) $location->agent_id );
			if ( $user instanceof \WP_User && is_email( $user->user_email ) ) {
				return $user->user_email;
			}
		}

		// 2. Try fallback email.
		$fallback = get_option( 'resa_notification_fallback_email', '' );
		if ( is_string( $fallback ) && is_email( $fallback ) ) {
			return $fallback;
		}

		// 3. Fallback to admin email.
		$adminEmail = get_option( 'admin_email', '' );
		if ( is_string( $adminEmail ) && is_email( $adminEmail ) ) {
			return $adminEmail;
		}

		return null;
	}

	/**
	 * Get the agent's display name.
	 *
	 * @param object|null $location Location row.
	 * @return string Agent name or generic fallback.
	 */
	private function getAgentName( ?object $location ): string {
		if ( $location !== null && ! empty( $location->agent_id ) ) {
			$user = get_user_by( 'ID', (int) $location->agent_id );
			if ( $user instanceof \WP_User ) {
				$displayName = $user->display_name;
				if ( ! empty( $displayName ) ) {
					return $displayName;
				}
			}
		}

		return __( 'Team', 'resa' );
	}

	/**
	 * Build the email subject line.
	 *
	 * @param object $lead Lead row.
	 * @return string Subject.
	 */
	private function buildSubject( object $lead ): string {
		$assetLabel = $this->getAssetTypeLabel( $lead->asset_type ?? '' );
		$leadName   = trim( ( $lead->first_name ?? '' ) . ' ' . ( $lead->last_name ?? '' ) );

		if ( empty( $leadName ) ) {
			$leadName = __( 'Unbekannt', 'resa' );
		}

		/* translators: 1: Asset type (e.g. "Mietpreis-Kalkulator"), 2: Lead name */
		return sprintf(
			__( 'Neuer Lead: %1$s von %2$s', 'resa' ),
			$assetLabel,
			$leadName
		);
	}

	/**
	 * Build the complete HTML email content.
	 *
	 * @param object      $lead      Lead row.
	 * @param object|null $location  Location row.
	 * @param string      $agentName Agent display name.
	 * @return string Rendered HTML.
	 */
	private function buildEmailContent( object $lead, ?object $location, string $agentName ): string {
		$vars = $this->buildTemplateVariables( $lead, $location, $agentName );

		$templatePath = __DIR__ . '/../Email/Templates/lead-notification.php';

		if ( ! file_exists( $templatePath ) ) {
			// Fallback: simple HTML if template missing.
			return $this->buildFallbackHtml( $vars );
		}

		ob_start();
		// phpcs:ignore WordPress.PHP.DontExtract.extract_extract
		extract( $vars, EXTR_SKIP );
		include $templatePath;
		$html = ob_get_clean();

		return $html ?: $this->buildFallbackHtml( $vars );
	}

	/**
	 * Build template variables from lead data.
	 *
	 * @param object      $lead      Lead row.
	 * @param object|null $location  Location row.
	 * @param string      $agentName Agent display name.
	 * @return array<string,string>
	 */
	private function buildTemplateVariables( object $lead, ?object $location, string $agentName ): array {
		$leadName = trim( ( $lead->first_name ?? '' ) . ' ' . ( $lead->last_name ?? '' ) );
		if ( empty( $leadName ) ) {
			$leadName = __( 'Unbekannt', 'resa' );
		}

		$locationName = $location->name ?? __( 'Nicht zugewiesen', 'resa' );

		$resultSummary = $this->buildResultSummary( $lead );

		$adminUrl = admin_url( 'admin.php?page=resa-leads' );

		return [
			'agent_name'     => esc_html( $agentName ),
			'lead_name'      => esc_html( $leadName ),
			'lead_email'     => esc_html( $lead->email ?? '' ),
			'lead_phone'     => esc_html( $lead->phone ?? '' ),
			'lead_company'   => esc_html( $lead->company ?? '' ),
			'lead_message'   => esc_html( $lead->message ?? '' ),
			'asset_type'     => esc_html( $this->getAssetTypeLabel( $lead->asset_type ?? '' ) ),
			'location_name'  => esc_html( $locationName ),
			'result_summary' => $resultSummary,
			'admin_url'      => esc_url( $adminUrl ),
			'site_name'      => esc_html( get_bloginfo( 'name' ) ),
			'created_at'     => esc_html( $this->formatDate( $lead->created_at ?? '' ) ),
		];
	}

	/**
	 * Get a human-readable label for the asset type.
	 *
	 * @param string $assetType Asset type slug.
	 * @return string Translated label.
	 */
	private function getAssetTypeLabel( string $assetType ): string {
		$labels = [
			'rent-calculator'   => __( 'Mietpreis-Kalkulator', 'resa' ),
			'value-calculator'  => __( 'Immobilienwert-Rechner', 'resa' ),
			'purchase-costs'    => __( 'Kaufnebenkosten-Rechner', 'resa' ),
			'budget-calculator' => __( 'Budgetrechner', 'resa' ),
			'roi-calculator'    => __( 'Renditerechner', 'resa' ),
			'energy-check'      => __( 'Energieeffizienz-Check', 'resa' ),
			'seller-checklist'  => __( 'Verkäufer-Checkliste', 'resa' ),
			'buyer-checklist'   => __( 'Käufer-Checkliste', 'resa' ),
		];

		return $labels[ $assetType ] ?? ucfirst( str_replace( '-', ' ', $assetType ) );
	}

	/**
	 * Build a summary string from the lead result.
	 *
	 * @param object $lead Lead row.
	 * @return string HTML-safe summary.
	 */
	private function buildResultSummary( object $lead ): string {
		$result = json_decode( $lead->result ?? '{}', true );

		if ( ! is_array( $result ) || empty( $result ) ) {
			return esc_html__( 'Keine Ergebnisdaten verfügbar', 'resa' );
		}

		$lines = [];

		// Common result fields.
		$fieldLabels = [
			'estimatedRent'    => __( 'Geschätzte Miete', 'resa' ),
			'estimatedValue'   => __( 'Geschätzter Wert', 'resa' ),
			'purchaseCosts'    => __( 'Kaufnebenkosten', 'resa' ),
			'totalBudget'      => __( 'Gesamtbudget', 'resa' ),
			'roi'              => __( 'Rendite', 'resa' ),
			'energyClass'      => __( 'Energieklasse', 'resa' ),
			'monthlyRent'      => __( 'Monatliche Miete', 'resa' ),
			'pricePerSqm'      => __( 'Preis pro m²', 'resa' ),
		];

		foreach ( $fieldLabels as $key => $label ) {
			if ( isset( $result[ $key ] ) ) {
				$value   = $this->formatResultValue( $result[ $key ] );
				$lines[] = esc_html( $label ) . ': ' . esc_html( $value );
			}
		}

		if ( empty( $lines ) ) {
			// Fallback: show first 3 key-value pairs.
			$count = 0;
			foreach ( $result as $key => $value ) {
				if ( $count >= 3 ) {
					break;
				}
				if ( is_scalar( $value ) ) {
					$lines[] = esc_html( ucfirst( (string) $key ) ) . ': ' . esc_html( (string) $value );
					++$count;
				}
			}
		}

		return implode( '<br>', $lines );
	}

	/**
	 * Format a result value for display.
	 *
	 * @param mixed $value Raw value.
	 * @return string Formatted string.
	 */
	private function formatResultValue( mixed $value ): string {
		if ( is_numeric( $value ) ) {
			// Format as German number with Euro.
			return number_format( (float) $value, 2, ',', '.' ) . ' €';
		}

		if ( is_array( $value ) ) {
			return wp_json_encode( $value ) ?: '';
		}

		return (string) $value;
	}

	/**
	 * Format a date string for display.
	 *
	 * @param string $dateString MySQL date string.
	 * @return string Formatted date.
	 */
	private function formatDate( string $dateString ): string {
		if ( empty( $dateString ) ) {
			return '';
		}

		$timestamp = strtotime( $dateString );
		if ( $timestamp === false ) {
			return $dateString;
		}

		return wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), $timestamp ) ?: $dateString;
	}

	/**
	 * Build fallback HTML if template file is missing.
	 *
	 * @param array<string,string> $vars Template variables.
	 * @return string Simple HTML email.
	 */
	private function buildFallbackHtml( array $vars ): string {
		$html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>';
		$html .= '<h1>' . esc_html__( 'Neuer Lead eingegangen', 'resa' ) . '</h1>';
		$html .= '<p><strong>' . esc_html__( 'Name', 'resa' ) . ':</strong> ' . $vars['lead_name'] . '</p>';
		$html .= '<p><strong>' . esc_html__( 'E-Mail', 'resa' ) . ':</strong> ' . $vars['lead_email'] . '</p>';

		if ( ! empty( $vars['lead_phone'] ) ) {
			$html .= '<p><strong>' . esc_html__( 'Telefon', 'resa' ) . ':</strong> ' . $vars['lead_phone'] . '</p>';
		}

		$html .= '<p><strong>' . esc_html__( 'Tool', 'resa' ) . ':</strong> ' . $vars['asset_type'] . '</p>';
		$html .= '<p><strong>' . esc_html__( 'Standort', 'resa' ) . ':</strong> ' . $vars['location_name'] . '</p>';
		$html .= '<p><strong>' . esc_html__( 'Ergebnis', 'resa' ) . ':</strong><br>' . $vars['result_summary'] . '</p>';
		$html .= '<p><a href="' . $vars['admin_url'] . '">' . esc_html__( 'Lead im Admin ansehen', 'resa' ) . '</a></p>';
		$html .= '</body></html>';

		return $html;
	}
}
