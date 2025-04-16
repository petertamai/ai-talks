

document.addEventListener('DOMContentLoaded', function() {
    // Set conversation ID for shared view
    if (isSharedView && conversationId) {
        localStorage.setItem('currentConversationId', conversationId);
    }
    
    // Setup shared view audio playback
    if (isSharedView && hasAudio) {
        const playButton = document.getElementById('play-conversation-btn');
        const audioPlayer = document.getElementById('audio-player');
        
        if (playButton && audioPlayer) {
            let isPlaying = false;
            let audioQueue = [];
            let currentAudioIndex = 0;
            
            async function loadAudioFiles() {
                try {
                    const response = await fetch(`api/get-conversation-audio.php?conversation_id=${conversationId}`);
                    if (!response.ok) {
                        return false;
                    }
                    
                    const data = await response.json();
                    
                    if (data.success && data.audioFiles && data.audioFiles.length > 0) {
                        audioQueue = data.audioFiles;
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error('Error loading audio files:', error);
                    return false;
                }
            }
            
            // Function to play the current audio file
            function playCurrentAudio() {
                if (currentAudioIndex < audioQueue.length) {
                    const audioFile = audioQueue[currentAudioIndex];
                    audioPlayer.src = `conversations/${conversationId}/audio/${audioFile}`;
                    
                    audioPlayer.onended = () => {
                        playNextAudio();
                    };
                    
                    audioPlayer.onerror = () => {
                        playNextAudio();
                    };
                    
                    audioPlayer.play().catch(() => {
                        playNextAudio();
                    });
                    
                    highlightCurrentMessage(audioFile);
                } else {
                    resetPlayState();
                }
            }
            
            // Function to play the next audio file
            function playNextAudio() {
                currentAudioIndex++;
                if (currentAudioIndex < audioQueue.length) {
                    playCurrentAudio();
                } else {
                    resetPlayState();
                }
            }
            
            // Reset play state
            function resetPlayState() {
                isPlaying = false;
                currentAudioIndex = 0;
                playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Play';
                
                document.querySelectorAll('.chat-message.highlighted').forEach(el => {
                    el.classList.remove('highlighted');
                });
            }
            
            // Highlight current message
            function highlightCurrentMessage(audioFile) {
                // Remove previous highlights
                document.querySelectorAll('.highlighted, .chat-message.highlighted, .speaking').forEach(el => {
                    el.classList.remove('highlighted');
                    el.classList.remove('speaking');
                });
                
                // Extract index from filename (e.g., message_0.mp3 -> index = 0)
                let indexMatch = audioFile.match(/_([\d]+)/);
                if (indexMatch && indexMatch[1]) {
                    const messageIndex = parseInt(indexMatch[1]);
                    console.log('Highlighting message at index:', messageIndex);
                    
                    // Try both selector approaches for maximum compatibility
                    const messages = document.querySelectorAll('.chat-message');
                    const dataIndexMessages = document.querySelectorAll('.chat-message[data-index="' + messageIndex + '"]');
                    
                    if (dataIndexMessages.length > 0) {
                        // If we have messages with data-index attribute
                        dataIndexMessages[0].classList.add('highlighted');
                        dataIndexMessages[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else if (messageIndex < messages.length) {
                        // Fallback to using the position in the DOM
                        messages[messageIndex].classList.add('highlighted');
                        messages[messageIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else {
                        console.log('Message index out of range:', messageIndex, 'total messages:', messages.length);
                    }
                } else {
                    console.log('Could not extract message index from filename:', audioFile);
                }
            }
            
            // Add play button event listener
            playButton.addEventListener('click', async function() {
                if (isPlaying) {
                    audioPlayer.pause();
                    isPlaying = false;
                    playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Play';
                    
                    document.querySelectorAll('.chat-message.highlighted').forEach(el => {
                        el.classList.remove('highlighted');
                    });
                } else {
                    if (audioQueue.length === 0) {
                        const hasAudio = await loadAudioFiles();
                        
                        if (!hasAudio) {
                            Swal.fire({
                                title: 'No Audio Available',
                                text: 'There are no audio recordings available for this conversation.',
                                icon: 'info'
                            });
                            return;
                        }
                    }
                    
                    currentAudioIndex = 0;
                    playCurrentAudio();
                    isPlaying = true;
                    playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Stop';
                }
            });
            
            // Preload audio files
            loadAudioFiles();
        }
    }
});

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
    
    // Set the selected model from data attribute for shared conversations
    if (isSharedView) {
        const ai1ModelSelect = document.getElementById('ai1-model');
        const ai2ModelSelect = document.getElementById('ai2-model');
        
        // Wait for models to load then set the right one
        if (ai1ModelSelect && ai2ModelSelect) {
            const checkModelsLoaded = setInterval(function() {
                if (ai1ModelSelect.options.length > 1 && ai2ModelSelect.options.length > 1) {
                    clearInterval(checkModelsLoaded);
                    
                    // Set AI1 model
                    const ai1Model = ai1ModelSelect.getAttribute('data-shared-model');
                    if (ai1Model) {
                        // Try to find the model in the dropdown
                        for (let i = 0; i < ai1ModelSelect.options.length; i++) {
                            if (ai1ModelSelect.options[i].value === ai1Model) {
                                ai1ModelSelect.selectedIndex = i;
                                $(ai1ModelSelect).trigger('change');
                                break;
                            }
                        }
                    }
                    
                    // Set AI2 model
                    const ai2Model = ai2ModelSelect.getAttribute('data-shared-model');
                    if (ai2Model) {
                        // Try to find the model in the dropdown
                        for (let i = 0; i < ai2ModelSelect.options.length; i++) {
                            if (ai2ModelSelect.options[i].value === ai2Model) {
                                ai2ModelSelect.selectedIndex = i;
                                $(ai2ModelSelect).trigger('change');
                                break;
                            }
                        }
                    }
                }
            }, 500);
        }
    }
});


document.addEventListener('DOMContentLoaded', function() {
    // Fix for settings panel in shared view
    const isSharedView = window.location.href.includes('?id=');
    
    // 1. Make sure settings panel starts closed in shared view
    if (isSharedView) {
        const settingsPanel = document.getElementById('settings-panel');
        if (settingsPanel && settingsPanel.classList.contains('open')) {
            settingsPanel.classList.remove('open');
        }
    }
    
    // 2. Ensure toggle-settings button exists and works
    const toggleSettingsBtn = document.getElementById('toggle-settings');
    const closeSettingsBtn = document.getElementById('close-settings');
    
    // If toggle button is missing, add it
    if (!toggleSettingsBtn) {
        const headerButtons = document.querySelector('header .flex.space-x-2');
        
        if (headerButtons) {
            const newToggleBtn = document.createElement('button');
            newToggleBtn.id = 'toggle-settings';
            newToggleBtn.className = 'px-3 py-1 bg-gray-600 rounded text-xs md:text-sm';
            newToggleBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span class="hidden md:inline">Settings</span>
            `;
            
            // Insert after the "New Conversation" button if it exists
            const newConversationBtn = document.querySelector('header a, header button');
            if (newConversationBtn) {
                headerButtons.insertBefore(newToggleBtn, newConversationBtn.nextSibling);
            } else {
                // Just append it if we can't find a reference element
                headerButtons.appendChild(newToggleBtn);
            }
            
            console.log('Added missing toggle-settings button');
        }
    }
    
    // 3. Ensure all settings toggle handlers are properly set up
    // Safe way to add event listeners (checking if elements exist first)
    
    // Get references again in case we just created the button
    const toggleBtn = document.getElementById('toggle-settings');
    const closeBtn = document.getElementById('close-settings');
    const settingsPanel = document.getElementById('settings-panel');
    
    if (toggleBtn && settingsPanel) {
        // Remove any existing listeners to prevent duplicates
        const newToggleBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
        
        // Add fresh event listener
        newToggleBtn.addEventListener('click', function() {
            settingsPanel.classList.toggle('open');
        });
    }
    
    if (closeBtn && settingsPanel) {
        // Remove any existing listeners to prevent duplicates
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        
        // Add fresh event listener
        newCloseBtn.addEventListener('click', function() {
            settingsPanel.classList.remove('open');
        });
    }
    
    // 4. Fix for sharing - add buttons if needed
    setTimeout(function() {
        const conversationHeader = document.querySelector('.conversation h2, .bg-gray-700.rounded-lg.p-3 h2');
        
        if (conversationHeader) {
            // Create a flex container for the header if it doesn't exist
            let headerContainer = conversationHeader.parentElement;
            
            // Check if the header is already inside a flex container
            if (!headerContainer.classList.contains('flex') || !headerContainer.classList.contains('justify-between')) {
                // Create a new flex container
                const newContainer = document.createElement('div');
                newContainer.className = 'flex justify-between items-center w-full mb-2';
                
                // Insert the container before the header
                headerContainer.insertBefore(newContainer, conversationHeader);
                
                // Move the header into the container
                newContainer.appendChild(conversationHeader);
                
                headerContainer = newContainer;
            }
            
            // Create buttons container if it doesn't exist
            let buttonContainer = document.querySelector('.conversation-header-buttons, .conversation-action-buttons');
            
            if (!buttonContainer) {
                buttonContainer = document.createElement('div');
                buttonContainer.className = 'conversation-header-buttons flex items-center ml-2';
                headerContainer.appendChild(buttonContainer);
            }
            
            // Create share button if it doesn't exist
            if (!document.getElementById('share-conversation-btn')) {
                const shareButton = document.createElement('button');
                shareButton.id = 'share-conversation-btn';
                shareButton.className = 'ml-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm';
                shareButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>Share';
                
                // Add event listener safely
                shareButton.onclick = function() {
                    if (window.conversationShare && typeof window.conversationShare.shareConversation === 'function') {
                        window.conversationShare.shareConversation();
                    } else {
                        console.error('Conversation share functionality not available');
                    }
                };
                
                // Add to container
                buttonContainer.appendChild(shareButton);
                console.log('Share button added successfully');
            }
            
            // Create play button if it doesn't exist
            if (!document.getElementById('play-conversation-btn')) {
                const playButton = document.createElement('button');
                playButton.id = 'play-conversation-btn';
                playButton.className = 'ml-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm' + (window.hasAudio ? '' : ' hidden');
                playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Play';
                
                // Add to container
                buttonContainer.appendChild(playButton);
            }
        }
    }, 500);
});




document.addEventListener('DOMContentLoaded', function() {
    // Get references to buttons
    const shareBtn = document.getElementById('share-conversation-btn');
    const playBtn = document.getElementById('play-conversation-btn');
    
    // Initially hide buttons (they will show only when appropriate)
    if (shareBtn) shareBtn.classList.add('hidden');
    if (playBtn) playBtn.classList.add('hidden');
    
    // Function to check for audio files and show/hide play button accordingly
    async function updatePlayButtonVisibility(forceCheck = false) {
        if (!playBtn) return false;
        
        try {
            // Get conversation ID
            const conversationId = localStorage.getItem('currentConversationId');
            if (!conversationId) return false;
            
            // Check for audio files via API
            const endpoint = forceCheck ? 
                `api/check-audio-recordings.php?conversation_id=${conversationId}&force_scan=true` :
                `api/check-audio-recordings.php?conversation_id=${conversationId}`;
                
            const response = await fetch(endpoint);
            if (!response.ok) return false;
            
            const data = await response.json();
            console.log('Audio check result:', data);
            
            // Show/hide button based on audio presence
            if (data && data.hasAudio === true) {
                playBtn.classList.remove('hidden');
                return true;
            } else {
                playBtn.classList.add('hidden');
                return false;
            }
        } catch (error) {
            console.error('Error checking for audio files:', error);
            playBtn.classList.add('hidden');
            return false;
        }
    }
    
    // Function to handle share button visibility
    function updateShareButtonVisibility() {
        if (!shareBtn) return;
        
        // Show share button only when conversation has ended
        const conversationActive = window.conversationActive === false; // Ended
        const hasMessages = document.querySelectorAll('.chat-message').length > 0;
        
        if (conversationActive && hasMessages) {
            shareBtn.classList.remove('hidden');
        } else {
            shareBtn.classList.add('hidden');
        }
    }
    
    // Extend the original stopConversation function to show share button
    if (typeof window.stopConversation === 'function') {
        const originalStopConversation = window.stopConversation;
        
        window.stopConversation = function(reasonMessage = null) {
            // Call original function
            const result = originalStopConversation(reasonMessage);
            
            // Now show share button since conversation has ended
            if (shareBtn) shareBtn.classList.remove('hidden');
            
            // Also update play button visibility after a delay
            // (to give time for any audio to be processed)
            setTimeout(() => {
                updatePlayButtonVisibility(true);
            }, 1000);
            
            return result;
        };
    }
    
    // Handle audio playback completion
    if (window.audioElements) {
        for (const id in window.audioElements) {
            if (window.audioElements.hasOwnProperty(id)) {
                const audio = window.audioElements[id];
                
                if (audio) {
                    audio.addEventListener('ended', function() {
                        // Check for audio files when audio playback completes
                        setTimeout(() => {
                            updatePlayButtonVisibility(true);
                        }, 1000);
                    });
                }
            }
        }
    }
    
    // Check for audio files on page load (for shared conversations)
    if (window.location.href.includes('?id=')) {
        setTimeout(() => {
            updatePlayButtonVisibility(true);
        }, 1000);
    }
    
    // Update button visibility periodically
    setInterval(() => {
        updateShareButtonVisibility();
    }, 1000);
});




document.addEventListener('DOMContentLoaded', function() {
    // Fix for play button functionality
    const playBtn = document.getElementById('play-conversation-btn');
    if (!playBtn) return;
    
    // Remove any existing event listeners
    const newPlayBtn = playBtn.cloneNode(true);
    playBtn.parentNode.replaceChild(newPlayBtn, playBtn);
    
    // Set up audio playback functionality
    newPlayBtn.addEventListener('click', async function() {
        const conversationId = localStorage.getItem('currentConversationId');
        if (!conversationId) {
            console.error('No conversation ID available');
            return;
        }
        
        const audioPlayer = document.getElementById('audio-player');
        if (!audioPlayer) {
            console.error('Audio player element not found');
            return;
        }
        
        // Check if we're already playing
        if (audioPlayer.playing) {
            // Stop playback
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            audioPlayer.playing = false;
            
            // Update button
            this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Play';
            
            // Remove highlighting
            document.querySelectorAll('.chat-message.highlighted').forEach(el => {
                el.classList.remove('highlighted');
            });
            
            return;
        }
        
        // Start playback
        try {
            // Load audio files list
            const response = await fetch(`api/get-conversation-audio.php?conversation_id=${conversationId}`);
            if (!response.ok) {
                throw new Error(`Failed to load audio files: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Audio files response:', data);
            
            if (data.success && data.audioFiles && data.audioFiles.length > 0) {
                // Store the audio files
                audioPlayer.audioFiles = data.audioFiles;
                audioPlayer.currentIndex = 0;
                audioPlayer.conversationId = conversationId;
                
                // Set up event handlers
                audioPlayer.onended = function() {
                    // Move to next file when current one ends
                    this.currentIndex++;
                    if (this.currentIndex < this.audioFiles.length) {
                        playNextAudio(this);
                    } else {
                        // End of playlist
                        resetPlayState(this, newPlayBtn);
                    }
                };
                
                audioPlayer.onerror = function() {
                    // Skip to next on error
                    this.currentIndex++;
                    if (this.currentIndex < this.audioFiles.length) {
                        playNextAudio(this);
                    } else {
                        resetPlayState(this, newPlayBtn);
                    }
                };
                
                // Start playing the first file
                audioPlayer.src = `conversations/${conversationId}/audio/${audioPlayer.audioFiles[0]}`;
                audioPlayer.playing = true;
                
                try {
                    await audioPlayer.play();
                    
                    // Update button to show stop icon
                    newPlayBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Stop';
                    
                    // Highlight the current message
                    highlightCurrentMessage(audioPlayer.audioFiles[0]);
                } catch (playError) {
                    console.error('Error playing audio:', playError);
                    resetPlayState(audioPlayer, newPlayBtn);
                }
            } else {
                console.error('No audio files available');
                alert('No audio files available for this conversation.');
            }
        } catch (error) {
            console.error('Error in audio playback:', error);
            alert('Error loading audio files: ' + error.message);
        }
    });
    
    // Helper function to play the next audio file
    function playNextAudio(audioPlayer) {
        if (!audioPlayer || !audioPlayer.audioFiles || audioPlayer.currentIndex >= audioPlayer.audioFiles.length) {
            resetPlayState(audioPlayer, newPlayBtn);
            return;
        }
        
        const currentFile = audioPlayer.audioFiles[audioPlayer.currentIndex];
        audioPlayer.src = `conversations/${audioPlayer.conversationId}/audio/${currentFile}`;
        
        audioPlayer.play().catch(error => {
            console.error('Error playing next audio file:', error);
            audioPlayer.currentIndex++;
            if (audioPlayer.currentIndex < audioPlayer.audioFiles.length) {
                playNextAudio(audioPlayer);
            } else {
                resetPlayState(audioPlayer, newPlayBtn);
            }
        });
        
        // Highlight the current message
        highlightCurrentMessage(currentFile);
    }
    
    // Helper function to reset play state
    function resetPlayState(audioPlayer, playButton) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        audioPlayer.playing = false;
        
        // Update button
        playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Play';
        
        // Remove highlighting
        document.querySelectorAll('.chat-message.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });
    }
    
    // Helper function to highlight the current message
    function highlightCurrentMessage(audioFile) {
        // Remove previous highlights
        document.querySelectorAll('.chat-message.highlighted, .highlighted, .speaking').forEach(el => {
            el.classList.remove('highlighted');
            el.classList.remove('speaking');
        });
        
        // Extract index from filename
        let indexMatch = audioFile.match(/_([\d]+)/);
        if (indexMatch && indexMatch[1]) {
            const messageIndex = parseInt(indexMatch[1]);
            
            // Try both selector approaches for maximum compatibility
            const messages = document.querySelectorAll('.chat-message');
            const dataIndexMessages = document.querySelectorAll('.chat-message[data-index="' + messageIndex + '"]');
            
            if (dataIndexMessages.length > 0) {
                // If we have messages with data-index attribute
                dataIndexMessages[0].classList.add('highlighted');
                dataIndexMessages[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (messageIndex < messages.length) {
                // Fallback to using the position in the DOM
                messages[messageIndex].classList.add('highlighted');
                messages[messageIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                console.log('Message index out of range:', messageIndex, 'total messages:', messages.length);
            }
        } else {
            console.log('Could not extract message index from filename:', audioFile);
        }
    }
});






document.addEventListener('DOMContentLoaded', function() {
    // Track active conversation state and use it for button visibility
    let isConversationActive = false;
    let isSharedView = window.location.href.includes('?id=');
    
    // Get references to buttons
    const shareBtn = document.getElementById('share-conversation-btn');
    const playBtn = document.getElementById('play-conversation-btn');
    
    // Ensure we have an audio player element
    let audioPlayer = document.getElementById('audio-player');
    if (!audioPlayer) {
        audioPlayer = document.createElement('audio');
        audioPlayer.id = 'audio-player';
        audioPlayer.className = 'hidden';
        document.body.appendChild(audioPlayer);
    }
    
    // Initialize button states
    function initializeButtons() {
        // Always hide both buttons initially on normal index page
        if (!isSharedView) {
            if (shareBtn) shareBtn.classList.add('hidden');
            if (playBtn) playBtn.classList.add('hidden');
        }
        
        // For shared view, check for audio files
        if (isSharedView && playBtn) {
            checkForAudioFiles().then(hasAudio => {
                playBtn.classList.toggle('hidden', !hasAudio);
            });
        }
    }
    
    // Utility function to check for audio files
    async function checkForAudioFiles() {
        try {
            const conversationId = localStorage.getItem('currentConversationId');
            if (!conversationId) return false;
            
            const response = await fetch(`api/check-audio-recordings.php?conversation_id=${conversationId}&force_scan=true`);
            if (!response.ok) return false;
            
            const data = await response.json();
            console.log('Audio check result:', data);
            
            return (data && data.hasAudio === true);
        } catch (error) {
            console.error('Error checking for audio files:', error);
            return false;
        }
    }
    
    // Hook into the startConversation function
    if (typeof window.startConversation === 'function') {
        const originalStartConversation = window.startConversation;
        
        window.startConversation = function() {
            isConversationActive = true;
            
            // Hide buttons when starting a conversation
            if (shareBtn) shareBtn.classList.add('hidden');
            if (playBtn) playBtn.classList.add('hidden');
            
            return originalStartConversation.apply(this, arguments);
        };
    }
    
    // Hook into the stopConversation function
    if (typeof window.stopConversation === 'function') {
        const originalStopConversation = window.stopConversation;
        
        window.stopConversation = function(reasonMessage = null) {
            const result = originalStopConversation.apply(this, arguments);
            
            // Mark conversation as inactive
            isConversationActive = false;
            
            // Only show share button when conversation has real messages
            const chatMessages = document.querySelectorAll('.chat-message:not(.system)');
            if (chatMessages.length > 0) {
                if (shareBtn) shareBtn.classList.remove('hidden');
                
                // Check for audio files and show play button if any exist
                setTimeout(() => {
                    checkForAudioFiles().then(hasAudio => {
                        if (playBtn) playBtn.classList.toggle('hidden', !hasAudio);
                    });
                }, 500);
            }
            
            return result;
        };
    }
    
    // Implement complete audio playback functionality
    if (playBtn) {
        // Remove any existing listeners and create fresh button
        const newPlayBtn = playBtn.cloneNode(true);
        if (playBtn.parentNode) {
            playBtn.parentNode.replaceChild(newPlayBtn, playBtn);
        }
        
        // Set up audio playback
        newPlayBtn.addEventListener('click', async function() {
            // Get conversation ID
            const conversationId = localStorage.getItem('currentConversationId');
            if (!conversationId) {
                console.error('No conversation ID found');
                return;
            }
            
            // Check if already playing
            if (audioPlayer.playing) {
                // Stop playback
                audioPlayer.pause();
                audioPlayer.currentTime = 0;
                audioPlayer.playing = false;
                
                // Update button appearance
                this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Play';
                
                // Remove highlighting
                document.querySelectorAll('.chat-message.highlighted, .speaking').forEach(el => {
                    el.classList.remove('highlighted');
                    el.classList.remove('speaking');
                });
                
                return;
            }
            
            // Start playback
            try {
                // Load audio files
                const response = await fetch(`api/get-conversation-audio.php?conversation_id=${conversationId}`);
                if (!response.ok) {
                    throw new Error(`Failed to load audio files: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Audio files found:', data);
                
                if (!data.success || !data.audioFiles || data.audioFiles.length === 0) {
                    alert('No audio files available for this conversation.');
                    return;
                }
                
                // Store audio data
                audioPlayer.audioFiles = data.audioFiles;
                audioPlayer.currentIndex = 0;
                audioPlayer.conversationId = conversationId;
                audioPlayer.playing = true;
                
                // Set up event handlers
                audioPlayer.onended = function() {
                    this.currentIndex++;
                    if (this.currentIndex < this.audioFiles.length) {
                        playNextAudio();
                    } else {
                        resetPlayback();
                    }
                };
                
                audioPlayer.onerror = function() {
                    console.error('Audio playback error');
                    this.currentIndex++;
                    if (this.currentIndex < this.audioFiles.length) {
                        playNextAudio();
                    } else {
                        resetPlayback();
                    }
                };
                
                // Start playing first file
                audioPlayer.src = `conversations/${conversationId}/audio/${audioPlayer.audioFiles[0]}`;
                await audioPlayer.play();
                
                // Update button appearance
                this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Stop';
                
                // Highlight current message
                highlightCurrentMessage(audioPlayer.audioFiles[0]);
                
            } catch (error) {
                console.error('Audio playback error:', error);
                alert('Error playing audio: ' + error.message);
                resetPlayback();
            }
            
            // Helper function to play next audio file
            function playNextAudio() {
                if (!audioPlayer || !audioPlayer.audioFiles || 
                    audioPlayer.currentIndex >= audioPlayer.audioFiles.length) {
                    resetPlayback();
                    return;
                }
                
                const currentFile = audioPlayer.audioFiles[audioPlayer.currentIndex];
                audioPlayer.src = `conversations/${audioPlayer.conversationId}/audio/${currentFile}`;
                
                audioPlayer.play().catch(error => {
                    console.error('Error playing next audio:', error);
                    audioPlayer.currentIndex++;
                    if (audioPlayer.currentIndex < audioPlayer.audioFiles.length) {
                        playNextAudio();
                    } else {
                        resetPlayback();
                    }
                });
                
                // Highlight current message
                highlightCurrentMessage(currentFile);
            }
            
            // Helper function to reset playback state
            function resetPlayback() {
                audioPlayer.pause();
                audioPlayer.currentTime = 0;
                audioPlayer.playing = false;
                
                // Reset button
                newPlayBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Play';
                
                // Remove highlighting
                document.querySelectorAll('.chat-message.highlighted, .speaking').forEach(el => {
                    el.classList.remove('highlighted');
                    el.classList.remove('speaking');
                });
            }
        });
    }
    
    // Function to highlight message during audio playback
    function highlightCurrentMessage(audioFile) {
        // Remove existing highlights
        document.querySelectorAll('.chat-message.highlighted, .speaking').forEach(el => {
            el.classList.remove('highlighted');
            el.classList.remove('speaking');
        });
        
        // Extract message index from filename
        const indexMatch = audioFile.match(/_([\d]+)/);
        if (!indexMatch || !indexMatch[1]) return;
        
        const messageIndex = parseInt(indexMatch[1]);
        console.log('Highlighting message at index:', messageIndex);
        
        // Try different selectors for maximum compatibility
        const messages = document.querySelectorAll('.chat-message');
        const indexMessages = document.querySelectorAll(`.chat-message[data-index="${messageIndex}"]`);
        
        let targetMessage = null;
        
        if (indexMessages.length > 0) {
            targetMessage = indexMessages[0];
        } else if (messageIndex < messages.length) {
            targetMessage = messages[messageIndex];
        }
        
        if (targetMessage) {
            targetMessage.classList.add('highlighted');
            targetMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    // Hook into TTS functionality to update play button visibility
    if (window.speakText) {
        const originalSpeakText = window.speakText;
        
        window.speakText = async function(aiId, text) {
            const result = await originalSpeakText.apply(this, arguments);
            
            // After speech is done, check for audio files
            setTimeout(() => {
                checkForAudioFiles().then(hasAudio => {
                    if (playBtn && !isConversationActive && hasAudio) {
                        playBtn.classList.remove('hidden');
                    }
                });
            }, 500);
            
            return result;
        };
    }
    
    // Initialize buttons
    initializeButtons();
    
    // Ensure share button is added for ending conversation
    setTimeout(function() {
        const conversationHeader = document.querySelector('.conversation h2, .bg-gray-700.rounded-lg.p-3 h2');
        
        if (conversationHeader) {
            // Create a flex container for the header if it doesn't exist
            let headerContainer = conversationHeader.parentElement;
            
            // Check if the header is already inside a flex container
            if (!headerContainer.classList.contains('flex') || !headerContainer.classList.contains('justify-between')) {
                // Create a new flex container
                const newContainer = document.createElement('div');
                newContainer.className = 'flex justify-between items-center w-full mb-2';
                
                // Insert the container before the header
                headerContainer.insertBefore(newContainer, conversationHeader);
                
                // Move the header into the container
                newContainer.appendChild(conversationHeader);
                
                headerContainer = newContainer;
            }
            
            // Create buttons container if it doesn't exist
            let buttonContainer = document.querySelector('.conversation-header-buttons, .conversation-action-buttons');
            
            if (!buttonContainer) {
                buttonContainer = document.createElement('div');
                buttonContainer.className = 'conversation-header-buttons flex items-center ml-2';
                headerContainer.appendChild(buttonContainer);
            }
            
            // Create share button if it doesn't exist
            if (!document.getElementById('share-conversation-btn')) {
                const shareButton = document.createElement('button');
                shareButton.id = 'share-conversation-btn';
                shareButton.className = 'ml-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm hidden';
                shareButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>Share';
                
                // Add event listener
                shareButton.addEventListener('click', function() {
                    if (window.conversationShare && typeof window.conversationShare.shareConversation === 'function') {
                        window.conversationShare.shareConversation();
                    } else {
                        console.error('Conversation share functionality not available');
                    }
                });
                
                // Add to container
                buttonContainer.appendChild(shareButton);
            }
            
            // Create play button if it doesn't exist
            if (!document.getElementById('play-conversation-btn')) {
                const playButton = document.createElement('button');
                playButton.id = 'play-conversation-btn';
                playButton.className = 'ml-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm hidden';
                playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Play';
                
                // Add to container
                buttonContainer.appendChild(playButton);
            }
        }
    }, 500);
});




document.addEventListener('DOMContentLoaded', function() {
    // Hook into the startConversation function to regenerate the conversation ID
    if (typeof window.startConversation === 'function') {
        const originalStartConversation = window.startConversation;
        
        window.startConversation = function() {
            // Generate a new conversation ID before starting the conversation
            const newConversationId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('currentConversationId', newConversationId);
            console.log('Generated new conversation ID:', newConversationId);
            
            // If the ConversationShare class is available, reset its ID as well
            if (window.conversationShare && typeof window.conversationShare.resetConversationId === 'function') {
                window.conversationShare.resetConversationId();
            } else {
                // Fallback if the method doesn't exist
                if (window.conversationShare) {
                    window.conversationShare.conversationId = newConversationId;
                }
            }
            
            // Call the original function
            return originalStartConversation.apply(this, arguments);
        };
    }
    
    // Also ensure a fresh ID when the page loads (if not viewing a shared conversation)
    if (!window.location.href.includes('?id=')) {
        // Only generate a new ID if we're not in a shared view
        // This ensures we don't mess up the ID when viewing a shared conversation
        const newConversationId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('currentConversationId', newConversationId);
        console.log('Generated new conversation ID on page load:', newConversationId);
        
        // Update ConversationShare if it exists
        if (window.conversationShare) {
            window.conversationShare.conversationId = newConversationId;
        }
    }
});
