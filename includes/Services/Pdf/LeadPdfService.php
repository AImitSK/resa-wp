<?php

declare( strict_types=1 );

namespace Resa\Services\Pdf;

use Resa\Models\Lead;
use Resa\Models\Location;
use Resa\Services\Email\EmailService;
use Resa\Services\Pdf\Charts\SimpleBarChart;
use Resa\Services\Pdf\Charts\SimpleGaugeChart;

/**
 * Lead PDF service — generates analysis PDFs and sends them to leads.
 *
 * Orchestrates PDF generation and email delivery after lead completion.
 * Uses PdfGenerator for rendering and EmailService for delivery.
 */
final class LeadPdfService {

	/**
	 * Template identifier for logging.
	 */
	private const TEMPLATE_ID = 'lead-result';

	/**
	 * PDF generator instance.
	 *
	 * @var PdfGenerator
	 */
	private PdfGenerator $pdfGenerator;

	/**
	 * Email service instance.
	 *
	 * @var EmailService
	 */
	private EmailService $emailService;

	/**
	 * Constructor.
	 *
	 * @param PdfGenerator $pdfGenerator PDF generator.
	 * @param EmailService $emailService Email service.
	 */
	public function __construct( PdfGenerator $pdfGenerator, EmailService $emailService ) {
		$this->pdfGenerator = $pdfGenerator;
		$this->emailService = $emailService;
	}

	/**
	 * Generate PDF and send to lead via email.
	 *
	 * @param int $leadId Lead ID.
	 * @return bool True on success, false on failure.
	 */
	public function generateAndSend( int $leadId ): bool {
		// Check if PDF sending is enabled.
		if ( ! $this->isEnabled() ) {
			return false;
		}

		$lead = Lead::findById( $leadId );
		if ( $lead === null ) {
			return false;
		}

		// Only process completed leads with valid email.
		if ( empty( $lead->email ) || ! is_email( $lead->email ) ) {
			return false;
		}

		$location = $this->getLocation( (int) ( $lead->location_id ?? 0 ) );

		try {
			// Generate PDF.
			$pdfPath = $this->generatePdf( $lead, $location );
			if ( $pdfPath === null ) {
				return false;
			}

			// Send email with PDF attachment.
			$sent = $this->sendEmail( $lead, $location, $pdfPath );

			// Clean up temporary PDF file.
			$this->cleanupPdf( $pdfPath );

			return $sent;
		} catch ( \Throwable $e ) {
			// Log error but don't propagate — lead completion should not fail.
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( 'RESA: Lead PDF generation failed: ' . $e->getMessage() );
			return false;
		}
	}

