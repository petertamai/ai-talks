/**
 * Conversation Share Functionality
 * 
 * Adds sharing functionality to the AI Conversation System
 * 
 * @author Piotr Tamulewicz <pt@petertam.pro>
 */

class ConversationShare {
    constructor() {
        this.conversationId = null;
        this.isPlaying = false;
        this.audioQueue = [];
        this.currentAudioIndex = 0;
        this.audioPlayer = new Audio();
        this.init();
    }
    
    init() {
        // Create a unique ID for this conversation if not exists
        this.conversationId = this.getConversationId();
        
        // Add the share button to the UI - wait for DOM to be fully loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.addShareButton();
            this.bindEvents();
            
            // Log initialization
            console.log('ConversationShare initialized with ID:', this.conversationId);
        });
    }
    
    getConversationId() {
        // Check if we already have a conversation ID in localStorage
        let id = localStorage.getItem('currentConversationId');
        
        // If not, create a new one
        if (!id) {
            id = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('currentConversationId', id);
        }
        
        return id;
    }
    
    resetConversationId() {
        // Generate a new conversation ID
        this.conversationId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('currentConversationId', this.conversationId);
        
        console.log('ConversationShare reset with new ID:', this.conversationId);
    }
    
    addShareButton() {
        // Find the conversation header element
        const headerElement = document.querySelector('.bg-gray-700.rounded-lg.p-3.flex.flex-col.h-full h2');
        
        if (!headerElement) {
            console.error('Could not find conversation header element');
            
            // Try alternative selector
            const altHeaderElement = document.querySelector('.flex.items-center.justify-between h2');
            
            if (!altHeaderElement) {
                console.error('Could not find alternative conversation header element');
                return;
            }
        }
        
        // Create a flex container for the header
        const headerParent = headerElement ? headerElement.parentNode : altHeaderElement.parentNode;
        
        // Find or create the button container
        let buttonContainer = document.querySelector('.conversation-header-buttons');
        
        if (!buttonContainer) {
            // Create the container if it doesn't exist
            buttonContainer = document.createElement('div');
            buttonContainer.className = 'conversation-header-buttons flex ml-2';
            
            // Find the status element
            const statusElement = document.getElementById('conversation-status');
            
            if (statusElement && headerParent === statusElement.parentNode) {
                // Insert before status element
                headerParent.insertBefore(buttonContainer, statusElement);
            } else {
                // Fallback: create a header container and reorganize elements
                const headerContainer = document.createElement('div');
                headerContainer.className = 'flex justify-between items-center w-full mb-2';
                
                // Get the header element
                const headerToMove = headerElement || altHeaderElement;
                
                // Insert the header container before the original header
                headerParent.insertBefore(headerContainer, headerToMove);
                
                // Move the header into the container
                headerContainer.appendChild(headerToMove);
                
                // Add the button container
                headerContainer.appendChild(buttonContainer);
                
                // If there's a status element, move it after the buttons
                if (statusElement) {
                    headerContainer.appendChild(statusElement);
                }
            }
        }
        
        // Create share button if it doesn't exist
        if (!document.getElementById('share-conversation-btn')) {
            const shareButton = document.createElement('button');
            shareButton.id = 'share-conversation-btn';
            shareButton.className = 'ml-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm';
            shareButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>Share';
            
            // Add to our container
            buttonContainer.appendChild(shareButton);
        }
        
        // Create play button if it doesn't exist
        if (!document.getElementById('play-conversation-btn')) {
            const playButton = document.createElement('button');
            playButton.id = 'play-conversation-btn';
            playButton.className = 'ml-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm hidden'; // Keep this hidden until we have audio
            playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Play';
            
            // Add to our container
            buttonContainer.appendChild(playButton);
        }
    }
    
    showShareButton(show) {
        const shareButton = document.getElementById('share-conversation-btn');
        if (shareButton) {
            if (show) {
                shareButton.classList.remove('hidden');
            } else {
                shareButton.classList.add('hidden');
            }
        }
    }
    
    showPlayButton(show) {
        const playButton = document.getElementById('play-conversation-btn');
        if (playButton) {
            if (show) {
                playButton.classList.remove('hidden');
            } else {
                playButton.classList.add('hidden');
            }
        }
    }
    
    bindEvents() {
        // Share button click event
        const shareBtn = document.getElementById('share-conversation-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareConversation());
        }
        
        // Play button click event
        const playBtn = document.getElementById('play-conversation-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => this.togglePlayConversation());
        }
        
        // When conversation starts, reset the ID
        const startBtn = document.getElementById('start-conversation');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.resetConversationId());
        }
    }
    
    async shareConversation() {
        try {
            // Collect conversation data
            const conversationData = this.collectConversationData();
            
            // Show loading state
            Swal.fire({
                title: 'Generating share link...',
                text: 'Please wait while we prepare your conversation for sharing.',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Call the API to save and share the conversation
            const response = await fetch('api/share-conversation.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    conversation_id: this.conversationId,
                    data: conversationData
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Show success message with copyable link
                Swal.fire({
                    title: 'Conversation Shared!',
                    html: `
                        <p>Share this link with others:</p>
                        <div class="flex my-4">
                            <input type="text" id="share-link-input" value="${data.shareUrl}" 
                                class="flex-grow p-2 bg-gray-800 text-white rounded-l">
                            <button id="copy-link-btn" 
                                class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-r">
                                Copy
                            </button>
                        </div>
                        <p class="text-sm text-gray-400">Link expires in 30 days</p>
                    `,
                    icon: 'success',
                    showConfirmButton: true,
                    confirmButtonText: 'Close',
                    confirmButtonColor: '#397BFB',
                    didOpen: () => {
                        // Add click event for copy button
                        document.getElementById('copy-link-btn').addEventListener('click', () => {
                            const linkInput = document.getElementById('share-link-input');
                            linkInput.select();
                            document.execCommand('copy');
                            
                            // Show copied notification
                            const copyBtn = document.getElementById('copy-link-btn');
                            const originalText = copyBtn.innerText;
                            copyBtn.innerText = 'Copied!';
                            setTimeout(() => {
                                copyBtn.innerText = originalText;
                            }, 2000);
                        });
                    }
                });
                
                // Check for audio after sharing
                this.updatePlayButtonVisibility();
            } else {
                Swal.fire({
                    title: 'Error',
                    text: data.message || 'Failed to share conversation',
                    icon: 'error',
                    confirmButtonColor: '#397BFB'
                });
            }
        } catch (error) {
            console.error('Error sharing conversation:', error);
            Swal.fire({
                title: 'Error',
                text: 'An unexpected error occurred. Please try again.',
                icon: 'error',
                confirmButtonColor: '#397BFB'
            });
        }
    }
    
    collectConversationData() {
        // Get conversation settings
        const settings = {
            messageDirection: this.getSelectedDirection(),
            models: {
                ai1: document.getElementById('ai1-model')?.value || '',
                ai2: document.getElementById('ai2-model')?.value || ''
            },
            names: {
                ai1: document.getElementById('ai1-name')?.value || 'AI-1',
                ai2: document.getElementById('ai2-name')?.value || 'AI-2'
            },
            prompts: {
                ai1: document.getElementById('ai1-prompt')?.value || '',
                ai2: document.getElementById('ai2-prompt')?.value || ''
            },
            tts: {
                ai1: {
                    enabled: document.getElementById('ai1-tts-enabled')?.checked || false,
                    voice: document.getElementById('ai1-voice')?.value || 'Arista-PlayAI'
                },
                ai2: {
                    enabled: document.getElementById('ai2-tts-enabled')?.checked || false,
                    voice: document.getElementById('ai2-voice')?.value || 'Angelo-PlayAI'
                }
            },
            parameters: {
                ai1: {
                    maxTokens: document.getElementById('ai1-max-tokens')?.value || 1200,
                    temperature: document.getElementById('ai1-temperature')?.value || 0.5
                },
                ai2: {
                    maxTokens: document.getElementById('ai2-max-tokens')?.value || 1200,
                    temperature: document.getElementById('ai2-temperature')?.value || 0.5
                }
            }
        };
        
        // Get messages from the chat container
        const messages = [];
        const chatElements = document.querySelectorAll('.chat-message');
        
        chatElements.forEach((element, index) => {
            const isAI1 = element.classList.contains('ai1');
            const isAI2 = element.classList.contains('ai2');
            const isHuman = element.classList.contains('human');
            
            // Get message content
            const messageText = element.querySelector('.message-text');
            const content = messageText ? messageText.textContent : element.textContent;
            
            // Get model name if available
            const modelBadge = element.querySelector('.model-badge');
            const model = modelBadge ? modelBadge.textContent : (isAI1 ? settings.models.ai1 : (isAI2 ? settings.models.ai2 : null));
            
            // Create message object
            const message = {
                id: index,
                role: isHuman ? 'human' : 'assistant',
                content: content.trim(),
                timestamp: new Date().toISOString(),
                model: model
            };
            
            // Add agent type
            if (isAI1) message.agent = 'ai1';
            if (isAI2) message.agent = 'ai2';
            
            messages.push(message);
        });
        
        // Return full conversation data
        return {
            id: this.conversationId,
            settings: settings,
            messages: messages,
            created_at: new Date().toISOString()
        };
    }
    
    getSelectedDirection() {
        const directionRadios = document.getElementsByName('conversation-direction');
        for (const radio of directionRadios) {
            if (radio.checked) {
                return radio.value;
            }
        }
        return 'ai1-to-ai2'; // Default
    }
    
    // Audio playback functionality
    async hasAudioRecordings() {
        try {
            console.log(`Checking for audio recordings for conversation: ${this.conversationId}`);
            const response = await fetch(`api/check-audio-recordings.php?conversation_id=${this.conversationId}`);
            
            if (!response.ok) {
                console.error(`Error checking for audio recordings: ${response.status}`);
                return false;
            }
            
            const data = await response.json();
            console.log('Audio check response:', data);
            
            return data.hasAudio === true;
        } catch (error) {
            console.error('Error checking for audio recordings:', error);
            return false;
        }
    }
    
    async updatePlayButtonVisibility() {
        try {
            console.log(`Checking audio for conversation: ${this.conversationId}`);
            
            const response = await fetch(`api/check-audio-recordings.php?conversation_id=${this.conversationId}`);
            if (!response.ok) {
                throw new Error(`Failed to check audio status: ${response.status}`);
            }
            
            const data = await response.json();
            
            console.log('Audio check result:', data);
            
            if (data && data.hasAudio === true) {
                this.showPlayButton(true);
                return true;
            } else {
                // Do a more thorough check - enumerate the audio directory directly
                // This is needed because sometimes the flag in shared_conversations.json isn't updated
                const audioPath = `conversations/${this.conversationId}/audio`;
                console.log(`Double-checking audio directory: ${audioPath}`);
                
                // See if any MP3 files exist in that directory
                const directCheck = await this.checkAudioDirectoryContents();
                
                if (directCheck) {
                    // We found audio files! Update the UI
                    this.showPlayButton(true);
                    return true;
                } else {
                    console.log('No audio files found after directory check');
                    this.showPlayButton(false);
                    return false;
                }
            }
        } catch (error) {
            console.error('Error checking for audio recordings:', error);
            this.showPlayButton(false);
            return false;
        }
    }
    // Add this new helper method to the ConversationShare class
async checkAudioDirectoryContents() {
    try {
        // We'll do a simple AJAX request to a PHP endpoint that will check the directory contents
        const response = await fetch(`api/check-audio-recordings.php?conversation_id=${this.conversationId}&force_scan=true`);
        if (!response.ok) {
            return false;
        }
        
        const data = await response.json();
        return data && data.hasAudio === true;
    } catch (error) {
        console.error('Error in direct audio directory check:', error);
        return false;
    }
}
    async togglePlayConversation() {
        const playButton = document.getElementById('play-conversation-btn');
        
        if (!playButton) {
            console.error('Play button not found');
            return;
        }
        
        if (this.isPlaying) {
            // Stop playing
            this.audioPlayer.pause();
            this.isPlaying = false;
            playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Play';
            playButton.className = playButton.className.replace('bg-green-600', 'bg-gray-600');
            
            // Remove highlighting
            document.querySelectorAll('.chat-message.speaking').forEach(el => {
                el.classList.remove('speaking');
            });
        } else {
            // Start playing
            if (this.audioQueue.length === 0) {
                try {
                    console.log(`Loading audio files for: ${this.conversationId}`);
                    const response = await fetch(`api/get-conversation-audio.php?conversation_id=${this.conversationId}`);
                    
                    if (!response.ok) {
                        throw new Error(`Failed to load audio files: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    console.log('Audio files response:', data);
                    
                    if (data.success && data.audioFiles && data.audioFiles.length > 0) {
                        this.audioQueue = data.audioFiles;
                        console.log(`Loaded ${this.audioQueue.length} audio files`);
                    } else {
                        Swal.fire({
                            title: 'No Audio Available',
                            text: 'There are no audio recordings available for this conversation.',
                            icon: 'info',
                            confirmButtonColor: '#397BFB'
                        });
                        return;
                    }
                } catch (error) {
                    console.error('Error loading audio files:', error);
                    Swal.fire({
                        title: 'Error',
                        text: 'Failed to load audio files: ' + error.message,
                        icon: 'error',
                        confirmButtonColor: '#397BFB'
                    });
                    return;
                }
            }
            
            this.currentAudioIndex = 0;
            this.playCurrentAudio();
            this.isPlaying = true;
            playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Stop';
            playButton.className = playButton.className.replace('bg-gray-600', 'bg-green-600');
        }
    }
    
    playCurrentAudio() {
        if (this.currentAudioIndex < this.audioQueue.length) {
            const audioFile = this.audioQueue[this.currentAudioIndex];
            console.log(`Playing audio file: ${audioFile}`);
            
            this.audioPlayer.src = `conversations/${this.conversationId}/audio/${audioFile}`;
            this.audioPlayer.onended = () => this.playNextAudio();
            this.audioPlayer.onerror = (e) => {
                console.error('Audio playback error:', e);
                this.playNextAudio(); // Skip to next on error
            };
            
            // Try to play the audio
            this.audioPlayer.play().catch(err => {
                console.error('Failed to play audio:', err);
                this.playNextAudio(); // Skip to next on error
            });
            
            // Highlight the corresponding message
            this.highlightCurrentMessage(audioFile);
        } else {
            // End of queue
            this.resetPlayState();
        }
    }
    
    playNextAudio() {
        this.currentAudioIndex++;
        if (this.currentAudioIndex < this.audioQueue.length) {
            this.playCurrentAudio();
        } else {
            this.resetPlayState();
        }
    }
    
    resetPlayState() {
        this.isPlaying = false;
        this.currentAudioIndex = 0;
        const playButton = document.getElementById('play-conversation-btn');
        if (playButton) {
            playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Play';
            playButton.className = playButton.className.replace('bg-green-600', 'bg-gray-600');
        }
        
        // Remove highlighting
        document.querySelectorAll('.chat-message.speaking').forEach(el => {
            el.classList.remove('speaking');
        });
    }
    
    highlightCurrentMessage(audioFile) {
        // Remove previous highlighting
        document.querySelectorAll('.chat-message.speaking').forEach(el => {
            el.classList.remove('speaking');
        });
        
        // Extract index from filename (assuming format like message_123.mp3)
        let indexMatch = audioFile.match(/_([\d]+)/);
        if (indexMatch && indexMatch[1]) {
            const messageIndex = parseInt(indexMatch[1]);
            const messages = document.querySelectorAll('.chat-message');
            
            if (messageIndex < messages.length) {
                messages[messageIndex].classList.add('speaking');
                messages[messageIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
}

// Initialize the conversation share functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing ConversationShare...");
    window.conversationShare = new ConversationShare();
});