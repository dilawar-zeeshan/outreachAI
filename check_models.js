const { GoogleGenerativeAI } = require("@google/generative-ai");

async function main() {
    const fetch = (await import('node-fetch')).default;
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Fetching models with key:", apiKey ? "Set" : "Not Set");
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        const models = data.models || [];
        const embedModels = models.filter(m => m.name.toLowerCase().includes('embed') || m.supportedGenerationMethods.includes('embedContent') || m.supportedGenerationMethods.includes('embedText'));
        console.log("Embedding Models:", JSON.stringify(embedModels, null, 2));
    } catch(e) {
        console.error(e);
    }
}
main();
