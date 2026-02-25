<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Services\Email;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Services\Email\EmailLogger;

class EmailLoggerTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'sanitize_email' )->returnArg();
		Functions\when( 'current_time' )->justReturn( '2026-02-25 12:00:00' );
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_log_inserts_email_entry(): void {
		global $wpdb;

		$wpdb->insert_id = 42;
		$wpdb->shouldReceive( 'insert' )
			->once()
			->with(
				'wp_resa_email_log',
				Mockery::on( function ( array $data ): bool {
					return $data['lead_id'] === 5
						&& $data['template_id'] === 'mietpreis'
						&& $data['recipient'] === 'max@test.de'
						&& $data['subject'] === 'Ihre Analyse'
						&& $data['status'] === 'sent'
						&& $data['error_message'] === null;
				} ),
				Mockery::type( 'array' )
			)
			->andReturn( 1 );

		$id = EmailLogger::log( 5, 'mietpreis', 'max@test.de', 'Ihre Analyse' );

		$this->assertSame( 42, $id );
	}

	public function test_log_stores_error_message_for_failed(): void {
		global $wpdb;

		$wpdb->insert_id = 43;
		$wpdb->shouldReceive( 'insert' )
			->once()
			->with(
				'wp_resa_email_log',
				Mockery::on( function ( array $data ): bool {
					return $data['status'] === 'failed'
						&& $data['error_message'] === 'SMTP timeout';
				} ),
				Mockery::type( 'array' )
			)
			->andReturn( 1 );

		$id = EmailLogger::log( 5, 'mietpreis', 'max@test.de', 'Analyse', 'failed', 'SMTP timeout' );

		$this->assertSame( 43, $id );
	}

	public function test_log_returns_false_on_db_error(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'insert' )->once()->andReturn( false );

		$id = EmailLogger::log( 5, 'mietpreis', 'max@test.de', 'Analyse' );

		$this->assertFalse( $id );
	}

	public function test_updateStatus_updates_status_field(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'update' )
			->once()
			->with(
				'wp_resa_email_log',
				Mockery::on( function ( array $data ): bool {
					return $data['status'] === 'delivered'
						&& ! isset( $data['opened_at'] );
				} ),
				[ 'id' => 42 ],
				[ '%s' ],
				[ '%d' ]
			)
			->andReturn( 1 );

		$result = EmailLogger::updateStatus( 42, 'delivered' );

		$this->assertTrue( $result );
	}

	public function test_updateStatus_sets_opened_at_timestamp(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'update' )
			->once()
			->with(
				'wp_resa_email_log',
				Mockery::on( function ( array $data ): bool {
					return $data['status'] === 'opened'
						&& $data['opened_at'] === '2026-02-25 12:00:00';
				} ),
				[ 'id' => 42 ],
				[ '%s', '%s' ],
				[ '%d' ]
			)
			->andReturn( 1 );

		$result = EmailLogger::updateStatus( 42, 'opened', 'opened_at' );

		$this->assertTrue( $result );
	}

	public function test_findByLead_returns_log_entries(): void {
		global $wpdb;

		$entries = [
			(object) [ 'id' => 1, 'lead_id' => 5, 'status' => 'sent' ],
			(object) [ 'id' => 2, 'lead_id' => 5, 'status' => 'opened' ],
		];

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( $entries );

		$result = EmailLogger::findByLead( 5 );

		$this->assertCount( 2, $result );
		$this->assertSame( 'sent', $result[0]->status );
	}

	public function test_findByLead_returns_empty_array_when_none(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( [] );

		$result = EmailLogger::findByLead( 999 );

		$this->assertSame( [], $result );
	}

	public function test_countByStatus_returns_count(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_var' )->once()->andReturn( '15' );

		$count = EmailLogger::countByStatus( 'sent' );

		$this->assertSame( 15, $count );
	}
}
