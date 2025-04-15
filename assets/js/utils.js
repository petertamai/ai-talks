/**
 * AI Conversation System - Utility Functions
 * 
 * Provides utility functions like logging, debugging, and helper methods
 * 
 * @author Piotr Tamulewicz
 * @link https://petertam.pro/
 */

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

// Helper function to detect mobile devices
function isMobileDevice() {
    return (
        window.innerWidth <= 768 ||
        navigator.userAgent.match(/Android/i) ||
        navigator.userAgent.match(/webOS/i) ||
        navigator.userAgent.match(/iPhone/i) ||
        navigator.userAgent.match(/iPad/i) ||
        navigator.userAgent.match(/iPod/i) ||
        navigator.userAgent.match(/BlackBerry/i) ||
        navigator.userAgent.match(/Windows Phone/i)
    );
}

// Handle mobile-specific adjustments
function setupMobileView() {
    if (isMobileDevice()) {
        // Adjust container heights for better mobile experience
        $('.chat-container').css('max-height', '50vh');
        
        // Make settings panel full width on mobile
        $('#settings-panel').addClass('w-full');
    }
}

// Check browser compatibility
function checkBrowserCompatibility() {
    const browserWarnings = [];
    
    // Check for WebAudio API (needed for TTS playback)
    if (!window.AudioContext && !window.webkitAudioContext) {
        browserWarnings.push('WebAudio API not supported - Text-to-Speech may not work properly');
    }
    
    // Check for Fetch API
    if (!window.fetch) {
        browserWarnings.push('Fetch API not supported - API communication may fail');
    }
    
    // Check for ES6 features
    try {
        new Function('(a = 0) => a');
    } catch (e) {
        browserWarnings.push('Modern JavaScript not fully supported - application may not function correctly');
    }
    
    // Log and display any warnings
    if (browserWarnings.length > 0) {
        debugLog('Browser compatibility issues detected:', browserWarnings);
        
        // Display warning to user
        const warningMessage = browserWarnings.join('<br>');
        
        Swal.fire({
            title: 'Browser Compatibility Warning',
            html: `Some features may not work correctly in your browser:<br><br>${warningMessage}`,
            icon: 'warning',
            confirmButtonText: 'Continue Anyway'
        });
    } else {
        debugLog('Browser compatibility check passed');
    }
}

// Format a timestamp for display
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Generate a unique ID
function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}

// Helper function to safely parse JSON
function safeJsonParse(jsonString, fallback = null) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        debugLog('Error parsing JSON:', error);
        return fallback;
    }
}

// Initialize mobile view when document is ready
$(document).ready(function() {
    setupMobileView();
    checkBrowserCompatibility();
});