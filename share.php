<?php
/**
 * Shared Conversation Page
 * 
 * @author Piotr Tamulewicz <pt@petertam.pro>
 */

// Include necessary configuration
require_once 'includes/config.php';

// Get the conversation ID from the URL
$conversationId = isset($_GET['id']) ? preg_replace('/[^a-zA-Z0-9_]/', '', $_GET['id']) : '';

// Initialize variables
$errorMessage = '';
$conversationData = null;
$hasAudio = false;
$sharedInfo = null;

// If no ID provided, set error
if (empty($conversationId)) {
    $errorMessage = 'No conversation ID provided.';
} else {
    // Path to shared conversations tracker
    $sharedConversationsFile = 'data/shared_conversations.json';
    $isShared = false;
    
    // Check if the conversation is in the shared list
    if (file_exists($sharedConversationsFile)) {
        $sharedConversations = json_decode(file_get_contents($sharedConversationsFile), true) ?: [];
        
        if (isset($sharedConversations[$conversationId])) {
            $sharedInfo = $sharedConversations[$conversationId];
            
            // Check if the share has expired
            if (isset($sharedInfo['expires_at']) && strtotime($sharedInfo['expires_at']) < time()) {
                $errorMessage = 'The shared conversation you are trying to access has expired.';
            } else {
                $isShared = true;
                $hasAudio = $sharedInfo['has_audio'] ?? false;
            }
        } else {
            $errorMessage = 'The shared conversation you are trying to access does not exist or has been removed.';
        }
    } else {
        $errorMessage = 'Shared conversation data is not available.';
    }
    
    // If it's a valid shared conversation, load the data
    if ($isShared) {
        // Path to conversation file
        $conversationFile = "conversations/$conversationId/conversation.json";
        
        // If conversation file doesn't exist, set error
        if (!file_exists($conversationFile)) {
            $errorMessage = 'The data for this conversation is missing or has been removed.';
        } else {
            // Load conversation data
            $conversationData = json_decode(file_get_contents($conversationFile), true);
            
            // Double-check for audio files directly
            $audioPath = "conversations/$conversationId/audio";
            if (file_exists($audioPath)) {
                $audioFiles = glob("$audioPath/*.mp3");
                if (!empty($audioFiles)) {
                    $hasAudio = true;
                    
                    // Update shared_conversations.json if necessary
                    if (isset($sharedConversations[$conversationId]) && !$sharedConversations[$conversationId]['has_audio']) {
                        $sharedConversations[$conversationId]['has_audio'] = true;
                        file_put_contents($sharedConversationsFile, json_encode($sharedConversations, JSON_PRETTY_PRINT));
                    }
                }
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shared Conversation - AI Conversation System</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.3/dist/sweetalert2.min.css" rel="stylesheet">
    <link href="assets/css/conversation-share.css" rel="stylesheet">
    <style>
        :root {
            --bg-color: #4D4D4D;
            --btn-bg: #397BFB;
            --accent-1: #cecaba;
            --accent-2: #b0fbc1;
        }
        body {
            background-color: var(--bg-color);
            font-family: 'Nunito', sans-serif;
        }
        .btn-primary {
            background-color: var(--btn-bg);
        }
        .chat-container {
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: var(--btn-bg) var(--bg-color);
        }
        .chat-container::-webkit-scrollbar {
            width: 8px;
        }
        .chat-container::-webkit-scrollbar-track {
            background: var(--bg-color);
        }
        .chat-container::-webkit-scrollbar-thumb {
            background-color: var(--btn-bg);
            border-radius: 20px;
        }
        .chat-message {
            border-radius: 0.5rem;
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            max-width: 85%;
            position: relative;
            word-break: break-word;
        }
        .chat-message.ai1 {
            background-color: var(--accent-1);
            color: #333;
            align-self: flex-start;
        }
        .chat-message.ai2 {
            background-color: var(--btn-bg);
            color: white;
            align-self: flex-end;
        }
        .chat-message.human {
            background-color: #6B7280;
            color: white;
            align-self: flex-start;
        }
        .agent-name {
            position: absolute;
            top: -0.75rem;
            font-size: 0.75rem;
            font-weight: bold;
            padding: 0.1rem 0.5rem;
            border-radius: 0.5rem;
        }
        .ai1 .agent-name {
            left: 0.5rem;
            background-color: var(--accent-1);
            color: #333;
        }
        .ai2 .agent-name {
            right: 0.5rem;
            background-color: var(--btn-bg);
            color: white;
        }
        .human .agent-name {
            left: 0.5rem;
            background-color: #6B7280;
            color: white;
        }
        .speaking {
            box-shadow: 0 0 0 2px var(--accent-2);
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(176, 251, 193, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(176, 251, 193, 0); }
            100% { box-shadow: 0 0 0 0 rgba(176, 251, 193, 0); }
        }
        .model-badge {
            position: absolute;
            bottom: -12px;
            font-size: 11px;
            background-color: rgba(0,0,0,0.5);
            padding: 2px 6px;
            border-radius: 10px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 120px;
        }
        .chat-message.ai1 .model-badge {
            left: 10px;
            color: var(--accent-1);
        }
        .chat-message.ai2 .model-badge {
            right: 10px;
            color: white;
        }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body class="text-white">
    <header class="bg-gray-800 shadow p-3">
        <div class="container mx-auto flex justify-between items-center">
            <h1 class="text-xl md:text-2xl font-bold">AI Conversation System</h1>
            <a href="index.php" class="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm">Back to Home</a>
        </div>
    </header>

    <main class="container mx-auto p-3">
        <?php if (!empty($errorMessage)): ?>
            <div class="bg-red-500 text-white p-4 rounded-lg mb-4">
                <h2 class="text-xl font-bold mb-2">Error</h2>
                <p><?php echo htmlspecialchars($errorMessage); ?></p>
            </div>
        <?php elseif ($conversationData): ?>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Sidebar with conversation settings -->
                <div class="md:col-span-1 sidebar">
                    <div class="bg-gray-700 rounded-lg p-3">
                        <h2 class="text-xl font-bold mb-3">Conversation Settings</h2>
                        
                        <?php if (isset($conversationData['settings'])): ?>
                            <div class="mb-3">
                                <h3 class="text-lg font-semibold">Message Direction</h3>
                                <p class="text-sm opacity-80"><?php echo htmlspecialchars($conversationData['settings']['messageDirection'] ?? 'N/A'); ?></p>
                            </div>
                            
                            <div class="mb-3">
                                <h3 class="text-lg font-semibold">Models</h3>
                                <ul class="text-sm opacity-80 list-disc pl-5">
                                    <?php if (isset($conversationData['settings']['models'])): ?>
                                        <?php foreach ($conversationData['settings']['models'] as $key => $value): ?>
                                            <li><strong><?php echo htmlspecialchars($key); ?>:</strong> <?php echo htmlspecialchars($value); ?></li>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </ul>
                            </div>
                            
                            <div class="mb-3">
                                <h3 class="text-lg font-semibold">Agent Names</h3>
                                <ul class="text-sm opacity-80 list-disc pl-5">
                                    <?php if (isset($conversationData['settings']['names'])): ?>
                                        <?php foreach ($conversationData['settings']['names'] as $key => $value): ?>
                                            <li><strong><?php echo htmlspecialchars($key); ?>:</strong> <?php echo htmlspecialchars($value); ?></li>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </ul>
                            </div>
                            
                            <div class="mb-3">
                                <h3 class="text-lg font-semibold">Prompts</h3>
                                <?php if (isset($conversationData['settings']['prompts'])): ?>
                                    <?php foreach ($conversationData['settings']['prompts'] as $key => $value): ?>
                                        <div class="mb-2">
                                            <p class="font-medium"><?php echo htmlspecialchars($key); ?>:</p>
                                            <div class="bg-gray-800 p-2 rounded text-xs overflow-auto max-h-20 prompt-content">
                                                <?php echo nl2br(htmlspecialchars($value)); ?>
                                            </div>
                                            <button class="text-xs mt-1 underline show-full-prompt">Show full prompt</button>
                                            <div class="hidden full-prompt bg-gray-800 p-2 rounded text-xs overflow-auto mt-1">
                                                <?php echo nl2br(htmlspecialchars($value)); ?>
                                            </div>
                                        </div>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </div>
                        <?php else: ?>
                            <p class="text-gray-400">No settings information available</p>
                        <?php endif; ?>
                    </div>
                </div>
                
                <!-- Main conversation content -->
                <div class="md:col-span-2">
                    <div class="conversation-container">
                        <div class="conversation-header">
                            <h2 class="text-xl font-bold">Shared Conversation</h2>
                            
                            <div class="conversation-action-buttons">
                                <?php if ($hasAudio): ?>
                                    <button id="play-conversation-btn" class="btn-play">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Play
                                    </button>
                                <?php endif; ?>
                            </div>
                        </div>
                        
                        <div class="conversation-messages">
                            <?php if (isset($conversationData['messages']) && is_array($conversationData['messages'])): ?>
                                <?php foreach ($conversationData['messages'] as $index => $message): ?>
                                    <?php
                                    $messageClass = 'message message-human';
                                    $agentName = 'Human';
                                    
                                    if (isset($message['role']) && $message['role'] === 'assistant') {
                                        if (isset($message['agent']) && $message['agent'] === 'ai2') {
                                            $messageClass = 'message message-ai';
                                            $agentName = $conversationData['settings']['names']['ai2'] ?? 'AI-2';
                                        } else {
                                            $messageClass = 'message message-ai';
                                            $agentName = $conversationData['settings']['names']['ai1'] ?? 'AI-1';
                                        }
                                    }
                                    
                                    // Skip [object Object] messages
                                    if ($message['content'] === '[object Object]') {
                                        continue;
                                    }
                                    ?>
                                    <div class="<?php echo $messageClass; ?>" data-index="<?php echo $index; ?>">
                                        <div class="message-header">
                                            <strong><?php echo htmlspecialchars($agentName); ?></strong>
                                            <?php if (isset($message['timestamp'])): ?>
                                                <span class="text-muted"><?php echo date('H:i', strtotime($message['timestamp'])); ?></span>
                                            <?php endif; ?>
                                        </div>
                                        <div class="message-content"><?php echo nl2br(htmlspecialchars($message['content'])); ?></div>
                                        <?php if (isset($message['model']) && !empty($message['model'])): ?>
                                            <div class="model-badge"><?php echo htmlspecialchars($message['model']); ?></div>
                                        <?php endif; ?>
                                    </div>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <div class="text-center text-gray-400 py-8">
                                    No messages found in this conversation.
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            </div>
        <?php endif; ?>
    </main>

    <footer class="bg-gray-800 py-2 px-3 mt-4">
        <div class="container mx-auto text-center text-sm opacity-75">
            <p>&copy; <?php echo date('Y'); ?> Piotr Tamulewicz | <a href="https://petertam.pro/" class="underline">petertam.pro</a></p>
        </div>
    </footer>

    <!-- Audio player (hidden) -->
    <audio id="audio-player" class="hidden"></audio>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.3/dist/sweetalert2.all.min.js"></script>
    
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        // Show full prompts
        const showPromptButtons = document.querySelectorAll('.show-full-prompt');
        showPromptButtons.forEach(button => {
            button.addEventListener('click', function() {
                const promptContent = this.previousElementSibling;
                const fullPrompt = this.nextElementSibling;
                
                if (fullPrompt.classList.contains('hidden')) {
                    promptContent.classList.add('hidden');
                    fullPrompt.classList.remove('hidden');
                    this.textContent = 'Show less';
                } else {
                    promptContent.classList.remove('hidden');
                    fullPrompt.classList.add('hidden');
                    this.textContent = 'Show full prompt';
                }
            });
        });
        
        <?php if ($hasAudio): ?>
        // Audio playback functionality
        const conversationId = '<?php echo $conversationId; ?>';
        const playButton = document.getElementById('play-conversation-btn');
        const audioPlayer = document.getElementById('audio-player');
        
        let isPlaying = false;
        let audioQueue = [];
        let currentAudioIndex = 0;
        
        // Load audio files
        async function loadAudioFiles() {
            try {
                console.log('Attempting to load audio files for conversation:', conversationId);
                const response = await fetch(`api/get-conversation-audio.php?conversation_id=${conversationId}`);
                
                if (!response.ok) {
                    console.error('Error loading audio files. Status:', response.status);
                    return false;
                }
                
                const data = await response.json();
                console.log('Audio files data:', data);
                
                if (data.success && data.audioFiles && data.audioFiles.length > 0) {
                    audioQueue = data.audioFiles;
                    console.log(`Loaded ${audioQueue.length} audio files:`, audioQueue);
                    return true;
                }
                
                console.log('No audio files found in response');
                return false;
            } catch (error) {
                console.error('Error loading audio files:', error);
                return false;
            }
        }
        
        // Play/Stop toggle
        if (playButton) {
            playButton.addEventListener('click', async function() {
                console.log('Play button clicked, current state:', isPlaying);
                
                if (isPlaying) {
                    // Stop playing
                    audioPlayer.pause();
                    isPlaying = false;
                    playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Play';
                    
                    // Remove highlights
                    document.querySelectorAll('.message.highlighted').forEach(el => {
                        el.classList.remove('highlighted');
                    });
                } else {
                    // Start playing
                    if (audioQueue.length === 0) {
                        console.log('No audio files in queue, loading...');
                        const hasAudio = await loadAudioFiles();
                        
                        if (!hasAudio) {
                            console.error('No audio files available');
                            Swal.fire({
                                title: 'No Audio Available',
                                text: 'There are no audio recordings available for this conversation.',
                                icon: 'info'
                            });
                            return;
                        }
                    }
                    
                    console.log('Starting audio playback');
                    currentAudioIndex = 0;
                    playCurrentAudio();
                    isPlaying = true;
                    playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Stop';
                }
            });
        }
        
        // Play current audio file
        function playCurrentAudio() {
            if (currentAudioIndex < audioQueue.length) {
                const audioFile = audioQueue[currentAudioIndex];
                console.log(`Playing audio file (${currentAudioIndex + 1}/${audioQueue.length}):`, audioFile);
                
                audioPlayer.src = `conversations/${conversationId}/audio/${audioFile}`;
                
                audioPlayer.onended = () => {
                    console.log('Audio playback ended, moving to next file');
                    playNextAudio();
                };
                
                audioPlayer.onerror = (e) => {
                    console.error('Audio playback error:', e);
                    console.log('Skipping to next audio file due to error');
                    playNextAudio(); // Skip to next on error
                };
                
                // Try to play the audio
                audioPlayer.play().then(() => {
                    console.log('Audio playback started successfully');
                }).catch(err => {
                    console.error('Failed to play audio:', err);
                    console.log('Skipping to next audio file due to playback failure');
                    playNextAudio(); // Skip to next on error
                });
                
                // Highlight the corresponding message
                highlightCurrentMessage(audioFile);
            } else {
                // End of queue
                console.log('Reached end of audio queue');
                resetPlayState();
            }
        }
        
        // Play next audio file
        function playNextAudio() {
            currentAudioIndex++;
            console.log(`Moving to audio file index: ${currentAudioIndex}`);
            
            if (currentAudioIndex < audioQueue.length) {
                playCurrentAudio();
            } else {
                console.log('No more audio files to play');
                resetPlayState();
            }
        }
        
        // Reset play state
        function resetPlayState() {
            console.log('Resetting playback state');
            isPlaying = false;
            currentAudioIndex = 0;
            
            if (playButton) {
                playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Play';
            }
            
            // Remove highlights
            document.querySelectorAll('.message.highlighted').forEach(el => {
                el.classList.remove('highlighted');
            });
        }
        
        // Highlight message currently being played
        function highlightCurrentMessage(audioFile) {
            console.log('Highlighting message for audio file:', audioFile);
            
            // Remove previous highlights
            document.querySelectorAll('.message.highlighted').forEach(el => {
                el.classList.remove('highlighted');
            });
            
            // Extract index from filename
            let indexMatch = audioFile.match(/_([\d]+)/);
            if (indexMatch && indexMatch[1]) {
                const messageIndex = parseInt(indexMatch[1]);
                console.log('Extracted message index:', messageIndex);
                
                const messages = document.querySelectorAll('.message');
                
                if (messageIndex < messages.length) {
                    console.log('Highlighting message at index:', messageIndex);
                    messages[messageIndex].classList.add('highlighted');
                    messages[messageIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    console.log('Message index out of range:', messageIndex, 'total messages:', messages.length);
                }
            } else {
                console.log('Could not extract message index from filename:', audioFile);
            }
        }
        
        // Preload audio files when page loads
        loadAudioFiles().then(hasAudio => {
            if (hasAudio) {
                console.log('Audio files loaded successfully');
            } else {
                console.log('No audio files available for this conversation');
                
                // Double-check by scanning directory directly
                if (playButton && !hasAudio) {
                    console.log('Hiding play button due to no audio files');
                    playButton.style.display = 'none';
                }
            }
        });
        <?php endif; ?>
    });
    </script>
</body>
</html>