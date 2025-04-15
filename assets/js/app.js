/**
 * AI Conversation System - Main Application File
 * 
 * This is the entry point file that loads all the modular JavaScript components
 * 
 * @author Piotr Tamulewicz
 * @link https://petertam.pro/
 */

// Load order is important to ensure dependencies are satisfied
document.addEventListener('DOMContentLoaded', function() {
    // First check if all required JS files are loaded
    const requiredScripts = [
        'utils.js',
        'config.js',
        'api.js',
        'conversation.js'
    ];
    
    let allScriptsLoaded = true;
    
    requiredScripts.forEach(script => {
        if (!isScriptLoaded(`assets/js/${script}`)) {
            console.error(`Required script not loaded: ${script}`);
            allScriptsLoaded = false;
        }
    });
    
    if (!allScriptsLoaded) {
        alert('Some required JavaScript files could not be loaded. Please refresh the page or contact support.');
    }
});

// Helper function to check if a script is loaded
function isScriptLoaded(url) {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src.includes(url)) {
            return true;
        }
    }
    return false;
}