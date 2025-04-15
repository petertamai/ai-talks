<?php
/**
 * API Endpoint to Check for Audio Recordings
 * 
 * Checks if a conversation has any audio recordings available.
 * 
 * @author Piotr Tamulewicz <pt@petertam.pro>
 */

// Include required configuration
require_once '../includes/config.php';

// Set headers
header('Content-Type: application/json');

// Helper function for error handling
function send_error($message, $error_details = null) {
    error_log("Check Audio Recordings Error: $message " . ($error_details ? json_encode($error_details) : ''));
    echo json_encode([
        'success' => false,
        'message' => $message,
        'hasAudio' => false
    ]);
    exit;
}

// Check if the request is a GET request
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_error('Invalid request method. Only GET requests are allowed.');
}

// Validate input
if (!isset($_GET['conversation_id']) || empty($_GET['conversation_id'])) {
    send_error('Missing conversation ID');
}

try {
    $conversationId = preg_replace('/[^a-zA-Z0-9_]/', '', $_GET['conversation_id']);
    
    // Make sure conversation ID is safe
    if ($conversationId !== $_GET['conversation_id']) {
        send_error("Invalid conversation ID format: {$_GET['conversation_id']}");
    }
    
    // Path to audio directory
    $audioPath = "../conversations/$conversationId/audio";
    
    // Check if the audio directory exists
    $hasAudio = false;
    
    if (file_exists($audioPath)) {
        // Check if there are any audio files
        $audioFiles = glob("$audioPath/*.mp3");
        $hasAudio = !empty($audioFiles);
    }
    
    // Return the result
    echo json_encode([
        'success' => true,
        'hasAudio' => $hasAudio
    ]);
    
} catch (Exception $e) {
    send_error('An error occurred while checking for audio recordings', $e->getMessage());
}