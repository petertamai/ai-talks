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


    async speakText(aiId, text) {
        // Check if TTS is enabled for this AI
        const ttsEnabled = $(`#${aiId}-tts-enabled`).is(':checked');
        if (!ttsEnabled) {
            debugLog(`TTS disabled for ${aiId}, skipping speech`);
            return Promise.resolve(); // Resolve immediately
        }
        
        try {
            const voice = $(`#${aiId}-voice`).val();
            
            // Double-check voice is valid
            if (!voice || voice.trim() === '') {
                throw new Error('Voice parameter is empty');
            }
            
            // Get the conversation ID from localStorage (used for sharing)
            const conversationId = localStorage.getItem('currentConversationId') || 
                ('conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
            
            // If no conversation ID exists, create and store one
            if (!localStorage.getItem('currentConversationId')) {
                localStorage.setItem('currentConversationId', conversationId);
            }
            
            debugLog(`Speaking with ${aiId} using voice: ${voice}, conversation: ${conversationId}`);
            
            // Calculate speaking time for fallback
            const speakingTime = calculateSpeakingTime(text);
            debugLog(`Calculated speaking time: ${speakingTime}ms for ${text.split(/\s+/).length} words`);
            
            // Update UI to show speaking state
            updateSpeakingState(aiId, true);
            
            // Verify text
            if (!text || text.trim() === '') {
                throw new Error('Text parameter is empty');
            }
            
            // Get the current message index (count of all messages)
            const messageIndex = document.querySelectorAll('.chat-message').length - 1;
            
            debugLog(`TTS for conversation: ${conversationId}, message: ${messageIndex}, agent: ${aiId}`);
            
            // Send request to our PHP proxy
            const response = await fetch('api/groq-tts-proxy.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    voice: voice,
                    input: text,
                    conversation_id: conversationId,
                    message_index: messageIndex,
                    agent: aiId
                })
            });
            
            debugLog(`TTS response status: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                debugLog(`TTS error response: ${errorText}`);
                throw new Error(`TTS API error: ${response.status}`);
            }
            
            // Get audio blob from response
            const audioBlob = await response.blob();
            debugLog(`Received audio blob: ${audioBlob.size} bytes`);
            
            // Create object URL for audio blob
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Play the audio
            return new Promise((resolve, reject) => {
                const audioElement = audioElements[aiId];
                
                audioElement.src = audioUrl;
                audioElement.onerror = (e) => {
                    debugLog(`Audio error: ${e}`);
                    updateSpeakingState(aiId, false);
                    URL.revokeObjectURL(audioUrl);
                    
                    // Still wait for the calculated speaking time
                    setTimeout(resolve, speakingTime);
                };
                
                audioElement.onended = () => {
                    debugLog(`Audio finished playing for ${aiId}`);
                    updateSpeakingState(aiId, false);
                    URL.revokeObjectURL(audioUrl);
                    
                    // Update the play button visibility after TTS completes
                    if (window.conversationShare) {
                        window.conversationShare.showShareButton(true);
                        // Force a check for audio files
                        window.conversationShare.updatePlayButtonVisibility().then(hasAudio => {
                            if (hasAudio) {
                                window.conversationShare.showPlayButton(true);
                            }
                        });
                    }
                    
                    resolve();
                };
                
                // Set a timer based on calculated speaking time as a fallback
                setTimeout(() => {
                    if (audioElement.paused || audioElement.ended) {
                        // Audio already ended
                        return;
                    }
                    
                    debugLog(`Speaking timer expired for ${aiId} after ${speakingTime}ms`);
                    updateSpeakingState(aiId, false);
                    audioElement.pause();
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                }, speakingTime + 500); // Add a small buffer
                
                // Start playing audio
                audioElement.play().catch(e => {
                    debugLog(`Error playing audio: ${e.message}`);
                    updateSpeakingState(aiId, false);
                    
                    // Wait for the calculated speaking time
                    setTimeout(resolve, speakingTime);
                });
            });
            
        } catch (error) {
            debugLog(`Error in speakText: ${error.message}`);
            updateSpeakingState(aiId, false);
            
            // Wait for a short time to simulate speech
            return new Promise(resolve => {
                setTimeout(resolve, 1000);
            });
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
        const conversationStatus = document.getElementById('conversation-status');
        
        // Fall back to global conversation status if specific elements not found
        if (conversationStatus) {
            if (isSpeaking) {
                const aiName = $(`#${aiId}-name`).val() || aiId;
                conversationStatus.textContent = `${aiName} is speaking`;
                conversationStatus.className = 'text-sm px-2 py-1 rounded bg-green-700';
            } else {
                // Only set to Idle if the conversation is NOT active
                if (!window.conversationActive) {
                    conversationStatus.textContent = 'Idle';
                    conversationStatus.className = 'text-sm px-2 py-1 rounded bg-gray-600';
                }
            }
        }
        
        // Continue with specific elements if they exist
        if (chatContainer && statusElement) {
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
        
        // Highlight the current message that's being spoken
        if (isSpeaking) {
            // Find the last message from this AI
            const messages = document.querySelectorAll(`.chat-message.${aiId}`);
            if (messages.length > 0) {
                const lastMessage = messages[messages.length - 1];
                
                // Remove speaking class from all messages
                document.querySelectorAll('.chat-message.speaking').forEach(el => {
                    el.classList.remove('speaking');
                });
                
                // Add speaking class to this message
                lastMessage.classList.add('speaking');
            }
        } else {
            // Remove speaking class from all messages when done
            document.querySelectorAll('.chat-message.speaking').forEach(el => {
                el.classList.remove('speaking');
            });
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
        const conversationStatus = document.getElementById('conversation-status');
        
        // Fall back to global conversation status if specific elements not found
        if (conversationStatus) {
            if (isListening) {
                const aiName = $(`#${aiId}-name`).val() || aiId;
                conversationStatus.textContent = `${aiName} is listening`;
                conversationStatus.className = 'text-sm px-2 py-1 rounded bg-blue-700';
            } else {
                // Only set to Idle if the conversation is NOT active
                if (!window.conversationActive) {
                    conversationStatus.textContent = 'Idle';
                    conversationStatus.className = 'text-sm px-2 py-1 rounded bg-gray-600';
                }
            }
        }
        
        // Continue with specific elements if they exist
        if (chatContainer && statusElement) {
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
}