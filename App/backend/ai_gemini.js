
const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "../../.env")
});

const { GoogleGenAI } = require("@google/genai");

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from .env");
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

async function generateLearningContent(moduleData) {

    const prompt = `
You are Monetto AI, an educational assistant.

Your job is to create an interactive educational lesson
based on the official learning module provided below.

OFFICIAL LEARNING MODULE:
${JSON.stringify(moduleData, null, 2)}

INSTRUCTIONS:

1. Use the supplied module as your primary source.
2. Respect its educational objectives and curriculum.
3. Explain concepts in accessible Brazilian Portuguese.
4. Use practical, relatable examples.
5. Divide the lesson into organized sections.
6. Include examples and explanations.
7. Include a short knowledge assessment at the end.
8. Do not invent curriculum requirements.
9. Do not introduce unrelated subjects.
10. Adapt the complexity to the student's educational level.

Return the lesson in Markdown.
`;

    try {
        const interaction = await ai.interactions.create({
            model: "gemini-3-flash-preview",
            input: prompt,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
                topP: 0.95,
                thinkingConfig: {
                    thinkingLevel: "HIGH",
                },
            },
        });

        const content = interaction.outputs?.at(-1)?.text;

        if (!content) {
            throw new Error("Gemini returned empty content.");
        }

        return content;

    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}

module.exports = {
    generateLearningContent
};