	/**
	 * Check if PDF sending to leads is enabled.
	 *
	 * @return bool
	 */
	private function isEnabled(): bool {
		return (bool) get_option( 'resa_lead_pdf_enabled', true );
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
	 * Generate the PDF file.
	 *
	 * @param object      $lead     Lead row.
	 * @param object|null $location Location row.
	 * @return string|null Path to generated PDF file, or null on failure.
	 */
	private function generatePdf( object $lead, ?object $location ): ?string {
		$templateName = $this->getTemplateForAssetType( $lead->asset_type ?? '' );
		$pdfData      = $this->buildPdfData( $lead, $location );

		// Generate unique filename.
		$uploadDir = wp_upload_dir();
		$pdfDir    = $uploadDir['basedir'] . '/resa-pdfs';
		if ( ! is_dir( $pdfDir ) ) {
			wp_mkdir_p( $pdfDir );

			// Add .htaccess to protect PDF directory.
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
			file_put_contents( $pdfDir . '/.htaccess', 'Deny from all' );
		}

		$filename = sprintf(
			'%s-%s-%s.pdf',
			sanitize_file_name( $templateName ),
			$lead->id ?? 0,
			wp_generate_password( 8, false )
		);
		$pdfPath = $pdfDir . '/' . $filename;

		try {
			$this->pdfGenerator->generateToFile( $templateName, $pdfData, $pdfPath );
			return $pdfPath;
		} catch ( \RuntimeException $e ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( 'RESA: PDF generation error: ' . $e->getMessage() );
			return null;
		}
	}

	/**
	 * Get the PDF template name for an asset type.
	 *
	 * @param string $assetType Asset type slug.
	 * @return string Template name.
	 */
	private function getTemplateForAssetType( string $assetType ): string {
		$templates = [
			'rent-calculator'   => 'rent-analysis',
			'value-calculator'  => 'value-analysis',
			'purchase-costs'    => 'purchase-costs',
			'budget-calculator' => 'budget-analysis',
			'roi-calculator'    => 'roi-analysis',
		];

		return $templates[ $assetType ] ?? 'rent-analysis';
	}

	/**
	 * Build PDF template data from lead and location.
	 *
	 * @param object      $lead     Lead row.
	 * @param object|null $location Location row.
	 * @return array<string,mixed>
	 */
	private function buildPdfData( object $lead, ?object $location ): array {
		$result = json_decode( $lead->result ?? '{}', true ) ?: [];
		$inputs = json_decode( $lead->inputs ?? '{}', true ) ?: [];
		$agent  = $this->getAgentData( $location );

		$leadName = trim( ( $lead->first_name ?? '' ) . ' ' . ( $lead->last_name ?? '' ) );

		// Extract result values - handle nested monthly_rent structure.
		$monthlyRent   = $result['monthly_rent'] ?? [];
		$estimatedRent = (float) ( $monthlyRent['estimate'] ?? $result['estimatedRent'] ?? 0 );
		$rentMin       = (float) ( $monthlyRent['low'] ?? $result['rentMin'] ?? 0 );
		$rentMax       = (float) ( $monthlyRent['high'] ?? $result['rentMax'] ?? 0 );
		$pricePerSqm   = (float) ( $result['price_per_sqm'] ?? $result['pricePerSqm'] ?? 0 );

		// City averages from result or city data.
		$cityData      = $result['city'] ?? [];
		$cityAverage   = (float) ( $result['cityAverage'] ?? $result['city_average'] ?? 0 );
		$countyAverage = (float) ( $result['countyAverage'] ?? $result['county_average'] ?? 0 );

		// Build comparison charts (SVG for Puppeteer, PNG for DOMPDF).
		$barChartSvg      = $this->buildComparisonChart( $pricePerSqm, $cityAverage, $countyAverage, false );
		$barChartPng      = $this->buildComparisonChart( $pricePerSqm, $cityAverage, $countyAverage, true );

		// Build market position gauge (SVG for Puppeteer, PNG for DOMPDF).
		$marketPercentile = (int) ( $result['market_position']['percentile'] ?? 50 );
		$marketLabel      = $result['market_position']['label'] ?? '';
		$gaugeChart       = new SimpleGaugeChart();
		$gaugeSvg         = $gaugeChart->render( $marketPercentile, $marketLabel, [ 'size' => 200 ] );
		$gaugePng         = $gaugeChart->renderPng( $marketPercentile, $marketLabel, [ 'size' => 200 ] );

		// Build factors array from result.factors object.
		$factors = $this->buildFactorsArray( $result, $inputs );

		// Get city name from inputs or result.
		$cityName = $inputs['city_name'] ?? $cityData['name'] ?? $location->name ?? '';

		// Extract address coordinates for static map.
		$addressLat = isset( $inputs['address_lat'] ) ? (float) $inputs['address_lat'] : null;
		$addressLng = isset( $inputs['address_lng'] ) ? (float) $inputs['address_lng'] : null;

		// Fall back to location coordinates if no address coordinates.
		if ( $addressLat === null && $location !== null && isset( $location->latitude ) ) {
			$addressLat = (float) $location->latitude;
			$addressLng = isset( $location->longitude ) ? (float) $location->longitude : null;
		}

		// Get logo URL and convert to base64 for DOMPDF reliability.
		$logoUrl      = (string) get_option( 'resa_branding_logo_url', '' );
		$logoDataUri  = $this->convertImageToDataUri( $logoUrl );

		// Static map via GD disabled — Puppeteer renders Leaflet maps natively.
		// Coordinates are passed to the template for Leaflet initialization.

		return [
			'lead_name'         => $leadName,
			'lead_salutation'   => $lead->salutation ?? '',
			'property_type'     => $this->translatePropertyType( $inputs['property_type'] ?? $inputs['propertyType'] ?? '' ),
			'property_address'  => $inputs['address'] ?? $inputs['address_display'] ?? $cityName,
			'address_lat'       => $addressLat,
			'address_lng'       => $addressLng,
			'living_area'       => (float) ( $inputs['size'] ?? $inputs['livingArea'] ?? 0 ),
			'rooms'             => (float) ( $inputs['rooms'] ?? 0 ),
			'construction_year' => (int) ( $inputs['year_built'] ?? $inputs['constructionYear'] ?? 0 ),
			'condition'         => $this->translateCondition( $inputs['condition'] ?? '' ),
			'equipment'              => $this->formatEquipment( $inputs['features'] ?? $inputs['equipment'] ?? [] ),
			'additional_equipment'   => (string) ( $inputs['additional_features'] ?? '' ),
			'estimated_rent'    => $estimatedRent,
			'rent_min'          => $rentMin,
			'rent_max'          => $rentMax,
			'price_per_sqm'     => $pricePerSqm,
			'city_average'      => $cityAverage,
			'county_average'    => $countyAverage,
			'market_position'   => $result['market_position']['label'] ?? $this->determineMarketPosition( $pricePerSqm, $cityAverage ),
			'factors'           => $factors,
			'location_name'     => $cityName ?: __( 'Nicht zugewiesen', 'resa' ),
			// Legacy single-agent fields (backwards compat for existing templates).
			'agent_name'        => $agent['name'],
			'agent_email'       => $agent['email'],
			'agent_phone'       => $agent['phone'],
			'agent_company'     => $agent['company'],
			// Location ID for multi-agent injection in PdfGenerator::renderTemplate().
			'location_id'       => (int) ( $lead->location_id ?? 0 ),
			'logo_url'          => $logoDataUri ?: $logoUrl,
			'primary_color'     => (string) get_option( 'resa_branding_primary_color', '#3b82f6' ),
			// Dual-rendering: SVG for Puppeteer, PNG data URI for DOMPDF.
			'bar_chart_svg'     => $barChartSvg,
			'bar_chart_png'     => $barChartPng,
			'gauge_svg'         => $gaugeSvg,
			'gauge_png'         => $gaugePng,
			'market_percentile' => $marketPercentile,
		];
	}

	/**
	 * Build comparison bar chart (SVG or PNG).
	 *
	 * @param float $propertyValue  Property price per sqm.
	 * @param float $cityAverage    City average.
	 * @param float $countyAverage  County average.
	 * @param bool  $asPng          True for GD-PNG (DOMPDF), false for SVG (Puppeteer).
	 * @return string SVG markup or base64 PNG data URI.
	 */
	private function buildComparisonChart( float $propertyValue, float $cityAverage, float $countyAverage, bool $asPng = false ): string {
		if ( $propertyValue <= 0 && $cityAverage <= 0 && $countyAverage <= 0 ) {
			return '';
		}

		$chart = new SimpleBarChart();

		$bars = [];

		if ( $propertyValue > 0 ) {
			$bars[] = [
				'label' => __( 'Ihr Objekt', 'resa' ),
				'value' => $propertyValue,
				'color' => '#3b82f6',
			];
		}

		if ( $cityAverage > 0 ) {
			$bars[] = [
				'label' => __( 'Stadt', 'resa' ),
				'value' => $cityAverage,
				'color' => '#94a3b8',
			];
		}

		if ( $countyAverage > 0 ) {
			$bars[] = [
				'label' => __( 'Landkreis', 'resa' ),
				'value' => $countyAverage,
				'color' => '#cbd5e1',
			];
		}

		if ( count( $bars ) < 2 ) {
			return '';
		}

		$config = [
			'width'  => 480,
			'height' => 200,
			'unit'   => '€/m²',
		];

		return $asPng ? $chart->renderPng( $bars, $config ) : $chart->render( $bars, $config );
	}

	/**
	 * Build factors array from result and inputs.
	 *
	 * @param array<string,mixed> $result Result data.
	 * @param array<string,mixed> $inputs Input data.
	 * @return array<int,array{label:string,value:string,impact:float}>
	 */
	private function buildFactorsArray( array $result, array $inputs ): array {
		$factors      = [];
		$resultFactor = $result['factors'] ?? [];

		// Map result factors (multipliers) to display format.
		$factorMapping = [
			'location_impact'  => [
				'label' => __( 'Lage', 'resa' ),
				'value' => $this->translateLocationRating( $inputs['location_rating'] ?? 0 ),
			],
			'condition_impact' => [
				'label' => __( 'Zustand', 'resa' ),
				'value' => $this->translateCondition( $inputs['condition'] ?? '' ),
			],
			'age_impact'       => [
				'label' => __( 'Baujahr', 'resa' ),
				'value' => (string) ( $inputs['year_built'] ?? '' ),
			],
			'feature_premium'  => [
				'label' => __( 'Ausstattung', 'resa' ),
				'value' => $this->formatEquipment( $inputs['features'] ?? [] ),
			],
			'size_factor'      => [
				'label' => __( 'Wohnfläche', 'resa' ),
				'value' => ( $inputs['size'] ?? 0 ) . ' m²',
			],
		];

		foreach ( $factorMapping as $key => $config ) {
			if ( isset( $resultFactor[ $key ] ) && is_numeric( $resultFactor[ $key ] ) ) {
				// Convert multiplier to percentage impact (1.1 = +10%, 0.9 = -10%).
				$multiplier = (float) $resultFactor[ $key ];
				$impact     = ( $multiplier - 1.0 ) * 100;

				$factors[] = [
					'label'  => $config['label'],
					'value'  => $config['value'],
					'impact' => round( $impact, 1 ),
				];
			}
		}

		return $factors;
	}

	/**
	 * Translate a generic value (condition, equipment, etc.).
	 *
	 * Handles both string values and arrays (e.g., features array).
	 *
	 * @param string|array<string>|mixed $value Raw value.
	 * @return string Translated value.
	 */
	private function translateValue( mixed $value ): string {
		// Handle array of values (e.g., features).
		if ( is_array( $value ) ) {
			$translated = array_map( [ $this, 'translateFeature' ], $value );
			return implode( ', ', array_filter( $translated ) );
		}

		// Handle non-string values.
		if ( ! is_string( $value ) ) {
			return '';
		}

		$translations = [
			'new'       => __( 'Neu', 'resa' ),
			'good'      => __( 'Gut', 'resa' ),
			'moderate'  => __( 'Mittel', 'resa' ),
			'poor'      => __( 'Renovierungsbedürftig', 'resa' ),
			'basic'     => __( 'Einfach', 'resa' ),
			'standard'  => __( 'Standard', 'resa' ),
			'premium'   => __( 'Gehoben', 'resa' ),
			'luxury'    => __( 'Luxus', 'resa' ),
			'excellent' => __( 'Sehr gut', 'resa' ),
		];

		return $translations[ strtolower( $value ) ] ?? $value;
	}

	/**
	 * Translate property type.
	 *
	 * @param string $type Raw type.
	 * @return string Translated type.
	 */
	private function translatePropertyType( string $type ): string {
		$types = [
			'apartment'   => __( 'Wohnung', 'resa' ),
			'house'       => __( 'Haus', 'resa' ),
			'villa'       => __( 'Villa', 'resa' ),
			'penthouse'   => __( 'Penthouse', 'resa' ),
			'maisonette'  => __( 'Maisonette', 'resa' ),
			'studio'      => __( 'Studio', 'resa' ),
			'loft'        => __( 'Loft', 'resa' ),
			'terraced'    => __( 'Reihenhaus', 'resa' ),
			'semi'        => __( 'Doppelhaushälfte', 'resa' ),
			'detached'    => __( 'Einfamilienhaus', 'resa' ),
			'bungalow'    => __( 'Bungalow', 'resa' ),
			'farmhouse'   => __( 'Bauernhaus', 'resa' ),
			'new_build'   => __( 'Neubau', 'resa' ),
			'old_build'   => __( 'Altbau', 'resa' ),
		];

		return $types[ strtolower( $type ) ] ?? ucfirst( $type );
	}

	/**
	 * Translate location rating (1-5) to label.
	 *
	 * @param int|string $rating Rating value.
	 * @return string Translated label.
	 */
	private function translateLocationRating( int|string $rating ): string {
		$ratings = [
			1 => __( 'Einfache Lage', 'resa' ),
			2 => __( 'Durchschnittliche Lage', 'resa' ),
			3 => __( 'Gute Lage', 'resa' ),
			4 => __( 'Sehr gute Lage', 'resa' ),
			5 => __( 'Top-Lage', 'resa' ),
		];

		return $ratings[ (int) $rating ] ?? __( 'Unbekannt', 'resa' );
	}

	/**
	 * Translate condition.
	 *
	 * @param string $condition Raw condition.
	 * @return string Translated condition.
	 */
	private function translateCondition( string $condition ): string {
		$conditions = [
			'new'              => __( 'Neubau / Kernsaniert', 'resa' ),
			'like_new'         => __( 'Neuwertig', 'resa' ),
			'renovated'        => __( 'Kürzlich renoviert', 'resa' ),
			'well_maintained'  => __( 'Gepflegt', 'resa' ),
			'good'             => __( 'Guter Zustand', 'resa' ),
			'moderate'         => __( 'Mittel', 'resa' ),
			'needs_work'       => __( 'Renovierungsbedürftig', 'resa' ),
			'needs_renovation' => __( 'Renovierungsbedürftig', 'resa' ),
		];

		return $conditions[ strtolower( $condition ) ] ?? ucfirst( $condition );
	}

	/**
	 * Format equipment/features for display.
	 *
	 * Handles both single string values and arrays of feature keys.
	 *
	 * @param string|array<string>|mixed $equipment Raw equipment value(s).
	 * @return string Formatted equipment string.
	 */
	private function formatEquipment( mixed $equipment ): string {
		if ( empty( $equipment ) ) {
			return '';
		}

		// Handle array of features.
		if ( is_array( $equipment ) ) {
			$translated = array_map( [ $this, 'translateFeature' ], $equipment );
			return implode( ', ', array_filter( $translated ) );
		}

		// Handle single string value.
		if ( is_string( $equipment ) ) {
			return $this->translateFeature( $equipment );
		}

		return '';
	}

	/**
	 * Translate a single feature/equipment key.
	 *
	 * @param string $feature Feature key.
	 * @return string Translated feature.
	 */
	private function translateFeature( string $feature ): string {
		$features = [
			// Equipment levels.
			'basic'          => __( 'Einfach', 'resa' ),
			'standard'       => __( 'Standard', 'resa' ),
			'premium'        => __( 'Gehoben', 'resa' ),
			'luxury'         => __( 'Luxus', 'resa' ),
			// Common features.
			'balcony'        => __( 'Balkon', 'resa' ),
			'terrace'        => __( 'Terrasse', 'resa' ),
			'garden'         => __( 'Garten', 'resa' ),
			'parking'        => __( 'Stellplatz', 'resa' ),
			'garage'         => __( 'Garage', 'resa' ),
			'elevator'       => __( 'Aufzug', 'resa' ),
			'cellar'         => __( 'Keller', 'resa' ),
			'fitted_kitchen' => __( 'Einbauküche', 'resa' ),
			'floor_heating'  => __( 'Fußbodenheizung', 'resa' ),
			'air_condition'  => __( 'Klimaanlage', 'resa' ),
			'fireplace'      => __( 'Kamin', 'resa' ),
			'sauna'          => __( 'Sauna', 'resa' ),
			'pool'           => __( 'Pool', 'resa' ),
			'solar'          => __( 'Solaranlage', 'resa' ),
			'barrier_free'   => __( 'Barrierefrei', 'resa' ),
			'furnished'      => __( 'Möbliert', 'resa' ),
			'guest_wc'       => __( 'Gäste-WC', 'resa' ),
			'guest_toilet'   => __( 'Gäste-WC', 'resa' ),
		];

		return $features[ strtolower( $feature ) ] ?? ucfirst( str_replace( '_', ' ', $feature ) );
	}

	/**
	 * Determine market position based on price comparison.
	 *
	 * @param float $propertyValue Property price per sqm.
	 * @param float $cityAverage   City average.
	 * @return string Market position label.
	 */
	private function determineMarketPosition( float $propertyValue, float $cityAverage ): string {
		if ( $propertyValue <= 0 || $cityAverage <= 0 ) {
			return '';
		}

		$ratio = $propertyValue / $cityAverage;

		if ( $ratio > 1.1 ) {
			return __( 'Über Durchschnitt', 'resa' );
		}

		if ( $ratio < 0.9 ) {
			return __( 'Unter Durchschnitt', 'resa' );
		}

		return __( 'Im Durchschnitt', 'resa' );
	}

	/**
	 * Get agent data from location.
	 *
	 * @param object|null $location Location row.
	 * @return array{name:string,email:string,phone:string,company:string}
	 */
	private function getAgentData( ?object $location ): array {
		$default = [
			'name'    => '',
			'email'   => '',
			'phone'   => '',
			'company' => '',
		];

		if ( $location === null || empty( $location->agent_id ) ) {
			// Try fallback from settings.
			$fallbackName  = get_option( 'resa_agent_fallback_name', '' );
			$fallbackEmail = get_option( 'resa_agent_fallback_email', '' );
			$fallbackPhone = get_option( 'resa_agent_fallback_phone', '' );

			if ( is_string( $fallbackName ) && $fallbackName !== '' ) {
				return [
					'name'    => $fallbackName,
					'email'   => is_string( $fallbackEmail ) ? $fallbackEmail : '',
					'phone'   => is_string( $fallbackPhone ) ? $fallbackPhone : '',
					'company' => (string) get_option( 'resa_agent_fallback_company', '' ),
				];
			}

			return $default;
		}

		$user = get_user_by( 'ID', (int) $location->agent_id );
		if ( ! $user instanceof \WP_User ) {
			return $default;
		}

		return [
			'name'    => $user->display_name ?: ( $user->first_name . ' ' . $user->last_name ),
			'email'   => $user->user_email,
			'phone'   => get_user_meta( $user->ID, 'phone', true ) ?: '',
			'company' => get_user_meta( $user->ID, 'company', true ) ?: '',
		];
	}

	/**
	 * Send email to lead with PDF attachment.
	 *
	 * @param object      $lead     Lead row.
	 * @param object|null $location Location row.
	 * @param string      $pdfPath  Path to PDF file.
	 * @return bool True on success.
	 */
	private function sendEmail( object $lead, ?object $location, string $pdfPath ): bool {
		$emailData = $this->buildEmailData( $lead, $location );
		$subject   = $this->buildEmailSubject( $lead );
		$html      = $this->buildEmailContent( $emailData );

		return $this->emailService->send(
			(int) $lead->id,
			self::TEMPLATE_ID,
			$lead->email,
			$subject,
			$html,
			[
				'attachments' => [ $pdfPath ],
			]
		);
	}

	/**
	 * Build email template data.
	 *
	 * @param object      $lead     Lead row.
	 * @param object|null $location Location row.
	 * @return array<string,string>
	 */
	private function buildEmailData( object $lead, ?object $location ): array {
		$leadName = trim( ( $lead->first_name ?? '' ) . ' ' . ( $lead->last_name ?? '' ) );
		$agent    = $this->getAgentData( $location );

		return [
			'lead_name'       => esc_html( $leadName ?: __( 'Interessent', 'resa' ) ),
			'lead_salutation' => esc_html( $lead->salutation ?? '' ),
			'asset_type'      => esc_html( $this->getAssetTypeLabel( $lead->asset_type ?? '' ) ),
			'result_summary'  => $this->buildResultSummary( $lead ),
			'agent_name'      => esc_html( $agent['name'] ),
			'agent_email'     => esc_html( $agent['email'] ),
			'agent_phone'     => esc_html( $agent['phone'] ),
			'agent_company'   => esc_html( $agent['company'] ),
			'location_name'   => esc_html( $location->name ?? __( 'Nicht zugewiesen', 'resa' ) ),
			'site_name'       => esc_html( (string) get_bloginfo( 'name' ) ),
		];
	}

	/**
	 * Build email subject line.
	 *
	 * @param object $lead Lead row.
	 * @return string Subject.
	 */
	private function buildEmailSubject( object $lead ): string {
		$assetLabel = $this->getAssetTypeLabel( $lead->asset_type ?? '' );

		/* translators: %s: Asset type (e.g. "Mietpreis-Analyse") */
		return sprintf( __( 'Ihre %s ist fertig', 'resa' ), $assetLabel );
	}

	/**
	 * Get a human-readable label for the asset type.
	 *
	 * @param string $assetType Asset type slug.
	 * @return string Translated label.
	 */
	private function getAssetTypeLabel( string $assetType ): string {
		$labels = [
			'rent-calculator'   => __( 'Mietpreis-Analyse', 'resa' ),
			'value-calculator'  => __( 'Immobilienwert-Analyse', 'resa' ),
			'purchase-costs'    => __( 'Kaufnebenkosten-Berechnung', 'resa' ),
			'budget-calculator' => __( 'Budget-Analyse', 'resa' ),
			'roi-calculator'    => __( 'Rendite-Analyse', 'resa' ),
			'energy-check'      => __( 'Energieeffizienz-Check', 'resa' ),
		];

		return $labels[ $assetType ] ?? __( 'Analyse', 'resa' );
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
			return esc_html__( 'Ihre detaillierte Analyse finden Sie im PDF.', 'resa' );
		}

		$lines = [];

		// Primary result fields for rent calculator.
		if ( isset( $result['estimatedRent'] ) || isset( $result['monthlyRent'] ) ) {
			$rent = $result['estimatedRent'] ?? $result['monthlyRent'] ?? 0;
			/* translators: %s: Monthly rent amount */
			$lines[] = sprintf(
				esc_html__( 'Geschätzte Miete: %s/Monat', 'resa' ),
				esc_html( number_format( (float) $rent, 2, ',', '.' ) . ' €' )
			);
		}

		if ( isset( $result['pricePerSqm'] ) || isset( $result['rentPerSqm'] ) ) {
			$sqm = $result['pricePerSqm'] ?? $result['rentPerSqm'] ?? 0;
			/* translators: %s: Price per square meter */
			$lines[] = sprintf(
				esc_html__( 'Preis pro m²: %s', 'resa' ),
				esc_html( number_format( (float) $sqm, 2, ',', '.' ) . ' €' )
			);
		}

		if ( empty( $lines ) ) {
			return esc_html__( 'Ihre detaillierte Analyse finden Sie im PDF.', 'resa' );
		}

		return implode( '<br>', $lines );
	}

