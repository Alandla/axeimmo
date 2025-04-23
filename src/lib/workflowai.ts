// Initialize WorkflowAI Client
import { WorkflowAI } from "@workflowai/workflowai"
import { ExtractedFrame } from './ffmpeg'

const workflowAI = new WorkflowAI({
    key: process.env.WORKFLOWAI_API_KEY
})

// Types for the image format
export interface Image {
  url?: string;
  content_type?: string;
  data?: string;
}

// Initialize Your AI agent
export interface VideoScriptKeywordExtractionInput {
  script?: string
}

export interface VideoScriptKeywordExtractionOutput {
  keywords?: string[]
}

export interface VideoDescriptionGenerationInput {
  images?: Image[]
}

export interface VideoDescriptionGenerationOutput {
  video_description?: string
}

export interface VideoBRollSelectionInput {
  b_roll_list?: {
    id?: string
    description?: string
  }[]
  sequence_list?: {
    id?: string
    transcript?: string
  }[]
  used_keywords?: string[]
}

export interface VideoBRollSelectionOutput {
  b_roll_selections?: {
    sequence_id?: string
    media_id?: string
  }[]
}

export interface BRollDisplayModeSelectionInput {
  sequences?: {
    sequence_id?: string
    text?: string
    b_roll_description?: string
  }[]
}

export interface BRollDisplayModeSelectionOutput {
  sequence_display_modes?: {
    sequence_id?: string
    display_mode?: ("full" | "half" | "hide")
  }[]
}

export interface WorkflowAIResponse<T> {
  output: T
  data: {
    duration_seconds: number
    cost_usd: number
    version: {
      properties?: {
        model: string
      }
    }
  }
}

export interface VideoSequenceAnalysisInput {
  frames?: Image[]
}

export interface VideoSequenceAnalysisOutput {
  sequences ? : {
    start_timestamp ? : number
    duration ? : number
    description ? : string
  }[]
}

export interface MediaSequenceMatchingInput {
  media_list?: {
    id?: string
    descriptions?: string[]
  }[]
  sequences?: {
    id?: string
    transcript?: string
  }[]
}

export interface MediaSequenceMatchingOutput {
  matched_sequences?: {
    sequence_id?: string
    media_id?: string
    description_index?: number
  }[]
}

const videoScriptKeywordExtraction = workflowAI.agent<VideoScriptKeywordExtractionInput, VideoScriptKeywordExtractionOutput>({
  id: "video-script-keyword-extraction",
  schemaId: 1,
  version: "production",
  // Cache options:
  // - "auto" (default): if a previous run exists with the same version and input, and if
  // the temperature is 0, the cached output is returned
  // - "always": the cached output is returned when available, regardless
  // of the temperature value
  // - "never": the cache is never used
  useCache: process.env.NODE_ENV === 'development' ? 'never' : 'auto'
})

const videoDescriptionGeneration = workflowAI.agent<VideoDescriptionGenerationInput, VideoDescriptionGenerationOutput>({
  id: "video-description-generation",
  schemaId: 1,
  version: "production",
  useCache: 'always'
})

const videoBRollSelection = workflowAI.agent<VideoBRollSelectionInput, VideoBRollSelectionOutput>({
  id: "video-broll-selection",
  schemaId: 4,
  version: "production",
  useCache: process.env.NODE_ENV === 'development' ? 'never' : 'auto'
})

const bRollDisplayModeSelection = workflowAI.agent<BRollDisplayModeSelectionInput, BRollDisplayModeSelectionOutput>({
  id: "broll-display-mode-selection",
  schemaId: 2,
  version: "3.1",
  useCache: process.env.NODE_ENV === 'development' ? 'never' : 'auto'
})

const videoSequenceAnalysis = workflowAI.agent<VideoSequenceAnalysisInput, VideoSequenceAnalysisOutput>({
  id: "video-sequence-analysis",
  schemaId: 3,
  version: "production",
  useCache: process.env.NODE_ENV === 'development' ? 'never' : 'auto'
})

const mediaSequenceMatching = workflowAI.agent<MediaSequenceMatchingInput, MediaSequenceMatchingOutput>({
  id: "media-sequence-matching",
  schemaId: 1,
  version: "2.1",
  useCache: process.env.NODE_ENV === 'development' ? 'never' : 'auto'
})

// Run Your AI agent
export async function videoScriptKeywordExtractionRun(scriptContent: string): Promise<{
  cost: number,
  output: VideoScriptKeywordExtractionOutput
}> {
  const input: VideoScriptKeywordExtractionInput = {
    "script": scriptContent
  }

  try {
    const response = await videoScriptKeywordExtraction(input) as WorkflowAIResponse<VideoScriptKeywordExtractionOutput>
    
    return {
      cost: response.data.cost_usd,
      output: response.output
    }
  } catch (error) {
    console.error('Failed to run video script keyword extraction:', error)
    throw error
  }
}

