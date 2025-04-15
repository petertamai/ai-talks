<?php
/**
 * Conversation Cleanup Script
 * 
 * This script removes unshared conversations based on age and cleans up expired shared conversations.
 * Intended to be run as a cron job.
 * 
 * @author Piotr Tamulewicz <pt@petertam.pro>
 */

// Ensure this script is being run from the command line
if (php_sapi_name() !== 'cli') {
    exit('This script can only be run from the command line.');
}

// Include required files
$scriptDir = dirname(__FILE__);
require_once $scriptDir . '/../includes/config.php';
require_once $scriptDir . '/../includes/functions.php';

// Define log function
function log_message($message) {
    echo '[' . date('Y-m-d H:i:s') . '] ' . $message . PHP_EOL;
}

// Set script parameters
$unsharedMaxAgeDays = 30; // Remove unshared conversations older than this
$checkTime = time();

log_message('Starting conversation cleanup process');

// Path to the conversations directory
$conversationsDir = $scriptDir . '/../conversations';

// Path to shared conversations tracker
$sharedConversationsFile = $scriptDir . '/../data/shared_conversations.json';

// Check if the shared conversations file exists
$sharedConversations = [];
if (file_exists($sharedConversationsFile)) {
    $sharedConversations = json_decode(file_get_contents($sharedConversationsFile), true) ?: [];
    log_message('Loaded shared conversations tracker: ' . count($sharedConversations) . ' entries');
} else {
    log_message('Shared conversations tracker not found. Creating a new one.');
}

// Process expired shared conversations
$expiredShares = [];
foreach ($sharedConversations as $id => $info) {
    if (isset($info['expires_at']) && strtotime($info['expires_at']) < $checkTime) {
        $expiredShares[] = $id;
    }
}

// Remove expired shares from the tracker
foreach ($expiredShares as $id) {
    unset($sharedConversations[$id]);
    log_message("Removed expired share for conversation: $id");
}

// Save the updated shared conversations tracker
if (!empty($expiredShares)) {
    file_put_contents($sharedConversationsFile, json_encode($sharedConversations, JSON_PRETTY_PRINT));
    log_message('Updated shared conversations tracker after removing ' . count($expiredShares) . ' expired shares');
}

// Process conversations directory
if (is_dir($conversationsDir)) {
    $conversationFolders = scandir($conversationsDir);
    $unsharedCount = 0;
    $keptCount = 0;
    
    foreach ($conversationFolders as $folder) {
        // Skip . and ..
        if ($folder === '.' || $folder === '..') {
            continue;
        }
        
        $conversationPath = $conversationsDir . '/' . $folder;
        
        // Skip if not a directory
        if (!is_dir($conversationPath)) {
            continue;
        }
        
        // Get conversation info
        $conversationFile = $conversationPath . '/conversation.json';
        
        // Skip if conversation file doesn't exist
        if (!file_exists($conversationFile)) {
            log_message("Warning: No conversation.json found in $folder - skipping");
            continue;
        }
        
        // Read conversation data
        $conversationData = json_decode(file_get_contents($conversationFile), true);
        
        // Check if shared
        $isShared = isset($conversationData['shared']) && $conversationData['shared'] === true;
        
        // If it's in the shared conversations tracker, consider it shared
        if (isset($sharedConversations[$folder])) {
            $isShared = true;
        }
        
        // Get conversation creation time
        $creationTime = 0;
        
        if (isset($conversationData['created_at'])) {
            $creationTime = strtotime($conversationData['created_at']);
        } elseif (isset($conversationData['messages'][0]['timestamp'])) {
            $creationTime = strtotime($conversationData['messages'][0]['timestamp']);
        } else {
            // If no timestamp in the data, use the file creation time
            $creationTime = filectime($conversationFile);
        }
        
        // Check if the conversation should be removed
        $ageInDays = ($checkTime - $creationTime) / (60 * 60 * 24);
        
        if (!$isShared && $ageInDays > $unsharedMaxAgeDays) {
            // Remove the conversation directory
            removeDirectory($conversationPath);
            log_message("Removed unshared conversation: $folder (age: " . round($ageInDays, 1) . " days)");
            $unsharedCount++;
        } else {
            $keptCount++;
        }
    }
    
    log_message("Cleanup complete. Removed $unsharedCount unshared conversations. Kept $keptCount conversations.");
} else {
    log_message("Error: Conversations directory not found: $conversationsDir");
}

/**
 * Recursively remove a directory and its contents
 *
 * @param string $dir Directory path
 * @return bool True on success, false on failure
 */
function removeDirectory($dir) {
    if (!is_dir($dir)) {
        return false;
    }
    
    $files = array_diff(scandir($dir), ['.', '..']);
    
    foreach ($files as $file) {
        $path = $dir . '/' . $file;
        
        if (is_dir($path)) {
            removeDirectory($path);
        } else {
            unlink($path);
        }
    }
    
    return rmdir($dir);
}

log_message('Conversation cleanup process finished');