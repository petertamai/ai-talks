/**
 * Speech Handler for AI Conversation System
 * 
 * Handles TTS and STT operations for AI agents
 * 
 * @author Piotr Tamulewicz
 * @link https://petertam.pro/
 */

class SpeechHandler {
    constructor() {
        // Audio contexts for TTS playback
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('AudioContext created successfully');
        } catch (e) {
            console.error('Error creating AudioContext:', e);
        }
        
        // Audio elements
        this.audioElements = {
            ai1: document.getElementById('ai1-audio'),
            ai2: document.getElementById('ai2-audio')
        };
        
        if (!this.audioElements.ai1 || !this.audioElements.ai2) {
            console.error('Audio elements not found in the DOM');
        } else {
            console.log('Audio elements initialized');
            
            // Setup audio event listeners for debugging
            this.audioElements.ai1.addEventListener('error', (e) => {
                console.error('AI1 audio error:', e);
            });
            
            this.audioElements.ai2.addEventListener('error', (e) => {
                console.error('AI2 audio error:', e);
            });
        }
        
        // Speech recognition
        this.recognition = null;
        this.isListening = false;
        this.currentListener = null;
        this.recordedChunks = [];
        this.mediaRecorder = null;
        
        // Initialize speech recognition if available
        this.initSpeechRecognition();
    }
    
    /**
     * Initialize the MediaRecorder for speech recognition
     */
    initSpeechRecognition() {
        // Check if MediaRecorder is supported
        if (!window.MediaRecorder) {
            console.error('MediaRecorder is not supported in this browser');
            return;
        }
        
        console.log('MediaRecorder is supported');
    }
    
    /**
     * Start recording audio
     * @param {string} aiId - The ID of the AI agent that's listening
     * @param {function} callback - Function to call with transcribed text
     */
    async startRecording(aiId, callback) {
        if (this.isListening) {
            console.warn('Already recording audio');
            return;
        }
        
        try {
            console.log(`Starting recording for ${aiId}...`);
            
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Microphone access granted');
            
            // Create MediaRecorder instance
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm'
            });
            
            console.log('MediaRecorder created');
            
            // Reset recorded chunks
            this.recordedChunks = [];
            
            // Add event listeners
            this.mediaRecorder.addEventListener('dataavailable', (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                    console.log(`Recorded chunk: ${event.data.size} bytes`);
                }
            });
            
            this.mediaRecorder.addEventListener('stop', async () => {
                console.log('MediaRecorder stopped, processing chunks...');
                
                // Create blob from recorded chunks
                const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
                console.log(`Created audio blob: ${audioBlob.size} bytes`);
                
                // Transcribe the audio
                await this.transcribeAudio(audioBlob, callback);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
                
                this.isListening = false;
                this.currentListener = null;
                
                console.log(`Recording session for ${aiId} completed`);
            });
            
            // Start recording
            this.mediaRecorder.start();
            this.isListening = true;
            this.currentListener = aiId;
            
            console.log(`MediaRecorder started for ${aiId}`);
            
            // Update UI to show listening state
            this.updateListeningState(aiId, true);
            
            // Set a timeout to stop recording after 10 seconds
            // This is a fallback in case the AI doesn't respond
            setTimeout(() => {
                if (this.isListening && this.currentListener === aiId) {
                    console.log(`Auto-stopping recording for ${aiId} after timeout`);
                    this.stopRecording();
                }
            }, 10000);
            
        } catch (error) {
            console.error('Error starting recording:', error);
            this.isListening = false;
            callback(''); // Call callback with empty string to continue conversation
        }
    }
    
    /**
     * Stop recording audio
     */
    stopRecording() {
        if (!this.isListening || !this.mediaRecorder) {
            console.warn('Not currently recording');
            return;
        }
        
        console.log(`Stopping recording for ${this.currentListener}`);
        
        // Stop MediaRecorder
        this.mediaRecorder.stop();
        
        // Update UI to show not listening state
        this.updateListeningState(this.currentListener, false);
    }
    
    /**
     * Transcribe audio using Groq's Speech-to-Text API
     * @param {Blob} audioBlob - The recorded audio blob
     * @param {function} callback - Function to call with transcribed text
     */
    async transcribeAudio(audioBlob, callback) {
        try {
            console.log(`Transcribing audio (${audioBlob.size} bytes)...`);
            
            // Create form data for API request
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            
            console.log('Sending audio to Groq STT API...');
            
            // Send request to our PHP proxy
            const response = await fetch('api/groq-stt-proxy.php', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Transcription response:', data);
            
            // Extract transcribed text
            const transcribedText = data.text || '';
            console.log(`Transcribed text: "${transcribedText}"`);
            
            // Call callback with transcribed text
            callback(transcribedText);
            
        } catch (error) {
            console.error('Error transcribing audio:', error);
            callback(''); // Call callback with empty string on error
        }
    }

/**
 * Speak text using Groq's Text-to-Speech API
 * @param {string} aiId - The ID of the AI agent that's speaking
 * @param {string} text - The text to speak
 * @param {string} voice - The voice to use
 * @param {function} callback - Function to call when speech is finished
 */
async speakText(aiId, text, voice, callback) {
    try {
        console.log(`Speaking with ${aiId}, voice: ${voice}, text: "${text.substring(0, 50)}..."`);
        
        // Update UI to show speaking state
        this.updateSpeakingState(aiId, true);
        
        // Verify parameters
        if (!voice || voice.trim() === '') {
            throw new Error('Voice parameter is empty');
        }
        
        if (!text || text.trim() === '') {
            throw new Error('Text parameter is empty');
        }
        
        // Get the conversation ID from localStorage (used for sharing)
        const conversationId = localStorage.getItem('currentConversationId') || 
            ('conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
        
        // If no conversation ID exists, create and store one
        if (!localStorage.getItem('currentConversationId')) {
            localStorage.setItem('currentConversationId', conversationId);
        }
        
        console.log(`Using conversation ID: ${conversationId}`);
        
        // Get the current message index (count of all messages)
        const messageIndex = document.querySelectorAll('.chat-message').length - 1;
        
        console.log(`TTS for conversation: ${conversationId}, message: ${messageIndex}, agent: ${aiId}`);
        
        // Debug the exact payload we're sending
        const payload = {
            voice: voice,
            input: text,
            conversation_id: conversationId,
            message_index: messageIndex,
            agent: aiId
        };
        
        console.log('TTS API payload:', payload);
        console.log('JSON payload:', JSON.stringify(payload));
        
        // Send request to our PHP proxy
        console.log('Sending request to TTS proxy...');
        const response = await fetch('api/groq-tts-proxy.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        console.log('TTS response status:', response.status);
        console.log('TTS response type:', response.headers.get('Content-Type'));
        
        if (!response.ok) {
            try {
                const errorData = await response.json();
                throw new Error(`Server error: ${errorData.error || response.status}`);
            } catch (e) {
                throw new Error(`Server error: ${response.status}`);
            }
        }
        
        // Get response content type
        const contentType = response.headers.get('Content-Type');
        console.log('TTS response content type:', contentType);
        
        // Check if response is audio
        if (contentType && contentType.includes('audio/')) {
            // Get audio blob from response
            const audioBlob = await response.blob();
            console.log(`Audio blob received: ${audioBlob.size} bytes`);
            
            // Create object URL for audio blob
            const audioUrl = URL.createObjectURL(audioBlob);
            console.log('Audio URL created:', audioUrl);
            
            // Verify audio element exists
            if (!this.audioElements[aiId]) {
                throw new Error(`Audio element for ${aiId} not found`);
            }
            
            // Set audio source and play
            const audioElement = this.audioElements[aiId];
            audioElement.src = audioUrl;
            
            // Debug log the audio element state
            console.log('Audio element details:', {
                id: aiId,
                src: audioElement.src,
                paused: audioElement.paused,
                duration: audioElement.duration,
                readyState: audioElement.readyState
            });
            
            // Add event listeners
            audioElement.oncanplay = () => {
                console.log(`Audio for ${aiId} is ready to play`);
                audioElement.play().catch(e => {
                    console.error('Error playing audio:', e);
                });
            };
            
            audioElement.onended = () => {
                console.log(`Audio for ${aiId} finished playing`);
                
                // Update UI to show not speaking state
                this.updateSpeakingState(aiId, false);
                
                // Show the play button in conversation header if audio exists
                if (window.conversationShare) {
                    window.conversationShare.showShareButton(true);
                    window.conversationShare.showPlayButton(true);
                    window.conversationShare.updatePlayButtonVisibility();
                }
                
                // Call callback when speech is finished
                callback();
                
                // Revoke object URL to free memory
                URL.revokeObjectURL(audioUrl);
            };
            
            audioElement.onerror = (e) => {
                console.error(`Audio error for ${aiId}:`, e);
                this.updateSpeakingState(aiId, false);
                callback();
            };
            
            // Try to play audio
            try {
                audioElement.load(); // Force reload
                console.log(`Attempting to play audio for ${aiId}`);
            } catch (e) {
                console.error('Error loading audio:', e);
                this.updateSpeakingState(aiId, false);
                callback();
            }
        } else {
            // If not audio, it's likely an error - try to parse as JSON
            console.warn('Response is not audio, trying to parse as JSON');
            try {
                const errorData = await response.json();
                throw new Error(`TTS API error: ${errorData.error || 'Unknown error'}`);
            } catch (e) {
                const responseText = await response.text();
                throw new Error(`TTS API returned non-audio response: ${responseText.substring(0, 100)}`);
            }
        }
        
    } catch (error) {
        console.error('Error speaking text:', error);
        
        // Update UI to show not speaking state
        this.updateSpeakingState(aiId, false);
        
        // Call callback on error
        callback();
    }
}
    /**
     * Update UI to show speaking state
     * @param {string} aiId - The ID of the AI agent
     * @param {boolean} isSpeaking - Whether the agent is speaking
     */
    updateSpeakingState(aiId, isSpeaking) {
        const chatContainer = document.getElementById(`${aiId}-chat`);
        const statusElement = document.getElementById(`${aiId}-status`);
        
        if (!chatContainer || !statusElement) {
            console.error(`Elements for ${aiId} not found`);
            return;
        }
        
        console.log(`Updating ${aiId} speaking state to: ${isSpeaking}`);
        
        if (isSpeaking) {
            chatContainer.classList.add('speaking');
            statusElement.textContent = 'Speaking';
            statusElement.className = 'text-sm px-2 py-1 rounded bg-green-700';
        } else {
            chatContainer.classList.remove('speaking');
            statusElement.textContent = 'Idle';
            statusElement.className = 'text-sm px-2 py-1 rounded bg-gray-600';
        }
    }
    
    /**
     * Update UI to show listening state
     * @param {string} aiId - The ID of the AI agent
     * @param {boolean} isListening - Whether the agent is listening
     */
    updateListeningState(aiId, isListening) {
        const chatContainer = document.getElementById(`${aiId}-chat`);
        const statusElement = document.getElementById(`${aiId}-status`);
        
        if (!chatContainer || !statusElement) {
            console.error(`Elements for ${aiId} not found`);
            return;
        }
        
        console.log(`Updating ${aiId} listening state to: ${isListening}`);
        
        if (isListening) {
            statusElement.textContent = 'Listening';
            statusElement.className = 'text-sm px-2 py-1 rounded bg-blue-700';
        } else {
            statusElement.textContent = 'Idle';
            statusElement.className = 'text-sm px-2 py-1 rounded bg-gray-600';
        }
    }
}