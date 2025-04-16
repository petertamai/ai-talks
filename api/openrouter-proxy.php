<?php
/**
 * OpenRouter API Proxy
 * 
 * Acts as a proxy between the client and OpenRouter API to avoid CORS issues.
 * Includes a fixed system message prepended to all requests.
 * 
 * @author Piotr Tamulewicz
 * @link https://petertam.pro/
 */

// Include configuration
require_once '../includes/config.php'; 
// Verify nonce
if (!isset($_SERVER['HTTP_X_AJAX_NONCE']) || !verify_nonce($_SERVER['HTTP_X_AJAX_NONCE'], 'ajax_request')) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid security token']);
    exit;
}
// --- Define your fixed system message here ---
$fixedSystemMessage = [
    'role' => 'system',
    'content' => 'as for emojis use UTF-8 emoji, now, track entire conversation and if you decide this is final end and no need to respond furtther,USE #END# ONLY AND ONLY THEN if all conversation should be ended. DONT ADD #END# to every single message, add end only conversation indicates good bye, see you ect!' // <-- **** EDIT THIS CONTENT ****
];
// ---------------------------------------------

// Set content type to JSON
header('Content-Type: application/json');

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check if API key is available
if (empty(OPENROUTER_API_KEY)) {
    http_response_code(400);
    echo json_encode(['error' => 'OpenRouter API key not found. Please provide an API key in the settings.']);
    exit;
}

try {
    // Get POST data from client
    $rawData = file_get_contents('php://input');
    $requestData = json_decode($rawData, true); // Decode into an associative array
    
    // Check for JSON decoding errors
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON data received from client: ' . json_last_error_msg());
    }
    
    // Validate required fields from the original request
    if (empty($requestData['model']) || !isset($requestData['messages']) || !is_array($requestData['messages'])) {
        // Note: We check if messages is an array now, even if empty initially, 
        // because we will be adding the system message.
        // If the client *must* send at least one user message, keep the original check:
        // if (empty($requestData['model']) || empty($requestData['messages'])) { ... }
        throw new Exception('Missing required fields (model or messages array)');
    }
    
    // --- Inject the fixed system message ---
    // Prepend the system message to the beginning of the messages array
    array_unshift($requestData['messages'], $fixedSystemMessage);
    // ---------------------------------------

    // --- Re-encode the modified data to JSON ---
    $modifiedJsonData = json_encode($requestData);
    
    // Check for JSON encoding errors after modification
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Failed to re-encode JSON data after adding system message: ' . json_last_error_msg());
    }
    // -------------------------------------------
    
    // Prepare API request
    $endpoint = OPENROUTER_API_URL . 'chat/completions';
    
    // Initialize cURL session
    $ch = curl_init($endpoint);
    
    // Set cURL options
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    // --- Use the modified JSON data ---
    curl_setopt($ch, CURLOPT_POSTFIELDS, $modifiedJsonData); 
    // ----------------------------------
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json', // Content-Type remains JSON
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
    
    // Log request (excluding sensitive content like full messages)
    // Consider if you want to log that a system message was added
    app_log('OpenRouter API request to model: ' . $requestData['model'] . ' (with fixed system message)', 'INFO');
    
    // Forward API response to client
    http_response_code($httpCode);
    echo $response; // Forward the raw response from OpenRouter
    
} catch (Exception $e) {
    http_response_code(500); // Use 500 for server-side errors/exceptions
    $errorMessage = $e->getMessage();
    echo json_encode(['error' => $errorMessage]);
    
    // Log error
    // Assuming handle_error exists and logs appropriately
    if (function_exists('handle_error')) {
        handle_error('OpenRouter API proxy error: ' . $errorMessage);
    } elseif (function_exists('app_log')) { // Fallback to app_log if handle_error doesn't exist
        app_log('OpenRouter API proxy error: ' . $errorMessage, 'ERROR');
    } else { // Basic error logging if neither exists
        error_log('OpenRouter API proxy error: ' . $errorMessage);
    }
}