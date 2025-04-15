/**
 * AI Conversation System - Conversation Logic
 * 
 * Handles the core conversation flow between AI agents
 * Detects #END# in responses to terminate the conversation.
 * 
 * @author Piotr Tamulewicz
 * @link https://petertam.pro/
 */

// --- Global Variables (assuming these are defined elsewhere, e.g., main script) ---
// let conversationActive = false;
// let conversationHistory = [];
// let audioElements = {}; // For TTS
// function debugLog(message) { console.log(message); } // Example debug logger
// function scrollToBottom() { /* Implementation needed */ }
// function openSettingsPanel() { /* Implementation needed */ }
// async function getAIResponse(aiId, lastMessage, modelId, temperature, maxTokens) { /* Implementation needed - calls your backend proxy */ }
// async function speakText(aiId, text) { /* Implementation needed - handles TTS */ }
// Assume jQuery ($) is available
// Assume Swal (SweetAlert2) is available
// ---------------------------------------------------------------------------------
// Find this function in your conversation.js file and add the audio saving part:

async function playTextToSpeech(agent, text) {
    try {
        const agentConfig = agent === 'ai1' ? config.ai1 : config.ai2;
        
        if (!agentConfig.tts.enabled) return;
        
        const audioElement = document.getElementById(`${agent}-audio`);
        
        // Get the conversation ID from localStorage (used for sharing)
        const conversationId = localStorage.getItem('currentConversationId') || 
            ('conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
        
        // If no conversation ID exists, create and store one
        if (!localStorage.getItem('currentConversationId')) {
            localStorage.setItem('currentConversationId', conversationId);
        }
        
        debug.log(`Playing TTS for ${agent} using voice ${agentConfig.tts.voice}`);
        
        const response = await fetch('api/tts.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                voice: agentConfig.tts.voice,
                conversation_id: conversationId, // Add conversation ID to the request
                message_index: document.querySelectorAll('.chat-message').length - 1 // Current message index
            })
        });
        
        if (!response.ok) {
            throw new Error('TTS request failed');
        }
        
        const data = await response.json();
        
        if (data.success) {
            audioElement.src = data.audioUrl;
            audioElement.play();
            
            // Show the play button in conversation header if audio exists
            if (window.conversationShare) {
                window.conversationShare.showShareButton(true);
                window.conversationShare.updatePlayButtonVisibility();
            }
        } else {
            debug.log(`TTS Error: ${data.message}`);
        }
    } catch (error) {
        console.error('TTS Error:', error);
        debug.log(`TTS Error: ${error.message}`);
    }
}

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
        // Hide typing indicator if it was showing (might be redundant here, but safe)
        hideTypingIndicator('ai1');
    } else if (sender === 'ai2') {
        messageClass = 'ai2';
        agentName = $('#ai2-name').val() || 'AI-2';
        // Get current model name if not provided
        if (!modelId) {
            modelId = $('#ai2-model').val();
        }
         // Hide typing indicator if it was showing (might be redundant here, but safe)
        hideTypingIndicator('ai2');
    } else if (sender === 'system') { // Added system sender type
        messageClass = 'system text-center w-full bg-gray-600 text-white'; // Use existing style
        agentName = 'System';
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
    const agentNameDiv = sender !== 'system' ? `<div class="agent-name">${agentName}</div>` : ''; // Don't show agent name for system messages

    chatContainer.append(`
        <div class="chat-message ${messageClass}">
            ${agentNameDiv}
            ${text}
            ${modelBadge}
        </div>
    `);
    
    // Force scroll to bottom
    scrollToBottom();
    
    // Add to conversation history (optional: decide if system messages go here)
    if (sender !== 'system') {
        conversationHistory.push({
            sender: sender,
            text: text,
            modelId: modelId,
            timestamp: new Date().toISOString()
        });
    }
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
            'display': 'none' // Start hidden
        });
    }
    
    // Make sure the chat container is set up as a flex container
    $('#chat-container').css({
        'display': 'flex',
        'flex-direction': 'column'
    });
    
    // Show the typing indicator
    $(`#${aiId}-typing`).show();
    
    // Position it correctly in the chat container (ensure it's last)
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
    if (!statusElement) return; // Guard against element not found

    if (isSpeaking) {
        statusElement.textContent = `${$(`#${aiId}-name`).val() || aiId} is speaking`;
        statusElement.className = 'text-sm px-2 py-1 rounded bg-green-700';
        // Hide typing indicator if it was showing
        hideTypingIndicator(aiId);
    } else {
        // Only set to Idle if the conversation is NOT active or if both are idle
        // This prevents flickering if one stops speaking but the other starts thinking
        if (!conversationActive) {
             statusElement.textContent = 'Idle';
             statusElement.className = 'text-sm px-2 py-1 rounded bg-gray-600';
        }
    }
}

