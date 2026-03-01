<?php

declare( strict_types=1 );

namespace Resa\Services\Geocoding;

/**
 * Data transfer object for geocoding results.
 *
 * Represents a single location match from a geocoding search.
 */
final class GeocodingResult {

	/**
	 * @param float       $latitude     Latitude coordinate.
	 * @param float       $longitude    Longitude coordinate.
	 * @param string      $displayName  Full formatted address.
	 * @param string|null $city         City/town name.
	 * @param string|null $state        State/region name.
	 * @param string|null $country      Country name.
	 * @param string|null $countryCode  ISO country code (e.g. "de", "at", "ch").
	 * @param string|null $postalCode   Postal/ZIP code.
	 */
	public function __construct(
		public readonly float $latitude,
		public readonly float $longitude,
		public readonly string $displayName,
		public readonly ?string $city = null,
		public readonly ?string $state = null,
		public readonly ?string $country = null,
		public readonly ?string $countryCode = null,
		public readonly ?string $postalCode = null
	) {}

	/**
	 * Convert to array for API responses.
	 *
	 * @return array<string,mixed>
	 */
	public function toArray(): array {
		return [
			'lat'          => $this->latitude,
			'lng'          => $this->longitude,
			'display_name' => $this->displayName,
			'city'         => $this->city,
			'state'        => $this->state,
			'country'      => $this->country,
			'country_code' => $this->countryCode,
			'postal_code'  => $this->postalCode,
		];
	}
}
