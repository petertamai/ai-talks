<?php
/**
 * Groq Text-to-Speech API Proxy - Fixed Version
 * 
 * Acts as a proxy between the client and Groq TTS API.
 * Also saves audio files for sharing.
 * 
 * @author Piotr Tamulewicz
 * @link https://petertam.pro/
 */

// Include configuration
require_once '../includes/config.php';
// Verify nonce
if (!isset($_SERVER['HTTP_X_AJAX_NONCE']) || !verify_nonce($_SERVER['HTTP_X_AJAX_NONCE'], 'ajax_request')) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid security token']);
    exit;
}
// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Create logs directory if it doesn't exist
if (!is_dir(__DIR__ . '/../logs')) {
    @mkdir(__DIR__ . '/../logs', 0755, true);
}

// Set up logging function
function logTts($message) {
    $logFile = __DIR__ . '/../logs/tts.log';
    $timestamp = date('Y-m-d H:i:s');
    @file_put_contents($logFile, "[$timestamp] $message" . PHP_EOL, FILE_APPEND);
    error_log("TTS: $message");
}

// Log start of request
logTts("TTS request received: " . print_r($_SERVER['REQUEST_METHOD'], true));

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    logTts("Error: Method not allowed");
    exit;
}

try {
    // Get POST data from client
    $rawData = file_get_contents('php://input');
    logTts("Raw request data received: " . substr($rawData, 0, 100) . "...");
    
    $requestData = json_decode($rawData, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON data: ' . json_last_error_msg());
    }
    
    // Validate required fields
    if (empty($requestData['voice'])) {
        throw new Exception('Missing required field: voice');
    }
    
    if (empty($requestData['input'])) {
        throw new Exception('Missing required field: input');
    }
    
    // Extract conversation details if provided
    $conversationId = null;
    $messageIndex = 0;
    $agent = '';
    
    if (isset($requestData['conversation_id']) && !empty($requestData['conversation_id'])) {
        $conversationId = preg_replace('/[^a-zA-Z0-9_]/', '', $requestData['conversation_id']);
        logTts("Conversation ID: $conversationId");
    } else {
        logTts("WARNING: No conversation_id provided in request");
    }
    
    if (isset($requestData['message_index'])) {
        $messageIndex = intval($requestData['message_index']);
        logTts("Message index: $messageIndex");
    }
    
    if (isset($requestData['agent'])) {
        $agent = $requestData['agent'];
        logTts("Agent: $agent");
    } else {
        // Fallback agent detection based on voice
        $agent = (strpos($requestData['voice'], 'Angelo') !== false) ? 'ai2' : 'ai1';
        logTts("Agent determined from voice: $agent");
    }
    
    // Prepare API request data
    $apiData = [
        'model' => 'playai-tts',
        'voice' => $requestData['voice'],
        'input' => $requestData['input'],
        'response_format' => 'mp3'
    ];
    
    $jsonPayload = json_encode($apiData);
    logTts("Sending to Groq API: " . substr($jsonPayload, 0, 100) . "...");
    
    // Prepare API request
    $endpoint = GROQ_API_URL . 'audio/speech';
    logTts("API Endpoint: $endpoint");
    
    // Initialize cURL session
    $ch = curl_init($endpoint);
    
    // Set cURL options
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPayload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . GROQ_API_KEY
    ]);
    
    // Execute cURL request
    $response = curl_exec($ch);
    
    // Check for cURL errors
    if (curl_errno($ch)) {
        throw new Exception('cURL error: ' . curl_error($ch));
    }
    
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $contentLength = curl_getinfo($ch, CURLINFO_CONTENT_LENGTH_DOWNLOAD);
    
    logTts("Response code: $httpCode, Content-Type: $contentType, Content-Length: $contentLength");
    
    // Close cURL session
    curl_close($ch);
    
    // Process response
    if ($httpCode >= 200 && $httpCode < 300) {
        // Check if response is audio
        if (strpos($contentType, 'audio/') === 0) {
            // If we have conversation details, save the audio file
            if ($conversationId) {
                logTts("Saving audio for conversation: $conversationId, message: $messageIndex, agent: $agent");
                
                // Create base directories path - Full server path 
                $basePath = realpath(__DIR__ . '/../conversations');
                if (!$basePath) {
                    $basePath = __DIR__ . '/../conversations';
                    if (!file_exists($basePath)) {
                        logTts("Creating base conversations directory: $basePath");
                        if (!@mkdir($basePath, 0755, true)) {
                            logTts("CRITICAL ERROR: Failed to create base conversations directory: $basePath");
                            logTts("Current directory: " . __DIR__);
                            logTts("Directory permissions: " . substr(sprintf('%o', fileperms(__DIR__)), -4));
                        }
                    }
                }
                
                // Create directories if they don't exist with full error reporting
                $conversationDir = $basePath . "/{$conversationId}";
                $audioDir = "{$conversationDir}/audio";
                
                // Ensure conversation directory exists
                if (!file_exists($conversationDir)) {
                    logTts("Creating conversation directory: $conversationDir");
                    if (!@mkdir($conversationDir, 0755, true)) {
                        $error = error_get_last();
                        logTts("ERROR: Failed to create conversation directory: $conversationDir - " . 
                              ($error ? $error['message'] : "Unknown error"));
                        throw new Exception("Failed to create conversation directory: " . 
                                           ($error ? $error['message'] : "Unknown error"));
                    }
                }
                
                // Ensure audio directory exists
                if (!file_exists($audioDir)) {
                    logTts("Creating audio directory: $audioDir");
                    if (!@mkdir($audioDir, 0755, true)) {
                        $error = error_get_last();
                        logTts("ERROR: Failed to create audio directory: $audioDir - " . 
                              ($error ? $error['message'] : "Unknown error"));
                        throw new Exception("Failed to create audio directory: " . 
                                           ($error ? $error['message'] : "Unknown error"));
                    }
                }
                
                // Ensure directory is writable with detailed error logging
                if (!is_writable($audioDir)) {
                    logTts("ERROR: Audio directory is not writable: $audioDir");
                    
                    // Try to fix permissions
                    @chmod($audioDir, 0755);
                    if (!is_writable($audioDir)) {
                        @chmod($audioDir, 0777); // Last resort
                        if (!is_writable($audioDir)) {
                            logTts("CRITICAL: Unable to make audio directory writable even after chmod: $audioDir");
                            logTts("Owner: " . posix_getpwuid(fileowner($audioDir))['name'] . ", Group: " . 
                                  posix_getgrgid(filegroup($audioDir))['name']);
                            throw new Exception("Audio directory is not writable and couldn't be fixed with chmod");
                        } else {
                            logTts("Fixed permissions with chmod 777: $audioDir");
                        }
                    } else {
                        logTts("Fixed permissions with chmod 755: $audioDir");
                    }
                }
                
                // Verify audio content before saving
                if (empty($response) || strlen($response) < 100) {
                    logTts("ERROR: Response content too small or empty: " . strlen($response) . " bytes");
                    throw new Exception("Received empty or invalid audio content from API");
                }
                
                // Save audio file with full path
                $audioFilePath = "{$audioDir}/message_{$messageIndex}.mp3";
                logTts("Saving to: $audioFilePath");
                
                // Write file with error handling
                $result = @file_put_contents($audioFilePath, $response);
                
                if ($result === false) {
                    $error = error_get_last();
                    logTts("ERROR: Failed to save audio file: " . ($error ? $error['message'] : "Unknown error"));
                    throw new Exception("Failed to save audio file: " . ($error ? $error['message'] : "Unknown error"));
                } else {
                    logTts("Successfully saved audio file: $audioFilePath, size: $result bytes");
                    
                    // Double-check file saved properly
                    if (!file_exists($audioFilePath)) {
                        logTts("ERROR: File does not exist after saving: $audioFilePath");
                    } else if (filesize($audioFilePath) === 0) {
                        logTts("ERROR: File saved but is empty: $audioFilePath");
                    } else {
                        logTts("File saved and verified: $audioFilePath, size: " . filesize($audioFilePath) . " bytes");
                        
                        // Update shared_conversations.json to indicate this conversation has audio
                        updateSharedConversationAudio($conversationId);
                    }
                }
            } else {
                logTts("No conversation_id provided, not saving audio file");
            }
            
            // Output audio data to browser
            header('Content-Type: ' . $contentType);
            header('Content-Length: ' . strlen($response));
            echo $response;
            logTts("Success: Returned audio data to browser, length: " . strlen($response) . " bytes");
        } else {
            // Return JSON response
            header('Content-Type: application/json');
            echo $response;
            logTts("Warning: Received non-audio response: " . substr($response, 0, 200));
        }
    } else {
        // Handle error response
        header('Content-Type: application/json');
        
        // Try to decode JSON error message
        $errorData = json_decode($response, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($errorData)) {
            $errorResponse = ['error' => 'Groq API Error: ' . print_r($errorData, true)];
        } else {
            $errorResponse = ['error' => 'Groq API Error: HTTP ' . $httpCode];
        }
        
        echo json_encode($errorResponse);
        logTts("Error: " . json_encode($errorResponse));
    }
    
} catch (Exception $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    $errorMessage = $e->getMessage();
    echo json_encode(['error' => $errorMessage]);
    
    logTts("Exception: $errorMessage");
    logTts("Stack trace: " . $e->getTraceAsString());
}

// Log end of request
logTts("Request processing completed");

/**
 * Update the shared_conversations.json file to indicate a conversation has audio
 * 
 * @param string $conversationId The ID of the conversation
 * @return void
 */
function updateSharedConversationAudio($conversationId) {
    try {
        $dataDir = __DIR__ . '/../data';
        $sharedConversationsFile = "$dataDir/shared_conversations.json";
        
        // Create data directory if it doesn't exist
        if (!file_exists($dataDir)) {
            if (!@mkdir($dataDir, 0755, true)) {
                logTts("ERROR: Failed to create data directory: $dataDir");
                return;
            }
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
        
        // Update the has_audio flag for this conversation
        if (isset($sharedConversations[$conversationId])) {
            $sharedConversations[$conversationId]['has_audio'] = true;
            
            // Save the updated shared conversations tracker
            file_put_contents($sharedConversationsFile, json_encode($sharedConversations, JSON_PRETTY_PRINT));
            logTts("Updated shared_conversations.json - set has_audio=true for $conversationId");
        } else {
            logTts("Conversation $conversationId not found in shared_conversations.json");
        }
    } catch (Exception $e) {
        logTts("Error updating shared_conversations.json: " . $e->getMessage());
    }
}