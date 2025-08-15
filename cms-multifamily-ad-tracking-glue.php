<?php
/*
	Plugin Name: CMS Multifamily Ad Tracking Glue
	Plugin URI: https://brindledigital.com
	Description: Just another plugin
	Version: 0.2
	Author: Jon Schroeder
	Author URI: https://brindledigital.com

	This program is free software; you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation; either version 2 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU General Public License for more details.
*/


/* Prevent direct access to the plugin */
if ( !defined( 'ABSPATH' ) ) {
	die( "Sorry, you are not allowed to access this page directly." );
}

// Plugin directory
define( 'CMSMULTI_GLUE_DIR', dirname( __FILE__ ) );

// Define the version of the plugin
define ( 'CMSMULTI_GLUE_VERSION', '0.2' );

/**
 * If the URL contains switch_cls[id]=..., set a sitewide rentfetch_lead_source cookie for 30 days.
 * We set this early on `init` so direct visits get the cookie before any JS runs.
 */
function cmsmulti_glue_set_lead_source_cookie() {
	// Robustly extract switch_cls[id] from several possible representations:
	// 1) PHP-decoded array: $_GET['switch_cls']['id']
	// 2) PHP-decoded string: $_GET['switch_cls'] (if provided without brackets)
	// 3) Literal bracketed key: $_GET['switch_cls[id]']
	// 4) Encoded query-string name like switch_cls%5Bid%5D=... (fall back to raw QUERY_STRING parsing)
	$value = null;

	// Case 1 & 2: standard PHP parsing
	if ( isset( $_GET['switch_cls'] ) ) {
		$switch = $_GET['switch_cls'];
		if ( is_array( $switch ) && isset( $switch['id'] ) ) {
			$value = wp_unslash( $switch['id'] );
		} elseif ( is_string( $switch ) ) {
			$value = wp_unslash( $switch );
		}
	}

	// Case 3: literal key present in some environments
	if ( null === $value && isset( $_GET['switch_cls[id]'] ) ) {
		$value = wp_unslash( $_GET['switch_cls[id]'] );
	}

	// Case 4: fallback to raw query string parsing to catch encoded parameter names
	if ( null === $value && isset( $_SERVER['QUERY_STRING'] ) ) {
		$qs = $_SERVER['QUERY_STRING'];

		// Try encoded form: switch_cls%5Bid%5D=VALUE
		if ( preg_match( '/(?:^|&)(?:switch_cls%5Bid%5D)=([^&]+)/i', $qs, $m ) ) {
			$value = rawurldecode( $m[1] );
		}

		// Try unencoded bracketed form: switch_cls[id]=VALUE
		if ( null === $value && preg_match( '/(?:^|&)(?:switch_cls\[id\])=([^&]+)/i', $qs, $m2 ) ) {
			$value = rawurldecode( $m2[1] );
		}
	}

	if ( null === $value || '' === trim( $value ) ) {
		return;
	}

	$value = sanitize_text_field( $value );

	$cookie_name = 'rentfetch_lead_source';
	$cookie_lifetime_seconds = 30 * 24 * 60 * 60; // 30 days
	$expires = time() + $cookie_lifetime_seconds;

	// Encode to be consistent with other code (JS reads via decodeURIComponent)
	$encoded_value = rawurlencode( $value );

	$cookie_options = array(
		'expires'  => $expires,
		'path'     => '/',
		'domain'   => '',
		'secure'   => is_ssl(),
		'httponly' => false,
		'samesite' => 'Lax',
	);

	if ( PHP_VERSION_ID >= 70300 ) {
		setcookie( $cookie_name, $encoded_value, $cookie_options );
	} else {
		$cookie_header = rawurlencode( $cookie_name ) . '=' . $encoded_value . '; Expires=' . gmdate( 'D, d-M-Y H:i:s T', $expires ) . '; Path=/';
		if ( is_ssl() ) {
			$cookie_header .= '; Secure';
		}
		$cookie_header .= '; SameSite=Lax';
		header( 'Set-Cookie: ' . $cookie_header, false );
	}

	// Make immediately available in this request
	$_COOKIE[ $cookie_name ] = $encoded_value;
}

add_action( 'init', 'cmsmulti_glue_set_lead_source_cookie', 1 );

// Enqueue JavaScript file everywhere
function cmsmulti_glue_enqueue_scripts() {
	wp_enqueue_script(
		'cms-multifamily-ad-tracking-glue',
		plugin_dir_url( __FILE__ ) . 'js/cms-multifamily-ad-tracking-glue.js',
		array('jquery'),
		CMSMULTI_GLUE_VERSION,
		true
	);
}
add_action( 'wp_enqueue_scripts', 'cmsmulti_glue_enqueue_scripts' );