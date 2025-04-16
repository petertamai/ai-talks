<?php
/**
 * API Endpoint to Get Nonce
 * 
 * Returns a security nonce for AJAX requests
 * 
 * @author Piotr Tamulewicz <pt@petertam.pro>
 */

// Include required configuration
require_once '../includes/config.php';

// Set headers
header('Content-Type: application/json');

// Generate nonce for AJAX requests
$nonce = generate_nonce('ajax_request');

// Return the nonce
echo json_encode([
    'success' => true,
    'nonce' => $nonce
]);