	/**
	 * Build email HTML content.
	 *
	 * @param array<string,string> $vars Template variables.
	 * @return string Rendered HTML.
	 */
	private function buildEmailContent( array $vars ): string {
		$templatePath = __DIR__ . '/../Email/Templates/lead-result.php';

		if ( ! file_exists( $templatePath ) ) {
			return $this->buildFallbackHtml( $vars );
		}

		ob_start();
		// phpcs:ignore WordPress.PHP.DontExtract.extract_extract -- Template rendering requires extract.
		extract( $vars, EXTR_SKIP );
		include $templatePath;
		$html = ob_get_clean();

		return $html ?: $this->buildFallbackHtml( $vars );
	}

	/**
	 * Build fallback HTML if template is missing.
	 *
	 * @param array<string,string> $vars Template variables.
	 * @return string Simple HTML email.
	 */
	private function buildFallbackHtml( array $vars ): string {
		$html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>';
		$html .= '<h1>' . esc_html__( 'Ihre Analyse ist fertig', 'resa' ) . '</h1>';
		$html .= '<p>' . sprintf(
			/* translators: %s: Lead name */
			esc_html__( 'Guten Tag %s,', 'resa' ),
			$vars['lead_name']
		) . '</p>';
		$html .= '<p>' . esc_html__( 'vielen Dank für Ihr Interesse. Die vollständige Analyse finden Sie im PDF-Anhang dieser E-Mail.', 'resa' ) . '</p>';
		$html .= '<p><strong>' . esc_html__( 'Zusammenfassung:', 'resa' ) . '</strong><br>' . $vars['result_summary'] . '</p>';

		if ( ! empty( $vars['agent_name'] ) ) {
			$html .= '<p><strong>' . esc_html__( 'Ihr Ansprechpartner:', 'resa' ) . '</strong><br>';
			$html .= $vars['agent_name'];
			if ( ! empty( $vars['agent_phone'] ) ) {
				$html .= '<br>' . $vars['agent_phone'];
			}
			if ( ! empty( $vars['agent_email'] ) ) {
				$html .= '<br>' . $vars['agent_email'];
			}
			$html .= '</p>';
		}

		$html .= '</body></html>';

		return $html;
	}

