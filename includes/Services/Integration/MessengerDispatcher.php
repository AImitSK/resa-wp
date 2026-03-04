<?php

declare( strict_types=1 );

namespace Resa\Services\Integration;

use Resa\Models\Lead;
use Resa\Models\Location;
use Resa\Models\Messenger;

/**
 * Dispatches lead notifications to messenger platforms.
 *
 * Builds platform-specific payloads (Slack Block Kit, Teams Adaptive Card,
 * Discord Embed) and sends them to all active messenger webhook URLs.
 */
final class MessengerDispatcher {

	/**
	 * Hook callback for resa_lead_created action.
	 *
	 * Builds the lead data and dispatches to all active messengers.
	 *
	 * @param int $leadId The completed lead ID.
	 */
	public function onLeadCreated( int $leadId ): void {
		$lead = Lead::findById( $leadId );
		if ( ! $lead ) {
			return;
		}

		$locationName = '';
		$bundesland   = '';

		if ( ! empty( $lead->location_id ) ) {
			$loc = Location::findById( (int) $lead->location_id );
			if ( $loc ) {
				$locationName = $loc->name;
				$bundesland   = $loc->bundesland ?? '';
			}
		}

		$result    = json_decode( $lead->result ?? 'null', true );
		$leadName  = trim( ( $lead->first_name ?? '' ) . ' ' . ( $lead->last_name ?? '' ) );
		$assetName = $lead->asset_type ?? '';

		$leadData = [
			'name'       => $leadName,
			'email'      => $lead->email ?? '',
			'phone'      => $lead->phone ?? '',
			'asset_type' => $assetName,
			'location'   => $locationName,
			'bundesland' => $bundesland,
			'result'     => $result,
			'timestamp'  => gmdate( 'c' ),
		];

		$this->dispatch( $leadData );
	}

	/**
	 * Send lead notification to all active messengers.
	 *
	 * @param array<string,mixed> $leadData Lead information.
	 */
	public function dispatch( array $leadData ): void {
		$messengers = Messenger::getActive();

		foreach ( $messengers as $messenger ) {
			$this->send( $messenger, $leadData );
		}
	}

	/**
	 * Send a test notification to a single messenger.
	 *
	 * @param object $messenger Messenger row from DB.
	 * @return array{success: bool, statusCode?: int, error?: string}
	 */
	public function sendTest( object $messenger ): array {
		$leadData = [
			'name'       => 'Max Mustermann',
			'email'      => 'test@example.com',
			'phone'      => '+49 170 1234567',
			'asset_type' => 'Mietpreis-Kalkulator',
			'location'   => 'München',
			'bundesland' => 'Bayern',
			'result'     => [
				'rent_per_sqm' => 18.50,
				'total_rent'   => 1572.50,
			],
			'timestamp'  => gmdate( 'c' ),
		];

		return $this->send( $messenger, $leadData );
	}

	/**
	 * Send a notification to a single messenger.
	 *
	 * @param object              $messenger Messenger row from DB.
	 * @param array<string,mixed> $leadData  Lead information.
	 * @return array{success: bool, statusCode?: int, error?: string}
	 */
	private function send( object $messenger, array $leadData ): array {
		$body = match ( $messenger->platform ) {
			'slack'   => $this->buildSlackPayload( $leadData ),
			'teams'   => $this->buildTeamsPayload( $leadData ),
			'discord' => $this->buildDiscordPayload( $leadData ),
			default   => null,
		};

		if ( $body === null ) {
			return [
				'success' => false,
				'error'   => 'Unknown platform: ' . $messenger->platform,
			];
		}

		$response = wp_remote_post(
			$messenger->webhook_url,
			[
				'timeout' => 5,
				'body'    => wp_json_encode( $body ),
				'headers' => [
					'Content-Type' => 'application/json',
					'User-Agent'   => 'RESA-Messenger/1.0',
				],
			]
		);

		if ( is_wp_error( $response ) ) {
			return [
				'success' => false,
				'error'   => $response->get_error_message(),
			];
		}

		$statusCode = wp_remote_retrieve_response_code( $response );

		return [
			'success'    => $statusCode >= 200 && $statusCode < 300,
			'statusCode' => $statusCode,
		];
	}

	/**
	 * Format a result value for display.
	 *
	 * @param array<string,mixed>|null $result Lead result data.
	 * @return string Formatted result string.
	 */
	private function formatResult( ?array $result ): string {
		if ( empty( $result ) ) {
			return '–';
		}

		$parts = [];
		foreach ( $result as $key => $value ) {
			if ( is_numeric( $value ) ) {
				$parts[] = str_replace( '_', ' ', ucfirst( $key ) ) . ': ' . number_format( (float) $value, 2, ',', '.' );
			}
		}

		return $parts ? implode( ' | ', $parts ) : '–';
	}

