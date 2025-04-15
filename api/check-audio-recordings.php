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

// Define custom error log function
function logCheckAudio($message) {
    error_log("CheckAudio: $message");
    
    // Also append to dedicated log file
    $logFile = __DIR__ . '/../logs/check_audio.log';
    $timestamp = date('Y-m-d H:i:s');
    @file_put_contents($logFile, "[$timestamp] $message" . PHP_EOL, FILE_APPEND);
}

// Helper function for error handling
function send_error($message, $error_details = null) {
    logCheckAudio("Error: $message " . ($error_details ? json_encode($error_details) : ''));
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
    
    logCheckAudio("Checking for audio files in: $audioPath");
    
    // Check if the audio directory exists
    $hasAudio = false;
    
    if (file_exists($audioPath)) {
        // Check if there are any audio files
        $audioFiles = glob("$audioPath/*.mp3");
        $hasAudio = !empty($audioFiles);
        
        logCheckAudio("Found " . count($audioFiles) . " audio files");
        if (!empty($audioFiles)) {
            logCheckAudio("Audio files: " . implode(", ", $audioFiles));
        }
    } else {
        logCheckAudio("Audio directory not found: $audioPath");
    }
    
    // Return the result with detailed information
    echo json_encode([
        'success' => true,
        'hasAudio' => $hasAudio,
        'audioPath' => $audioPath,
        'exists' => file_exists($audioPath),
        'audioFiles' => isset($audioFiles) ? count($audioFiles) : 0
    ]);
    
} catch (Exception $e) {
    send_error('An error occurred while checking for audio recordings', $e->getMessage());
}