	/**
	 * Clean up temporary PDF file.
	 *
	 * @param string $pdfPath Path to PDF file.
	 */
	private function cleanupPdf( string $pdfPath ): void {
		if ( file_exists( $pdfPath ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
			unlink( $pdfPath );
		}
	}

	/**
	 * Generate static map image as base64 data URI.
	 *
	 * Fetches OSM tiles directly and composites them with PHP GD.
	 * This is more reliable than external static map services.
	 *
	 * @param float $lat Latitude.
	 * @param float $lng Longitude.
	 * @return string Base64 data URI of the map image.
	 */
	private function generateStaticMap( float $lat, float $lng ): string {
		// Check if GD is available.
		if ( ! extension_loaded( 'gd' ) ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( 'RESA: GD extension not loaded, cannot generate map' );
			return '';
		}

		$zoom   = 15;
		$width  = 500;
		$height = 200;

		// Convert lat/lng to tile coordinates.
		$tileSize   = 256;
		$centerX    = $this->lngToTileX( $lng, $zoom );
		$centerY    = $this->latToTileY( $lat, $zoom );

		// Calculate how many tiles we need.
		$tilesX = (int) ceil( $width / $tileSize ) + 1;
		$tilesY = (int) ceil( $height / $tileSize ) + 1;

		// Create the output image.
		$image = imagecreatetruecolor( $width, $height );
		if ( $image === false ) {
			return '';
		}

		// Fill with light gray background as fallback.
		$bgColor = imagecolorallocate( $image, 240, 240, 240 );
		imagefill( $image, 0, 0, $bgColor );

		// Calculate the offset for centering.
		$offsetX = (int) ( ( $centerX - floor( $centerX ) ) * $tileSize );
		$offsetY = (int) ( ( $centerY - floor( $centerY ) ) * $tileSize );

		// Starting tile.
		$startTileX = (int) floor( $centerX ) - (int) floor( $tilesX / 2 );
		$startTileY = (int) floor( $centerY ) - (int) floor( $tilesY / 2 );

		// Starting position on canvas.
		$startPosX = (int) ( $width / 2 ) - $offsetX - (int) floor( $tilesX / 2 ) * $tileSize;
		$startPosY = (int) ( $height / 2 ) - $offsetY - (int) floor( $tilesY / 2 ) * $tileSize;

		// Fetch and draw tiles.
		for ( $y = 0; $y < $tilesY; $y++ ) {
			for ( $x = 0; $x < $tilesX; $x++ ) {
				$tileX = $startTileX + $x;
				$tileY = $startTileY + $y;

				// Wrap tile X coordinate.
				$maxTile = pow( 2, $zoom );
				$tileX   = ( $tileX % $maxTile + $maxTile ) % $maxTile;

				// Skip invalid Y coordinates.
				if ( $tileY < 0 || $tileY >= $maxTile ) {
					continue;
				}

				$tileUrl = sprintf(
					'https://tile.openstreetmap.org/%d/%d/%d.png',
					$zoom,
					$tileX,
					$tileY
				);

				$tileData = $this->fetchTile( $tileUrl );
				if ( $tileData !== '' ) {
					$tile = @imagecreatefromstring( $tileData );
					if ( $tile !== false ) {
						$destX = $startPosX + ( $x * $tileSize );
						$destY = $startPosY + ( $y * $tileSize );
						imagecopy( $image, $tile, $destX, $destY, 0, 0, $tileSize, $tileSize );
						imagedestroy( $tile );
					}
				}
			}
		}

		// Draw a marker at the center.
		$this->drawMarker( $image, (int) ( $width / 2 ), (int) ( $height / 2 ) );

		// Convert to PNG data URI.
		ob_start();
		imagepng( $image, null, 6 );
		$pngData = ob_get_clean();
		imagedestroy( $image );

		if ( empty( $pngData ) ) {
			return '';
		}

		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		return 'data:image/png;base64,' . base64_encode( $pngData );
	}

	/**
	 * Convert longitude to tile X coordinate.
	 *
	 * @param float $lng  Longitude.
	 * @param int   $zoom Zoom level.
	 * @return float Tile X coordinate.
	 */
	private function lngToTileX( float $lng, int $zoom ): float {
		return ( ( $lng + 180 ) / 360 ) * pow( 2, $zoom );
	}

	/**
	 * Convert latitude to tile Y coordinate.
	 *
	 * @param float $lat  Latitude.
	 * @param int   $zoom Zoom level.
	 * @return float Tile Y coordinate.
	 */
	private function latToTileY( float $lat, int $zoom ): float {
		$latRad = deg2rad( $lat );
		return ( 1 - log( tan( $latRad ) + 1 / cos( $latRad ) ) / M_PI ) / 2 * pow( 2, $zoom );
	}

	/**
	 * Fetch a single tile image.
	 *
	 * @param string $url Tile URL.
	 * @return string Binary PNG data, or empty string on failure.
	 */
	private function fetchTile( string $url ): string {
		$response = wp_remote_get(
			$url,
			[
				'timeout'    => 5,
				'sslverify'  => false,
				'user-agent' => 'RESA-WP-Plugin/1.0 (PDF Map Generator)',
			]
		);

		if ( is_wp_error( $response ) ) {
			return '';
		}

		$statusCode = wp_remote_retrieve_response_code( $response );
		if ( $statusCode !== 200 ) {
			return '';
		}

		return wp_remote_retrieve_body( $response );
	}

	/**
	 * Draw a location marker on the image.
	 *
	 * @param resource|\GdImage $image Image resource.
	 * @param int               $x     X coordinate.
	 * @param int               $y     Y coordinate.
	 */
	private function drawMarker( $image, int $x, int $y ): void {
		// Marker colors.
		$red    = imagecolorallocate( $image, 220, 38, 38 );
		$white  = imagecolorallocate( $image, 255, 255, 255 );
		$shadow = imagecolorallocate( $image, 0, 0, 0 );

		// Draw shadow (offset ellipse).
		imagefilledellipse( $image, $x + 1, $y + 1, 18, 18, $shadow );

		// Draw outer circle (red).
		imagefilledellipse( $image, $x, $y, 16, 16, $red );

		// Draw inner circle (white).
		imagefilledellipse( $image, $x, $y, 8, 8, $white );
	}

	/**
	 * Legacy method for backwards compatibility.
	 *
	 * @param float $lat Latitude.
	 * @param float $lng Longitude.
	 * @return string Static map image URL (external service).
	 * @deprecated Use generateStaticMap() instead.
	 */
	private function getStaticMapUrl( float $lat, float $lng ): string {
		// OpenStreetMap Static Maps API.
		// Format: center lat,lng; zoom; size; marker position.
		return sprintf(
			'https://staticmap.openstreetmap.de/staticmap.php?center=%f,%f&zoom=15&size=500x200&markers=%f,%f,red-pushpin',
			$lat,
			$lng,
			$lat,
			$lng
		);
	}

	/**
	 * Convert an image URL to a base64 data URI for DOMPDF reliability.
	 *
	 * DOMPDF has issues with remote URLs (timeouts, SSL, redirects).
	 * Converting to base64 data URIs ensures reliable image embedding.
	 *
	 * @param string $url Image URL (can be local path, WordPress upload URL, or external).
	 * @return string Base64 data URI, or empty string on failure.
	 */
	private function convertImageToDataUri( string $url ): string {
		if ( empty( $url ) ) {
			return '';
		}

		// Try to convert WordPress upload URL to local path for faster access.
		$localPath = $this->urlToLocalPath( $url );

		if ( $localPath !== null && file_exists( $localPath ) ) {
			// Read from local filesystem (faster, more reliable).
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			$imageData = file_get_contents( $localPath );
			$mimeType  = $this->getMimeType( $localPath );
		} else {
			// Fetch from URL with timeout.
			$response = wp_remote_get(
				$url,
				[
					'timeout'   => 10,
					'sslverify' => false, // Some hosts have SSL issues.
				]
			);

			if ( is_wp_error( $response ) ) {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log( 'RESA: Failed to fetch image for PDF: ' . $url . ' - ' . $response->get_error_message() );
				return '';
			}

			$statusCode = wp_remote_retrieve_response_code( $response );
			if ( $statusCode !== 200 ) {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log( 'RESA: Image fetch returned HTTP ' . $statusCode . ' for: ' . $url );
				return '';
			}

			$imageData = wp_remote_retrieve_body( $response );
			$mimeType  = wp_remote_retrieve_header( $response, 'content-type' );

			// Clean up mime type (remove charset, etc.).
			if ( strpos( $mimeType, ';' ) !== false ) {
				$mimeType = trim( explode( ';', $mimeType )[0] );
			}
		}

		if ( empty( $imageData ) ) {
			return '';
		}

		// Validate mime type.
		$allowedMimes = [ 'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml' ];
		if ( ! in_array( $mimeType, $allowedMimes, true ) ) {
			// Try to detect from image data.
			$mimeType = $this->detectMimeType( $imageData );
			if ( ! in_array( $mimeType, $allowedMimes, true ) ) {
				return '';
			}
		}

		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		return 'data:' . $mimeType . ';base64,' . base64_encode( $imageData );
	}

	/**
	 * Convert WordPress upload URL to local filesystem path.
	 *
	 * @param string $url URL to convert.
	 * @return string|null Local path, or null if not a local upload.
	 */
	private function urlToLocalPath( string $url ): ?string {
		$uploadDir = wp_upload_dir();
		$baseUrl   = $uploadDir['baseurl'];
		$basePath  = $uploadDir['basedir'];

		// Check if URL is within uploads directory.
		if ( strpos( $url, $baseUrl ) === 0 ) {
			$relativePath = substr( $url, strlen( $baseUrl ) );
			return $basePath . $relativePath;
		}

		// Check if it's already a local path.
		if ( strpos( $url, ABSPATH ) === 0 && file_exists( $url ) ) {
			return $url;
		}

		return null;
	}

	/**
	 * Get MIME type from file extension.
	 *
	 * @param string $path File path.
	 * @return string MIME type.
	 */
	private function getMimeType( string $path ): string {
		$extension = strtolower( pathinfo( $path, PATHINFO_EXTENSION ) );

		$mimeTypes = [
			'png'  => 'image/png',
			'jpg'  => 'image/jpeg',
			'jpeg' => 'image/jpeg',
			'gif'  => 'image/gif',
			'webp' => 'image/webp',
			'svg'  => 'image/svg+xml',
		];

		return $mimeTypes[ $extension ] ?? 'image/png';
	}

	/**
	 * Detect MIME type from image binary data.
	 *
	 * @param string $data Binary image data.
	 * @return string Detected MIME type.
	 */
	private function detectMimeType( string $data ): string {
		// Check magic bytes.
		$signatures = [
			"\x89PNG"       => 'image/png',
			"\xFF\xD8\xFF" => 'image/jpeg',
			'GIF87a'        => 'image/gif',
			'GIF89a'        => 'image/gif',
			'RIFF'          => 'image/webp', // WebP starts with RIFF.
			'<svg'          => 'image/svg+xml',
			'<?xml'         => 'image/svg+xml', // SVG with XML declaration.
		];

		foreach ( $signatures as $signature => $mime ) {
			if ( strpos( $data, $signature ) === 0 ) {
				return $mime;
			}
		}

		return 'application/octet-stream';
	}
}
