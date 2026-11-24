
const path = require("path");
const fs = require("fs");

// Read the project .env without relying on dotenv being present in Electron's
// runtime node_modules. Existing environment variables always take priority.
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

const { GoogleGenAI } = require("@google/genai");

async function generateLearningContent(moduleData, model = "gemini-4-hydrogen") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing from the project .env file.");
    }
    const ai = new GoogleGenAI({ apiKey });

    if (model === "gemini-decision-1") {
        const decision = await ai.decisions.create({
            model,
            input: JSON.stringify(moduleData, null, 2),
            questions: {
                curriculum_alignment: {
                    type: "noul",
                    instructions: "Determine whether this module clearly aligns its learning objectives with the BNCC skill and financial education.",
                    criteria: { true_description: "Objectives clearly align with the BNCC skill and financial education.", false_description: "Alignment is missing, unclear, or unrelated." },
                },
                objectives_are_measurable: {
                    type: "noul",
                    instructions: "Determine whether the module states specific, understandable learning objectives a student can demonstrate.",
                    criteria: { true_description: "Objectives are specific and demonstrable.", false_description: "Objectives are vague, absent, or not demonstrable." },
                },
                assessment_evidence: {
                    type: "noul",
                    instructions: "Determine whether the module provides activities or assessment evidence that can show whether its objectives were learned.",
                    criteria: { true_description: "Activities or assessment evidence directly demonstrate the objectives.", false_description: "Evidence is missing or does not demonstrate the objectives." },
                },
            },
        });
        const labels = {
            curriculum_alignment: "Alinhamento com a habilidade BNCC",
            objectives_are_measurable: "Objetivos de aprendizagem verificáveis",
            assessment_evidence: "Evidências de aprendizagem",
        };
        const content = Object.entries(decision.answers || {}).map(([key, answer]) => {
            const yes = answer.noul >= 0.5;
            const confidence = Math.round((answer.confidence || 0) * 100);
            return `${labels[key] || key}: ${yes ? "Sim" : "Não"} (${confidence}% de confiança)`;
        }).join("\n");
        if (!content) throw new Error("O modelo de decisão retornou uma avaliação vazia.");
        return { content, kind: "assessment" };
    }

    if (model === "gemini-nano-banana-2.1") {
        const interaction = await ai.interactions.create({
            model,
            input: `Crie um infográfico educativo, claro e visualmente organizado, em português brasileiro, com base neste módulo oficial. Use poucos textos legíveis, exemplos visuais simples e conceitos corretos. Não invente objetivos curriculares.\n\n${JSON.stringify(moduleData, null, 2)}`,
        });
        const image = interaction.output_image || interaction.steps
            ?.filter((step) => step.type === "model_output")
            .flatMap((step) => step.content || [])
            .find((part) => part.type === "image");
        if (!image?.data) throw new Error("O modelo não retornou uma imagem. Tente novamente ou escolha outro modelo.");
        return {
            content: interaction.output_text || "Infográfico educativo do módulo selecionado.",
            imageData: image.data,
            imageMimeType: image.mime_type || "image/png",
            kind: "image",
        };
    }

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
            model,
            input: prompt,
            generation_config: {
                temperature: 0.7,
                max_output_tokens: 8192,
                top_p: 0.95,
                thinking_level: "high",
            },
        });

        const content = interaction.output_text || interaction.steps
            ?.filter((step) => step.type === "model_output")
            .flatMap((step) => step.content || [])
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join("\n");

        if (!content) {
            throw new Error("Gemini returned empty content.");
        }

        return { content, kind: "text" };

    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}

module.exports = {
    generateLearningContent
};
