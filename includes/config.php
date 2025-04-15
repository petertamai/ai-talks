<?php
/**
 * Configuration settings for AI Conversation System
 * 
 * @author Piotr Tamulewicz
 * @link https://petertam.pro/
 */

// Enable error reporting for development (disable in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Define API endpoints
define('LITELLM_API_URL', 'https://backend-litellm-app.jml2s5.easypanel.host/');
define('GROQ_API_URL', 'https://api.groq.com/openai/v1/');

// API keys - in production, these should be stored securely as environment variables
// or in a separate .env file that is not committed to version control
define('GROQ_API_KEY', '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');  // Replace with your actual key
define('LITELLM_API_KEY', 'sk-HlQd84qHqCwOKUvPmXVq9g');  // Replace with your actual key

// Logging settings
define('LOG_ENABLED', true);
define('LOG_FILE', __DIR__ . '/../logs/app.log');

/**
 * Custom error logger
 * 
 * @param string $message Error message
 * @param string $level Error level (INFO, WARNING, ERROR)
 * @return void
 */
function app_log($message, $level = 'INFO') {
    if (!LOG_ENABLED) return;
    
    // Create logs directory if it doesn't exist
    $logDir = dirname(LOG_FILE);
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
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