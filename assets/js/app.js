/**
 * AI Conversation System - Improved Application Logic with Better Timing
 * 
 * Handles the conversation between two AI agents with realistic timing
 * 
 * @author Piotr Tamulewicz
 * @link https://petertam.pro/
 */

$(document).ready(function() {
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
    
    // Conversation state
    let conversationActive = false;
    let conversationHistory = {
        ai1: [],
        ai2: []
    };
    
    // Audio elements
    const audioElements = {
        ai1: document.getElementById('ai1-audio'),
        ai2: document.getElementById('ai2-audio')
    };
    
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
    
    // Fetch available models from LiteLLM
    async function fetchAvailableModels() {
        try {
            debugLog('Fetching available models...');
            
            const response = await fetch('api/litellm-models-proxy.php');
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            debugLog('Models API response:', data);
            
            // Populate model dropdowns
            if (data.data && Array.isArray(data.data)) {
                // Clear existing options
                $('#ai1-model, #ai2-model').empty();
                
                // Add models to dropdowns
                data.data.forEach(model => {
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
            
            // Fallback to hardcoded models if API fails
            addFallbackModels();
        }
    }
    
    // Add fallback models
    function addFallbackModels() {
        const fallbackModels = [
            { id: 'gpt-4', name: 'GPT-4' },
            { id: 'claude-3-opus', name: 'Claude 3 Opus' },
            { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
            { id: 'gemini-pro', name: 'Gemini Pro' }
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
    function addMessageToChat(aiId, text, isAi = true) {
        const chatContainer = $(`#${aiId}-chat`);
        const messageClass = isAi ? 'ai' : 'human';
        
        debugLog(`Adding ${messageClass} message to ${aiId}: ${text.substring(0, 50)}...`);
        
        // Add message to container
        chatContainer.append(`
            <div class="chat-message ${messageClass}">
                ${text}
            </div>
        `);
        
        // Scroll to bottom
        chatContainer.scrollTop(chatContainer[0].scrollHeight);
        
        // Add to conversation history
        conversationHistory[aiId].push({
            role: isAi ? 'assistant' : 'user',
            content: text
        });
    }
    
    // Get AI response from LiteLLM
    async function getAIResponse(aiId, prompt) {
        try {
            // Get model and system prompt
            const model = $(`#${aiId}-model`).val();
            const systemPrompt = $(`#${aiId}-prompt`).val();
            
            debugLog(`Getting ${aiId} response using model: ${model}`);
            debugLog(`Prompt: ${prompt.substring(0, 50)}...`);
            
            // Create messages array
            const messages = [
                {
                    role: 'system',
                    content: systemPrompt
                }
            ];
            
            // Add conversation history
            for (const message of conversationHistory[aiId]) {
                messages.push(message);
            }
            
            // Add the prompt as a user message
            messages.push({
                role: 'user',
                content: prompt
            });
            
            debugLog(`Sending ${messages.length} messages to ${model}`);
            
            // Send request to LiteLLM via our PHP proxy
            const response = await fetch('api/litellm-proxy.php', {
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
            debugLog(`LLM response received:`, data);
            
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
    
    // Speak text using Groq TTS with timing
    async function speakText(aiId, text, voice) {
        try {
            // Get voice from select element if not provided or empty
            if (!voice || voice.trim() === '') {
                voice = $(`#${aiId}-voice`).val();
                debugLog(`Using voice from select element: ${voice}`);
            }
            
            // Double-check voice is valid
            if (!voice || voice.trim() === '') {
                voice = (aiId === 'ai1') ? 'Arista-PlayAI' : 'Nova-PlayAI';
                debugLog(`Using fallback voice: ${voice}`);
            }
            
            debugLog(`Speaking with ${aiId} using voice: ${voice}`);
            
            // Calculate speaking time
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
            
            // Play the audio and wait for calculated time
            return new Promise((resolve, reject) => {
                const audioElement = audioElements[aiId];
                
                audioElement.src = audioUrl;
                
                // Track if audio ended naturally
                let audioEndedNaturally = false;
                
                audioElement.onerror = (e) => {
                    debugLog(`Audio error: ${e}`);
                    updateSpeakingState(aiId, false);
                    URL.revokeObjectURL(audioUrl);
                    reject(e);
                };
                
                audioElement.onended = () => {
                    debugLog(`Audio finished playing for ${aiId} naturally`);
                    audioEndedNaturally = true;
                    updateSpeakingState(aiId, false);
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                };
                
                // Set a timer based on calculated speaking time as a fallback
                // This ensures the conversation continues even if audio playback fails
                setTimeout(() => {
                    if (!audioEndedNaturally) {
                        debugLog(`Speaking timer expired for ${aiId} after ${speakingTime}ms`);
                        updateSpeakingState(aiId, false);
                        URL.revokeObjectURL(audioUrl);
                        resolve();
                    }
                }, speakingTime);
                
                // Start playing audio
                audioElement.play().catch(e => {
                    debugLog(`Error playing audio: ${e.message}`);
                    updateSpeakingState(aiId, false);
                    // Still wait for the calculated speaking time before continuing
                    setTimeout(() => {
                        URL.revokeObjectURL(audioUrl);
                        resolve();
                    }, speakingTime);
                });
            });
            
        } catch (error) {
            debugLog(`Error in speakText: ${error.message}`);
            updateSpeakingState(aiId, false);
            
            // Even on error, wait for the calculated speaking time
            const speakingTime = calculateSpeakingTime(text);
            debugLog(`Waiting ${speakingTime}ms despite error`);
            
            return new Promise(resolve => {
                setTimeout(resolve, speakingTime);
            });
        }
    }
    
    // Update UI speaking state
    function updateSpeakingState(aiId, isSpeaking) {
        const chatContainer = document.getElementById(`${aiId}-chat`);
        const statusElement = document.getElementById(`${aiId}-status`);
        
        debugLog(`Updating ${aiId} speaking state: ${isSpeaking}`);
        
        if (isSpeaking) {
            chatContainer.classList.add('speaking');
            statusElement.textContent = 'Speaking';
            statusElement.className = 'text-sm px-2 py-1 rounded bg-green-700';
        } else {
            chatContainer.classList.remove('speaking');
            statusElement.textContent = 'Idle';
            statusElement.className = 'text-sm px-2 py-1 rounded bg-gray-600';
        }
    }
    
    // Add "thinking" delay to make conversation more natural
    async function addThinkingDelay(aiId) {
        // Show thinking state
        const statusElement = document.getElementById(`${aiId}-status`);
        statusElement.textContent = 'Thinking';
        statusElement.className = 'text-sm px-2 py-1 rounded bg-yellow-600';
        
        // Random delay between 1-3 seconds
        const thinkingTime = 1000 + Math.random() * 2000;
        debugLog(`${aiId} thinking for ${Math.round(thinkingTime)}ms`);
        
        return new Promise(resolve => setTimeout(resolve, thinkingTime));
    }
    
    // Process conversation turn
    async function processTurn(currentAi, otherAi, message) {
        if (!conversationActive) {
            debugLog('Conversation not active, stopping');
            return;
        }
        
        try {
            debugLog(`Processing turn for ${currentAi} responding to: ${message.substring(0, 50)}...`);
            
            // Add a thinking delay
            await addThinkingDelay(currentAi);
            
            // Check if conversation is still active after thinking
            if (!conversationActive) {
                debugLog('Conversation stopped during thinking');
                return;
            }
            
            // Get AI response
            const response = await getAIResponse(currentAi, message);
            
            // Add AI response to chat
            addMessageToChat(currentAi, response, true);
            
            // Speak the response
            const voice = $(`#${currentAi}-voice`).val();
            
            try {
                await speakText(currentAi, response, voice);
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
            
            // Add this AI's response to the other AI's chat window as a human message
            addMessageToChat(otherAi, response, false);
            
            // Now process the other AI's turn
            await processTurn(otherAi, currentAi, response);
            
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
                
                // Add fallback message to current AI's chat as its response
                addMessageToChat(currentAi, fallbackMessage, true);
                
                // Add fallback message to other AI's chat as a human message
                addMessageToChat(otherAi, fallbackMessage, false);
                
                // Continue with other AI
                await processTurn(otherAi, currentAi, fallbackMessage);
            }
        }
    }
    
    
    // Start conversation
    $('#start-conversation').click(async function() {
        if (conversationActive) {
            debugLog('Conversation already active');
            return;
        }
        
        debugLog('Starting conversation');
        
        // Disable start button and enable stop button
        $(this).prop('disabled', true);
        $('#stop-conversation').prop('disabled', false);
        
        // Set conversation state
        conversationActive = true;
        
        // Clear chat containers
        $('#ai1-chat, #ai2-chat').empty();
        
        // Reset conversation history
        conversationHistory = {
            ai1: [],
            ai2: []
        };
        
        // Get conversation direction and starting message
        const direction = $('input[name="conversation-direction"]:checked').val();
        const startingMessage = $('#starting-message').val();
        
        // Determine which AI to start with based on direction
        let startingAi, otherAi;
        if (direction === 'human-to-ai1') {
            startingAi = 'ai1';
            otherAi = 'ai2';
        } else {
            startingAi = 'ai2';
            otherAi = 'ai1';
        }
        
        debugLog(`Starting conversation with direction: ${direction}`);
        debugLog(`First AI to respond: ${startingAi}, to message: ${startingMessage}`);
        
        // Add the starting message to the starting AI's chat window as a human message
        addMessageToChat(startingAi, startingMessage, false);
        
        try {
            // Process the first turn with the starting AI
            await processTurn(startingAi, otherAi, startingMessage);
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
        updateSpeakingState('ai2', false);
        
        // Add end message to both chats
        $('#ai1-chat, #ai2-chat').append(`
            <div class="chat-message system text-center w-full bg-gray-600 text-white">
                Conversation stopped
            </div>
        `);
        
        debugLog('Conversation fully stopped');
    });
    
    // Toggle debug panel
    $('#toggle-debug').click(function() {
        $('#debug-panel').toggle();
    });
});