<?php
/**
 * LiteLLM API Proxy
 * 
 * Acts as a proxy between the client and LiteLLM API to avoid CORS issues
 * 
 * @author Piotr Tamulewicz
 * @link https://petertam.pro/
 */

// Include configuration
require_once '../includes/config.php';

// Set content type to JSON
header('Content-Type: application/json');

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Get POST data from client
    $rawData = file_get_contents('php://input');
    $requestData = json_decode($rawData, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON data');
    }
    
    // Validate required fields
    if (empty($requestData['model']) || empty($requestData['messages'])) {
        throw new Exception('Missing required fields (model or messages)');
    }
    
    // Prepare API request
    $endpoint = LITELLM_API_URL . 'chat/completions';
    
    // Initialize cURL session
    $ch = curl_init($endpoint);
    
    // Set cURL options
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $rawData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . LITELLM_API_KEY, // Main API key
        'x-goog-api-key: ' . LITELLM_API_KEY // Also try Google-style API key format
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
    
    // Log request (excluding sensitive content)
    app_log('LiteLLM API request to model: ' . $requestData['model'], 'INFO');
    
    // Forward API response to client
    http_response_code($httpCode);
    echo $response;
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    
    // Log error
    handle_error('LiteLLM API error: ' . $e->getMessage());
}