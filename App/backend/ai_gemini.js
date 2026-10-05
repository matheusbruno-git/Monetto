require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const tools = [
    {
        type: "google_search",
    },
];

const generationConfig = {
    temperature: 1,
    max_output_tokens: 65536,
    topP: 0.95,
    thinkingLevel: "high",
};

async function main() {
    try {
        const interaction = await ai.interactions.create({
            model: "models/gemini-3-flash-preview",
            input: "INSERT_INPUT_HERE",
            tools: tools,
            generation_config: generationConfig,
        });

        console.log(interaction.steps?.at(-1));
    } catch (error) {
        console.error("Gemini API Error:", error);
    }
}

main();