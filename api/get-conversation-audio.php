<?php
/**
 * API Endpoint to Get Conversation Audio Files
 * 
 * Returns a list of audio files for a conversation in the correct playback order.
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
    error_log("Get Conversation Audio Error: $message " . ($errorDetails ? json_encode($errorDetails) : ''));
    
    // Trigger custom error action for logging
    do_action('ai_conversation_system_error', [
        'component' => 'get_conversation_audio',
        'message' => $message,
        'details' => $errorDetails
    ]);
    
    echo json_encode([
        'success' => false,
        'message' => $message,
        'audioFiles' => []
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
    if (!file_exists($audioPath)) {
        echo json_encode([
            'success' => true,
            'audioFiles' => []
        ]);
        exit;
    }
    
    // Get all audio files
    $audioFiles = glob($audioPath . '/*.mp3');
    
    if (empty($audioFiles)) {
        echo json_encode([
            'success' => true,
            'audioFiles' => []
        ]);
        exit;
    }
    
    // Path to conversation JSON file
    $conversationFile = ABSPATH . '/conversations/' . $conversationId . '/conversation.json';
    
    // Get file name only for each audio file
    $audioFileNames = array_map(function($path) {
        return basename($path);
    }, $audioFiles);
    
    // If conversation file exists, sort audio files by message order
    if (file_exists($conversationFile)) {
        $conversationData = json_decode(file_get_contents($conversationFile), true);
        
        if (isset($conversationData['messages']) && is_array($conversationData['messages'])) {
            // Create a map of message IDs to audio files
            $messageAudioMap = [];
            
            foreach ($audioFileNames as $fileName) {
                // Extract message ID from filename (assuming format like message_123.mp3)
                if (preg_match('/message_(\d+)/', $fileName, $matches)) {
                    $messageId = $matches[1];
                    $messageAudioMap[$messageId] = $fileName;
                }
            }
            
            // Sort audio files based on message order
            $sortedAudioFiles = [];
            
            foreach ($conversationData['messages'] as $message) {
                if (isset($message['id']) && isset($messageAudioMap[$message['id']])) {
                    $sortedAudioFiles[] = $messageAudioMap[$message['id']];
                }
            }
            
            // Use sorted files if available, otherwise use original list
            $audioFileNames = !empty($sortedAudioFiles) ? $sortedAudioFiles : $audioFileNames;
        }
    } else {
        // If conversation file doesn't exist, sort by filename which might contain timestamps
        usort($audioFileNames, function($a, $b) {
            // Extract timestamps or just compare filenames
            preg_match('/(\d+)/', $a, $matchesA);
            preg_match('/(\d+)/', $b, $matchesB);
            
            $timeA = isset($matchesA[1]) ? intval($matchesA[1]) : 0;
            $timeB = isset($matchesB[1]) ? intval($matchesB[1]) : 0;
            
            return $timeA - $timeB;
        });
    }
    
    // Return the sorted audio files
    echo json_encode([
        'success' => true,
        'audioFiles' => $audioFileNames
    ]);
    
} catch (Exception $e) {
    handleError('An error occurred while retrieving audio files', $e->getMessage());
}