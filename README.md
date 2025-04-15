# AI Conversation System

A simple web application that allows two AI agents to have a spoken conversation with each other using LiteLLM for AI responses and Groq API for speech functionalities.

## Features

- Two AI agents that can have a spoken conversation with each other
- Configurable LLM models for each agent (via LiteLLM)
- Customisable voices for each agent (via Groq TTS API)
- Configurable system prompts to control agent personalities
- Speech-to-text using Groq Whisper API
- Continuous, autonomous conversation flow

## Requirements

- PHP 7.4 or higher
- Web server (Apache, Nginx, etc.)
- API keys for Groq
- Access to LiteLLM endpoint

## Installation

1. Clone or download this repository to your web server directory.
2. Edit `includes/config.php` and add your API keys:
   ```php
   define('GROQ_API_KEY', 'YOUR_GROQ_API_KEY'); 
   ```
3. Make sure the `logs` directory exists and is writable by the web server.
4. Access the application via your web browser.

## Usage

1. Configure the AI agents:
   - Select the LLM models you want to use
   - Choose voices for each agent
   - Customise system prompts to control agent personalities
2. Set a starting message and select which agent should start the conversation
3. Click "Start Conversation" to begin
4. The agents will autonomously converse with each other:
   - One agent will speak using text-to-speech
   - The other agent will listen using speech-to-text
   - They will take turns speaking and listening
5. Click "Stop Conversation" at any time to end the conversation

## File Structure

```
/ai-chat-app/
├── index.php                # Main application page
├── assets/
│   ├── css/
│   │   └── tailwind.min.css # Tailwind CSS
│   └── js/
│       ├── app.js           # Main application logic
│       └── speech-handler.js # Speech processing logic
├── api/
│   ├── litellm-proxy.php    # Proxy for LiteLLM API
│   ├── groq-tts-proxy.php   # Proxy for Groq Text-to-Speech API
│   └── groq-stt-proxy.php   # Proxy for Groq Speech-to-Text API
└── includes/
    └── config.php           # Configuration settings
```

## Customisation

- Add more voice options by editing the dropdown menus in `index.php`
- Modify the conversation flow logic in `app.js`
- Adjust the speech handling capabilities in `speech-handler.js`
- Change the visual style by editing the CSS in `index.php`

## Notes

- Browser compatibility: This application works best in modern browsers that support the MediaRecorder API and Web Audio API.
- For optimal performance, use a headset or ensure your microphone and speakers are properly configured to avoid audio feedback.
- The continuous conversation may need manual intervention if transcription fails or if responses are too long or short.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Piotr Tamulewicz | [petertam.pro](https://petertam.pro/)