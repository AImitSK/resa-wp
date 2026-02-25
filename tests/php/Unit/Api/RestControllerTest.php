<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Api;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Api\RestController;

/**
 * Concrete test implementation of the abstract RestController.
 */
class TestableController extends RestController {

	public function registerRoutes(): void {
		// No-op for testing.
	}

	/**
	 * Expose protected methods for testing.
	 *
	 * @param mixed $data   Response data.
	 * @param int   $status HTTP status code.
	 */
	public function callSuccess( mixed $data = null, int $status = 200 ): \WP_REST_Response {
		return $this->success( $data, $status );
	}

	/**
	 * @param array<string,mixed> $data Additional error data.
	 */
	public function callError( string $code, string $message, int $status = 400, array $data = [] ): \WP_Error {
		return $this->error( $code, $message, $status, $data );
	}

	public function callNotFound( string $message = '' ): \WP_Error {
		return $this->notFound( $message );
	}

	/**
	 * @param array<string,string> $errors Field errors.
	 */
	public function callValidationError( array $errors ): \WP_Error {
		return $this->validationError( $errors );
	}
}

class RestControllerTest extends TestCase {

	use MockeryPHPUnitIntegration;

	private TestableController $controller;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		$this->controller = new TestableController();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_publicAccess_gibt_true_zurueck(): void {
		$this->assertTrue( $this->controller->publicAccess() );
	}

	public function test_adminAccess_prueft_manage_options(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( true );

		$this->assertTrue( $this->controller->adminAccess() );
	}

	public function test_adminAccess_verweigert_ohne_capability(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( false );

		$this->assertFalse( $this->controller->adminAccess() );
	}

	public function test_success_erstellt_WP_REST_Response(): void {
		$data     = [ 'status' => 'ok' ];
		$response = $this->controller->callSuccess( $data, 200 );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertSame( $data, $response->get_data() );
		$this->assertSame( 200, $response->get_status() );
	}

	public function test_success_mit_status_201(): void {
		$response = $this->controller->callSuccess( [ 'id' => 1 ], 201 );

		$this->assertSame( 201, $response->get_status() );
	}

	public function test_error_erstellt_WP_Error(): void {
		$error = $this->controller->callError( 'resa_test', 'Testfehler', 400 );

		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'resa_test', $error->get_error_code() );
		$this->assertSame( 'Testfehler', $error->get_error_message() );

		$data = $error->get_error_data();
		$this->assertSame( 400, $data['status'] );
	}

	public function test_notFound_erstellt_404_error(): void {
		Functions\expect( '__' )->andReturnFirstArg();

		$error = $this->controller->callNotFound();

		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'resa_not_found', $error->get_error_code() );
		$this->assertSame( 404, $error->get_error_data()['status'] );
	}

	public function test_notFound_mit_custom_message(): void {
		$error = $this->controller->callNotFound( 'Lead nicht gefunden.' );

		$this->assertSame( 'Lead nicht gefunden.', $error->get_error_message() );
	}

	public function test_validationError_enthaelt_field_errors(): void {
		Functions\expect( '__' )->andReturnFirstArg();

		$errors = [ 'email' => 'E-Mail ist erforderlich.' ];
		$error  = $this->controller->callValidationError( $errors );

		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertSame( 'resa_validation_error', $error->get_error_code() );
		$this->assertSame( 400, $error->get_error_data()['status'] );
		$this->assertSame( $errors, $error->get_error_data()['errors'] );
	}
}
