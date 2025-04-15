/**
 * AI Conversation System - Configuration and Initialization
 * 
 * Handles core configuration, initialization, and global variables
 * 
 * @author Piotr Tamulewicz
 * @link https://petertam.pro/
 */

// Global variables
let conversationActive = false;
let conversationHistory = [];

// DOM elements
const audioElements = {
    ai1: document.getElementById('ai1-audio'),
    ai2: document.getElementById('ai2-audio')
};

// Initialize application
$(document).ready(function() {
    // Initialize Select2 for model dropdowns
    $('.model-select').select2({
        placeholder: "Select a model",
        allowClear: true,
        theme: "classic",
        dropdownParent: $('#settings-panel')
    });

    // Set up event listeners
    setupEventListeners();
    
    // Test audio support
    const audioSupport = testAudioSupport();
    
    // Check for API key and fetch models
    setTimeout(checkApiKey, 500);
    
    // Initial setup for typing indicators
    $('#ai1-typing, #ai2-typing').hide().css({
        'align-self': function() {
            return $(this).attr('id') === 'ai1-typing' ? 'flex-start' : 'flex-end';
        }
    });
    
    // Handle window resize events to ensure proper scrolling
    $(window).resize(function() {
        if (conversationActive) {
            scrollToBottom();
        }
    });
});

// Set up UI event listeners
function setupEventListeners() {
    $('#toggle-settings').click(function() {
        $('#settings-panel').toggleClass('open');
    });
    
    // Close settings panel with the close button
    $('#close-settings').click(function() {
        $('#settings-panel').removeClass('open');
    });
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
    
    // Start conversation button
    $('#start-conversation').click(startConversation);
    
    // Stop conversation button
    $('#stop-conversation').click(stopConversation);
}

// Test audio support and log results
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

// Ensure settings panel opens when needed
function openSettingsPanel() {
    if (!$('#settings-panel').hasClass('open')) {
        $('#settings-panel').addClass('open');
    }
}

// Scroll chat to bottom - improved function
function scrollToBottom() {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Double-check scroll position after a short delay
        // This helps when images or other content might still be loading
        setTimeout(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 100);
    }
}