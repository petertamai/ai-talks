/**
 * AI Conversation System - Conversation Logic
 * 
 * Handles the core conversation flow between AI agents
 * 
 * @author Piotr Tamulewicz
 * @link https://petertam.pro/
 */

// Add message to chat
function addMessageToChat(sender, text) {
    const chatContainer = $('#chat-container');
    let messageClass, agentName;
    
    if (sender === 'ai1') {
        messageClass = 'ai1';
        agentName = $('#ai1-name').val() || 'AI-1';
        // Hide typing indicator if it was showing
        hideTypingIndicator('ai1');
    } else if (sender === 'ai2') {
        messageClass = 'ai2';
        agentName = $('#ai2-name').val() || 'AI-2';
        // Hide typing indicator if it was showing
        hideTypingIndicator('ai2');
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
    
    // Force scroll to bottom
    scrollToBottom();
    
    // Add to conversation history
    conversationHistory.push({
        sender: sender,
        text: text,
        timestamp: new Date().toISOString()
    });
}

// Show typing indicator for an AI
function showTypingIndicator(aiId) {
    $(`#${aiId}-typing`).show();
    // Position it correctly in the chat
    const chatContainer = $('#chat-container');
    $(`#${aiId}-typing`).appendTo(chatContainer);
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator(aiId) {
    $(`#${aiId}-typing`).hide();
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
    // Show thinking state
    const statusElement = document.getElementById('conversation-status');
    const aiName = $(`#${aiId}-name`).val() || aiId;
    
    statusElement.textContent = `${aiName} is thinking`;
    statusElement.className = 'text-sm px-2 py-1 rounded bg-yellow-600';
    
    // Show typing indicator
    showTypingIndicator(aiId);
    
    // Random delay between 1-3 seconds
    const thinkingTime = 1000 + Math.random() * 2000;
    debugLog(`${aiId} thinking for ${Math.round(thinkingTime)}ms`);
    
    return new Promise(resolve => setTimeout(resolve, thinkingTime));
}

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