// Add "thinking" delay to make conversation more natural
async function addThinkingDelay(aiId) {
    try {
        // Show thinking state in status bar
        const statusElement = document.getElementById('conversation-status');
        const aiName = $(`#${aiId}-name`).val() || aiId;
        
        if (statusElement) {
            statusElement.textContent = `${aiName} is thinking`;
            statusElement.className = 'text-sm px-2 py-1 rounded bg-yellow-600';
        }
        
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
async function processTurn(currentAi, message, isFirstMessage = false) {
    if (!conversationActive) {
        debugLog('Conversation not active, stopping turn processing.');
        // Ensure indicators are hidden if stopped abruptly
        hideTypingIndicator('ai1');
        hideTypingIndicator('ai2');
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
            hideTypingIndicator(currentAi); // Ensure indicator is hidden
            return;
        }
        
        // Get the model information
        const modelId = $(`#${currentAi}-model`).val();
        const temperature = parseFloat($(`#${currentAi}-temperature`).val()) || 0.5;
        const maxTokens = parseInt($(`#${currentAi}-max-tokens`).val()) || 1200;
        
        // Get AI response with model parameters
        const response = await getAIResponse(currentAi, message, modelId, temperature, maxTokens);
        
        // --- Check for #END# condition ---
        if (response && typeof response === 'string' && response.includes('#END#')) {
            debugLog(`AI ${currentAi} responded with #END#. Ending conversation.`);
            hideTypingIndicator(currentAi); // Hide indicator before stopping

            // Call stopConversation with the specific reason
            // The stopConversation function will add the message to the chat
            stopConversation('Conversation has ended'); 

            // IMPORTANT: Return immediately to prevent further processing of this turn
            return; 
        }
        // --- End of #END# check ---

        // If we reach here, #END# was not found or response was invalid

        // Hide typing indicator before showing the response
        hideTypingIndicator(currentAi);
        
        // Check if response is valid before proceeding
        if (!response || typeof response !== 'string' || response.trim() === '') {
             debugLog(`Received empty or invalid response from ${currentAi}. Attempting recovery.`);
             // Handle error like the catch block below, maybe try again or use fallback
             throw new Error(`Empty or invalid response from ${aiName}`);
        }

        // Add AI response to chat - this AI is responding (shown as an AI message)
        addMessageToChat(currentAi, response, modelId);
        
        // Speak the response if TTS is enabled
        try {
            // Update speaking state before starting speech
            updateSpeakingState(currentAi, true); 
            await speakText(currentAi, response);
            // Update speaking state after speech finishes
            updateSpeakingState(currentAi, false); 
        } catch (speechError) {
            debugLog(`Speech error but continuing: ${speechError.message}`);
            updateSpeakingState(currentAi, false); // Ensure state is reset on error
            // Continue anyway even if speech fails, with a brief delay
            await new Promise(resolve => setTimeout(resolve, 500)); // Shorter delay ok here
        }
        
        // Check if conversation is still active before continuing (might have been stopped during speech)
        if (!conversationActive) {
            debugLog('Conversation stopped during/after speech');
            return;
        }
        
        // Add a brief pause between turns
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Determine next step based on conversation direction
        const direction = $('input[name="conversation-direction"]:checked').val();
        
        if (direction === 'human-to-ai1' && currentAi === 'ai1') {
            // Human -> AI1 -> done
            debugLog('Conversation ended naturally (Human -> AI1)');
            stopConversation('Conversation ended'); // Use stopConversation for consistency
            return;
        } else if (direction === 'human-to-ai2' && currentAi === 'ai2') {
            // Human -> AI2 -> done
            debugLog('Conversation ended naturally (Human -> AI2)');
            stopConversation('Conversation ended'); // Use stopConversation for consistency
            return;
        } else if (direction === 'ai1-to-ai2' && currentAi === 'ai1' && isFirstMessage) {
            // AI1 started, now AI2 should respond to that initial message
            await processTurn('ai2', response, false);
        } else if (direction === 'ai2-to-ai1' && currentAi === 'ai2' && isFirstMessage) {
            // AI2 started, now AI1 should respond to that initial message
            await processTurn('ai1', response, false);
        } else {
            // Continue alternating for ongoing conversation (AI1 -> AI2 or AI2 -> AI1)
            const otherAi = currentAi === 'ai1' ? 'ai2' : 'ai1';
            await processTurn(otherAi, response, false);
        }
        
    } catch (error) {
        debugLog(`Error in processTurn for ${currentAi}: ${error.message}`);
        
        // Make sure to hide the typing indicator if there was an error
        hideTypingIndicator(currentAi);
        updateSpeakingState(currentAi, false); // Reset speaking state on error

        if (conversationActive) {
            // Add an error message to the chat
            addMessageToChat('system', `An error occurred: ${error.message}. Stopping conversation.`);
            
            // Stop the conversation due to the error
            stopConversation('Conversation stopped due to error');
        }
        // Removed the automatic recovery logic for simplicity and predictability. 
        // You could re-add the fallback message logic here if desired, but stopping is often safer.
    }
}

// Start conversation
async function startConversation() {
    if (conversationActive) {
        debugLog('Conversation already active');
        return;
    }
    
    // Check for OpenRouter API key (assuming this check happens elsewhere or is guaranteed)
    // const openrouterKey = $('#openrouter-api-key').val(); // Example check
    // if (!openrouterKey || openrouterKey.trim() === '') { ... return; }
    
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
    
    // Reset status bar
    const statusElement = document.getElementById('conversation-status');
    if (statusElement) {
        statusElement.textContent = 'Starting...';
        statusElement.className = 'text-sm px-2 py-1 rounded bg-blue-600'; // Indicate starting
    }

    // Get conversation direction and starting message
    const direction = $('input[name="conversation-direction"]:checked').val();
    const startingMessage = $('#starting-message').val().trim(); // Trim whitespace

    if (!startingMessage) {
        debugLog('Starting message is empty. Cannot start.');
         Swal.fire('Error', 'Please provide a starting message.', 'error');
         // Reset state
         $('#start-conversation').prop('disabled', false);
         $('#stop-conversation').prop('disabled', true);
         conversationActive = false;
         if (statusElement) {
             statusElement.textContent = 'Idle';
             statusElement.className = 'text-sm px-2 py-1 rounded bg-gray-600';
         }
         return;
    }
    
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
        receiver = 'ai2'; // AI1 sends message, AI2 receives/responds first
    } else { // ai2-to-ai1
        sender = 'ai2';
        receiver = 'ai1'; // AI2 sends message, AI1 receives/responds first
    }
    
    debugLog(`Starting conversation with direction: ${direction}`);
    debugLog(`Sender: ${sender}, Receiver: ${receiver}, Message: ${startingMessage.substring(0,50)}...`);
    
    try {
        // Always add the *initial* starting message to the chat first
        addMessageToChat(sender, startingMessage, sender.startsWith('ai') ? $(`#${sender}-model`).val() : null);

        // Now, trigger the *first response* from the designated receiver AI
        await processTurn(receiver, startingMessage, true); 

    } catch (error) {
        debugLog(`Error starting conversation: ${error.message}`);
        addMessageToChat('system', `Failed to start conversation: ${error.message}`);
        // Reset to initial state using stopConversation logic
        stopConversation('Conversation failed to start'); 
    }
}

