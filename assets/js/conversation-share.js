/**
 * Conversation Share and Play Functionality
 * 
 * This file handles the UI and functionality for sharing conversations 
 * and playing conversation audio recordings.
 * 
 * @author Piotr Tamulewicz <pt@petertam.pro>
 */

class ConversationManager {
    constructor() {
        this.conversationId = null;
        this.isPlaying = false;
        this.audioQueue = [];
        this.currentAudioIndex = 0;
        this.audioPlayer = new Audio();
        
        this.init();
    }
    
    init() {
        // Get the conversation ID from the URL or data attribute
        this.conversationId = document.querySelector('.conversation-container').dataset.conversationId;
        
        // Add event listeners when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.appendButtons();
            this.bindEvents();
        });
        
        // Set up audio player event listeners
        this.audioPlayer.addEventListener('ended', () => this.playNextAudio());
    }
    
    appendButtons() {
        const conversationHeader = document.querySelector('.conversation-header');
        if (!conversationHeader) return;
        
        // Create the button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'conversation-action-buttons';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.alignItems = 'center';
        buttonContainer.style.marginLeft = 'auto';
        
        // Create share button
        const shareButton = document.createElement('button');
        shareButton.id = 'share-conversation-btn';
        shareButton.className = 'btn-share';
        shareButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg> Share';
        shareButton.style.backgroundColor = '#397BFB';
        shareButton.style.color = '#fff';
        shareButton.style.border = 'none';
        shareButton.style.borderRadius = '4px';
        shareButton.style.padding = '8px 12px';
        shareButton.style.display = 'flex';
        shareButton.style.alignItems = 'center';
        shareButton.style.gap = '6px';
        shareButton.style.cursor = 'pointer';
        
        // Add it to the container
        buttonContainer.appendChild(shareButton);
        
        // Check if audio recordings exist before adding play button
        this.checkForAudioRecordings().then(hasAudio => {
            if (hasAudio) {
                const playButton = document.createElement('button');
                playButton.id = 'play-conversation-btn';
                playButton.className = 'btn-play';
                playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Play';
                playButton.style.backgroundColor = '#cecaba';
                playButton.style.color = '#333';
                playButton.style.border = 'none';
                playButton.style.borderRadius = '4px';
                playButton.style.padding = '8px 12px';
                playButton.style.marginLeft = '8px';
                playButton.style.display = 'flex';
                playButton.style.alignItems = 'center';
                playButton.style.gap = '6px';
                playButton.style.cursor = 'pointer';
                
                buttonContainer.appendChild(playButton);
            }
        });
        
        // Add the container to the header
        conversationHeader.appendChild(buttonContainer);
    }
    
    bindEvents() {
        // Share button click event
        document.getElementById('share-conversation-btn')?.addEventListener('click', () => this.shareConversation());
        
        // Play button click event (if it exists)
        document.getElementById('play-conversation-btn')?.addEventListener('click', () => this.togglePlayConversation());
    }
    
    async checkForAudioRecordings() {
        try {
            const response = await fetch(`/api/check-audio-recordings.php?conversation_id=${this.conversationId}`);
            const data = await response.json();
            return data.hasAudio;
        } catch (error) {
            console.error('Error checking for audio recordings:', error);
            return false;
        }
    }
    
    async shareConversation() {
        try {
            // Show loading state
            Swal.fire({
                title: 'Generating share link...',
                didOpen: () => {
                    Swal.showLoading();
                },
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false
            });
            
            // Call the API to share the conversation
            const response = await fetch('/api/share-conversation.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    conversation_id: this.conversationId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Show success message with copyable link
                Swal.fire({
                    title: 'Conversation Shared!',
                    html: `
                        <p>Share this link with others:</p>
                        <div class="share-link-container" style="display: flex; margin: 16px 0;">
                            <input type="text" id="share-link-input" value="${data.shareUrl}" 
                                style="flex-grow: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px 0 0 4px;">
                            <button id="copy-link-btn" 
                                style="background: #397BFB; color: white; border: none; padding: 8px 12px; border-radius: 0 4px 4px 0; cursor: pointer;">
                                Copy
                            </button>
                        </div>
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
    
    async loadAudioFiles() {
        try {
            const response = await fetch(`/api/get-conversation-audio.php?conversation_id=${this.conversationId}`);
            const data = await response.json();
            
            if (data.success && data.audioFiles.length > 0) {
                this.audioQueue = data.audioFiles;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error loading audio files:', error);
            return false;
        }
    }
    
    async togglePlayConversation() {
        const playButton = document.getElementById('play-conversation-btn');
        
        if (this.isPlaying) {
            // Stop playing
            this.audioPlayer.pause();
            this.isPlaying = false;
            playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Play';
            playButton.style.backgroundColor = '#cecaba';
        } else {
            // Start playing
            if (this.audioQueue.length === 0) {
                const hasAudio = await this.loadAudioFiles();
                if (!hasAudio) {
                    Swal.fire({
                        title: 'No Audio Available',
                        text: 'There are no audio recordings available for this conversation.',
                        icon: 'info',
                        confirmButtonColor: '#397BFB'
                    });
                    return;
                }
            }
            
            this.currentAudioIndex = 0;
            this.playCurrentAudio();
            this.isPlaying = true;
            playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> Stop';
            playButton.style.backgroundColor = '#b0fbc1';
        }
    }
    
    playCurrentAudio() {
        if (this.currentAudioIndex < this.audioQueue.length) {
            const audioFile = this.audioQueue[this.currentAudioIndex];
            this.audioPlayer.src = `/conversations/${this.conversationId}/audio/${audioFile}`;
            this.audioPlayer.play();
            
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
            playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Play';
            playButton.style.backgroundColor = '#cecaba';
        }
        
        // Remove any highlights
        document.querySelectorAll('.message.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });
    }
    
    highlightCurrentMessage(audioFile) {
        // Remove previous highlighting
        document.querySelectorAll('.message.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });
        
        // Extract message ID from filename (assuming format like message_123.mp3)
        const messageIdMatch = audioFile.match(/message_(\d+)/);
        if (messageIdMatch && messageIdMatch[1]) {
            const messageId = messageIdMatch[1];
            const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);
            
            if (messageElement) {
                messageElement.classList.add('highlighted');
                messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
}

// Initialize the conversation manager
const conversationManager = new ConversationManager();

// Add some CSS for highlighting
const style = document.createElement('style');
style.textContent = `
.message.highlighted {
    box-shadow: 0 0 0 2px #397BFB;
    transition: box-shadow 0.3s ease;
}
`;
document.head.appendChild(style);