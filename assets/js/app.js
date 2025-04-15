/**
 * AI Conversation System - Main Application Logic
 * 
 * Handles the conversation between AI agents with OpenRouter integration
 * 
 * @author Piotr Tamulewicz
 * @link https://petertam.pro/
 */

$(document).ready(function() {

    setTimeout(checkApiKey, 500);
    function checkApiKey() {
        const openrouterKey = $('#openrouter-api-key').val();
        
        if (!openrouterKey || openrouterKey.trim() === '') {
            Swal.fire({
                title: 'API Key Required',
                text: 'Please enter your OpenRouter API key to continue',
                icon: 'info',
                input: 'password',
                inputPlaceholder: 'Enter your OpenRouter API key',
                confirmButtonText: 'Save Key',
                showCancelButton: true,
                cancelButtonText: 'Later',
                allowOutsideClick: false,
                inputValidator: (value) => {
                    if (!value || value.trim() === '') {
                        return 'You need to enter an API key!';
                    }
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    $('#openrouter-api-key').val(result.value);
                    saveApiKey('openrouter_api_key', result.value);
                    // Toggle settings to show
                    $('#settings-panel').toggleClass('open');
                    // Fetch available models with the new key
                    fetchAvailableModels();
                } else {
                    // Show settings panel if they click "Later"
                    $('#settings-panel').toggleClass('open');
                }
            });
        } else {
            // If we have a key, fetch models directly
            fetchAvailableModels();
        }
    }
    async function saveApiKey(keyName, keyValue) {
        try {
            // Show loading indicator
            Swal.fire({
                title: 'Saving...',
                text: 'Saving your API key',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            const response = await fetch('api/save-keys.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    [keyName]: keyValue
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                Swal.fire({
                    title: 'Success',
                    text: data.messages.join('\n'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                
                // If the OpenRouter key was updated, refresh models
                if (keyName === 'openrouter_api_key') {
                    fetchAvailableModels();
                }
            } else {
                throw new Error('Failed to save API key');
            }
            
        } catch (error) {
            console.error('Error saving API key:', error);
            Swal.fire({
                title: 'Error',
                text: 'Error saving API key: ' + error.message,
                icon: 'error'
            });
        }
    }
    
    // Debug logging
    function debugLog(message, data = null) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        
        console.log(logMessage);
        if (data) {
            console.log(data);
        }
        
        // Also add to page for visible debugging
        $('<div class="debug-log"></div>')
            .text(logMessage)
            .appendTo('#debug-panel')
            .css({
                'font-size': '12px',
                'font-family': 'monospace',
                'padding': '4px',
                'border-bottom': '1px solid #666'
            });
        
        // Keep only last 20 logs
        const logs = $('#debug-panel .debug-log');
        if (logs.length > 20) {
            logs.first().remove();
        }
        
        // Scroll to bottom
        $('#debug-panel').scrollTop($('#debug-panel')[0].scrollHeight);
    }
    
    // Test audio support
    function testAudioSupport() {
        debugLog("Testing audio support...");
        
        const audioTest = document.createElement('audio');
        const canPlayMp3 = audioTest.canPlayType('audio/mpeg') !== '';
        const canPlayWav = audioTest.canPlayType('audio/wav') !== '';
        
        debugLog(`Audio support - MP3: ${canPlayMp3 ? 'Yes' : 'No'}, WAV: ${canPlayWav ? 'Yes' : 'No'}`);
        
        // Check if audio elements exist
        const ai1Audio = document.getElementById('ai1-audio');
        const ai2Audio = document.getElementById('ai2-audio');
        
        if (!ai1Audio || !ai2Audio) {
            debugLog("WARNING: Audio elements not found in the DOM");
        } else {
            debugLog("Audio elements found in the DOM");
        }
        
        return {mp3: canPlayMp3, wav: canPlayWav};
    }
    
    // Run audio support test
    const audioSupport = testAudioSupport();
    
    // Conversation state
    let conversationActive = false;
    let conversationHistory = [];
    
    // Audio elements
    const audioElements = {
        ai1: document.getElementById('ai1-audio'),
        ai2: document.getElementById('ai2-audio')
    };
    
    // Toggle settings panel
    $('#toggle-settings').click(function() {
        $('#settings-panel').toggleClass('open');
    });
    
    // Toggle debug panel
    $('#toggle-debug').click(function() {
        $('#debug-panel').toggle();
    });
    
    // Enable/disable TTS based on checkboxes
    $('#ai1-tts-enabled').change(function() {
        $('#ai1-voice').prop('disabled', !this.checked);
    });
    
    $('#ai2-tts-enabled').change(function() {
        $('#ai2-voice').prop('disabled', !this.checked);
    });
    
    // Save API keys
    $('#save-openrouter-key').click(function() {
        const key = $('#openrouter-api-key').val();
        if (!key || key.trim() === '') {
            Swal.fire({
                title: 'Error',
                text: 'OpenRouter API key cannot be empty',
                icon: 'error'
            });
            return;
        }
        
        saveApiKey('openrouter_api_key', key);
    });
    
    $('#save-groq-key').click(function() {
        saveApiKey('groq_api_key', $('#groq-api-key').val());
    });
    
    // API key saving function
    async function saveApiKey(keyName, keyValue) {
        try {
            const response = await fetch('api/save-keys.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    [keyName]: keyValue
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                alert(data.messages.join('\n'));
                // If the OpenRouter key was updated, refresh models
                if (keyName === 'openrouter_api_key') {
                    fetchAvailableModels();
                }
            } else {
                throw new Error('Failed to save API key');
            }
            
        } catch (error) {
            console.error('Error saving API key:', error);
            alert('Error saving API key: ' + error.message);
        }
    }
    
    // Calculate speaking time based on text
    function calculateSpeakingTime(text) {
        // Count words (rough approximation)
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const wordCount = words.length;
        
        // Average speaking rate is about 150 words per minute
        // That's 2.5 words per second, so we use the inverse: 0.4 seconds per word
        const secondsPerWord = 0.4;
        
        // Add some buffer time for pauses and natural speech patterns
        const pauseTime = Math.min(2, wordCount * 0.05); // Scales with message length but caps at 2 seconds
        
        // Calculate total speaking time in milliseconds
        const speakingTimeMs = (wordCount * secondsPerWord + pauseTime) * 1000;
        
        // Ensure a minimum speaking time of 1.5 seconds
        return Math.max(1500, speakingTimeMs);
    }
    
// Fetch available models from OpenRouter
async function fetchAvailableModels() {
    try {
        debugLog('Fetching available models from OpenRouter...');
        
        // First check if we have an API key
        const openrouterKey = $('#openrouter-api-key').val();
        if (!openrouterKey || openrouterKey.trim() === '') {
            throw new Error('OpenRouter API key not found');
        }
        
        const response = await fetch('api/openrouter-models-proxy.php');
        
        if (!response.ok) {
            // Check if it's a 400 error which might be an API key issue
            if (response.status === 400) {
                const errorData = await response.json();
                if (errorData.error && errorData.error.includes('API key')) {
                    throw new Error('Invalid OpenRouter API key');
                }
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        debugLog('Models API response:', data);
        
        // Populate model dropdowns
        if (data.data && Array.isArray(data.data)) {
            // Clear existing options
            $('#ai1-model, #ai2-model').empty();
            
            // Sort models by name
            const sortedModels = [...data.data].sort((a, b) => {
                return a.id.localeCompare(b.id);
            });
            
            // Add models to dropdowns
            sortedModels.forEach(model => {
                const modelOption = `<option value="${model.id}">${model.id}</option>`;
                $('#ai1-model, #ai2-model').append(modelOption);
            });
            
            debugLog(`Models loaded: ${data.data.length} models`);
        } else {
            debugLog('Unexpected model data format:', data);
            
            // Fallback to hardcoded models
            addFallbackModels();
        }
    } catch (error) {
        debugLog('Error fetching models:', error.message);
        
        // Show error message if it's an API key issue
        if (error.message.includes('API key')) {
            Swal.fire({
                title: 'API Key Error',
                text: 'There was a problem with your OpenRouter API key. Please check that it is correct.',
                icon: 'error',
                confirmButtonText: 'Update Key',
            }).then(() => {
                // Show settings panel
                $('#settings-panel').toggleClass('open');
            });
        }
        
        // Fallback to hardcoded models if API fails
        addFallbackModels();
    }
}
    
    // Add fallback models
    function addFallbackModels() {
        const fallbackModels = [
            { id: 'openai/gpt-4o', name: 'GPT-4o' },
            { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo' },
            { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
            { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet' },
            { id: 'google/gemini-pro', name: 'Gemini Pro' }
        ];
        
        // Add fallback models to dropdowns
        $('#ai1-model, #ai2-model').empty();
        fallbackModels.forEach(model => {
            const modelOption = `<option value="${model.id}">${model.name}</option>`;
            $('#ai1-model, #ai2-model').append(modelOption);
        });
        
        debugLog('Using fallback models', fallbackModels);
    }
    
    // Initial fetch of available models
    fetchAvailableModels();
    
    // Add message to chat
// Add message to chat
function addMessageToChat(sender, text) {
    const chatContainer = $('#chat-container');
    let messageClass, agentName;
    
    if (sender === 'ai1') {
        messageClass = 'ai1';
        agentName = $('#ai1-name').val() || 'AI-1';
    } else if (sender === 'ai2') {
        messageClass = 'ai2';
        agentName = $('#ai2-name').val() || 'AI-2';
    } else {
        messageClass = 'human';
        agentName = 'Human';
    }
    
    // Add message to container with clear identification
    chatContainer.append(`
        <div class="chat-message ${messageClass}">
            <div class="agent-name">${agentName}</div>
            ${text}
        </div>
    `);
    
    // Scroll to bottom
    chatContainer.scrollTop(chatContainer[0].scrollHeight);
    
    // Add to conversation history
    conversationHistory.push({
        sender: sender,
        text: text,
        timestamp: new Date().toISOString()
    });
}
    
    // Get AI response from OpenRouter
    async function getAIResponse(aiId, prompt) {
        try {
            // Get model and system prompt
            const model = $(`#${aiId}-model`).val();
            const systemPrompt = $(`#${aiId}-prompt`).val();
            const aiName = $(`#${aiId}-name`).val() || (aiId === 'ai1' ? 'AI-1' : 'AI-2');
            
            // Get the other AI's name
            const otherAiId = aiId === 'ai1' ? 'ai2' : 'ai1';
            const otherAiName = $(`#${otherAiId}-name`).val() || (otherAiId === 'ai1' ? 'AI-1' : 'AI-2');
            
            debugLog(`Getting ${aiId} (${aiName}) response using model: ${model}`);
            debugLog(`Prompt: ${prompt.substring(0, 50)}...`);
            
            // Create messages array with system prompt that identifies the AIs by name
            const messages = [
                {
                    role: 'system',
                    content: `${systemPrompt} You are ${aiName} and you are talking to ${otherAiName}. Keep your responses concise and engaging.`
                }
            ];
            
            // Add recent conversation history formatted with names
            // We need to convert our format to the OpenAI format
            const relevantHistory = conversationHistory.slice(-10); // Last 10 messages
            
            for (const message of relevantHistory) {
                let role, name, content = message.text;
                
                if (message.sender === aiId) {
                    role = 'assistant';
                    name = aiName;
                } else if (message.sender === otherAiId) {
                    role = 'user';
                    name = otherAiName;
                } else {
                    role = 'user';
                    name = 'Human';
                }
                
                messages.push({
                    role: role,
                    content: content,
                    name: name
                });
            }
            
            // Add the current prompt from the other AI or human
            messages.push({
                role: 'user',
                content: prompt,
                name: otherAiName // The prompt is coming from the other AI
            });
            
            debugLog(`Sending ${messages.length} messages to ${model}`);
            
            // Send request to OpenRouter via our PHP proxy
            const response = await fetch('api/openrouter-proxy.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    max_tokens: 150, // Limit response length for quicker exchanges
                    temperature: 0.7 // Add some randomness for more engaging conversation
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            debugLog(`OpenRouter response received:`, data);
            
            // Extract and return AI response
            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                const aiResponse = data.choices[0].message.content.trim();
                debugLog(`AI response text: ${aiResponse.substring(0, 50)}...`);
                return aiResponse;
            } else {
                throw new Error('Invalid response format from API');
            }
            
        } catch (error) {
            debugLog(`Error getting ${aiId} response:`, error.message);
            return `Sorry, I'm having trouble responding right now.`;
        }
    }
    
    // Speak text using Groq TTS if enabled
    async function speakText(aiId, text) {
        // Check if TTS is enabled for this AI
        const ttsEnabled = $(`#${aiId}-tts-enabled`).is(':checked');
        if (!ttsEnabled) {
            debugLog(`TTS disabled for ${aiId}, skipping speech`);
            return Promise.resolve(); // Resolve immediately
        }
        
        try {
            const voice = $(`#${aiId}-voice`).val();
            
            // Double-check voice is valid
            if (!voice || voice.trim() === '') {
                throw new Error('Voice parameter is empty');
            }
            
            debugLog(`Speaking with ${aiId} using voice: ${voice}`);
            
            // Calculate speaking time for fallback
            const speakingTime = calculateSpeakingTime(text);
            debugLog(`Calculated speaking time: ${speakingTime}ms for ${text.split(/\s+/).length} words`);
            
            // Update UI to show speaking state
            updateSpeakingState(aiId, true);
            
            // Verify text
            if (!text || text.trim() === '') {
                throw new Error('Text parameter is empty');
            }
            
            // Send request to our PHP proxy
            const response = await fetch('api/groq-tts-proxy.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    voice: voice,
                    input: text
                })
            });
            
            debugLog(`TTS response status: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                debugLog(`TTS error response: ${errorText}`);
                throw new Error(`TTS API error: ${response.status}`);
            }
            
            // Get audio blob from response
            const audioBlob = await response.blob();
            debugLog(`Received audio blob: ${audioBlob.size} bytes`);
            
            // Create object URL for audio blob
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Play the audio
            return new Promise((resolve, reject) => {
                const audioElement = audioElements[aiId];
                
                audioElement.src = audioUrl;
                audioElement.onerror = (e) => {
                    debugLog(`Audio error: ${e}`);
                    updateSpeakingState(aiId, false);
                    URL.revokeObjectURL(audioUrl);
                    
                    // Still wait for the calculated speaking time
                    setTimeout(resolve, speakingTime);
                };
                
                audioElement.onended = () => {
                    debugLog(`Audio finished playing for ${aiId}`);
                    updateSpeakingState(aiId, false);
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                };
                
                // Set a timer based on calculated speaking time as a fallback
                setTimeout(() => {
                    if (audioElement.paused || audioElement.ended) {
                        // Audio already ended
                        return;
                    }
                    
                    debugLog(`Speaking timer expired for ${aiId} after ${speakingTime}ms`);
                    updateSpeakingState(aiId, false);
                    audioElement.pause();
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                }, speakingTime + 500); // Add a small buffer
                
                // Start playing audio
                audioElement.play().catch(e => {
                    debugLog(`Error playing audio: ${e.message}`);
                    updateSpeakingState(aiId, false);
                    
                    // Wait for the calculated speaking time
                    setTimeout(resolve, speakingTime);
                });
            });
            
        } catch (error) {
            debugLog(`Error in speakText: ${error.message}`);
            updateSpeakingState(aiId, false);
            
            // Wait for a short time to simulate speech
            return new Promise(resolve => {
                setTimeout(resolve, 1000);
            });
        }
    }
    
    // Update UI speaking state
    function updateSpeakingState(aiId, isSpeaking) {
        const statusElement = document.getElementById('conversation-status');
        
        if (isSpeaking) {
            statusElement.textContent = `${$(`#${aiId}-name`).val() || aiId} is speaking`;
            statusElement.className = 'text-sm px-2 py-1 rounded bg-green-700';
        } else {
            statusElement.textContent = 'Idle';
            statusElement.className = 'text-sm px-2 py-1 rounded bg-gray-600';
        }
    }
    
    // Add "thinking" delay to make conversation more natural
    async function addThinkingDelay(aiId) {
        // Show thinking state
        const statusElement = document.getElementById('conversation-status');
        const aiName = $(`#${aiId}-name`).val() || aiId;
        
        statusElement.textContent = `${aiName} is thinking`;
        statusElement.className = 'text-sm px-2 py-1 rounded bg-yellow-600';
        
        // Random delay between 1-3 seconds
        const thinkingTime = 1000 + Math.random() * 2000;
        debugLog(`${aiId} thinking for ${Math.round(thinkingTime)}ms`);
        
        return new Promise(resolve => setTimeout(resolve, thinkingTime));
    }
    
    // Process conversation turn
// Process conversation turn
async function processTurn(currentAi, message, isFirstMessage = false) {
    if (!conversationActive) {
        debugLog('Conversation not active, stopping');
        return;
    }
    
    try {
        const aiName = $(`#${currentAi}-name`).val() || currentAi;
        debugLog(`Processing turn for ${aiName} responding to: ${message.substring(0, 50)}...`);
        
        // Add a thinking delay
        await addThinkingDelay(currentAi);
        
        // Check if conversation is still active after thinking
        if (!conversationActive) {
            debugLog('Conversation stopped during thinking');
            return;
        }
        
        // Get AI response
        const response = await getAIResponse(currentAi, message);
        
        // Add AI response to chat - this AI is responding (shown as an AI message)
        addMessageToChat(currentAi, response);
        
        // Speak the response if TTS is enabled
        try {
            await speakText(currentAi, response);
        } catch (speechError) {
            debugLog(`Speech error but continuing: ${speechError.message}`);
            // Continue anyway even if speech fails, with a brief delay
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Check if conversation is still active before continuing
        if (!conversationActive) {
            debugLog('Conversation stopped during speech');
            return;
        }
        
        // Add a brief pause between turns
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Determine next step based on conversation direction
        const direction = $('input[name="conversation-direction"]:checked').val();
        
        if (direction === 'human-to-ai1' && currentAi === 'ai1') {
            // Human -> AI1 -> done
            conversationActive = false;
            $('#start-conversation').prop('disabled', false);
            $('#stop-conversation').prop('disabled', true);
            updateSpeakingState(currentAi, false);
            debugLog('Conversation ended naturally');
            return;
        } else if (direction === 'human-to-ai2' && currentAi === 'ai2') {
            // Human -> AI2 -> done
            conversationActive = false;
            $('#start-conversation').prop('disabled', false);
            $('#stop-conversation').prop('disabled', true);
            updateSpeakingState(currentAi, false);
            debugLog('Conversation ended naturally');
            return;
        } else if (direction === 'ai1-to-ai2' && isFirstMessage) {
            // AI1 has responded, now AI2 should respond
            await processTurn('ai2', response);
        } else if (direction === 'ai2-to-ai1' && isFirstMessage) {
            // AI2 has responded, now AI1 should respond
            await processTurn('ai1', response);
        } else {
            // Continue alternating
            const otherAi = currentAi === 'ai1' ? 'ai2' : 'ai1';
            await processTurn(otherAi, response);
        }
        
    } catch (error) {
        debugLog(`Error in processTurn: ${error.message}`);
        
        if (conversationActive) {
            // Wait a moment before trying to recover
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Try to continue conversation despite error with a different message
            // to avoid getting stuck in a loop
            const topics = [
                'space exploration',
                'artificial intelligence',
                'favorite books',
                'interesting science facts',
                'music',
                'the concept of time'
            ];
            const randomTopic = topics[Math.floor(Math.random() * topics.length)];
            const fallbackMessage = `I'd like to talk about something different. What do you think about ${randomTopic}?`;
            
            // Add fallback message as coming from current AI
            addMessageToChat(currentAi, fallbackMessage);
            
            // Continue with other AI
            const otherAi = currentAi === 'ai1' ? 'ai2' : 'ai1';
            await processTurn(otherAi, fallbackMessage);
        }
    }
}
    

// Start conversation
$('#start-conversation').click(async function() {
    if (conversationActive) {
        debugLog('Conversation already active');
        return;
    }
    
    // Check for OpenRouter API key
    const openrouterKey = $('#openrouter-api-key').val();
    if (!openrouterKey || openrouterKey.trim() === '') {
        Swal.fire({
            title: 'API Key Required',
            text: 'Please enter your OpenRouter API key to start a conversation',
            icon: 'warning',
            confirmButtonText: 'Enter Key',
        }).then(() => {
            // Show settings panel
            $('#settings-panel').toggleClass('open');
        });
        return;
    }
    
    debugLog('Starting conversation');
    
    // Disable start button and enable stop button
    $(this).prop('disabled', true);
    $('#stop-conversation').prop('disabled', false);
    
    // Set conversation state
    conversationActive = true;
    
    // Clear chat container
    $('#chat-container').empty();
    
    // Reset conversation history
    conversationHistory = [];
    
    // Get conversation direction and starting message
    const direction = $('input[name="conversation-direction"]:checked').val();
    const startingMessage = $('#starting-message').val();
    
    // Determine first sender and receiver based on direction
    let sender, receiver;
    
    if (direction === 'human-to-ai1') {
        sender = 'human';
        receiver = 'ai1';
    } else if (direction === 'human-to-ai2') {
        sender = 'human';
        receiver = 'ai2';
    } else if (direction === 'ai1-to-ai2') {
        sender = 'ai1';
        receiver = 'ai2';
    } else { // ai2-to-ai1
        sender = 'ai2';
        receiver = 'ai1';
    }
    
    debugLog(`Starting conversation with direction: ${direction}`);
    debugLog(`Sender: ${sender}, Receiver: ${receiver}, Message: ${startingMessage}`);
    
    try {
        if (sender === 'human') {
            // Human starts - add the human message to chat
            addMessageToChat('human', startingMessage);
            
            // Process turn with the receiving AI
            await processTurn(receiver, startingMessage, true);
        } else {
            // An AI starts - IMPORTANT: Always show the starting message in the chat
            addMessageToChat(sender, startingMessage);
            
            // Now get the receiving AI's response to this message
            await processTurn(receiver, startingMessage, true);
        }
    } catch (error) {
        debugLog(`Error starting conversation: ${error.message}`);
        
        // Reset to initial state
        $('#start-conversation').prop('disabled', false);
        $('#stop-conversation').prop('disabled', true);
        conversationActive = false;
    }
});

    
    // Stop conversation
    $('#stop-conversation').click(function() {
        if (!conversationActive) {
            debugLog('Conversation not active');
            return;
        }
        
        debugLog('Stopping conversation');
        
        // Set conversation state
        conversationActive = false;
        
        // Enable start button and disable stop button
        $('#start-conversation').prop('disabled', false);
        $(this).prop('disabled', true);
        
        // Stop audio playback
        for (const id in audioElements) {
            const audio = audioElements[id];
            audio.pause();
            audio.currentTime = 0;
        }
        
        // Reset UI states
        updateSpeakingState('ai1', false);
        
        // Add end message to chat
        $('#chat-container').append(`
            <div class="chat-message system text-center w-full bg-gray-600 text-white">
                Conversation stopped
            </div>
        `);
        
        debugLog('Conversation fully stopped');
    });
});