const path = require("path");
const fs = require("fs");
const { Groq } = require("groq-sdk");

function loadProjectEnv() {
    const envPath = path.resolve(__dirname, "../../.env");
    try {
        const contents = fs.readFileSync(envPath, "utf8");
        for (const line of contents.split(/\r?\n/)) {
            const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_-]*)\s*=\s*(.*?)\s*$/);
            if (!match) continue;
            const envName = match[1].replace(/-/g, "_");
            if (process.env[envName] !== undefined) continue;
            let value = match[2];
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
                if (match[2].startsWith('"')) value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
            } else {
                value = value.replace(/\s+#.*$/, "").trim();
            }
            process.env[envName] = value;
        }
    } catch (error) {
        if (error.code !== "ENOENT") console.warn("Could not read project .env:", error.message);
    }
}

loadProjectEnv();

const ALLOWED_MODELS = new Set([
    "openai/gpt-oss-120b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
]);

async function generateLearningContent(moduleData, model = "openai/gpt-oss-120b", studyLevel = "") {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("GROQ_API_KEY is missing from the project .env file.");
    }

    const selectedModel = ALLOWED_MODELS.has(model) ? model : "openai/gpt-oss-120b";
    const groq = new Groq({ apiKey });

    const prompt = `
You are Monetto AI, an educational assistant.

Your job is to create a clear, engaging, interactive educational lesson
based on the official learning module provided below.

OFFICIAL LEARNING MODULE:
${JSON.stringify(moduleData, null, 2)}
${studyLevel ? `\nSTUDENT LEVEL: ${studyLevel}` : ""}

INSTRUCTIONS:

1. Use the supplied module as your primary source.
2. Respect its educational objectives and curriculum.
3. Explain concepts in accessible Brazilian Portuguese.
4. Use practical, relatable everyday examples (such as money, discounts, savings, and budgeting).
5. Divide the lesson into clear sections with headings (##) and horizontal dividers (---).
6. Use bold (**text**) for key terms, bullet lists for steps/tips, and blockquotes (> ...) for quick reflections or callouts.
7. If using a table, keep cells short and clear. Do NOT include external image links or URLs.
8. Include a short knowledge assessment / practice check at the end with clear questions.
9. Do not invent curriculum requirements or introduce unrelated subjects.
10. Adapt the tone and complexity to the student's educational level.

Return the lesson in clean Markdown.
`.trim();

    try {
        const completion = await groq.chat.completions.create({
            model: selectedModel,
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_completion_tokens: 4096,
            top_p: 1,
            stream: false,
        });

        const content = completion.choices?.[0]?.message?.content?.trim();
        if (!content) {
            throw new Error("Groq returned empty content.");
        }

        return { content, kind: "text" };
    } catch (error) {
        console.error("Groq API Error:", error);
        throw error;
    }
}

module.exports = {
    generateLearningContent,
};