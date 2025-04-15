<?php
//index.php
// Include configuration
require_once 'includes/config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Conversation System - by Piotr Tamulewicz</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.3/dist/sweetalert2.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />
    <style>
        :root {
            --bg-color: #4D4D4D;
            --btn-bg: #397BFB;
            --accent-1: #cecaba;
            --accent-2: #b0fbc1;
        }
        body {
            background-color: var(--bg-color);
            font-family: 'Nunito', sans-serif;
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        main {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        .content-container {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        .btn-primary {
            background-color: var(--btn-bg);
        }
        .accent-1 {
            color: var(--accent-1);
        }
        .accent-2 {
            color: var(--accent-2);
        }
        .chat-container {
            flex: 1;
            overflow-y: auto;
            min-height: 200px;
            display: flex;
            flex-direction: column;
            max-height: calc(93vh - 115px);
            scrollbar-width: thin;
            scrollbar-color: var(--btn-bg) var(--bg-color);
        }
        .chat-container::-webkit-scrollbar {
            width: 8px;
        }
        .chat-container::-webkit-scrollbar-track {
            background: var(--bg-color);
        }
        .chat-container::-webkit-scrollbar-thumb {
            background-color: var(--btn-bg);
            border-radius: 20px;
        }
        .chat-message {
            border-radius: 0.5rem;
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            max-width: 85%;
            position: relative;
            word-break: break-word;
        }
        .chat-message.ai1 {
            background-color: var(--accent-1);
            color: #333;
            align-self: flex-start;
        }
        .chat-message.ai2 {
            background-color: var(--btn-bg);
            color: white;
            align-self: flex-end;
        }
        .chat-message.human {
            background-color: #6B7280;
            color: white;
            align-self: flex-start;
        }
        .agent-name {
            position: absolute;
            top: -0.75rem;
            font-size: 0.75rem;
            font-weight: bold;
            padding: 0.1rem 0.5rem;
            border-radius: 0.5rem;
        }
        .ai1 .agent-name {
            left: 0.5rem;
            background-color: var(--accent-1);
            color: #333;
        }
        .ai2 .agent-name {
            right: 0.5rem;
            background-color: var(--btn-bg);
            color: white;
        }
        .human .agent-name {
            left: 0.5rem;
            background-color: #6B7280;
            color: white;
        }
        .speaking {
            box-shadow: 0 0 0 2px var(--accent-2);
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(176, 251, 193, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(176, 251, 193, 0); }
            100% { box-shadow: 0 0 0 0 rgba(176, 251, 193, 0); }
        }
        .settings-panel {
            display: none;
        }
        .settings-panel.open {
            display: block;
        }
        /* Typing indicator */
        .typing-indicator {
            background-color: rgba(255, 255, 255, 0.2);
            will-change: transform;
            width: auto;
            border-radius: 50px;
            padding: 10px;
            display: inline-flex;
            align-items: center;
            margin-bottom: 0.5rem;
            position: relative;
        }
        .typing-indicator span {
            height: 8px;
            width: 8px;
            float: left;
            margin: 0 1px;
            background-color: #fff;
            display: block;
            border-radius: 50%;
            opacity: 0.4;
        }
        .typing-indicator span:nth-of-type(1) {
            animation: 1s blink infinite .3333s;
        }
        .typing-indicator span:nth-of-type(2) {
            animation: 1s blink infinite .6666s;
        }
        .typing-indicator span:nth-of-type(3) {
            animation: 1s blink infinite .9999s;
        }
        @keyframes blink {
            50% {
                opacity: 1;
            }
        }
        .typing-indicator-container {
            display: none;
        }
        /* Select2 overrides */
        .select2-container {
            width: 100% !important;
        }
        .select2-container--default .select2-selection--single {
            background-color: #1F2937 !important;
            border: 1px solid #374151 !important;
            border-radius: 0.375rem !important;
            height: 38px !important;
            color: white !important;
        }
        .select2-container--default .select2-selection--single .select2-selection__rendered {
            color: white !important;
            line-height: 38px !important;
        }
        .select2-container--default .select2-results__option--highlighted[aria-selected] {
            background-color: var(--btn-bg) !important;
        }
        .select2-dropdown {
            background-color: #1F2937 !important;
            border: 1px solid #374151 !important;
            color: white !important;
        }
        .select2-results__option {
            padding: 8px !important;
        }
        /* Mobile optimizations */
        @media (max-width: 768px) {
            .chat-message {
                max-width: 90%;
            }
            body {
                overflow: auto;
                height: auto;
            }
            main {
                overflow: visible;
            }
            .content-container {
                overflow: visible;
            }
            .chat-container {
                min-height: 300px;
                max-height: 50vh;
            }
        }
        .select2-container--classic .select2-search--dropdown .select2-search__field {
            color: #000000;
        }
        .model-badge {
        position: absolute;
        bottom: -12px;
        font-size: 11px;
        background-color: rgba(0,0,0,0.5);
        padding: 2px 6px;
        border-radius: 10px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 120px;
    }
    
    .chat-message.ai1 .model-badge {
        left: 10px;
        color: var(--accent-1);
    }
    
    .chat-message.ai2 .model-badge {
        right: 10px;
        color: white;
    }
    
    /* Make the chat message have relative positioning to place the badge */
    .chat-message {
        position: relative;
        padding-bottom: 15px; /* Add some padding for the badge */
    }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body class="text-white">
    <header class="bg-gray-800 shadow p-3">
        <div class="container mx-auto flex justify-between items-center">
            <h1 class="text-xl md:text-2xl font-bold">AI Conversation System</h1>
            <div class="flex space-x-2">
                <button id="toggle-settings" class="px-3 py-1 bg-gray-600 rounded text-xs md:text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span class="hidden md:inline">Settings</span>
                </button>
                <button id="toggle-debug" class="px-3 py-1 bg-gray-600 rounded text-xs md:text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span class="hidden md:inline">Debug</span>
                </button>
            </div>
        </div>
    </header>

    <main class="container mx-auto p-3">
    <!-- Settings Panel -->
    <div id="settings-panel" class="settings-panel bg-gray-800 rounded-lg p-3 mb-3">
        <div class="flex justify-between items-center mb-3">
            <h2 class="text-xl font-bold">Settings</h2>
            <button id="close-settings" class="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm">
                Close
            </button>
        </div>
        
        <!-- API Keys -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div class="bg-gray-700 rounded-lg p-3">
                <h3 class="text-lg font-bold mb-2">OpenRouter API Key</h3>
                <div class="mb-2">
                    <input type="password" id="openrouter-api-key" class="w-full p-2 bg-gray-800 rounded form-control" 
                           placeholder="Enter OpenRouter API key" value="<?php echo htmlspecialchars(OPENROUTER_API_KEY); ?>">
                </div>
                <p class="text-xs opacity-75 mb-2">Your API key is stored securely in your browser cookies.</p>
                <button id="save-openrouter-key" class="btn-primary px-3 py-1 rounded text-sm">Save Key</button>
            </div>
            
            <div class="bg-gray-700 rounded-lg p-3">
                <h3 class="text-lg font-bold mb-2">Groq API Key <span class="text-xs">(Optional for TTS)</span></h3>
                <div class="mb-2">
                    <input type="password" id="groq-api-key" class="w-full p-2 bg-gray-800 rounded form-control" 
                           placeholder="Enter Groq API key (optional)" value="<?php echo htmlspecialchars(GROQ_API_KEY); ?>">
                </div>
                <p class="text-xs opacity-75 mb-2">Required only if you want text-to-speech.</p>
                <button id="save-groq-key" class="btn-primary px-3 py-1 rounded text-sm">Save Key</button>
            </div>
        </div>
        
        <!-- AI Configuration -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <!-- AI 1 Configuration -->
            <div class="bg-gray-700 rounded-lg p-3">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="text-lg font-bold">AI Agent 1</h3>
                    <div class="flex items-center">
                        <label class="text-xs mr-2">Name:</label>
                        <input type="text" id="ai1-name" class="p-1 bg-gray-800 rounded w-24 form-control" value="AI-1">
                    </div>
                </div>
                
                <div class="mb-3">
                    <label class="block text-sm font-medium mb-1">Model</label>
                    <select id="ai1-model" class="model-select w-full p-2 bg-gray-800 rounded form-control">
                        <option value="">Loading models...</option>
                    </select>
                </div>
                
                <!-- Add these model parameters in two columns -->
                <div class="grid grid-cols-2 gap-2 mb-3">
                    <div>
                        <label class="block text-sm font-medium mb-1">Max Tokens</label>
                        <input type="number" id="ai1-max-tokens" class="w-full p-2 bg-gray-800 rounded form-control" 
                               value="1200" min="50" max="4000">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Temperature</label>
                        <input type="number" id="ai1-temperature" class="w-full p-2 bg-gray-800 rounded form-control" 
                               value="0.5" min="0" max="2" step="0.1">
                    </div>
                </div>
                
                <div class="mb-3">
                    <div class="flex items-center justify-between mb-1">
                        <label class="text-sm font-medium">Text-to-Speech</label>
                        <label class="inline-flex items-center">
                            <input type="checkbox" id="ai1-tts-enabled" class="form-checkbox rounded">
                            <span class="ml-2 text-xs">Enabled</span>
                        </label>
                    </div>
                    <select id="ai1-voice" class="w-full p-2 bg-gray-800 rounded form-control" disabled>
                        <option value="Arista-PlayAI" selected>Arista (Female)</option>
                        <option value="Angelo-PlayAI">Angelo (Male)</option>
                        <option value="Nova-PlayAI">Nova (Female)</option>
                        <option value="Atlas-PlayAI">Atlas (Male)</option>
                        <option value="Indigo-PlayAI">Indigo (Neutral)</option>
                        <!-- More voice options can be added here -->
                    </select>
                </div>
                
                <div class="mb-2">
                    <label class="block text-sm font-medium mb-1">System Prompt</label>
                    <textarea id="ai1-prompt" class="w-full p-2 bg-gray-800 rounded h-20 form-control" placeholder="Instructions for AI behavior..."
                    >You are a curious and friendly AI who loves asking questions. You're having a conversation with another AI. Keep your responses brief and engaging. Ask follow-up questions.</textarea>
                </div>
            </div>
            
            <!-- AI 2 Configuration -->
            <div class="bg-gray-700 rounded-lg p-3">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="text-lg font-bold">AI Agent 2</h3>
                    <div class="flex items-center">
                        <label class="text-xs mr-2">Name:</label>
                        <input type="text" id="ai2-name" class="p-1 bg-gray-800 rounded w-24 form-control" value="AI-2">
                    </div>
                </div>
                
                <div class="mb-3">
                    <label class="block text-sm font-medium mb-1">Model</label>
                    <select id="ai2-model" class="model-select w-full p-2 bg-gray-800 rounded form-control">
                        <option value="">Loading models...</option>
                    </select>
                </div>
                
                <!-- Add these model parameters in two columns -->
                <div class="grid grid-cols-2 gap-2 mb-3">
                    <div>
                        <label class="block text-sm font-medium mb-1">Max Tokens</label>
                        <input type="number" id="ai2-max-tokens" class="w-full p-2 bg-gray-800 rounded form-control" 
                               value="1200" min="50" max="4000">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Temperature</label>
                        <input type="number" id="ai2-temperature" class="w-full p-2 bg-gray-800 rounded form-control" 
                               value="0.5" min="0" max="2" step="0.1">
                    </div>
                </div>
                
                <div class="mb-3">
                    <div class="flex items-center justify-between mb-1">
                        <label class="text-sm font-medium">Text-to-Speech</label>
                        <label class="inline-flex items-center">
                            <input type="checkbox" id="ai2-tts-enabled" class="form-checkbox rounded">
                            <span class="ml-2 text-xs">Enabled</span>
                        </label>
                    </div>
                    <select id="ai2-voice" class="w-full p-2 bg-gray-800 rounded form-control" disabled>
                        <option value="Angelo-PlayAI" selected>Angelo (Male)</option>
                        <option value="Arista-PlayAI">Arista (Female)</option>
                        <option value="Nova-PlayAI">Nova (Female)</option>
                        <option value="Atlas-PlayAI">Atlas (Male)</option>
                        <option value="Indigo-PlayAI">Indigo (Neutral)</option>
                        <!-- More voice options can be added here -->
                    </select>
                </div>
                
                <div class="mb-2">
                    <label class="block text-sm font-medium mb-1">System Prompt</label>
                    <textarea id="ai2-prompt" class="w-full p-2 bg-gray-800 rounded h-20 form-control" placeholder="Instructions for AI behavior..."
                    >You are a knowledgeable and thoughtful AI. You're having a conversation with another AI. Respond to questions with interesting facts and insights. Keep responses concise.</textarea>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Debug Panel (hidden by default) -->
    <div id="debug-panel" class="hidden bg-black text-green-400 p-2 rounded mb-3 overflow-y-auto text-xs font-mono" style="max-height: 200px;">
        <!-- Debug logs will appear here -->
    </div>
    
    <div class="content-container">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full">
            <!-- Conversation Starter -->
            <div class="bg-gray-700 rounded-lg p-3">
                <h2 class="text-xl font-bold mb-2">Conversation Starter</h2>
                <div class="mb-3">
                    <label class="block text-sm font-medium mb-1">Message Direction</label>
                    <div class="flex flex-wrap items-center gap-3">
                        <div class="flex items-center">
                            <input type="radio" id="direction-human-to-ai1" name="conversation-direction" value="human-to-ai1" class="mr-2">
                            <label for="direction-human-to-ai1" class="text-sm">Human → AI-1</label>
                        </div>
                        <div class="flex items-center">
                            <input type="radio" id="direction-ai1-to-ai2" name="conversation-direction" value="ai1-to-ai2" class="mr-2" checked>
                            <label for="direction-ai1-to-ai2" class="text-sm">AI-1 → AI-2</label>
                        </div>
                        <div class="flex items-center">
                            <input type="radio" id="direction-human-to-ai2" name="conversation-direction" value="human-to-ai2" class="mr-2">
                            <label for="direction-human-to-ai2" class="text-sm">Human → AI-2</label>
                        </div>
                        <div class="flex items-center">
                            <input type="radio" id="direction-ai2-to-ai1" name="conversation-direction" value="ai2-to-ai1" class="mr-2">
                            <label for="direction-ai2-to-ai1" class="text-sm">AI-2 → AI-1</label>
                        </div>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="block text-sm font-medium mb-1">Starting Message</label>
                    <textarea id="starting-message" class="w-full p-2 bg-gray-800 rounded h-24 lg:h-48 form-control">Hello! I'm excited to chat with you today. What interests you the most about artificial intelligence?</textarea>
                </div>
                <div class="flex justify-between">
                    <button id="start-conversation" class="btn-primary px-4 py-2 rounded font-bold">Start Conversation</button>
                    <button id="stop-conversation" class="bg-red-600 px-4 py-2 rounded font-bold" disabled>Stop Conversation</button>
                </div>
            </div>
            
            <!-- Chat Window -->
            <div class="bg-gray-700 rounded-lg p-3 flex flex-col h-full">
                <div class="flex items-center justify-between mb-2">
                    <h2 class="text-xl font-bold">Conversation</h2>
                    <div id="conversation-status" class="text-sm px-2 py-1 rounded bg-gray-600">Idle</div>
                </div>
                <div id="chat-container" class="chat-container bg-gray-800 rounded-lg p-3 overflow-y-auto flex flex-col">
                    <!-- Chat messages will be inserted here -->
                </div>
                <!-- Typing indicators -->
                <div id="ai1-typing" class="typing-indicator-container">
                    <div class="typing-indicator ai1">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
                <div id="ai2-typing" class="typing-indicator-container">
                    <div class="typing-indicator ai2">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>

    <footer class="bg-gray-800 py-2 px-3">
        <div class="container mx-auto text-center text-sm opacity-75">
            <p>&copy; <?php echo date('Y'); ?> Piotr Tamulewicz | <a href="https://petertam.pro/" class="underline">petertam.pro</a></p>
        </div>
    </footer>

    <!-- Audio Elements -->
    <audio id="ai1-audio" class="hidden" controls></audio>
    <audio id="ai2-audio" class="hidden" controls></audio>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.3/dist/sweetalert2.all.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
    <script src="assets/js/utils.js"></script>
    <script src="assets/js/config.js"></script>
    <script src="assets/js/api.js"></script>
    <script src="assets/js/conversation.js"></script>
    <script src="assets/js/app.js"></script>
    <script src="assets/js/conversation-share.js"></script>
    <script>
// Fix for settings panel opening/closing
document.addEventListener('DOMContentLoaded', function() {
    // Toggle settings panel via the top button
    document.getElementById('toggle-settings').addEventListener('click', function() {
        const settingsPanel = document.getElementById('settings-panel');
        if (settingsPanel) {
            settingsPanel.classList.toggle('open');
        }
    });

    // Close settings panel via the Close button
    document.getElementById('close-settings').addEventListener('click', function() {
        const settingsPanel = document.getElementById('settings-panel');
        if (settingsPanel) {
            settingsPanel.classList.remove('open');
        }
    });

    // Make sure the settings panel CSS includes the display styles
    const style = document.createElement('style');
    style.textContent = `
        .settings-panel {
            display: none;
        }
        .settings-panel.open {
            display: block;
        }
    `;
    document.head.appendChild(style);
});
</script>

</body>



</html>