import type { ScriptAnalysis, Language, ScheduleDay, Scene, Shot, ProductionBible, ContinuityAnalysis, Part } from '../types';

async function apiCall<T>(action: string, payload: any): Promise<T> {
    try {
        const response = await fetch('/api/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, payload })
        });

        if (!response.ok) {
            let errorMessage = `API request for '${action}' failed with status ${response.status}`;
            try {
                const errorBody = await response.json();
                errorMessage = errorBody.message || errorMessage;
            } catch (e) {
                // Body might not be JSON, fall back to status text
                errorMessage = `${errorMessage}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        return response.json() as Promise<T>;
    } catch (error) {
        console.error(`Error during API call for action '${action}':`, error);
        // Re-throw a more user-friendly error
        throw new Error(`There was a problem communicating with the AI service. Please try again. (Action: ${action})`);
    }
}


export async function parseScript(content: string | Part, language: Language): Promise<ScriptAnalysis> {
    return apiCall('parseScript', { content, language });
}

export async function generateSchedule(analysis: ScriptAnalysis, language: Language): Promise<ScheduleDay[]> {
    return apiCall('generateSchedule', { analysis, language });
}

export async function generateShotList(scene: Scene, language: Language): Promise<Shot[]> {
    return apiCall('generateShotList', { scene, language });
}

export async function generateImageForShot(shot: Shot, scene: Scene, language: Language): Promise<string> {
    return apiCall('generateImageForShot', { shot, scene, language });
}

export async function generateSceneProductionGuide(scene: Scene, language: Language): Promise<ProductionBible> {
    return apiCall('generateSceneProductionGuide', { scene, language });
}

export async function generateContinuityReport(analysis: ScriptAnalysis, language: Language): Promise<ContinuityAnalysis> {
    return apiCall('generateContinuityReport', { analysis, language });
}