	/**
	 * Build Slack Block Kit payload.
	 *
	 * @param array<string,mixed> $data Lead data.
	 * @return array<string,mixed> Slack payload.
	 */
	private function buildSlackPayload( array $data ): array {
		$title       = 'Neuer Lead: ' . ( $data['asset_type'] ?: 'RESA' );
		$resultText  = $this->formatResult( $data['result'] );
		$locationStr = $data['location'] ?: '–';
		if ( ! empty( $data['bundesland'] ) ) {
			$locationStr .= ', ' . $data['bundesland'];
		}

		$timestamp = wp_date( 'd.m.Y, H:i', strtotime( $data['timestamp'] ) );

		$fields = [
			[ 'type' => 'mrkdwn', 'text' => "*Name:*\n" . ( $data['name'] ?: '–' ) ],
			[ 'type' => 'mrkdwn', 'text' => "*E-Mail:*\n" . ( $data['email'] ?: '–' ) ],
		];

		if ( ! empty( $data['phone'] ) ) {
			$fields[] = [ 'type' => 'mrkdwn', 'text' => "*Telefon:*\n" . $data['phone'] ];
		}

		$fields[] = [ 'type' => 'mrkdwn', 'text' => "*Standort:*\n" . $locationStr ];

		$blocks = [
			[
				'type' => 'header',
				'text' => [ 'type' => 'plain_text', 'text' => $title ],
			],
			[
				'type'   => 'section',
				'fields' => $fields,
			],
		];

		if ( $resultText !== '–' ) {
			$blocks[] = [
				'type' => 'section',
				'text' => [ 'type' => 'mrkdwn', 'text' => "*Ergebnis:* " . $resultText ],
			];
		}

		$blocks[] = [
			'type'     => 'context',
			'elements' => [
				[ 'type' => 'mrkdwn', 'text' => $timestamp . ' · RESA' ],
			],
		];

		return [
			'text'   => $title,
			'blocks' => $blocks,
		];
	}

	/**
	 * Build Microsoft Teams Adaptive Card payload (v1.4).
	 *
	 * @param array<string,mixed> $data Lead data.
	 * @return array<string,mixed> Teams payload.
	 */
	private function buildTeamsPayload( array $data ): array {
		$title       = 'Neuer Lead: ' . ( $data['asset_type'] ?: 'RESA' );
		$resultText  = $this->formatResult( $data['result'] );
		$locationStr = $data['location'] ?: '–';
		if ( ! empty( $data['bundesland'] ) ) {
			$locationStr .= ', ' . $data['bundesland'];
		}

		$timestamp = wp_date( 'd.m.Y, H:i', strtotime( $data['timestamp'] ) );

		$facts = [
			[ 'title' => 'Name:', 'value' => $data['name'] ?: '–' ],
			[ 'title' => 'E-Mail:', 'value' => $data['email'] ?: '–' ],
		];

		if ( ! empty( $data['phone'] ) ) {
			$facts[] = [ 'title' => 'Telefon:', 'value' => $data['phone'] ];
		}

		$facts[] = [ 'title' => 'Standort:', 'value' => $locationStr ];

		if ( $resultText !== '–' ) {
			$facts[] = [ 'title' => 'Ergebnis:', 'value' => $resultText ];
		}

		$body = [
			[
				'type'   => 'TextBlock',
				'size'   => 'Large',
				'weight' => 'Bolder',
				'text'   => $title,
			],
			[
				'type'  => 'FactSet',
				'facts' => $facts,
			],
			[
				'type'     => 'TextBlock',
				'size'     => 'Small',
				'isSubtle' => true,
				'text'     => $timestamp . ' · RESA',
			],
		];

		return [
			'type'        => 'message',
			'attachments' => [
				[
					'contentType' => 'application/vnd.microsoft.card.adaptive',
					'contentUrl'  => null,
					'content'     => [
						'$schema' => 'http://adaptivecards.io/schemas/adaptive-card.json',
						'type'    => 'AdaptiveCard',
						'version' => '1.4',
						'body'    => $body,
					],
				],
			],
		];
	}

	/**
	 * Build Discord Embed payload.
	 *
	 * @param array<string,mixed> $data Lead data.
	 * @return array<string,mixed> Discord payload.
	 */
	private function buildDiscordPayload( array $data ): array {
		$title       = 'Neuer Lead: ' . ( $data['asset_type'] ?: 'RESA' );
		$resultText  = $this->formatResult( $data['result'] );
		$locationStr = $data['location'] ?: '–';
		if ( ! empty( $data['bundesland'] ) ) {
			$locationStr .= ', ' . $data['bundesland'];
		}

		$fields = [
			[ 'name' => 'Name', 'value' => $data['name'] ?: '–', 'inline' => true ],
			[ 'name' => 'E-Mail', 'value' => $data['email'] ?: '–', 'inline' => true ],
		];

		if ( ! empty( $data['phone'] ) ) {
			$fields[] = [ 'name' => 'Telefon', 'value' => $data['phone'], 'inline' => true ];
		}

		$fields[] = [ 'name' => 'Standort', 'value' => $locationStr, 'inline' => true ];

		if ( $resultText !== '–' ) {
			$fields[] = [ 'name' => 'Ergebnis', 'value' => $resultText, 'inline' => false ];
		}

		return [
			'username' => 'RESA',
			'embeds'   => [
				[
					'title'     => $title,
					'color'     => 3447003,
					'fields'    => $fields,
					'footer'    => [ 'text' => 'RESA' ],
					'timestamp' => $data['timestamp'],
				],
			],
		];
	}
}
