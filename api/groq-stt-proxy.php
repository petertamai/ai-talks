<?php
/**
 * Groq Speech-to-Text API Proxy
 * 
 * Acts as a proxy between the client and Groq STT API to avoid CORS issues
 * 
 * @author Piotr Tamulewicz
 * @link https://petertam.pro/
 */

// Include configuration
require_once '../includes/config.php';

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Check if audio file was uploaded
    if (!isset($_FILES['audio']) || $_FILES['audio']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Audio file is required');
    }
    
    $audioFile = $_FILES['audio'];
    
    // Prepare API request
    $endpoint = GROQ_API_URL . 'audio/transcriptions';
    
    // Create boundary for multipart form data
    $boundary = uniqid();
    $delimiter = '-------------' . $boundary;
    
    // Build multipart request body
    $postData = '';
    
    // Add model field
    $postData .= "--" . $delimiter . "\r\n";
    $postData .= 'Content-Disposition: form-data; name="model"' . "\r\n\r\n";
    $postData .= "whisper-large-v3-turbo\r\n";
    
    // Add response_format field
    $postData .= "--" . $delimiter . "\r\n";
    $postData .= 'Content-Disposition: form-data; name="response_format"' . "\r\n\r\n";
    $postData .= "verbose_json\r\n";
    
    // Add audio file field
    $postData .= "--" . $delimiter . "\r\n";
    $postData .= 'Content-Disposition: form-data; name="file"; filename="' . basename($audioFile['name']) . '"' . "\r\n";
    $postData .= 'Content-Type: ' . $audioFile['type'] . "\r\n\r\n";
    $postData .= file_get_contents($audioFile['tmp_name']) . "\r\n";
    
    // End of multipart data
    $postData .= "--" . $delimiter . "--\r\n";
    
    // Initialize cURL session
    $ch = curl_init($endpoint);
    
    // Set cURL options
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: multipart/form-data; boundary=' . $delimiter,
        'Authorization: Bearer ' . GROQ_API_KEY
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
    app_log('Groq STT API request', 'INFO');
    
    // Set content type to JSON
    header('Content-Type: application/json');
    
    // Forward API response to client
    http_response_code($httpCode);
    echo $response;
    
} catch (Exception $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    
    // Log error
    handle_error('Groq STT API error: ' . $e->getMessage());
}