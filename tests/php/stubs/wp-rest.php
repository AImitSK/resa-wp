<?php
/**
 * Minimal WordPress REST API stubs for unit testing.
 *
 * Brain Monkey mocks functions but not classes. These stubs provide
 * just enough of WP_REST_Response, WP_REST_Request, WP_REST_Server,
 * and WP_Error to run unit tests without a full WordPress installation.
 */

declare( strict_types=1 );

if ( ! class_exists( 'WP_Error' ) ) {
	/**
	 * Minimal WP_Error stub.
	 */
	class WP_Error {

		/** @var array<string, array<int, string>> */
		protected array $errors = [];

		/** @var array<string, mixed> */
		protected array $error_data = [];

		/**
		 * @param string              $code    Error code.
		 * @param string              $message Error message.
		 * @param array<string,mixed> $data    Error data.
		 */
		public function __construct( string $code = '', string $message = '', mixed $data = '' ) {
			if ( $code !== '' ) {
				$this->errors[ $code ][] = $message;
				if ( $data ) {
					$this->error_data[ $code ] = $data;
				}
			}
		}

		public function get_error_code(): string {
			$codes = array_keys( $this->errors );
			return $codes[0] ?? '';
		}

		public function get_error_message( string $code = '' ): string {
			if ( $code === '' ) {
				$code = $this->get_error_code();
			}
			return $this->errors[ $code ][0] ?? '';
		}

		/**
		 * @return mixed
		 */
		public function get_error_data( string $code = '' ) {
			if ( $code === '' ) {
				$code = $this->get_error_code();
			}
			return $this->error_data[ $code ] ?? null;
		}
	}
}

if ( ! class_exists( 'WP_REST_Response' ) ) {
	/**
	 * Minimal WP_REST_Response stub.
	 */
	class WP_REST_Response {

		/** @var mixed */
		protected $data;
		protected int $status;

		/** @var array<string, string> */
		protected array $headers = [];

		public function __construct( mixed $data = null, int $status = 200 ) {
			$this->data   = $data;
			$this->status = $status;
		}

		/** @return mixed */
		public function get_data() {
			return $this->data;
		}

		public function get_status(): int {
			return $this->status;
		}

		public function set_status( int $code ): void {
			$this->status = $code;
		}

		public function header( string $key, string $value ): void {
			$this->headers[ $key ] = $value;
		}

		/** @return array<string, string> */
		public function get_headers(): array {
			return $this->headers;
		}
	}
}

if ( ! class_exists( 'WP_REST_Request' ) ) {
	/**
	 * Minimal WP_REST_Request stub.
	 */
	class WP_REST_Request {

		/** @var array<string, mixed> */
		protected array $params = [];
		protected string $method;
		protected string $route;

		/** @var array<string, string> */
		protected array $headers = [];

		public function __construct( string $method = 'GET', string $route = '' ) {
			$this->method = $method;
			$this->route  = $route;
		}

		public function set_param( string $key, mixed $value ): void {
			$this->params[ $key ] = $value;
		}

		public function get_param( string $key ): mixed {
			return $this->params[ $key ] ?? null;
		}

		/** @return array<string, mixed> */
		public function get_params(): array {
			return $this->params;
		}

		public function set_header( string $key, string $value ): void {
			$this->headers[ strtolower( $key ) ] = $value;
		}

		public function get_header( string $key ): ?string {
			return $this->headers[ strtolower( $key ) ] ?? null;
		}

		public function get_method(): string {
			return $this->method;
		}

		public function get_route(): string {
			return $this->route;
		}
	}
}

if ( ! class_exists( 'WP_REST_Server' ) ) {
	/**
	 * Minimal WP_REST_Server stub (constants only).
	 */
	class WP_REST_Server {
		const READABLE   = 'GET';
		const CREATABLE  = 'POST';
		const EDITABLE   = 'POST, PUT, PATCH';
		const DELETABLE  = 'DELETE';
		const ALLMETHODS  = 'GET, POST, PUT, PATCH, DELETE';
	}
}
