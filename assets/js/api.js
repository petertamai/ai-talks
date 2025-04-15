/**
 * AI Conversation System - API Integration
 * 
 * Handles all API calls including OpenRouter, Groq TTS, and key management
 * 
 * @author Piotr Tamulewicz
 * @link https://petertam.pro/
 */

// Check for API key
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
                openSettingsPanel();
                // Fetch available models with the new key
                fetchAvailableModels();
            } else {
                // Show settings panel if they click "Later"
                openSettingsPanel();
            }
        });
    } else {
        // If we have a key, fetch models directly
        fetchAvailableModels();
    }
}

// Save API key to server
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
            
            // Refresh Select2 to update with new options
            $('.model-select').trigger('change');
            
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
                openSettingsPanel();
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
    
    // Refresh Select2 to update with new options
    $('.model-select').trigger('change');
    
    debugLog('Using fallback models', fallbackModels);
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