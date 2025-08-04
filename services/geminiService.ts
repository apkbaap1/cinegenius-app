import type { ScriptAnalysis, Language, ScheduleDay, Scene, Shot, ProductionBible, ContinuityAnalysis, Part } from '../types';

async function callProxy<T>(action: string, payload: any): Promise<T> {
  const response = await fetch('/api/proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown server error occurred' }));
    throw new Error(errorData.message || `API call failed with status: ${response.status}`);
  }
  return response.json();
}

export function parseScript(content: string | Part, language: Language): Promise<ScriptAnalysis> {
  return callProxy('parseScript', { content, language });
}

export function generateSchedule(analysis: ScriptAnalysis, language: Language): Promise<ScheduleDay[]> {
  return callProxy('generateSchedule', { analysis, language });
}

export function generateShotList(scene: Scene, language: Language): Promise<Shot[]> {
  return callProxy('generateShotList', { scene, language });
}

export function generateImageForShot(shot: Shot, scene: Scene, language: Language): Promise<string> {
  return callProxy('generateImageForShot', { shot, scene, language });
}

export function generateSceneProductionGuide(scene: Scene, language: Language): Promise<ProductionBible> {
  return callProxy('generateSceneProductionGuide', { scene, language });
}

export function generateContinuityReport(analysis: ScriptAnalysis, language: Language): Promise<ContinuityAnalysis> {
  return callProxy('generateContinuityReport', { analysis, language });
}

export function askScriptQuestion(analysis: ScriptAnalysis, question: string, language: Language): Promise<string> {
  return callProxy('askScriptQuestion', { analysis, question, language });
}
