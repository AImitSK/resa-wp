<?php

declare( strict_types=1 );

namespace Resa\Services\Integration;

use Resa\Models\Lead;
use Resa\Models\Location;
use Resa\Models\Webhook;

/**
 * Dispatches webhook HTTP requests for lead events.
 *
 * Signs payloads with HMAC-SHA256 and sends them to all active
 * webhooks that subscribe to the triggered event.
 */
final class WebhookDispatcher {

	/**
	 * Dispatch an event to all matching active webhooks.
	 *
	 * @param string              $event   Event name (e.g. 'lead.created').
	 * @param array<string,mixed> $payload Event payload data.
	 */
	public function dispatch( string $event, array $payload ): void {
		$webhooks = Webhook::getActive();

		foreach ( $webhooks as $webhook ) {
			$events = json_decode( $webhook->events ?? '[]', true ) ?: [];

			if ( in_array( $event, $events, true ) ) {
				$this->send( $webhook, $event, $payload );
			}
		}
	}

	/**
	 * Hook callback for resa_lead_created action.
	 *
	 * Builds the lead payload and dispatches to all webhooks.
	 *
	 * @param int $leadId The completed lead ID.
	 */
	public function onLeadCreated( int $leadId ): void {
		$lead = Lead::findById( $leadId );
		if ( ! $lead ) {
			return;
		}

		$location = null;
		if ( ! empty( $lead->location_id ) ) {
			$loc = Location::findById( (int) $lead->location_id );
			if ( $loc ) {
				$location = [
					'id'        => (int) $loc->id,
					'name'      => $loc->name,
					'bundesland' => $loc->bundesland ?? null,
				];
			}
		}

		$meta = json_decode( $lead->meta ?? '{}', true ) ?: [];

		$payload = [
			'event'     => 'lead.created',
			'timestamp' => gmdate( 'c' ),
			'lead'      => [
				'id'           => (int) $lead->id,
				'name'         => trim( ( $lead->first_name ?? '' ) . ' ' . ( $lead->last_name ?? '' ) ),
				'email'        => $lead->email ?? '',
				'phone'        => $lead->phone ?? '',
				'consent'      => (bool) $lead->consent_given,
				'consent_date' => $lead->consent_date,
			],
			'asset'     => [
				'type' => $lead->asset_type ?? '',
				'name' => $lead->asset_type ?? '',
			],
			'location'  => $location,
			'inputs'    => json_decode( $lead->inputs ?? '{}', true ) ?: [],
			'result'    => json_decode( $lead->result ?? 'null', true ),
			'meta'      => [
				'page_url'   => $meta['page_url'] ?? '',
				'utm_source' => $meta['utm_source'] ?? '',
				'utm_medium' => $meta['utm_medium'] ?? '',
			],
		];

		$this->dispatch( 'lead.created', $payload );
	}

	/**
	 * Send a test payload to a single webhook.
	 *
	 * @param object $webhook Webhook row from DB.
	 * @return array{success: bool, statusCode?: int, error?: string}
	 */
	public function sendTest( object $webhook ): array {
		$payload = [
			'event'     => 'lead.created',
			'timestamp' => gmdate( 'c' ),
			'lead'      => [
				'id'           => 0,
				'name'         => 'Max Mustermann',
				'email'        => 'test@example.com',
				'phone'        => '+49 170 1234567',
				'consent'      => true,
				'consent_date' => gmdate( 'Y-m-d H:i:s' ),
			],
			'asset'     => [
				'type' => 'rent-calculator',
				'name' => 'Mietpreis-Kalkulator',
			],
			'location'  => [
				'id'         => 1,
				'name'       => 'München',
				'bundesland' => 'Bayern',
			],
			'inputs'    => [
				'property_type' => 'apartment',
				'rooms'         => 3,
				'area'          => 85,
			],
			'result'    => [
				'rent_per_sqm' => 18.50,
				'total_rent'   => 1572.50,
			],
			'meta'      => [
				'page_url'   => home_url( '/' ),
				'utm_source' => 'test',
				'utm_medium' => 'webhook',
			],
		];

		return $this->send( $webhook, 'lead.created', $payload );
	}

	/**
	 * Send a payload to a single webhook via HTTP POST.
	 *
	 * @param object              $webhook Webhook row from DB.
	 * @param string              $event   Event name.
	 * @param array<string,mixed> $payload Payload data.
	 * @return array{success: bool, statusCode?: int, error?: string}
	 */
	private function send( object $webhook, string $event, array $payload ): array {
		$body      = wp_json_encode( $payload );
		$signature = hash_hmac( 'sha256', $body, $webhook->secret );

		$response = wp_remote_post(
			$webhook->url,
			[
				'timeout' => 5,
				'body'    => $body,
				'headers' => [
					'Content-Type'     => 'application/json',
					'X-Resa-Signature' => $signature,
					'X-Resa-Event'     => $event,
					'User-Agent'       => 'RESA-Webhook/1.0',
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
}
