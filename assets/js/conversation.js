/**
 * AI Conversation System - Conversation Logic
 * 
 * Handles the core conversation flow between AI agents
 * 
 * @author Piotr Tamulewicz
 * @link https://petertam.pro/
 */

// Add message to chat
function addMessageToChat(sender, text, modelId = null) {
    const chatContainer = $('#chat-container');
    let messageClass, agentName, modelName = '';
    
    if (sender === 'ai1') {
        messageClass = 'ai1';
        agentName = $('#ai1-name').val() || 'AI-1';
        // Get current model name if not provided
        if (!modelId) {
            modelId = $('#ai1-model').val();
        }
        // Hide typing indicator if it was showing
        hideTypingIndicator('ai1');
    } else if (sender === 'ai2') {
        messageClass = 'ai2';
        agentName = $('#ai2-name').val() || 'AI-2';
        // Get current model name if not provided
        if (!modelId) {
            modelId = $('#ai2-model').val();
        }
        // Hide typing indicator if it was showing
        hideTypingIndicator('ai2');
    } else {
        messageClass = 'human';
        agentName = 'Human';
    }
    
    // Extract model name after first slash if it exists
    if (modelId && modelId.includes('/')) {
        modelName = modelId.split('/')[1];
    }
    
    // Add message to container with clear identification and model badge
    const modelBadge = modelName ? `<div class="model-badge">${modelName}</div>` : '';
    
    chatContainer.append(`
        <div class="chat-message ${messageClass}">
            <div class="agent-name">${agentName}</div>
            ${text}
            ${modelBadge}
        </div>
    `);
    
    // Force scroll to bottom
    scrollToBottom();
    
    // Add to conversation history
    conversationHistory.push({
        sender: sender,
        text: text,
        modelId: modelId,
        timestamp: new Date().toISOString()
    });
}

// Show typing indicator for an AI
function showTypingIndicator(aiId) {
    // Create the typing indicator if it doesn't exist in the DOM
    const typingContainer = $(`#${aiId}-typing`);
    if (typingContainer.length === 0) {
        debugLog(`Typing indicator container for ${aiId} not found, creating it`);
        
        // Create the container and typing indicator
        $(`<div id="${aiId}-typing" class="typing-indicator-container">
            <div class="typing-indicator ${aiId}">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>`).appendTo('#chat-container');
        
        // Style it according to which AI is typing
        $(`#${aiId}-typing`).css({
            'align-self': aiId === 'ai1' ? 'flex-start' : 'flex-end',
            'display': 'none'
        });
    }
    
    // Make sure the chat container is set up as a flex container
    $('#chat-container').css({
        'display': 'flex',
        'flex-direction': 'column'
    });
    
    // Show the typing indicator
    $(`#${aiId}-typing`).show();
    
    // Position it correctly in the chat container
    $(`#${aiId}-typing`).appendTo('#chat-container');
    
    // Force scroll to bottom to show the typing indicator
    scrollToBottom();
    
    debugLog(`Typing indicator for ${aiId} shown`);
}

// Hide typing indicator
function hideTypingIndicator(aiId) {
    const typingContainer = $(`#${aiId}-typing`);
    if (typingContainer.length > 0) {
        typingContainer.hide();
        debugLog(`Typing indicator for ${aiId} hidden`);
    }
}

// Update UI speaking state
function updateSpeakingState(aiId, isSpeaking) {
    const statusElement = document.getElementById('conversation-status');
    
    if (isSpeaking) {
        statusElement.textContent = `${$(`#${aiId}-name`).val() || aiId} is speaking`;
        statusElement.className = 'text-sm px-2 py-1 rounded bg-green-700';
        // Hide typing indicator if it was showing
        hideTypingIndicator(aiId);
    } else {
        statusElement.textContent = 'Idle';
        statusElement.className = 'text-sm px-2 py-1 rounded bg-gray-600';
    }
}

