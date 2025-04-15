<?php
/**
 * API Endpoint to Check for Audio Recordings
 * 
 * Checks if a conversation has any audio recordings available.
 * 
 * @author Piotr Tamulewicz <pt@petertam.pro>
 */

// Include the required configuration files
require_once '../includes/config.php';
require_once '../includes/functions.php';

// Set headers
header('Content-Type: application/json');

// Define error handling function
function handleError($message, $errorDetails = null) {
    error_log("Check Audio Recordings Error: $message " . ($errorDetails ? json_encode($errorDetails) : ''));
    
    // Trigger custom error action for logging
    do_action('ai_conversation_system_error', [
        'component' => 'check_audio_recordings',
        'message' => $message,
        'details' => $errorDetails
    ]);
    
    echo json_encode([
        'success' => false,
        'message' => $message,
        'hasAudio' => false
    ]);
    exit;
}

// Check if the request is a GET request
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    handleError('Invalid request method. Only GET requests are allowed.');
}

// Validate input
if (!isset($_GET['conversation_id']) || empty($_GET['conversation_id'])) {
    handleError('Missing conversation ID');
}

try {
    $conversationId = sanitize_text_field($_GET['conversation_id']);
    
    // Path to audio directory
    $audioPath = ABSPATH . '/conversations/' . $conversationId . '/audio';
    
    // Check if the audio directory exists
    $hasAudio = false;
    
    if (file_exists($audioPath)) {
        // Check if there are any audio files
        $audioFiles = glob($audioPath . '/*.mp3');
        $hasAudio = !empty($audioFiles);
    }
    
    // Return the result
    echo json_encode([
        'success' => true,
        'hasAudio' => $hasAudio
    ]);
    
} catch (Exception $e) {
    handleError('An error occurred while checking for audio recordings', $e->getMessage());
}