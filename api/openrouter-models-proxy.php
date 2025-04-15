<?php
/**
 * OpenRouter Models API Proxy
 * 
 * Acts as a proxy between the client and OpenRouter API to fetch available models
 * 
 * @author Piotr Tamulewicz
 * @link https://petertam.pro/
 */

// Include configuration
require_once '../includes/config.php';

// Set content type to JSON
header('Content-Type: application/json');

// Check if API key is available
if (empty(OPENROUTER_API_KEY)) {
    http_response_code(400);
    echo json_encode(['error' => 'OpenRouter API key not found. Please provide an API key in the settings.']);
    exit;
}

try {
    // Prepare API request
    $endpoint = OPENROUTER_API_URL . 'models';
    
    // Initialize cURL session
    $ch = curl_init($endpoint);
    
    // Set cURL options
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPGET, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . OPENROUTER_API_KEY,
        'HTTP-Referer: https://petertam.pro/', // Your site URL
        'X-Title: AI Conversation System'      // Your app name
    ]);
    
    // Execute cURL request
    $response = curl_exec($ch);
    
    // Check for cURL errors
    if (curl_errno($ch)) {
        throw new Exception('cURL error: ' . curl_error($ch));
    }
    
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    // Close cURL session
    curl_close($ch);
    
    // Log request
    app_log('OpenRouter models API request', 'INFO');
    
    // Forward API response to client
    http_response_code($httpCode);
    echo $response;
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    
    // Log error
    handle_error('OpenRouter Models API error: ' . $e->getMessage());
}