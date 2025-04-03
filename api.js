// Import the Google Gemini API client
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Function to enhance the prompt using Gemini
async function enhancePromptWithGemini(prompt, apiKey) {
    try {
        // Initialize the API client
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Create the enhancement instruction
        const enhancementPrompt = `Please rephrase and enhance the following prompt to make it clearer, more specific, and more effective. Maintain the original intent but make it more articulate and well-structured. Here's the prompt to enhance:

"${prompt}"

Enhanced version:`;

        // Generate the enhanced prompt
        const result = await model.generateContent(enhancementPrompt);
        const response = await result.response;
        const enhancedPrompt = response.text();
        
        return enhancedPrompt;
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error('Failed to enhance prompt: ' + error.message);
    }
}

// Export the function
module.exports = { enhancePromptWithGemini };