// Add "thinking" delay to make conversation more natural
async function addThinkingDelay(aiId) {
    try {
        // Show thinking state in status bar
        const statusElement = document.getElementById('conversation-status');
        const aiName = $(`#${aiId}-name`).val() || aiId;
        
        statusElement.textContent = `${aiName} is thinking`;
        statusElement.className = 'text-sm px-2 py-1 rounded bg-yellow-600';
        
        // Make sure we show the typing indicator regardless of TTS setting
        showTypingIndicator(aiId);
        
        // Random delay between 1-3 seconds
        const thinkingTime = 1000 + Math.random() * 2000;
        debugLog(`${aiId} thinking for ${Math.round(thinkingTime)}ms`);
        
        return new Promise(resolve => setTimeout(resolve, thinkingTime));
    } catch (error) {
        debugLog(`Error in thinking delay: ${error.message}`);
        // Continue anyway with a minimal delay
        return new Promise(resolve => setTimeout(resolve, 1000));
    }
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
        
        // Add a thinking delay with typing indicator
        await addThinkingDelay(currentAi);
        
        // Check if conversation is still active after thinking
        if (!conversationActive) {
            debugLog('Conversation stopped during thinking');
            hideTypingIndicator(currentAi);
            return;
        }
        
        // Get the model information
        const modelId = $(`#${currentAi}-model`).val();
        const temperature = parseFloat($(`#${currentAi}-temperature`).val()) || 0.5;
        const maxTokens = parseInt($(`#${currentAi}-max-tokens`).val()) || 1200;
        
        // Get AI response with model parameters
        const response = await getAIResponse(currentAi, message, modelId, temperature, maxTokens);
        
        // Hide typing indicator before showing the response
        hideTypingIndicator(currentAi);
        
        // Add AI response to chat - this AI is responding (shown as an AI message)
        addMessageToChat(currentAi, response, modelId);
        
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
        } else if (direction === 'ai1-to-ai2' && currentAi === 'ai1' && isFirstMessage) {
            // AI1 started, now AI2 should respond to that initial message
            await processTurn('ai2', response, false);
        } else if (direction === 'ai2-to-ai1' && currentAi === 'ai2' && isFirstMessage) {
            // AI2 started, now AI1 should respond to that initial message
            await processTurn('ai1', response, false);
        } else {
            // Continue alternating for ongoing conversation
            const otherAi = currentAi === 'ai1' ? 'ai2' : 'ai1';
            await processTurn(otherAi, response, false);
        }
        
    } catch (error) {
        debugLog(`Error in processTurn: ${error.message}`);
        
        // Make sure to hide the typing indicator if there was an error
        hideTypingIndicator(currentAi);
        
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
            addMessageToChat(currentAi, fallbackMessage, $(`#${currentAi}-model`).val());
            
            // Continue with other AI
            const otherAi = currentAi === 'ai1' ? 'ai2' : 'ai1';
            await processTurn(otherAi, fallbackMessage, false);
        }
    }
}

// Start conversation
async function startConversation() {
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
            openSettingsPanel();
        });
        return;
    }
    
    debugLog('Starting conversation');
    
    // Disable start button and enable stop button
    $('#start-conversation').prop('disabled', true);
    $('#stop-conversation').prop('disabled', false);
    
    // Set conversation state
    conversationActive = true;
    
    // Clear chat container and hide any typing indicators
    $('#chat-container').empty();
    hideTypingIndicator('ai1');
    hideTypingIndicator('ai2');
    
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
        
        // Make sure we hide any typing indicators that might be showing
        hideTypingIndicator('ai1');
        hideTypingIndicator('ai2');
    }
}

// Stop conversation
function stopConversation() {
    if (!conversationActive) {
        debugLog('Conversation not active');
        return;
    }
    
    debugLog('Stopping conversation');
    
    // Set conversation state
    conversationActive = false;
    
    // Enable start button and disable stop button
    $('#start-conversation').prop('disabled', false);
    $('#stop-conversation').prop('disabled', true);
    
    // Stop audio playback
    for (const id in audioElements) {
        const audio = audioElements[id];
        audio.pause();
        audio.currentTime = 0;
    }
    
    // Reset UI states
    updateSpeakingState('ai1', false);
    updateSpeakingState('ai2', false);
    
    // Hide typing indicators
    hideTypingIndicator('ai1');
    hideTypingIndicator('ai2');
    
    // Add end message to chat
    $('#chat-container').append(`
        <div class="chat-message system text-center w-full bg-gray-600 text-white">
            Conversation stopped
        </div>
    `);
    
    // Scroll to bottom to show the stop message
    scrollToBottom();
    
    debugLog('Conversation fully stopped');
}