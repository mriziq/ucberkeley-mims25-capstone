// Function to enhance prompt using Gemini API
async function enhancePromptWithGemini(prompt, apiKey) {
    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Please rephrase and enhance the following prompt to make it clearer, more specific, and more effective. Maintain the original intent but make it more articulate and well-structured. Only return the enhanced prompt. Do not say anything else. Here's the prompt to enhance:

"${prompt}"

Enhanced version:`
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API request failed: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Unexpected API response format');
        }
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error('Failed to enhance prompt: ' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', function() {
  const importButton = document.getElementById('importButton');
  const enhanceButton = document.getElementById('enhanceButton');
  const copyButton = document.getElementById('copyButton');
  const insertButton = document.getElementById('insertButton');
  const originalText = document.getElementById('originalText');
  const enhancedText = document.getElementById('enhancedText');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const saveApiKeyButton = document.getElementById('saveApiKey');
  const loadingSpinner = document.getElementById('loadingSpinner');

  // Load saved API key
  chrome.storage.local.get(['geminiApiKey'], function(result) {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
    }
  });

  // Save API key
  saveApiKeyButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.local.set({ geminiApiKey: apiKey }, function() {
        alert('API key saved successfully!');
      });
    } else {
      alert('Please enter a valid API key');
    }
  });

  // Import button handler
  importButton.addEventListener('click', async function() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Check if we're on a supported site
      if (!tab.url.includes('chatgpt.com') && !tab.url.includes('gemini.google.com')) {
        alert('Please navigate to ChatGPT or Google Gemini to import a prompt');
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: "getPrompt" });
      
      if (response.error) {
        alert(response.error);
        return;
      }

      if (response.prompt) {
        originalText.textContent = response.prompt;
        // Enable enhance button only when we have imported text
        enhanceButton.disabled = false;
      } else {
        originalText.textContent = "No text found in the input field";
        enhanceButton.disabled = true;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error importing prompt. Make sure you are on a supported site');
    }
  });

  // Enhance button handler
  enhanceButton.addEventListener('click', async function() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      alert('Please enter your Gemini API key first');
      return;
    }

    const promptText = originalText.textContent;
    if (!promptText || promptText === "No prompt imported yet") {
      alert('Please import a prompt first');
      return;
    }

    try {
      // Show loading spinner
      loadingSpinner.classList.remove('hidden');
      enhanceButton.disabled = true;

      const enhancedPrompt = await enhancePromptWithGemini(promptText, apiKey);
      enhancedText.textContent = enhancedPrompt;
      
      // Enable copy and insert buttons
      copyButton.disabled = false;
      insertButton.disabled = false;
    } catch (error) {
      console.error('Error:', error);
      alert('Error enhancing prompt: ' + error.message);
    } finally {
      // Hide loading spinner
      loadingSpinner.classList.add('hidden');
      enhanceButton.disabled = false;
    }
  });

  // Copy button handler
  copyButton.addEventListener('click', function() {
    const enhancedPrompt = enhancedText.textContent;
    if (enhancedPrompt && enhancedPrompt !== "Enhanced prompt will appear here") {
      navigator.clipboard.writeText(enhancedPrompt)
        .then(() => alert('Enhanced prompt copied to clipboard!'))
        .catch(err => {
          console.error('Failed to copy text:', err);
          alert('Failed to copy text to clipboard');
        });
    }
  });

  // Insert button handler
  insertButton.addEventListener('click', async function() {
    const enhancedPrompt = enhancedText.textContent;
    if (!enhancedPrompt || enhancedPrompt === "Enhanced prompt will appear here") {
      alert('No enhanced prompt to insert');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "setPrompt",
        enhancedPrompt: enhancedPrompt
      });
      
      if (response.error) {
        alert(response.error);
      } else if (response.success) {
        window.close(); // Close the popup after successful insertion
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error inserting enhanced prompt');
    }
  });
}); 