/**
 * Génère une description d'une vidéo à partir de 4 images
 * @param imageUrls Tableau d'URLs des images (généralement 4 images)
 * @returns La description générée et le coût de l'opération
 */
export async function generateVideoDescription(imageUrls: string[]): Promise<{
  cost: number,
  description: string
}> {
  // Formatage des URLs d'images au format attendu par l'API
  const images: Image[] = imageUrls.map(url => ({ url }));
  
  const input: VideoDescriptionGenerationInput = {
    images
  }

  try {
    const response = await videoDescriptionGeneration(input) as WorkflowAIResponse<VideoDescriptionGenerationOutput>;
    
    return {
      cost: response.data.cost_usd,
      description: response.output.video_description || ""
    }
  } catch (error) {
    console.error('Failed to generate video description:', error);
    throw error;
  }
}

/**
 * Sélectionne les meilleurs B-Rolls à utiliser pour chaque séquence
 * @param bRollList Liste des B-Rolls disponibles avec leurs descriptions
 * @param sequenceList Liste des séquences avec leurs transcriptions
 * @param usedKeywords Liste des mots-clés déjà utilisés (optionnel)
 * @returns Les associations séquence-média et le coût de l'opération
 */
export async function selectBRollsForSequences(
  bRollList: { id?: string, description?: string }[],
  sequenceList: { id?: string, transcript?: string }[],
  usedKeywords: string[] = []
): Promise<{
  cost: number,
  selections: { sequence_id?: string, media_id?: string }[]
}> {
  const input: VideoBRollSelectionInput = {
    b_roll_list: bRollList,
    sequence_list: sequenceList,
    used_keywords: usedKeywords
  }

  try {
    const response = await videoBRollSelection(input) as WorkflowAIResponse<VideoBRollSelectionOutput>;
    
    return {
      cost: response.data.cost_usd,
      selections: response.output.b_roll_selections || []
    }
  } catch (error) {
    console.error('Failed to select B-Rolls for sequences:', error);
    throw error;
  }
}

/**
 * Sélectionne le mode d'affichage pour chaque B-Roll en fonction du contexte de la séquence
 * @param sequences Liste des séquences avec leurs textes et descriptions de B-Roll
 * @returns Les modes d'affichage sélectionnés et le coût de l'opération
 */
export async function selectBRollDisplayModes(
  sequences: { sequence_id?: string, text?: string, b_roll_description?: string }[]
): Promise<{
  cost: number,
  displayModes: { sequence_id?: string, display_mode?: "full" | "half" | "hide", reasoning?: string }[]
}> {
  const input: BRollDisplayModeSelectionInput = {
    sequences
  }

  try {
    const response = await bRollDisplayModeSelection(input) as WorkflowAIResponse<BRollDisplayModeSelectionOutput>;
    
    return {
      cost: response.data.cost_usd,
      displayModes: response.output.sequence_display_modes || []
    }
  } catch (error) {
    console.error('Failed to select B-Roll display modes:', error);
    throw error;
  }
}

/**
 * Analyse une séquence vidéo à partir d'une série de frames
 * @param frames Tableau de frames en base64 avec leurs timestamps
 * @returns Les séquences détectées avec leurs descriptions et le coût de l'opération
 */
export async function analyzeVideoSequence(
  frames: ExtractedFrame[]
): Promise<{
  cost: number,
  sequences: { start_timestamp?: number, duration?: number, description?: string }[]
}> {
  // Convertir les frames au format attendu par l'API
  const formattedFrames: Image[] = frames.map(frame => ({
    content_type: frame.mimeType,
    data: frame.base64
  }));

  const input: VideoSequenceAnalysisInput = {
    frames: formattedFrames
  }

  try {
    const response = await videoSequenceAnalysis(input) as WorkflowAIResponse<VideoSequenceAnalysisOutput>;
    
    return {
      cost: response.data.cost_usd,
      sequences: response.output.sequences || []
    }
  } catch (error) {
    console.error('Failed to analyze video sequence:', error);
    throw error;
  }
}

/**
 * Associe les médias aux séquences en fonction de leur contenu
 * @param mediaList Liste des médias avec leurs descriptions
 * @param sequences Liste des séquences avec leurs transcriptions
 * @returns Les associations média-séquence et le coût de l'opération
 */
export async function matchMediaWithSequences(
  mediaList: { id?: string, descriptions?: string[] }[],
  sequences: { id?: string, transcript?: string }[]
): Promise<{
  cost: number,
  matches: { sequence_id?: string, media_id?: string, description_index?: number }[]
}> {
  const input: MediaSequenceMatchingInput = {
    media_list: mediaList,
    sequences
  }

  try {
    const response = await mediaSequenceMatching(input) as WorkflowAIResponse<MediaSequenceMatchingOutput>;
    
    return {
      cost: response.data.cost_usd,
      matches: response.output.matched_sequences || []
    }
  } catch (error) {
    console.error('Failed to match media with sequences:', error);
    throw error;
  }
}