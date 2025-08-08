jQuery(document).ready(function ($) {
	// Configuration
	const PARAM_NAME = 'switch_cls[id]';
	const STORAGE_KEY = 'cms_multifamily_tracking_param';
	const STORAGE_EXPIRY_KEY = 'cms_multifamily_tracking_expiry';
	const EXPIRY_HOURS = 24; // How long to remember the parameter

	// Optional: Domains to include/exclude (empty arrays = include all external)
	const INCLUDE_DOMAINS = []; // e.g., ['example.com', 'partner-site.com']
	const EXCLUDE_DOMAINS = [
		'google.com',
		'facebook.com',
		'querymonitor.com',
		'wordpress.org',
		'googleapis',
	]; // Common exclusions

	// File extensions to exclude from tracking
	const EXCLUDE_EXTENSIONS = [
		'jpg',
		'jpeg',
		'png',
		'gif',
		'bmp',
		'webp',
		'svg',
		'pdf',
		'doc',
		'docx',
		'xls',
		'xlsx',
		'zip',
		'rar',
	]; // Image files and common document types

	/**
	 * Get URL parameter value - checks both encoded and non-encoded versions
	 */
	function getUrlParameter(name) {
		const urlParams = new URLSearchParams(window.location.search);

		// Try the non-encoded version first
		let value = urlParams.get(name);
		if (value) {
			return value;
		}

		// Try the encoded version
		const encodedName = encodeURIComponent(name);
		value = urlParams.get(encodedName);
		if (value) {
			return value;
		}

		// Fallback: manually parse the query string for both versions
		const queryString = window.location.search;

		// Check for non-encoded version
		const nonEncodedPattern = new RegExp(
			`[?&]${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^&]*)`
		);
		let match = queryString.match(nonEncodedPattern);
		if (match) {
			return decodeURIComponent(match[1]);
		}

		// Check for encoded version
		const encodedPattern = new RegExp(
			`[?&]${encodedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^&]*)`
		);
		match = queryString.match(encodedPattern);
		if (match) {
			return decodeURIComponent(match[1]);
		}

		return null;
	}

	/**
	 * Check if URL already contains the tracking parameter (encoded or non-encoded)
	 */
	function urlContainsTrackingParam(url) {
		const encodedParam = encodeURIComponent(PARAM_NAME);
		return url.includes(PARAM_NAME) || url.includes(encodedParam);
	}

	/**
	 * Check if URL points to an excluded file type
	 */
	function isExcludedFileType(url) {
		try {
			// Parse URL to get pathname
			const urlObj = new URL(url, window.location.origin);
			const pathname = urlObj.pathname.toLowerCase();

			// Extract file extension
			const lastDotIndex = pathname.lastIndexOf('.');
			if (lastDotIndex === -1) {
				return false; // No file extension
			}

			const extension = pathname.substring(lastDotIndex + 1);

			// Remove any query parameters from extension
			const cleanExtension = extension.split('?')[0];

			return EXCLUDE_EXTENSIONS.includes(cleanExtension);
		} catch (e) {
			return false; // If URL parsing fails, don't exclude
		}
	}

	/**
	 * Check if URL uses an excluded protocol (mailto, tel, etc.)
	 */
	function isExcludedProtocol(url) {
		const excludedProtocols = ['mailto:', 'tel:', 'sms:', 'ftp:', 'file:'];

		// Check if URL starts with any excluded protocol
		for (let protocol of excludedProtocols) {
			if (url.toLowerCase().startsWith(protocol)) {
				return true;
			}
		}

		return false;
	}
	/**
	 * Store tracking parameter with expiry
	 */
	function storeTrackingParam(value) {
		const expiryTime = new Date().getTime() + EXPIRY_HOURS * 60 * 60 * 1000;
		sessionStorage.setItem(STORAGE_KEY, value);
		sessionStorage.setItem(STORAGE_EXPIRY_KEY, expiryTime.toString());
		console.log('CMS Multifamily Tracking: Stored parameter:', value);
	}

	/**
	 * Get stored tracking parameter if not expired
	 */
	function getStoredTrackingParam() {
		const storedValue = sessionStorage.getItem(STORAGE_KEY);
		const expiryTime = sessionStorage.getItem(STORAGE_EXPIRY_KEY);

		if (!storedValue || !expiryTime) {
			return null;
		}

		const now = new Date().getTime();
		if (now > parseInt(expiryTime)) {
			// Expired, clear storage
			sessionStorage.removeItem(STORAGE_KEY);
			sessionStorage.removeItem(STORAGE_EXPIRY_KEY);
			return null;
		}

		return storedValue;
	}

	/**
	 * Check if URL is external and should be tracked
	 */
	function isExternalLink(url) {
		try {
			const link = new URL(url, window.location.origin);

			// Not external if same hostname
			if (link.hostname === window.location.hostname) {
				return false;
			}

			// Check exclude list
			if (EXCLUDE_DOMAINS.length > 0) {
				for (let domain of EXCLUDE_DOMAINS) {
					if (link.hostname.includes(domain)) {
						return false;
					}
				}
			}

			// Check include list (if specified)
			if (INCLUDE_DOMAINS.length > 0) {
				let shouldInclude = false;
				for (let domain of INCLUDE_DOMAINS) {
					if (link.hostname.includes(domain)) {
						shouldInclude = true;
						break;
					}
				}
				return shouldInclude;
			}

			return true;
		} catch (e) {
			return false;
		}
	}

	/**
	 * Add tracking parameter to URL without encoding
	 */
	function addTrackingToUrl(url, trackingValue) {
		try {
			const urlObj = new URL(url);
			// Use manual string concatenation to avoid automatic encoding
			const separator = urlObj.search ? '&' : '?';
			return (
				urlObj.toString() + separator + PARAM_NAME + '=' + trackingValue
			);
		} catch (e) {
			// Fallback for relative URLs or malformed URLs
			const separator = url.includes('?') ? '&' : '?';
			return url + separator + PARAM_NAME + '=' + trackingValue;
		}
	}

	/**
	 * Process external links and add tracking
	 */
	function processExternalLinks(trackingValue) {
		$('a[href]').each(function () {
			const $link = $(this);
			const href = $link.attr('href');

			// Skip if already processed or not external
			if ($link.data('tracking-processed') || !isExternalLink(href)) {
				return;
			}

			// Skip if it's an excluded protocol (mailto, tel, etc.)
			if (isExcludedProtocol(href)) {
				$link.data('tracking-processed', true);
				return;
			}

			// Skip if it's an excluded file type (images, documents, etc.)
			if (isExcludedFileType(href)) {
				$link.data('tracking-processed', true);
				return;
			}

			// Skip if already has the parameter (encoded or non-encoded)
			if (urlContainsTrackingParam(href)) {
				$link.data('tracking-processed', true);
				return;
			}

			// Add tracking parameter
			const newHref = addTrackingToUrl(href, trackingValue);
			$link.attr('href', newHref);
			$link.data('tracking-processed', true);

			console.log(
				'CMS Multifamily Tracking: Updated link from',
				href,
				'to',
				newHref
			);
		});
	}

	/**
	 * Handle dynamically added links
	 */
	function setupDynamicLinkHandler(trackingValue) {
		$(document).on('mouseenter focus', 'a[href]', function () {
			const $link = $(this);
			const href = $link.attr('href');

			// Skip if already processed or not external
			if ($link.data('tracking-processed') || !isExternalLink(href)) {
				return;
			}

			// Skip if it's an excluded protocol (mailto, tel, etc.)
			if (isExcludedProtocol(href)) {
				$link.data('tracking-processed', true);
				return;
			}

			// Skip if it's an excluded file type (images, documents, etc.)
			if (isExcludedFileType(href)) {
				$link.data('tracking-processed', true);
				return;
			}

			// Skip if already has the parameter (encoded or non-encoded)
			if (urlContainsTrackingParam(href)) {
				$link.data('tracking-processed', true);
				return;
			}

			// Add tracking parameter
			const newHref = addTrackingToUrl(href, trackingValue);
			$link.attr('href', newHref);
			$link.data('tracking-processed', true);
		});
	}

	// Main execution
	function init() {
		// Check for tracking parameter in current URL
		const currentParam = getUrlParameter(PARAM_NAME);

		if (currentParam) {
			// Store the parameter for future use
			storeTrackingParam(currentParam);
			console.log(
				'CMS Multifamily Tracking: Found and stored parameter:',
				currentParam
			);
		}

		// Get tracking value (from current URL or stored)
		const trackingValue = currentParam || getStoredTrackingParam();

		if (trackingValue) {
			// Process existing links
			processExternalLinks(trackingValue);

			// Setup handler for dynamic links
			setupDynamicLinkHandler(trackingValue);

			console.log(
				'CMS Multifamily Tracking: Active with parameter:',
				trackingValue
			);
		} else {
			console.log(
				'CMS Multifamily Tracking: No tracking parameter found'
			);
		}
	}

	// Initialize when DOM is ready
	init();

	// Re-process links when new content is loaded (for AJAX sites)
	$(document).on('DOMNodeInserted', function (e) {
		const trackingValue = getStoredTrackingParam();
		if (trackingValue && $(e.target).find('a[href]').length > 0) {
			setTimeout(function () {
				processExternalLinks(trackingValue);
			}, 100);
		}
	});
});
