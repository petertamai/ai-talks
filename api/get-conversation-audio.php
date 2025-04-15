<?php
/**
 * API Endpoint to Get Conversation Audio Files
 * 
 * Returns a list of audio files for a conversation in the correct playback order.
 * 
 * @author Piotr Tamulewicz <pt@petertam.pro>
 */

// Include required configuration
require_once '../includes/config.php';

// Set headers
header('Content-Type: application/json');

// Helper function for error handling
function send_error($message, $error_details = null) {
    error_log("Get Conversation Audio Error: $message " . ($error_details ? json_encode($error_details) : ''));
    echo json_encode([
        'success' => false,
        'message' => $message,
        'audioFiles' => []
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
    if (!file_exists($audioPath)) {
        echo json_encode([
            'success' => true,
            'audioFiles' => []
        ]);
        exit;
    }
    
    // Get all audio files
    $audioFiles = glob("$audioPath/*.mp3");
    
    if (empty($audioFiles)) {
        echo json_encode([
            'success' => true,
            'audioFiles' => []
        ]);
        exit;
    }
    
    // Get file name only for each audio file
    $audioFileNames = array_map(function($path) {
        return basename($path);
    }, $audioFiles);
    
    // Sort audio files by their message index in filename
    usort($audioFileNames, function($a, $b) {
        $indexA = 0;
        $indexB = 0;
        
        // Extract the message index from the filename
        if (preg_match('/_(\d+)/', $a, $matchesA)) {
            $indexA = intval($matchesA[1]);
        }
        
        if (preg_match('/_(\d+)/', $b, $matchesB)) {
            $indexB = intval($matchesB[1]);
        }
        
        return $indexA - $indexB;
    });
    
    // Return the sorted audio files
    echo json_encode([
        'success' => true,
        'audioFiles' => $audioFileNames
    ]);
    
} catch (Exception $e) {
    send_error('An error occurred while retrieving audio files', $e->getMessage());
}