<?php
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
            height: calc(100vh - 240px);
        }
        .chat-message {
            border-radius: 0.5rem;
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            max-width: 80%;
        }
        .chat-message.ai {
            background-color: var(--accent-1);
            color: #333;
            align-self: flex-start;
        }
        .chat-message.human {
            background-color: var(--btn-bg);
            color: white;
            align-self: flex-end;
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
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body class="text-white">
    <header class="bg-gray-800 shadow p-4">
        <div class="container mx-auto">
            <h1 class="text-2xl font-bold">AI Conversation System</h1>
            <p class="text-sm opacity-75">Watch two AI agents have a conversation with each other</p>
        </div>
    </header>

    <main class="container mx-auto p-4">
        <!-- Debug Toggle Button -->
        <div class="text-right mb-2">
            <button id="toggle-debug" class="px-3 py-1 bg-gray-600 rounded text-xs">
                Show Debug Panel
            </button>
        </div>
        
        <!-- Debug Panel (hidden by default) -->
        <div id="debug-panel" class="hidden bg-black text-green-400 p-2 rounded mb-4 h-40 overflow-y-auto text-xs font-mono" style="max-height: 200px;">
            <!-- Debug logs will appear here -->
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- AI 1 Configuration -->
            <div class="bg-gray-700 rounded-lg p-4">
                <h2 class="text-xl font-bold mb-2">AI Agent 1</h2>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-1">Model</label>
                    <select id="ai1-model" class="w-full p-2 bg-gray-800 rounded">
                        <option value="">Loading models...</option>
                    </select>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-1">Voice</label>
                    <select id="ai1-voice" class="w-full p-2 bg-gray-800 rounded">
                        <option value="Arista-PlayAI" selected>Arista (Female)</option>
                        <option value="Aaliyah-PlayAI">Aaliyah (Female)</option>
                        <option value="Adelaide-PlayAI">Adelaide (Female)</option>
                        <option value="Angelo-PlayAI">Angelo (Male)</option>
                        <option value="Atlas-PlayAI">Atlas (Male)</option>
                        <option value="Basil-PlayAI">Basil (Male)</option>
                        <option value="Briggs-PlayAI">Briggs (Male)</option>
                        <option value="Calum-PlayAI">Calum (Male)</option>
                        <option value="Celeste-PlayAI">Celeste (Female)</option>
                        <option value="Cheyenne-PlayAI">Cheyenne (Female)</option>
                        <option value="Chip-PlayAI">Chip (Male)</option>
                        <option value="Cillian-PlayAI">Cillian (Male)</option>
                        <option value="Deedee-PlayAI">Deedee (Female)</option>
                        <option value="Eleanor-PlayAI">Eleanor (Female)</option>
                        <option value="Fritz-PlayAI">Fritz (Male)</option>
                        <option value="Gail-PlayAI">Gail (Female)</option>
                        <option value="Indigo-PlayAI">Indigo (Neutral)</option>
                        <option value="Jennifer-PlayAI">Jennifer (Female)</option>
                        <option value="Judy-PlayAI">Judy (Female)</option>
                        <option value="Mamaw-PlayAI">Mamaw (Female)</option>
                        <option value="Mason-PlayAI">Mason (Male)</option>
                        <option value="Mikail-PlayAI">Mikail (Male)</option>
                        <option value="Mitch-PlayAI">Mitch (Male)</option>
                        <option value="Nia-PlayAI">Nia (Female)</option>
                        <option value="Quinn-PlayAI">Quinn (Neutral)</option>
                        <option value="Ruby-PlayAI">Ruby (Female)</option>
                        <option value="Thunder-PlayAI">Thunder (Male)</option>
                    </select>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-1">System Prompt</label>
                    <textarea id="ai1-prompt" class="w-full p-2 bg-gray-800 rounded h-24" placeholder="You are a helpful assistant having a conversation with another AI..."
                    >You are a curious and friendly AI who loves asking questions. You're having a conversation with another AI. Keep your responses brief and engaging. Ask follow-up questions.</textarea>
                </div>
            </div>
            
            <!-- AI 2 Configuration -->
            <div class="bg-gray-700 rounded-lg p-4">
                <h2 class="text-xl font-bold mb-2">AI Agent 2</h2>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-1">Model</label>
                    <select id="ai2-model" class="w-full p-2 bg-gray-800 rounded">
                        <option value="">Loading models...</option>
                    </select>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-1">Voice</label>
                    <select id="ai2-voice" class="w-full p-2 bg-gray-800 rounded">
                        <option value="Angelo-PlayAI" selected>Angelo (Male)</option>
                        <option value="Aaliyah-PlayAI">Aaliyah (Female)</option>
                        <option value="Adelaide-PlayAI">Adelaide (Female)</option>
                        <option value="Arista-PlayAI">Arista (Female)</option>
                        <option value="Atlas-PlayAI">Atlas (Male)</option>
                        <option value="Basil-PlayAI">Basil (Male)</option>
                        <option value="Briggs-PlayAI">Briggs (Male)</option>
                        <option value="Calum-PlayAI">Calum (Male)</option>
                        <option value="Celeste-PlayAI">Celeste (Female)</option>
                        <option value="Cheyenne-PlayAI">Cheyenne (Female)</option>
                        <option value="Chip-PlayAI">Chip (Male)</option>
                        <option value="Cillian-PlayAI">Cillian (Male)</option>
                        <option value="Deedee-PlayAI">Deedee (Female)</option>
                        <option value="Eleanor-PlayAI">Eleanor (Female)</option>
                        <option value="Fritz-PlayAI">Fritz (Male)</option>
                        <option value="Gail-PlayAI">Gail (Female)</option>
                        <option value="Indigo-PlayAI">Indigo (Neutral)</option>
                        <option value="Jennifer-PlayAI">Jennifer (Female)</option>
                        <option value="Judy-PlayAI">Judy (Female)</option>
                        <option value="Mamaw-PlayAI">Mamaw (Female)</option>
                        <option value="Mason-PlayAI">Mason (Male)</option>
                        <option value="Mikail-PlayAI">Mikail (Male)</option>
                        <option value="Mitch-PlayAI">Mitch (Male)</option>
                        <option value="Nia-PlayAI">Nia (Female)</option>
                        <option value="Quinn-PlayAI">Quinn (Neutral)</option>
                        <option value="Ruby-PlayAI">Ruby (Female)</option>
                        <option value="Thunder-PlayAI">Thunder (Male)</option>
                    </select>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-1">System Prompt</label>
                    <textarea id="ai2-prompt" class="w-full p-2 bg-gray-800 rounded h-24" placeholder="You are a helpful assistant having a conversation with another AI..."
                    >You are a knowledgeable and thoughtful AI. You're having a conversation with another AI. Respond to questions with interesting facts and insights. Keep responses concise.</textarea>
                </div>
            </div>
        </div>
        
        <!-- Conversation Starter -->
        <div class="bg-gray-700 rounded-lg p-4 my-4">
            <h2 class="text-xl font-bold mb-2">Conversation Starter</h2>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Starting AI</label>
                <select id="starting-ai" class="w-full md:w-auto p-2 bg-gray-800 rounded">
                    <option value="ai1">AI Agent 1</option>
                    <option value="ai2">AI Agent 2</option>
                </select>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Starting Message</label>
                <textarea id="starting-message" class="w-full p-2 bg-gray-800 rounded h-16">Hello! I'm excited to chat with you today. What interests you the most about artificial intelligence?</textarea>
            </div>
            <div class="flex justify-between">
                <button id="start-conversation" class="btn-primary px-4 py-2 rounded font-bold">Start Conversation</button>
                <button id="stop-conversation" class="bg-red-600 px-4 py-2 rounded font-bold" disabled>Stop Conversation</button>
            </div>
        </div>
        
        <!-- Chat Windows -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- AI 1 Chat -->
            <div class="bg-gray-700 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                    <h2 class="text-xl font-bold">AI Agent 1</h2>
                    <div id="ai1-status" class="text-sm px-2 py-1 rounded bg-gray-600">Idle</div>
                </div>
                <div id="ai1-chat" class="chat-container bg-gray-800 rounded-lg p-4 overflow-y-auto flex flex-col">
                    <!-- Chat messages will be inserted here -->
                </div>
            </div>
            
            <!-- AI 2 Chat -->
            <div class="bg-gray-700 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                    <h2 class="text-xl font-bold">AI Agent 2</h2>
                    <div id="ai2-status" class="text-sm px-2 py-1 rounded bg-gray-600">Idle</div>
                </div>
                <div id="ai2-chat" class="chat-container bg-gray-800 rounded-lg p-4 overflow-y-auto flex flex-col">
                    <!-- Chat messages will be inserted here -->
                </div>
            </div>
        </div>
    </main>

    <footer class="bg-gray-800 p-4 mt-4">
        <div class="container mx-auto text-center text-sm opacity-75">
            <p>&copy; <?php echo date('Y'); ?> Piotr Tamulewicz | <a href="https://petertam.pro/" class="underline">petertam.pro</a></p>
        </div>
    </footer>

    <!-- Audio Elements -->
    <audio id="ai1-audio" class="hidden" controls></audio>
    <audio id="ai2-audio" class="hidden" controls></audio>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="assets/js/app.js"></script>
</body>
</html>