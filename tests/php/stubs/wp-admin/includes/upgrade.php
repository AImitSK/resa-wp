<?php
/**
 * Stub for wp-admin/includes/upgrade.php.
 *
 * Provides a no-op dbDelta() when Brain Monkey hasn't mocked it yet.
 */

if ( ! function_exists( 'dbDelta' ) ) {
	/**
	 * Stub dbDelta — does nothing in unit tests.
	 *
	 * @param string|string[] $queries SQL queries.
	 * @return string[]
	 */
	function dbDelta( $queries = '' ) { // phpcs:ignore Universal.NamingConventions.NoReservedKeywordParameterNames.queriesFound
		return [];
	}
}
