import { GoogleGenAI, Type, Part } from "@google/genai";
import type { ScriptAnalysis, Language, ScheduleDay, Scene, Shot, ProductionBible, ContinuityAnalysis } from '../types';

// Minimal types for Vercel request/response to avoid adding dependencies
interface VercelRequest {
  method?: string;
  body: {
    action?: string;
    payload?: any;
  };
}
interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: any) => void;
}

if (!process.env.API_KEY) {
  // This check now runs on the server, as intended.
  throw new Error("API_KEY environment variable not set on the server.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// --- SCHEMAS ---

const SCRIPT_ANALYSIS_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "The title of the movie script." },
        logline: { type: Type.STRING, description: "A one-sentence summary of the film." },
        scenes: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    sceneNumber: { type: Type.INTEGER },
                    setting: { type: Type.STRING, description: "e.g., INT. COFFEE SHOP" },
                    timeOfDay: { type: Type.STRING, description: "e.g., DAY, NIGHT" },
                    summary: { type: Type.STRING },
                    characters: { type: Type.ARRAY, items: { type: Type.STRING } },
                    locations: { type: Type.STRING, description: "The general location, e.g., 'Coffee Shop', 'John's Apartment'" },
                    pages: { type: Type.STRING, description: "Page count for the scene, e.g., '1 1/8'" }
                },
                required: ["sceneNumber", "setting", "timeOfDay", "summary", "characters", "locations", "pages"]
            }
        },
        characters: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING, description: "A brief description of the character." }
                },
                required: ["name", "description"]
            }
        }
    },
    required: ["title", "logline", "scenes", "characters"]
};

const SCHEDULE_SCHEMA = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            day: { type: Type.INTEGER },
            date: { type: Type.STRING, description: "A fictional date for the shoot day, e.g., 'Monday, Oct 28th'" },
            scenes: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        sceneNumber: { type: Type.INTEGER },
                        setting: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        pages: { type: Type.STRING }
                    },
                    required: ["sceneNumber", "setting", "summary", "pages"]
                }
            },
            notes: { type: Type.STRING, description: "Notes for the day, like primary location. e.g., 'All scenes at the Coffee Shop location.'" }
        },
        required: ["day", "date", "scenes", "notes"]
    }
};

const SHOT_LIST_SCHEMA = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            shotNumber: { type: Type.INTEGER },
            shotType: { type: Type.STRING, description: "e.g., Wide Shot, Medium Close-Up, POV" },
            lens: { type: Type.STRING, description: "e.g., 24mm, 50mm, 85mm Anamorphic" },
            description: { type: Type.STRING, description: "A detailed description of the action and framing in the shot." }
        },
        required: ["shotNumber", "shotType", "lens", "description"]
    }
};

const PRODUCTION_BIBLE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        camera: {
            type: Type.ARRAY,
            description: "Suggestions for camera, lenses, and general cinematographic approach.",
            items: {
                type: Type.OBJECT,
                properties: {
                    recommendation: { type: Type.STRING, description: "Specific equipment or technique, e.g., 'ARRI Alexa with Anamorphic Lenses'" },
                    reasoning: { type: Type.STRING, description: "Why this choice is suitable for the script's tone and story." }
                },
                required: ["recommendation", "reasoning"]
            }
        },
        art: {
            type: Type.ARRAY,
            description: "Key props and set dressing suggestions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    prop: { type: Type.STRING, description: "The name of the prop or set piece." },
                    description: { type: Type.STRING, description: "Description and relevance to the story or characters." }
                },
                required: ["prop", "description"]
            }
        },
        lighting: {
            type: Type.ARRAY,
            description: "Lighting design ideas for key scenes or the overall film.",
            items: {
                type: Type.OBJECT,
                properties: {
                    setup: { type: Type.STRING, description: "e.g., 'High-key lighting', 'Motivated practicals'" },
                    mood: { type: Type.STRING, description: "The mood this lighting setup will create, e.g., 'Optimistic', 'Tense', 'Mysterious'" },
                    details: { type: Type.STRING, description: "Further details on implementation or specific scenes." }
                },
                required: ["setup", "mood", "details"]
            }
        },
        costumes: {
            type: Type.ARRAY,
            description: "Costume concepts for main characters.",
            items: {
                type: Type.OBJECT,
                properties: {
                    character: { type: Type.STRING },
                    costume: { type: Type.STRING, description: "Description of the costume." },
                    inspiration: { type: Type.STRING, description: "Inspiration or reference for the costume's style." }
                },
                required: ["character", "costume", "inspiration"]
            }
        }
    },
    required: ["camera", "art", "lighting", "costumes"]
};

