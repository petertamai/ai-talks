<?php
/**
 * Configuration settings for AI Conversation System
 * 
 * @author Piotr Tamulewicz
 * @link https://petertam.pro/
 */

// Enable error reporting for development (disable in production)
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Session handling for cookies
session_start();

// Get API keys from cookies if available
function getOpenRouterKey() {
    if (isset($_COOKIE['openrouter_api_key']) && !empty($_COOKIE['openrouter_api_key'])) {
        return $_COOKIE['openrouter_api_key'];
    }
    return '';
}

function getGroqKey() {
    if (isset($_COOKIE['groq_api_key']) && !empty($_COOKIE['groq_api_key'])) {
        return $_COOKIE['groq_api_key'];
    }
    return '';
}

// Define API endpoints
define('OPENROUTER_API_URL', 'https://openrouter.ai/api/v1/');
define('GROQ_API_URL', 'https://api.groq.com/openai/v1/');

// Set keys from cookies or fallback to environment variables
define('OPENROUTER_API_KEY', getOpenRouterKey() ?: getenv('OPENROUTER_API_KEY') ?: '');
define('GROQ_API_KEY', getGroqKey() ?: getenv('GROQ_API_KEY') ?: '');

// Logging settings
define('LOG_ENABLED', true);
define('LOG_FILE', __DIR__ . '/../logs/app.log');

// Create logs directory if it doesn't exist
if (!is_dir(__DIR__ . '/../logs')) {
    mkdir(__DIR__ . '/../logs', 0755, true);
}

/**
 * Custom error logger
 * 
 * @param string $message Error message
 * @param string $level Error level (INFO, WARNING, ERROR)
 * @return void
 */
function app_log($message, $level = 'INFO') {
    if (!LOG_ENABLED) return;
    
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] [$level] $message" . PHP_EOL;
    
    // Append to log file
    file_put_contents(LOG_FILE, $logMessage, FILE_APPEND);
}

/**
 * Custom action hook system for error handling
 */
class ErrorHook {
    private static $actions = [];
    
    /**
     * Register an action
     * 
     * @param string $hook Hook name
     * @param callable $callback Function to execute
     * @param int $priority Priority (lower executes first)
     * @return void
     */
    public static function add_action($hook, $callback, $priority = 10) {
        if (!isset(self::$actions[$hook])) {
            self::$actions[$hook] = [];
        }
        
        self::$actions[$hook][$priority][] = $callback;
    }
    
    /**
     * Execute all registered actions for a hook
     * 
     * @param string $hook Hook name
     * @param mixed $args Arguments to pass to the callback
     * @return void
     */
    public static function do_action($hook, $args = null) {
        if (!isset(self::$actions[$hook])) {
            return;
        }
        
        // Sort by priority
        ksort(self::$actions[$hook]);
        
        foreach (self::$actions[$hook] as $priority => $callbacks) {
            foreach ($callbacks as $callback) {
                call_user_func($callback, $args);
            }
        }
    }
}

// Register default error action
ErrorHook::add_action('error_occurred', function($error) {
    app_log($error['message'], $error['level']);
});

/**
 * Handle errors
 * 
 * @param string $message Error message
 * @param string $level Error level
 * @return void
 */
function handle_error($message, $level = 'ERROR') {
    $error = [
        'message' => $message,
        'level' => $level,
        'time' => time()
    ];
    
    ErrorHook::do_action('error_occurred', $error);
}