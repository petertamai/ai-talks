<?php
/**
 * Security functions for AI Conversation System
 * 
 * @author Piotr Tamulewicz <pt@petertam.pro>
 */
define('DISABLE_NONCE_CHECK', true);
// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
     session_start();
}

/**
 * Generate a nonce for AJAX requests
 * 
 * @param string $action The action being performed
 * @return string The generated nonce
 */
function generate_nonce($action = 'default') {
    $nonce = md5($action . session_id() . time());
    $_SESSION['nonces'][$action] = $nonce;
    
    // Clean up old nonces
    if (isset($_SESSION['nonces']) && count($_SESSION['nonces']) > 20) {
        array_shift($_SESSION['nonces']);
    }
    
    return $nonce;
}

/**
 * Verify a nonce from AJAX requests
 * 
 * @param string $nonce The nonce to verify
 * @param string $action The action being performed
 * @return bool Whether the nonce is valid
 */
function verify_nonce($nonce, $action = 'default') {
    if (!isset($_SESSION['nonces'][$action])) {
        return false;
    }
    
    // Check if the nonce matches
    $valid = ($_SESSION['nonces'][$action] === $nonce);
    
    // Remove used nonce for one-time use
    if ($valid) {
        unset($_SESSION['nonces'][$action]);
    }
    
    return $valid;
}