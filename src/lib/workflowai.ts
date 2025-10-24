// Initialize WorkflowAI Client
import { WorkflowAI } from "@workflowai/workflowai"
import { ExtractedFrame } from './ffmpeg'
import { ensureJpegUrl, convertToJpeg } from '@/src/lib/image-conversion'

const workflowAI = new WorkflowAI({
    key: process.env.WORKFLOWAI_API_KEY
})

/**
 * Helper to check if an error is related to unsupported image type
 */
function isUnsupportedImageTypeError(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || error?.toString().toLowerCase() || ''
  return errorMessage.includes('image') && 
         (errorMessage.includes('type') || 
          errorMessage.includes('format') || 
          errorMessage.includes('unsupported') ||
          errorMessage.includes('invalid'))
}

/**
 * Executes a WorkflowAI operation with automatic retry and JPEG conversion if image type error occurs
 * The operation function receives the current image URL as parameter
 */
async function executeWithImageRetry<T>(
  operation: (url: string) => Promise<T>,
  imageUrl: string,
  operationName: string
): Promise<{ result: T, convertedUrl?: string }> {
  try {
    const result = await operation(imageUrl)
    return { result }
  } catch (error) {
    console.error(`Error in ${operationName} with original image:`, error)
    
    if (isUnsupportedImageTypeError(error)) {
      console.log(`Detected unsupported image type error, converting to JPEG and retrying...`)
      try {
        const jpegUrl = await convertToJpeg(imageUrl)
        console.log(`Image converted to JPEG: ${jpegUrl}, retrying ${operationName}...`)
        const result = await operation(jpegUrl)
        return { result, convertedUrl: jpegUrl }
      } catch (retryError) {
        console.error(`Error in ${operationName} even after JPEG conversion:`, retryError)
        throw retryError
      }
    }
    
    throw error
  }
}

// Types for the image format
export interface Image {
  url?: string;
  content_type?: string;
  data?: string;
}

