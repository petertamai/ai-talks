<?php
/**
 * API Endpoint to Check for Audio Recordings - Enhanced Version
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
    
    // Additional check for shared_conversations.json
    $sharedConversationsFile = "../data/shared_conversations.json";
    $sharedStatus = false;
    
    if (file_exists($sharedConversationsFile)) {
        $sharedData = json_decode(file_get_contents($sharedConversationsFile), true);
        
        if (isset($sharedData[$conversationId]['has_audio'])) {
            $sharedStatus = (bool)$sharedData[$conversationId]['has_audio'];
            logCheckAudio("Shared status from JSON: " . ($sharedStatus ? "true" : "false"));
            
            // If JSON says we have audio but we didn't find any files, log this discrepancy
            if ($sharedStatus && !$hasAudio) {
                logCheckAudio("WARNING: shared_conversations.json indicates has_audio=true but no audio files found");
            }
            
            // Update shared conversations file if necessary
            if ($hasAudio && !$sharedStatus) {
                logCheckAudio("Updating shared_conversations.json to set has_audio=true");
                $sharedData[$conversationId]['has_audio'] = true;
                file_put_contents($sharedConversationsFile, json_encode($sharedData, JSON_PRETTY_PRINT));
            }
        } else {
            logCheckAudio("Conversation not found in shared_conversations.json");
        }
    } else {
        logCheckAudio("shared_conversations.json not found");
    }
    
    // Force update if requested (used by conversation-share.js)
    if (isset($_GET['force_scan']) && $_GET['force_scan'] === 'true') {
        logCheckAudio("Force scan requested - checking direct file system");
        
        // The most reliable check - scan the filesystem directly
        $absoluteAudioPath = realpath("../conversations/$conversationId/audio");
        
        if ($absoluteAudioPath) {
            logCheckAudio("Scanning absolute path: $absoluteAudioPath");
            
            // Use PHP's Directory class for a more thorough scan
            $audioFiles = [];
            $dir = dir($absoluteAudioPath);
            
            while (($file = $dir->read()) !== false) {
                if ($file !== '.' && $file !== '..' && preg_match('/\.mp3$/i', $file)) {
                    $audioFiles[] = $file;
                }
            }
            
            $dir->close();
            
            $hasAudio = !empty($audioFiles);
            logCheckAudio("Force scan found " . count($audioFiles) . " audio files");
            
            // Update shared conversations file if necessary
            if ($hasAudio && !$sharedStatus && file_exists($sharedConversationsFile)) {
                logCheckAudio("Updating shared_conversations.json from force scan");
                $sharedData[$conversationId]['has_audio'] = true;
                file_put_contents($sharedConversationsFile, json_encode($sharedData, JSON_PRETTY_PRINT));
            }
        } else {
            logCheckAudio("Force scan: Audio directory not found for absolute path");
        }
    }
    
    // Return the result with detailed information
    echo json_encode([
        'success' => true,
        'hasAudio' => $hasAudio,
        'audioPath' => $audioPath,
        'exists' => file_exists($audioPath),
        'audioFiles' => isset($audioFiles) ? count($audioFiles) : 0,
        'sharedStatus' => $sharedStatus
    ]);
    
} catch (Exception $e) {
    send_error('An error occurred while checking for audio recordings', $e->getMessage());
}