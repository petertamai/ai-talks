<?php
/**
 * API Endpoint for Sharing Conversations
 * 
 * Handles the process of marking a conversation as shared and returning a shareable URL.
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
    error_log("Share Conversation Error: $message " . ($errorDetails ? json_encode($errorDetails) : ''));
    
    // Trigger custom error action for logging
    do_action('ai_conversation_system_error', [
        'component' => 'share_conversation',
        'message' => $message,
        'details' => $errorDetails
    ]);
    
    echo json_encode([
        'success' => false,
        'message' => $message
    ]);
    exit;
}

// Check if the request is a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    handleError('Invalid request method. Only POST requests are allowed.');
}

// Get JSON payload
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Validate input
if (!isset($data['conversation_id']) || empty($data['conversation_id'])) {
    handleError('Missing conversation ID');
}

try {
    $conversationId = sanitize_text_field($data['conversation_id']);
    
    // Path to conversation folder
    $conversationPath = ABSPATH . '/conversations/' . $conversationId;
    
    // Check if conversation exists
    if (!file_exists($conversationPath)) {
        handleError("Conversation not found: $conversationId");
    }
    
    // Path to conversation JSON file
    $conversationFile = $conversationPath . '/conversation.json';
    
    // Check if conversation JSON exists
    if (!file_exists($conversationFile)) {
        handleError("Conversation data not found for ID: $conversationId");
    }
    
    // Read conversation data
    $conversationData = json_decode(file_get_contents($conversationFile), true);
    
    // Mark as shared in the conversation data
    $conversationData['shared'] = true;
    $conversationData['shared_at'] = date('Y-m-d H:i:s');
    
    // Save updated conversation data
    file_put_contents($conversationFile, json_encode($conversationData, JSON_PRETTY_PRINT));
    
    // Update the shared conversations tracker file
    $sharedConversationsFile = ABSPATH . '/data/shared_conversations.json';
    
    // Create directory if it doesn't exist
    if (!file_exists(dirname($sharedConversationsFile))) {
        mkdir(dirname($sharedConversationsFile), 0755, true);
    }
    
    // Initialize shared conversations array
    $sharedConversations = [];
    
    // If the file exists, read it
    if (file_exists($sharedConversationsFile)) {
        $sharedConversations = json_decode(file_get_contents($sharedConversationsFile), true) ?: [];
    }
    
    // Add or update the shared conversation
    $sharedConversations[$conversationId] = [
        'conversation_id' => $conversationId,
        'shared_at' => date('Y-m-d H:i:s'),
        'expires_at' => date('Y-m-d H:i:s', strtotime('+30 days')), // Set expiry for 30 days
        'has_audio' => doesConversationHaveAudio($conversationId)
    ];
    
    // Save the updated shared conversations tracker
    file_put_contents($sharedConversationsFile, json_encode($sharedConversations, JSON_PRETTY_PRINT));
    
    // Generate share URL
    $shareUrl = getSiteUrl() . '/shared-conversation.php?id=' . $conversationId;
    
    // Return success
    echo json_encode([
        'success' => true,
        'shareUrl' => $shareUrl,
        'expiresAt' => $sharedConversations[$conversationId]['expires_at']
    ]);
    
} catch (Exception $e) {
    handleError('An error occurred while sharing the conversation', $e->getMessage());
}

/**
 * Check if a conversation has audio files
 * 
 * @param string $conversationId The conversation ID
 * @return bool True if audio files exist, false otherwise
 */
function doesConversationHaveAudio($conversationId) {
    $audioPath = ABSPATH . '/conversations/' . $conversationId . '/audio';
    
    if (!file_exists($audioPath)) {
        return false;
    }
    
    $audioFiles = glob($audioPath . '/*.mp3');
    return !empty($audioFiles);
}

/**
 * Get the site URL
 * 
 * @return string The site URL
 */
function getSiteUrl() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $baseUrl = $protocol . '://' . $host;
    
    // If there's a sub-directory, include it
    $scriptName = $_SERVER['SCRIPT_NAME'];
    $baseDir = dirname(dirname($scriptName));
    $baseDir = $baseDir !== '/' ? $baseDir : '';
    
    return $baseUrl . $baseDir;
}