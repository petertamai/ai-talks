<?php
/**
 * OpenRouter API Proxy
 * 
 * Acts as a proxy between the client and OpenRouter API to avoid CORS issues
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

// Check if API key is available
if (empty(OPENROUTER_API_KEY)) {
    http_response_code(400);
    echo json_encode(['error' => 'OpenRouter API key not found. Please provide an API key in the settings.']);
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
    $endpoint = OPENROUTER_API_URL . 'chat/completions';
    
    // Initialize cURL session
    $ch = curl_init($endpoint);
    
    // Set cURL options
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $rawData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
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
    
    // Log request (excluding sensitive content)
    app_log('OpenRouter API request to model: ' . $requestData['model'], 'INFO');
    
    // Forward API response to client
    http_response_code($httpCode);
    echo $response;
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    
    // Log error
    handle_error('OpenRouter API error: ' . $e->getMessage());
}