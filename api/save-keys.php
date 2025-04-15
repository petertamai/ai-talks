<?php
/**
 * API Key Management - Securely save API keys to cookies
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
    
    $response = ['success' => false, 'messages' => []];
    
    // Handle OpenRouter API key
    if (isset($requestData['openrouter_api_key'])) {
        $key = trim($requestData['openrouter_api_key']);
        
        if (empty($key)) {
            // Clear the cookie if empty
            setcookie('openrouter_api_key', '', time() - 3600, '/', '', true, true);
            $response['messages'][] = 'OpenRouter API key cleared';
        } else {
            // Set the cookie
            setcookie('openrouter_api_key', $key, time() + 60*60*24*30, '/', '', true, true); // 30 days
            $response['messages'][] = 'OpenRouter API key saved';
        }
    }
    
    // Handle Groq API key
    if (isset($requestData['groq_api_key'])) {
        $key = trim($requestData['groq_api_key']);
        
        if (empty($key)) {
            // Clear the cookie if empty
            setcookie('groq_api_key', '', time() - 3600, '/', '', true, true);
            $response['messages'][] = 'Groq API key cleared';
        } else {
            // Set the cookie
            setcookie('groq_api_key', $key, time() + 60*60*24*30, '/', '', true, true); // 30 days
            $response['messages'][] = 'Groq API key saved';
        }
    }
    
    $response['success'] = true;
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    
    // Log error
    handle_error('API Key Management error: ' . $e->getMessage());
}