// Stop conversation
function stopConversation(reasonMessage = null) { // Added optional reason message
    if (!conversationActive && !reasonMessage) { // Avoid logging if already stopped unless a reason is given
        debugLog('Stop called but conversation not active.');
        return;
    }
    
    const wasActive = conversationActive; // Track if it was active before stopping
    debugLog(`Stopping conversation. Reason: ${reasonMessage || 'Manual stop'}`);
    
    // Set conversation state
    conversationActive = false;
    
    // Enable start button and disable stop button
    $('#start-conversation').prop('disabled', false);
    $('#stop-conversation').prop('disabled', true);
    
    // Stop audio playback
    for (const id in audioElements) {
        if (audioElements.hasOwnProperty(id)) {
            const audio = audioElements[id];
            if (audio && typeof audio.pause === 'function') {
                audio.pause();
                audio.currentTime = 0;
            }
        }
    }
    
    // Reset UI states (speaking and status bar)
    updateSpeakingState('ai1', false);
    updateSpeakingState('ai2', false);
    const statusElement = document.getElementById('conversation-status');
     if (statusElement) {
        statusElement.textContent = 'Idle';
        statusElement.className = 'text-sm px-2 py-1 rounded bg-gray-600';
    }

    // Hide typing indicators
    hideTypingIndicator('ai1');
    hideTypingIndicator('ai2');
    
    // Add end message to chat *if* the conversation was active or a specific reason is given
    if (wasActive || reasonMessage) {
        const endMessageText = reasonMessage || 'Conversation stopped'; // Use reason or default
        // Use addMessageToChat for consistency
        addMessageToChat('system', endMessageText); 
    }
    
    // Scroll to bottom to show the stop message
    scrollToBottom();
    
    debugLog('Conversation fully stopped');
}