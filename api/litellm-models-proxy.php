<?php
/**
 * LiteLLM Models API Proxy
 * 
 * Acts as a proxy between the client and LiteLLM API to fetch available models
 * 
 * @author Piotr Tamulewicz
 * @link https://petertam.pro/
 */

// Include configuration
require_once '../includes/config.php';

// Set content type to JSON
header('Content-Type: application/json');

try {
    // Prepare API request
    $endpoint = LITELLM_API_URL . 'models';
    
    // Initialize cURL session
    $ch = curl_init($endpoint);
    
    // Set cURL options
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPGET, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'accept: application/json',
        'Authorization: Bearer ' . LITELLM_API_KEY, // Standard API key
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
    
    // Log request
    app_log('LiteLLM models API request', 'INFO');
    
    // Check if request was successful
    if ($httpCode >= 200 && $httpCode < 300) {
        // Parse response to validate and potentially transform
        $decodedResponse = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON response from LiteLLM API');
        }
        
        // Forward API response to client
        echo $response;
    } else {
        // Handle error response
        $errorData = json_decode($response, true);
        $errorMessage = isset($errorData['error']) ? $errorData['error'] : 'Unknown LiteLLM API error';
        
        throw new Exception($errorMessage);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    
    // Log error
    handle_error('LiteLLM Models API error: ' . $e->getMessage());
}