// Initialize Your AI agent
export interface VideoScriptKeywordExtractionInput {
  script?: string
  keyword_count ? : number
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

export interface MediaRecommendationFilterInput {
  video_script?: string
  available_media?: {
    id?: string
    descriptions?: string[]
  }[]
}

export interface MediaRecommendationFilterOutput {
  recommended_media?: string[]
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

export interface VideoScriptImageSearchInput {
  video_script?: string
  max_queries?: number
}

export interface VideoScriptImageSearchOutput {
  image_search_queries?: {
    query?: string
  }[]
}

export interface KlingAnimationPromptEnhancementInput {
  image?: Image
  basic_prompt?: string
}

export interface KlingAnimationPromptEnhancementOutput {
  enhanced_prompt?: string
}

export interface ImageStagingIdeasInput {
  image?: Image
}

export interface ImageStagingIdeasOutput {
  staging_ideas?: string[]
}

export interface WebPageContentExtractionInput {
  markdown_content?: string
}

export interface WebPageContentExtractionOutput {
  relevant_images?: string[]
}

// Types for image analysis
export interface ImageAnalysisInput {
  image_url?: Image
}

export interface ImageAnalysisOutput {
  description?: string
}

export interface VideoZoomInsertionInput {
  sequences?: {
    id?: number
    words?: {
      text?: string
      start?: number
      end?: number
      silence?: number
    }[]
  }[]
}

export interface VideoZoomInsertionOutput {
  zooms?: {
    sequence?: number
    word?: number
    type?: ("zoom-out-impact" | "zoom-in-impact" | "zoom-in-fast" | "zoom-in-instant" | "zoom-out-instant" | "zoom-out-fast" | "zoom-in-continuous" | "zoom-out-continuous")
    intent?: string
  }[]
}

export interface TextVoiceEnhancementInput {
  text?: string
}

export interface TextVoiceEnhancementOutput {
  enhancements?: {
    type?: ("tag" | "caps" | "ellipsis")
    value?: string
    word?: string
    occurrence?: number
  }[]
}

const videoScriptKeywordExtraction = workflowAI.agent<VideoScriptKeywordExtractionInput, VideoScriptKeywordExtractionOutput>({
  id: "video-script-keyword-extraction",
  schemaId: 2,
  version: "production",
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
  version: "production",
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
  schemaId: 2,
  version: process.env.NODE_ENV === 'development' ? '5.3' : 'production',
  useCache: process.env.NODE_ENV === 'development' ? 'never' : 'auto'
})

const mediaRecommendationFilter = workflowAI.agent<MediaRecommendationFilterInput, MediaRecommendationFilterOutput>({
  id: "media-recommendation-filter",
  schemaId: 1,
  version: "1.1",
  useCache: "auto"
})

const videoScriptImageSearch = workflowAI.agent<VideoScriptImageSearchInput, VideoScriptImageSearchOutput>({
  id: "video-script-image-search",
  schemaId: 2,
  version: process.env.NODE_ENV === 'development' ? '4.3' : 'production',
  useCache: "auto"
})

const klingAnimationPromptEnhancement = workflowAI.agent<KlingAnimationPromptEnhancementInput, KlingAnimationPromptEnhancementOutput>({
  id: "kling-animation-prompt-enhancement",
  schemaId: 2,
  version: process.env.NODE_ENV === 'development' ? '4.1' : 'production',
  useCache: "auto"
})

const imageStagingIdeas = workflowAI.agent<ImageStagingIdeasInput, ImageStagingIdeasOutput>({
  id: "image-staging-ideas",
  schemaId: 2,
  version: process.env.NODE_ENV === 'development' ? '5.1' : 'production',
  useCache: "auto"
})

const webPageContentExtraction = workflowAI.agent<WebPageContentExtractionInput, WebPageContentExtractionOutput>({
  id: "web-page-content-extraction",
  schemaId: 2,
  version: "production",
  useCache: "auto"
})

const videoZoomInsertion = workflowAI.agent<VideoZoomInsertionInput, VideoZoomInsertionOutput>({
  id: "video-zoom-insertion",
  schemaId: 2,
  version: "dev",
  useCache: "auto"
})

const textVoiceEnhancement = workflowAI.agent<TextVoiceEnhancementInput, TextVoiceEnhancementOutput>({
  id: "text-voice-enhancement",
  schemaId: 1,
  version: "production",
  useCache: "auto"
})

// Image analysis agent
const imageAnalysis = workflowAI.agent<ImageAnalysisInput, ImageAnalysisOutput>({
  id: "image-analysis",
  schemaId: 2,
  version: process.env.NODE_ENV === 'development' ? '2.2' : 'production',
  useCache: "auto"
})

// Avatar prompt enhancement (configurable)
export interface AvatarPromptEnhancementInput {
  basic_prompt?: string
  style?: string
}

export interface AvatarPromptEnhancementOutput {
  enhanced_prompt?: string
}

const avatarPromptEnhancement = workflowAI.agent<AvatarPromptEnhancementInput, AvatarPromptEnhancementOutput>({
  id: "text-to-image-prompt-enhancement",
  schemaId: 3,
  version: 'dev',
  useCache: 'never'
})

// Avatar identity extraction (name, gender, age, tags) from a free-form prompt
export interface AvatarIdentityExtractionInput {
  prompt?: string
}

export interface AvatarIdentityExtractionOutput {
  name?: string
  gender?: ("male" | "female" | "unknown")
  age?: string
  tags?: string[]
  place?: string
}

const avatarIdentityExtraction = workflowAI.agent<AvatarIdentityExtractionInput, AvatarIdentityExtractionOutput>({
  id: "avatar-prompt-extraction",
  schemaId: 2,
  version: 'dev',
  useCache: 'never'
})

// Image prompt information extraction (name, place, tags)
export interface LookIdentityExtractionInput {
  prompt?: string
}

export interface LookIdentityExtractionOutput {
  name?: string
  place?: string
  tags?: string[]
}

const lookIdentityExtraction = workflowAI.agent<LookIdentityExtractionInput, LookIdentityExtractionOutput>({
  id: "image-prompt-information-extraction",
  schemaId: 2,
  version: 'dev',
  useCache: 'never'
})

// Run Your AI agent
export async function videoScriptKeywordExtractionRun(scriptContent: string): Promise<{
  cost: number,
  output: VideoScriptKeywordExtractionOutput
}> {
  // Calcul du nombre de mots-clés en fonction de la longueur du script
  const calculateKeywordCount = (scriptLength: number): number => {
    // Base de 10 mots-clés
    let keywordCount = 10;
    
    // Si plus de 2000 caractères, on ajoute 5 mots-clés
    if (scriptLength > 2000) {
      keywordCount += 5;
      
      // Pour chaque 1000 caractères supplémentaires, on ajoute 5 mots-clés
      const additionalThousands = Math.floor((scriptLength - 2000) / 1000);
      keywordCount += additionalThousands * 5;
    }
    
    return keywordCount;
  };

  const input: VideoScriptKeywordExtractionInput = {
    "script": scriptContent,
    "keyword_count": calculateKeywordCount(scriptContent.length)
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
    
    if (isUnsupportedImageTypeError(error)) {
      console.log('Detected unsupported image type error, converting all images to JPEG and retrying...');
      try {
        const convertedUrls = await Promise.all(imageUrls.map(url => convertToJpeg(url)));
        console.log('Images converted to JPEG, retrying generateVideoDescription...');
        
        const convertedImages: Image[] = convertedUrls.map(url => ({ url }));
        const retryInput: VideoDescriptionGenerationInput = {
          images: convertedImages
        }
        
        const response = await videoDescriptionGeneration(retryInput) as WorkflowAIResponse<VideoDescriptionGenerationOutput>;
        
        return {
          cost: response.data.cost_usd,
          description: response.output.video_description || ""
        }
      } catch (retryError) {
        console.error('Failed to generate video description even after JPEG conversion:', retryError);
        throw retryError;
      }
    }
    
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
  mediaList: { id?: string, descriptions?: string[], needed?: boolean }[],
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

/**
 * Filtre et recommande les médias pertinents en fonction d'un script vidéo
 * @param videoScript Le script de la vidéo
 * @param availableMedia Liste des médias disponibles avec leurs descriptions
 * @returns Les médias recommandés et le coût de l'opération
 */
export async function mediaRecommendationFilterRun(
  videoScript: string,
  availableMedia: { id?: string, descriptions?: string[] }[]
): Promise<{
  cost: number,
  recommendedMedia: string[]
}> {
  const input: MediaRecommendationFilterInput = {
    video_script: videoScript,
    available_media: availableMedia
  }

  try {
    const response = await mediaRecommendationFilter(input) as WorkflowAIResponse<MediaRecommendationFilterOutput>;
    
    return {
      cost: response.data.cost_usd,
      recommendedMedia: response.output.recommended_media || []
    }
  } catch (error) {
    console.error('Failed to filter and recommend media:', error);
    throw error;
  }
}

export async function videoScriptImageSearchRun(
  scriptContent: string,
  maxQueries?: number
): Promise<{
  cost: number,
  queries: { query?: string }[]
}> {
  const input: VideoScriptImageSearchInput = {
    video_script: scriptContent,
    max_queries: maxQueries
  }

  try {
    const response = await videoScriptImageSearch(input) as WorkflowAIResponse<VideoScriptImageSearchOutput>;
    
    return {
      cost: response.data.cost_usd,
      queries: response.output.image_search_queries || []
    }
  } catch (error) {
    console.error('Failed to run video script image search:', error);
    throw error;
  }
}

/**
 * Génère un prompt d'animation Kling à partir d'une image
 * @param imageUrl URL de l'image source
 * @param basicPrompt Prompt de base pour l'animation
 * @returns Le prompt d'animation amélioré et le coût de l'opération
 */
export async function generateKlingAnimationPrompt(
  imageUrl: string,
  basicPrompt: string
): Promise<{
  cost: number,
  enhancedPrompt: string,
  convertedUrl?: string
}> {
  const { result, convertedUrl } = await executeWithImageRetry(
    async (url: string) => {
      const input: KlingAnimationPromptEnhancementInput = {
        image: {
          url: url
        },
        basic_prompt: basicPrompt
      }
      const response = await klingAnimationPromptEnhancement(input) as WorkflowAIResponse<KlingAnimationPromptEnhancementOutput>
      return response
    },
    imageUrl,
    'generateKlingAnimationPrompt'
  )
  
  return {
    cost: result.data.cost_usd,
    enhancedPrompt: result.output.enhanced_prompt || "",
    convertedUrl
  }
}

/**
 * Génère des idées de mise en scène et recommande un mouvement de caméra pour une image
 * @param imageUrl URL de l'image source
 * @returns Les idées de mise en scène, le mouvement de caméra recommandé et le coût de l'opération
 */
export async function generateImageStagingIdeas(
  imageUrl: string
): Promise<{
  cost: number,
  stagingIdeas: string[],
  convertedUrl?: string
}> {
  const { result, convertedUrl } = await executeWithImageRetry(
    async (url: string) => {
      const input: ImageStagingIdeasInput = {
        image: {
          url: url
        }
      }
      const response = await imageStagingIdeas(input) as WorkflowAIResponse<ImageStagingIdeasOutput>
      return response
    },
    imageUrl,
    'generateImageStagingIdeas'
  )
  
  return {
    cost: result.data.cost_usd,
    stagingIdeas: result.output.staging_ideas || [],
    convertedUrl
  }
}

/**
 * Extrait les images pertinentes d'un contenu markdown de page web
 * @param markdownContent Le contenu markdown de la page web
 * @returns Les URLs des images pertinentes et le coût de l'opération
 */
export async function webPageContentExtractionRun(
  markdownContent: string
): Promise<{
  cost: number,
  relevantImages: string[]
}> {
  const input: WebPageContentExtractionInput = {
    markdown_content: markdownContent
  }

  try {
    const response = await webPageContentExtraction(input) as WorkflowAIResponse<WebPageContentExtractionOutput>;
    
    return {
      cost: response.data.cost_usd,
      relevantImages: response.output.relevant_images || []
    }
  } catch (error) {
    console.error('Failed to extract web page content:', error);
    throw error;
  }
}

// Run the image analysis agent
export async function imageAnalysisRun(
  imageUrl: string
): Promise<{
  cost: number
  description: string
  safeUrl?: string
}> {
  // Convert AVIF to JPEG if needed to improve compatibility
  const initialUrl = await ensureJpegUrl(imageUrl)
  
  const { result, convertedUrl } = await executeWithImageRetry(
    async (url: string) => {
      const input: ImageAnalysisInput = {
        image_url: {
          url: url
        }
      }
      const response = await imageAnalysis(input) as WorkflowAIResponse<ImageAnalysisOutput>
      return response
    },
    initialUrl,
    'imageAnalysisRun'
  )

  const finalUrl = convertedUrl || initialUrl

  return {
    cost: result.data.cost_usd,
    description: result.output.description || "",
    safeUrl: finalUrl !== imageUrl ? finalUrl : undefined
  }
}

/**
 * Analyse les séquences vidéo et génère des recommandations de zoom pour des mots spécifiques
 * @param sequences Liste des séquences avec leurs mots et timings
 * @returns Les recommandations de zoom et le coût de l'opération
 */
export async function videoZoomInsertionRun(
  sequences: { id?: number, words?: { text?: string, start?: number, end?: number, silence?: number }[] }[]
): Promise<{
  cost: number,
  zooms: { sequence?: number, word?: number, type?: string, intent?: string }[]
}> {
  const input: VideoZoomInsertionInput = {
    sequences
  }

  try {
    const response = await videoZoomInsertion(input) as WorkflowAIResponse<VideoZoomInsertionOutput>;
    
    return {
      cost: response.data.cost_usd,
      zooms: response.output.zooms || []
    }
  } catch (error) {
    console.error('Failed to run video zoom insertion:', error);
    throw error;
  }
}

/**
 * Améliore un texte pour l'optimiser pour la génération vocale
 * @param text Le texte à améliorer
 * @returns Les améliorations suggérées et le coût de l'opération
 */
export async function textVoiceEnhancementRun(
  text: string
): Promise<{
  cost: number,
  enhancements: { type?: string, value?: string, word?: string, occurrence?: number }[]
}> {
  const input: TextVoiceEnhancementInput = {
    text
  }

  try {
    const response = await textVoiceEnhancement(input) as WorkflowAIResponse<TextVoiceEnhancementOutput>;
    
    return {
      cost: response.data.cost_usd,
      enhancements: response.output.enhancements || []
    }
  } catch (error) {
    console.error('Failed to run text voice enhancement:', error);
    throw error;
  }
}

/**
 * Améliore un prompt d'avatar en utilisant WorkflowAI
 */
export async function improveAvatarPrompt(
  basicPrompt: string,
  style?: string
): Promise<{
  cost: number,
  enhancedPrompt: string
}> {
  const input: AvatarPromptEnhancementInput = {
    basic_prompt: basicPrompt,
    style: style
  }

  try {
    const response = await avatarPromptEnhancement(input) as WorkflowAIResponse<AvatarPromptEnhancementOutput>
    return {
      cost: response.data.cost_usd,
      enhancedPrompt: response.output.enhanced_prompt || basicPrompt
    }
  } catch (error) {
    console.error('Failed to improve avatar prompt:', error)
    throw error
  }
}

/**
 * Extrait l'identité d'un avatar (name, gender, age, tags) depuis un prompt libre
 */
export async function extractAvatarIdentityFromPrompt(
  prompt: string
): Promise<{
  cost: number,
  name?: string,
  gender?: 'male' | 'female',
  age?: string,
  tags?: string[]
  place?: string
}> {
  const input: AvatarIdentityExtractionInput = { prompt }

  try {
    const response = await avatarIdentityExtraction(input) as WorkflowAIResponse<AvatarIdentityExtractionOutput>
    // Normalisation minimale
    const rawGender = (response.output.gender || 'unknown').toLowerCase()
    const gender = rawGender === 'male' || rawGender === 'm' ? 'male' : rawGender === 'female' || rawGender === 'f' ? 'female' : undefined

    return {
      cost: response.data.cost_usd,
      name: response.output.name,
      gender,
      age: response.output.age,
      tags: Array.isArray(response.output.tags) ? response.output.tags.filter(Boolean) as string[] : undefined,
      place: response.output.place
    }
  } catch (error) {
    console.error('Failed to extract avatar identity:', error)
    // En cas d'échec, retourner des valeurs neutres pour ne pas bloquer la création
    return {
      cost: 0,
      tags: []
    }
  }
}

/**
 * Extrait name, place et tags depuis un prompt d'image amélioré
 */
export async function extractLookIdentityInfo(
  prompt: string
): Promise<{
  cost: number,
  name?: string,
  place?: string,
  tags?: string[]
}> {
  const input: LookIdentityExtractionInput = { prompt }

  try {
    const response = await lookIdentityExtraction(input) as WorkflowAIResponse<LookIdentityExtractionOutput>
    return {
      cost: response.data.cost_usd,
      name: response.output.name,
      place: response.output.place,
      tags: Array.isArray(response.output.tags) ? response.output.tags.filter(Boolean) as string[] : undefined
    }
  } catch (error) {
    console.error('Failed to extract image prompt info:', error)
    return { cost: 0 }
  }
}