const CONTINUITY_ANALYSIS_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        characterContinuity: {
            type: Type.ARRAY,
            description: "Identified issues with character presence or absence across scenes.",
            items: {
                type: Type.OBJECT,
                properties: {
                    sceneNumber: { type: Type.INTEGER },
                    character: { type: Type.STRING },
                    issue: { type: Type.STRING, description: "A detailed description of the character continuity issue." }
                },
                required: ["sceneNumber", "character", "issue"]
            }
        },
        costumeContinuity: {
            type: Type.ARRAY,
            description: "Identified issues with costume consistency across scenes for characters.",
            items: {
                type: Type.OBJECT,
                properties: {
                    character: { type: Type.STRING },
                    sceneNumbers: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                    issue: { type: Type.STRING, description: "A detailed description of the costume continuity issue." }
                },
                required: ["character", "sceneNumbers", "issue"]
            }
        },
        editingContinuity: {
            type: Type.ARRAY,
            description: "Potential editing issues between consecutive or related scenes.",
            items: {
                type: Type.OBJECT,
                properties: {
                    sceneNumbers: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                    issue: { type: Type.STRING, description: "A detailed description of the potential editing problem (e.g., crossing the line, jump cuts)." },
                    suggestion: { type: Type.STRING, description: "A suggestion to mitigate the editing issue." }
                },
                required: ["sceneNumbers", "issue", "suggestion"]
            }
        }
    },
    required: ["characterContinuity", "costumeContinuity", "editingContinuity"]
};

const parseJSONResponse = <T>(text: string, action: string): T => {
    if (!text) throw new Error(`Received an empty response from the AI for ${action}.`);
    try {
        const cleanText = text.replace(/^```json/, '').replace(/```$/, '').trim();
        return JSON.parse(cleanText) as T;
    } catch (e) {
        console.error(`Failed to parse JSON for ${action}:`, text);
        throw new Error(`The AI returned an invalid format for ${action}.`);
    }
}

// --- API Logic Functions ---

async function _parseScript({ content, language }: { content: string | Part; language: Language; }): Promise<ScriptAnalysis> {
    const systemInstruction = `You are a professional script reader and first assistant director. Analyze the provided film script. Extract the title, a logline, a detailed breakdown of every scene, and a list of all characters. Provide the entire response in ${language}. Ensure the JSON output strictly adheres to the provided schema.`;

    let requestContents: any;
    if (typeof content === 'string') {
        requestContents = content;
    } else {
        const textPart = { text: `Analyze the attached script file and extract the required information in ${language}.` };
        requestContents = { parts: [content, textPart] };
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: requestContents,
        config: { systemInstruction, responseMimeType: "application/json", responseSchema: SCRIPT_ANALYSIS_SCHEMA }
    });
    
    return parseJSONResponse<ScriptAnalysis>(response.text, 'script analysis');
}

