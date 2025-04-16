/**
 * Security functions for AI Conversation System
 *
 * Handles nonce generation and verification for AJAX requests
 *
 * @author Piotr Tamulewicz <pt@petertam.pro>
 */

let currentNonce = '';
let isRefreshingNonce = false; // Flag to prevent concurrent refreshes

// Fetch new nonce from server
async function refreshNonce() {
    // Prevent multiple concurrent requests for a nonce
    if (isRefreshingNonce) {
        console.log('Nonce refresh already in progress...');
        // Optionally, return a promise that resolves when the ongoing refresh completes
        // This requires more complex state management (e.g., storing the promise)
        return false; // Or handle waiting appropriately
    }
    isRefreshingNonce = true;
    console.log('Refreshing nonce...'); // Added for debugging

    try {
        const response = await originalFetch('api/get-nonce.php', { // Use originalFetch to avoid interception loop
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
                // No nonce needed to GET a nonce
            }
        });

        if (!response.ok) {
            console.error('Failed to get nonce from server. Status:', response.status);
            currentNonce = ''; // Clear potentially invalid nonce
            return false;
        }

        const data = await response.json();

        if (data.success && data.nonce) {
            console.log('New nonce received:', data.nonce); // Added for debugging
            currentNonce = data.nonce;
            return true;
        } else {
            console.error('Invalid nonce response from server:', data);
            currentNonce = ''; // Clear potentially invalid nonce
            return false;
        }
    } catch (error) {
        console.error('Error refreshing nonce:', error);
        currentNonce = ''; // Clear potentially invalid nonce
        return false;
    } finally {
        isRefreshingNonce = false; // Allow next refresh
    }
}

// Add nonce to fetch requests
const originalFetch = window.fetch;
window.fetch = async function(url, options = {}) {
    // Only modify our own API calls, EXCLUDING the nonce fetch itself
    if (typeof url === 'string' && url.startsWith('api/') && url !== 'api/get-nonce.php') {
        // Make sure we have a valid nonce
        if (!currentNonce) {
            console.log('No current nonce, attempting refresh before request to:', url); // Debugging
            const refreshed = await refreshNonce();
            if (!refreshed) {
                 // Handle failure: maybe throw an error or return a specific response
                 console.error("Could not refresh nonce, aborting request to:", url);
                 // You might want to throw an error here to stop the fetch
                 throw new Error("Nonce acquisition failed");
                 // Or return a simulated error response:
                 // return new Response(JSON.stringify({ success: false, error: 'Nonce acquisition failed' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
            }
        }

        // Ensure options and headers objects exist
        options = options || {}; // Ensure options is an object
        if (!options.headers) {
            options.headers = {};
        } else if (options.headers instanceof Headers) {
            // Convert Headers to plain object to safely add new header
            const headerObj = {};
            for (const [key, value] of options.headers.entries()) {
                headerObj[key] = value;
            }
            options.headers = headerObj;
        } else if (Array.isArray(options.headers)) {
             // Convert array of [key, value] pairs to object
             const headerObj = {};
             options.headers.forEach(([key, value]) => {
                 headerObj[key] = value;
             });
             options.headers = headerObj;
        }
        // Ensure options.headers is now a plain object
        if (typeof options.headers !== 'object' || options.headers === null || Array.isArray(options.headers)) {
             console.warn('Could not normalize headers, creating new header object.');
             options.headers = {};
        }


        // Add nonce to headers if we have one
        if (currentNonce) {
             options.headers['X-AJAX-Nonce'] = currentNonce;
             console.log(`Added nonce ${currentNonce} to request for: ${url}`); // Debugging
             // Invalidate the nonce after adding it, so the next request must get a new one
             // This makes the nonce truly single-use ("nonce" = number used once)
             currentNonce = '';
        } else {
             // This case should ideally be prevented by the refresh logic above
             console.error("Attempting to make API call without a valid nonce to:", url);
             // Handle error appropriately - throw or return error response
             throw new Error("Attempting API call without nonce");
        }

        // --- REMOVED THE PROBLEMATIC LINE ---
        // refreshNonce(); // DO NOT call refreshNonce here - this caused the loop!
        // We now clear currentNonce above, forcing the *next* API call to refresh it.
    } else if (url === 'api/get-nonce.php') {
        console.log('Allowing fetch for get-nonce.php without modification.'); // Debugging
    }

    // Call original fetch with potentially modified options
    return originalFetch.call(this, url, options);
};

// Initialize nonce on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initial nonce refresh.'); // Debugging
    refreshNonce().catch(err => {
        console.error("Initial nonce refresh failed:", err);
        // Handle initial failure if necessary (e.g., show error message to user)
    });
});
