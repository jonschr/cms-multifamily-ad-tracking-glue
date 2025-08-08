<?php
/*
	Plugin Name: CMS Multifamily Ad Tracking Glue
	Plugin URI: https://brindledigital.com
	Description: Just another plugin
	Version: 0.1
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
define ( 'CMSMULTI_GLUE_VERSION', '0.1' );

// Enqueue JavaScript file everywhere (frontend and admin)
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