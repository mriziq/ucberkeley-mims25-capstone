// Store the last captured text
let lastCapturedText = '';
let isObserving = false;

// Function to set up the mutation observer
function setupPromptObserver() {
    const promptDiv = document.getElementById('prompt-textarea');
    if (!promptDiv || isObserving) return;

    // Create a MutationObserver to watch for changes in the prompt div
    const observer = new MutationObserver((mutations) => {
        const currentText = promptDiv.textContent.trim();
        
        // Only update if the text has changed
        if (currentText !== lastCapturedText) {
            lastCapturedText = currentText;
            
            // Send the updated text to the extension
            chrome.runtime.sendMessage({
                action: "textUpdated",
                text: currentText
            });
        }
    });

    // Start observing the prompt div
    observer.observe(promptDiv, {
        childList: true,
        characterData: true,
        subtree: true
    });

    isObserving = true;
}

// Function to initialize the observer
function initializeObserver() {
    // Try to set up the observer immediately
    setupPromptObserver();

    // If the prompt div isn't available immediately, watch for changes
    const bodyObserver = new MutationObserver((mutations) => {
        setupPromptObserver();
    });

    // Observe the body for changes to catch when the prompt div is added
    bodyObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Start observing when the content script loads
initializeObserver();

// Function to get the prompt based on the current website
function getPromptFromPage() {
    const url = window.location.href;
    
    if (url.includes('chatgpt.com')) {
        const promptDiv = document.getElementById('prompt-textarea');
        if (promptDiv) {
            return promptDiv.textContent.trim();
        }
    } 
    else if (url.includes('gemini.google.com')) {
        // Gemini uses a rich text editor div with role="textbox"
        const promptDiv = document.querySelector('div[role="textbox"]');
        if (promptDiv) {
            return promptDiv.textContent.trim();
        }
    }
    
    return null;
}

// Function to set the prompt based on the current website
function setPromptOnPage(text) {
    const url = window.location.href;
    
    if (url.includes('chatgpt.com')) {
        const promptDiv = document.getElementById('prompt-textarea');
        if (promptDiv) {
            promptDiv.innerHTML = '';
            const paragraph = document.createElement('p');
            paragraph.textContent = text;
            promptDiv.appendChild(paragraph);
            return true;
        }
    } 
    else if (url.includes('gemini.google.com')) {
        const promptDiv = document.querySelector('div[role="textbox"]');
        if (promptDiv) {
            promptDiv.textContent = text; // Gemini's input handles plain text
            // Trigger an input event to ensure Gemini recognizes the change
            const inputEvent = new InputEvent('input', {
                bubbles: true,
                cancelable: true,
            });
            promptDiv.dispatchEvent(inputEvent);
            return true;
        }
    }
    
    return false;
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getPrompt") {
        const promptText = getPromptFromPage();
        if (promptText !== null) {
            sendResponse({ prompt: promptText });
        } else {
            sendResponse({ error: "Prompt input field not found" });
        }
    }
    else if (request.action === "setPrompt") {
        const success = setPromptOnPage(request.enhancedPrompt);
        if (success) {
            sendResponse({ success: true });
        } else {
            sendResponse({ error: "Could not set prompt text" });
        }
    }
    return true; // Required for async response
});