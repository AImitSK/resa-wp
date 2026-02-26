<?php

declare( strict_types=1 );

namespace Resa\Api;

use Resa\Core\ErrorMessages;

/**
 * Abstract base controller for all RESA REST API endpoints.
 *
 * Provides standardized response formatting, permission checks,
 * and route registration for the /wp-json/resa/v1/ namespace.
 */
abstract class RestController {

	/**
	 * REST API namespace.
	 */
	protected const NAMESPACE = 'resa/v1';

	/**
	 * Register routes on rest_api_init.
	 */
	abstract public function registerRoutes(): void;

	/**
	 * Permission callback: public endpoints (no auth required).
	 *
	 * @return true Always allows access. Nonce verification happens in the callback.
	 */
	public function publicAccess(): bool {
		return true;
	}

	/**
	 * Permission callback: admin-only endpoints.
	 *
	 * Requires logged-in user with manage_options capability.
	 */
	public function adminAccess(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Return a standardized success response.
	 *
	 * @param mixed $data   Response data.
	 * @param int   $status HTTP status code.
	 *
	 * @return \WP_REST_Response
	 */
	protected function success( mixed $data = null, int $status = 200 ): \WP_REST_Response {
		return new \WP_REST_Response( $data, $status );
	}

	/**
	 * Return a standardized error response.
	 *
	 * @param string              $code    Machine-readable error code (e.g. 'resa_not_found').
	 * @param string              $message Human-readable error message.
	 * @param int                 $status  HTTP status code.
	 * @param array<string,mixed> $data    Additional error data.
	 *
	 * @return \WP_Error
	 */
	protected function error( string $code, string $message, int $status = 400, array $data = [] ): \WP_Error {
		return new \WP_Error( $code, $message, array_merge( $data, [ 'status' => $status ] ) );
	}

	/**
	 * Return a 404 error.
	 *
	 * @param string $message Optional custom message.
	 *
	 * @return \WP_Error
	 */
	protected function notFound( string $message = '' ): \WP_Error {
		if ( $message === '' ) {
			$message = ErrorMessages::get( ErrorMessages::NOT_FOUND );
		}

		return $this->error( ErrorMessages::NOT_FOUND, $message, 404 );
	}

	/**
	 * Return a validation error with field-level details.
	 *
	 * @param array<string,string> $errors Field => message pairs.
	 *
	 * @return \WP_Error
	 */
	protected function validationError( array $errors ): \WP_Error {
		return $this->error(
			ErrorMessages::VALIDATION,
			ErrorMessages::get( ErrorMessages::VALIDATION ),
			400,
			[ 'errors' => $errors ]
		);
	}

	/**
	 * Get a required string parameter or return a validation error.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @param string           $key     Parameter name.
	 *
	 * @return string|\WP_Error Sanitized string or error.
	 */
	protected function requiredString( \WP_REST_Request $request, string $key ): string|\WP_Error {
		$value = $request->get_param( $key );

		if ( ! is_string( $value ) || trim( $value ) === '' ) {
			return $this->validationError(
				[ $key => ErrorMessages::getWithParam( 'field_required', $key ) ]
			);
		}

		return sanitize_text_field( $value );
	}

	/**
	 * Get a required integer parameter or return a validation error.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @param string           $key     Parameter name.
	 *
	 * @return int|\WP_Error Validated integer or error.
	 */
	protected function requiredInt( \WP_REST_Request $request, string $key ): int|\WP_Error {
		$value = $request->get_param( $key );

		if ( $value === null || $value === '' ) {
			return $this->validationError(
				[ $key => ErrorMessages::getWithParam( 'field_required', $key ) ]
			);
		}

		return absint( $value );
	}
}