async function _generateSchedule({ analysis, language }: { analysis: ScriptAnalysis; language: Language; }): Promise<ScheduleDay[]> {
    const systemInstruction = `You are a 1st Assistant Director creating a shooting schedule. Based on the provided scene breakdown, create an efficient shooting schedule. Group scenes by location to minimize company moves. Aim for a reasonable number of pages per day (e.g., 3-5 pages). Provide the entire response in ${language}.`;
    const prompt = `Create a schedule from this analysis:\n${JSON.stringify(analysis.scenes)}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { systemInstruction, responseMimeType: "application/json", responseSchema: SCHEDULE_SCHEMA }
    });

    return parseJSONResponse<ScheduleDay[]>(response.text, 'scheduling');
}

async function _generateShotList({ scene, language }: { scene: Scene; language: Language; }): Promise<Shot[]> {
    const systemInstruction = `You are a visionary film director and cinematographer. For the given scene, create a dynamic and visually interesting shot list. Suggest varied camera shots and appropriate lenses to tell the story effectively. Provide the entire response in ${language}.`;
    const prompt = `Generate a shot list for this scene:\nSetting: ${scene.setting}, ${scene.timeOfDay}\nCharacters: ${scene.characters.join(', ')}\nSummary: ${scene.summary}`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { systemInstruction, responseMimeType: "application/json", responseSchema: SHOT_LIST_SCHEMA }
    });
    
    return parseJSONResponse<Shot[]>(response.text, 'the shot list');
}

async function _generateImageForShot({ shot, scene }: { shot: Shot; scene: Scene; language: Language; }): Promise<string> {
    // Sanitize the description to improve prompt safety.
    // Replace known character names with generic placeholders to avoid potential safety flags on names.
    let cleanDescription = shot.description;
    if (scene.characters && scene.characters.length > 0) {
        scene.characters.forEach((char, index) => {
            // Use a simple regex to avoid issues with special characters in names
            const regex = new RegExp(char.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
            cleanDescription = cleanDescription.replace(regex, `Person ${index + 1}`);
        });
    }
    // Remove quotation marks which can sometimes be misinterpreted in prompts.
    cleanDescription = cleanDescription.replace(/"/g, '');

    const prompt = `cinematic film still of ${cleanDescription}. Setting: ${scene.setting}, ${scene.timeOfDay}. Camera: ${shot.shotType}, ${shot.lens}. Photorealistic with dramatic lighting.`;
    
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' }
    });

    if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image.imageBytes) {
        return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
    } else {
        // Provide a more specific error if no images are returned, which can be due to safety filters.
        throw new Error("Image generation failed. The prompt may have been blocked by safety policies or the service is temporarily unavailable.");
    }
}

async function _generateSceneProductionGuide({ scene, language }: { scene: Scene; language: Language; }): Promise<ProductionBible> {
    const systemInstruction = `You are a team of seasoned film industry professionals: a cinematographer, a production designer, a gaffer, and a costume designer. For the provided scene details, create a comprehensive production guide covering camera/lenses, art department props, lighting design, and costume concepts. Your suggestions should be creative, practical, and thematically consistent with the scene's summary and characters. Provide the entire response in ${language}.`;
    const prompt = `Generate a production guide for the following scene:\n- Scene Number: ${scene.sceneNumber}\n- Setting: ${scene.setting}, ${scene.timeOfDay}\n- Characters: ${scene.characters.join(', ')}\n- Summary: ${scene.summary}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { systemInstruction, responseMimeType: "application/json", responseSchema: PRODUCTION_BIBLE_SCHEMA }
    });

    return parseJSONResponse<ProductionBible>(response.text, 'the scene production guide');
}

async function _generateContinuityReport({ analysis, language }: { analysis: ScriptAnalysis; language: Language; }): Promise<ContinuityAnalysis> {
    const systemInstruction = `You are an expert script supervisor and film editor. Analyze the entire script breakdown provided. Your task is to identify continuity errors and potential editing problems. 
    Focus on three areas:
    1.  **Character Continuity**: Do characters appear or disappear between scenes illogically? Note any inconsistencies.
    2.  **Costume Continuity**: Based on scene summaries and character actions, flag potential costume inconsistencies between consecutive scenes where a character appears. Assume a costume change only happens if the script implies it (e.g., time passes, character changes at home).
    3.  **Editing Continuity**: From an editor's perspective, identify potential issues between scenes. This includes jarring transitions, potential for jump cuts, 'crossing the line' (180-degree rule) problems based on scene descriptions, and mismatches in time or setting. Suggest solutions for these editing challenges.
    Provide the entire response in ${language}.`;

    const prompt = `Analyze this script for continuity issues:\n${JSON.stringify({ scenes: analysis.scenes, characters: analysis.characters })}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { systemInstruction, responseMimeType: "application/json", responseSchema: CONTINUITY_ANALYSIS_SCHEMA }
    });

    return parseJSONResponse<ContinuityAnalysis>(response.text, 'the continuity analysis');
}

async function _askScriptQuestion({ analysis, question, language }: { analysis: ScriptAnalysis; question: string; language: Language; }): Promise<string> {
    const systemInstruction = `You are an intelligent filmmaking assistant called CineGenius. The user has provided a script which has been analyzed into the following JSON data. Your task is to answer the user's questions based on this data. Be helpful, concise, and provide creative insights where appropriate. If a question cannot be answered from the data, state that clearly and politely. Answer in markdown format when it makes sense (e.g., for lists). Respond in ${language}.

Here is the script analysis data:
${JSON.stringify(analysis)}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: question,
        config: { systemInstruction }
    });
    
    const text = response.text.trim();
    if (!text) throw new Error("Received an empty response from the AI assistant.");
    return text;
}


// --- Vercel Serverless Function Handler ---

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { action, payload } = req.body;

    try {
        let result: any;
        switch (action) {
            case 'parseScript':
                result = await _parseScript(payload);
                break;
            case 'generateSchedule':
                result = await _generateSchedule(payload);
                break;
            case 'generateShotList':
                result = await _generateShotList(payload);
                break;
            case 'generateImageForShot':
                result = await _generateImageForShot(payload);
                break;
            case 'generateSceneProductionGuide':
                result = await _generateSceneProductionGuide(payload);
                break;
            case 'generateContinuityReport':
                result = await _generateContinuityReport(payload);
                break;
            case 'askScriptQuestion':
                result = await _askScriptQuestion(payload);
                break;
            default:
                return res.status(400).json({ message: `Invalid action: ${action}` });
        }
        return res.status(200).json(result);
    } catch (error: any) {
        console.error(`Error in action: ${action}`, error);
        return res.status(500).json({ message: error.message || 'An internal server error occurred' });
    }
}
