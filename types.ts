export type Language = 'English' | 'Spanish' | 'French' | 'German' | 'Japanese' | 'Chinese';

export interface Scene {
  sceneNumber: number;
  setting: string;
  timeOfDay: string;
  summary: string;
  characters: string[];
  locations: string;
  pages: string;
}

export interface Character {
  name:string;
  description: string;
  scenes: number[];
}

export interface ScriptAnalysis {
  title: string;
  logline: string;
  scenes: Scene[];
  characters: Character[];
}

export interface ScheduleDay {
    day: number;
    date: string;
    scenes: {
        sceneNumber: number;
        setting: string;
        summary: string;
        pages: string;
    }[];
    notes: string;
}

export interface Shot {
    shotNumber: number;
    shotType: string;
    lens: string;
    description: string;
    imageUrl?: string;
    isLoadingImage?: boolean;
}

export interface CameraSuggestion {
    recommendation: string;
    reasoning: string;
}

export interface ArtSuggestion {
    prop: string;
    description: string;
}

export interface LightingSuggestion {
    setup: string;
    mood: string;
    details: string;
}

export interface CostumeSuggestion {
    character: string;
    costume: string;
    inspiration: string;
}

export interface ProductionBible {
    camera: CameraSuggestion[];
    art: ArtSuggestion[];
    lighting: LightingSuggestion[];
    costumes: CostumeSuggestion[];
}

export interface CharacterContinuityIssue {
    sceneNumber: number;
    character: string;
    issue: string;
}

export interface CostumeContinuityIssue {
    character: string;
    sceneNumbers: number[];
    issue: string;
}

export interface EditingContinuityIssue {
    sceneNumbers: number[];
    issue: string;
    suggestion: string;
}

export interface ContinuityAnalysis {
    characterContinuity: CharacterContinuityIssue[];
    costumeContinuity: CostumeContinuityIssue[];
    editingContinuity: EditingContinuityIssue[];
}

// Added for frontend service to understand file parts without google/genai import
export interface InlineData {
    mimeType: string;
    data: string;
}

export interface Part {
    text?: string;
    inlineData?: InlineData;
}
