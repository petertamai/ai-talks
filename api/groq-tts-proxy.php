<?php
/**
 * Simplified Groq Text-to-Speech API Proxy
 * 
 * @author Piotr Tamulewicz
 * @link https://petertam.pro/
 */

// Include configuration
require_once '../includes/config.php';

// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Log request details
$request_id = uniqid();
$log_prefix = "[TTS-$request_id]";

function logTts($message) {
    global $log_prefix;
    error_log("$log_prefix $message");
}

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Get POST data from client
    $rawData = file_get_contents('php://input');
    logTts("Raw request data: $rawData");
    
    $requestData = json_decode($rawData, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON data: ' . json_last_error_msg());
    }
    
    // Validate required fields
    if (empty($requestData['voice'])) {
        throw new Exception('Missing required field: voice');
    }
    
    if (empty($requestData['input'])) {
        throw new Exception('Missing required field: input');
    }
    
    // Prepare API request data
    $apiData = [
        'model' => 'playai-tts',
        'voice' => $requestData['voice'],
        'input' => $requestData['input'],
        'response_format' => 'mp3'
    ];
    
    $jsonPayload = json_encode($apiData);
    logTts("Sending to Groq: $jsonPayload");
    
    // Prepare API request
    $endpoint = GROQ_API_URL . 'audio/speech';
    logTts("Endpoint: $endpoint");
    
    // Initialize cURL session
    $ch = curl_init($endpoint);
    
    // Set cURL options
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPayload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . GROQ_API_KEY
    ]);
    
    // Execute cURL request
    $response = curl_exec($ch);
    
    // Check for cURL errors
    if (curl_errno($ch)) {
        throw new Exception('cURL error: ' . curl_error($ch));
    }
    
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    
    logTts("Response code: $httpCode, Content-Type: $contentType");
    
    // Close cURL session
    curl_close($ch);
    
    // Process response
    if ($httpCode >= 200 && $httpCode < 300) {
        // Check if response is audio
        if (strpos($contentType, 'audio/') === 0) {
            // Output audio data
            header('Content-Type: ' . $contentType);
            header('Content-Length: ' . strlen($response));
            echo $response;
            logTts("Success: Returned audio data, length: " . strlen($response) . " bytes");
        } else {
            // Return JSON response
            header('Content-Type: application/json');
            echo $response;
            logTts("Warning: Received non-audio response: $response");
        }
    } else {
        // Handle error response
        header('Content-Type: application/json');
        
        // Try to decode JSON error message
        $errorData = json_decode($response, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($errorData)) {
            $errorResponse = ['error' => 'Groq API Error: ' . print_r($errorData, true)];
        } else {
            $errorResponse = ['error' => 'Groq API Error: HTTP ' . $httpCode];
        }
        
        echo json_encode($errorResponse);
        logTts("Error: " . json_encode($errorResponse));
    }
    
} catch (Exception $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    $errorMessage = $e->getMessage();
    echo json_encode(['error' => $errorMessage]);
    
    logTts("Exception: $errorMessage");
}