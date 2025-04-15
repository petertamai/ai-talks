<?php
/**
 * API Endpoint for Sharing Conversations
 * 
 * Handles the process of saving conversation data and marking it as shared.
 * 
 * @author Piotr Tamulewicz <pt@petertam.pro>
 */

// Include required configuration
require_once '../includes/config.php';

// Set headers
header('Content-Type: application/json');

// Helper function for error handling
function send_error($message, $error_details = null) {
    error_log("Share Conversation Error: $message " . ($error_details ? json_encode($error_details) : ''));
    echo json_encode([
        'success' => false,
        'message' => $message
    ]);
    exit;
}

// Check if the request is a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error('Invalid request method. Only POST requests are allowed.');
}

// Get JSON payload
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Validate input
if (!isset($data['conversation_id']) || empty($data['conversation_id'])) {
    send_error('Missing conversation ID');
}

if (!isset($data['data']) || !is_array($data['data'])) {
    send_error('Missing or invalid conversation data');
}

try {
    $conversationId = preg_replace('/[^a-zA-Z0-9_]/', '', $data['conversation_id']);
    
    // Make sure conversation ID is safe (alphanumeric and underscores only)
    if ($conversationId !== $data['conversation_id']) {
        send_error("Invalid conversation ID format: {$data['conversation_id']}");
    }
    
    // Create directory structure if it doesn't exist
    $conversationsDir = '../conversations';
    $conversationPath = "$conversationsDir/$conversationId";
    $audioPath = "$conversationPath/audio";
    
    if (!file_exists($conversationsDir)) {
        mkdir($conversationsDir, 0755, true);
    }
    
    if (!file_exists($conversationPath)) {
        mkdir($conversationPath, 0755, true);
    }
    
    if (!file_exists($audioPath)) {
        mkdir($audioPath, 0755, true);
    }
    
    // Add shared flag to conversation data
    $conversationData = $data['data'];
    $conversationData['shared'] = true;
    $conversationData['shared_at'] = date('Y-m-d H:i:s');
    
    // Save conversation data to file
    $conversationFile = "$conversationPath/conversation.json";
    file_put_contents($conversationFile, json_encode($conversationData, JSON_PRETTY_PRINT));
    
    // Update the shared conversations tracker file
    $dataDir = '../data';
    $sharedConversationsFile = "$dataDir/shared_conversations.json";
    
    // Create data directory if it doesn't exist
    if (!file_exists($dataDir)) {
        mkdir($dataDir, 0755, true);
    }
    
    // Initialize shared conversations array
    $sharedConversations = [];
    
    // If the file exists, read it
    if (file_exists($sharedConversationsFile)) {
        $fileContent = file_get_contents($sharedConversationsFile);
        if (!empty($fileContent)) {
            $sharedConversations = json_decode($fileContent, true) ?: [];
        }
    }
    
    // Check if there are audio files
    $hasAudio = false;
    if (file_exists($audioPath)) {
        $audioFiles = glob("$audioPath/*.mp3");
        $hasAudio = !empty($audioFiles);
    }
    
    // Add or update the shared conversation
    $sharedConversations[$conversationId] = [
        'conversation_id' => $conversationId,
        'shared_at' => date('Y-m-d H:i:s'),
        'expires_at' => date('Y-m-d H:i:s', strtotime('+30 days')), // Set expiry for 30 days
        'has_audio' => $hasAudio,
        'title' => isset($conversationData['messages'][0]['content']) 
            ? substr($conversationData['messages'][0]['content'], 0, 50) . '...' 
            : 'Shared Conversation'
    ];
    
    // Save the updated shared conversations tracker
    file_put_contents($sharedConversationsFile, json_encode($sharedConversations, JSON_PRETTY_PRINT));
    
    // Generate share URL
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $baseDir = dirname(dirname($_SERVER['SCRIPT_NAME']));
    $baseDir = $baseDir !== '/' ? $baseDir : '';
    
    $shareUrl = "$protocol://$host$baseDir/share.php?id=$conversationId";
    
    // Return success
    echo json_encode([
        'success' => true,
        'shareUrl' => $shareUrl,
        'expiresAt' => $sharedConversations[$conversationId]['expires_at']
    ]);
    
} catch (Exception $e) {
    send_error('An error occurred while sharing the conversation', $e->getMessage());
}