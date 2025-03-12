import axios from 'axios';
import { logger } from "@trigger.dev/sdk/v3";


const SIEVE_API_URL = 'https://mango.sievedata.com/v2';

interface SieveJobResponse {
    id: string;
    status: string;
    outputs?: Array<{
        data: string;
    }>;
    error?: string;
}

export interface SieveCostResponse {
    cost: number;
    currency: string;
    details?: {
        compute_cost?: number;
        storage_cost?: number;
        network_cost?: number;
    }
}

// Nouvelle interface pour les résultats de transcription Sieve
export interface SieveTranscriptionResult {
    text: string;
    segments: Array<{
        start: number;
        end: number;
        text: string;
        words: Array<{
            word: string;
            start: number;
            end: number;
            confidence: number;
        }>;
    }>;
}

// Nouvelle fonction pour créer une transcription avec Sieve
export const createSieveTranscription = async (audioUrl: string, text?: string) => {
    try {
        const data = {
            function: "sieve/transcribe",
            inputs: {
                file: { url: audioUrl },
                backend: "stable-ts-whisper-large-v3",
                word_level_timestamps: true,
                source_language: "auto",
                diarization_backend: "None",
                min_speakers: -1,
                max_speakers: -1,
                custom_vocabulary: {},
                translation_backend: "None",
                target_language: "",
                segmentation_backend: 'none',
                min_segment_length: -1,
                min_silence_length: 0.4,
                vad_threshold: 0.2,
                pyannote_segmentation_threshold: 0.8,
                denoise_backend: "None",
                initial_prompt: text || ""
            }
        };

        const response = await axios.post(`${SIEVE_API_URL}/push`, data, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': process.env.SIEVE_API_KEY
            }
        });

        return response.data.id;
    } catch (error: any) {
        logger.error('Error creating transcription:', error.response?.data || error.message);
        throw error;
    }
}

// Fonction optimisée pour attendre le résultat d'une transcription
export const pollSieveTranscriptionStatus = async (jobId: string): Promise<any> => {
    try {
        
        const response = await axios.get(`${SIEVE_API_URL}/jobs/${jobId}/await`, {
            headers: {
                'X-API-Key': process.env.SIEVE_API_KEY
            }
        });

        const data = response.data;
        
        if (data.status === 'error') {
            logger.error('Transcription job failed', { jobId, error: data.error });
            throw new Error(`Transcription job failed: ${data.error}`);
        }

        if (data.status === 'finished' && data.outputs && data.outputs.length > 0) {
            logger.info('Transcription completed successfully', { jobId });
            const transcriptionResult = data.outputs[0].data;
            
            // Adapter le format de retour pour qu'il soit compatible avec le reste du code
            return {
                status: 'done',
                result: transcriptionResult,
            };
        }

        throw new Error(`Unexpected response status: ${data.status}`);
    } catch (error: any) {
        logger.error(`Error while getting transcription result: ${error.message || error}`);
        throw error;
    }
};

export const analyzeSimpleVideoWithSieve = async (mediaUrl: string) => {
    try {
        const data = {
            function: "sieve/visual-qa",
            inputs: {
                file: { url: mediaUrl },
                backend: "gemini-1.5-flash",
                prompt: "Give me a description of what you see",
                fps: 1,
                audio_context: false,
                start_time: 0,
                end_time: 4,
                crop_coordinates: "-1, -1, -1, -1"
            }
        };

        const response = await axios.post(`${SIEVE_API_URL}/push`, data, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': process.env.SIEVE_API_KEY
            }
        });

        return response.data.id;
    } catch (error: any) {
        logger.error('Error analyzing media:', error.response?.data || error.message);
        throw error;
    }
}

export const analyzeVideoWithSieve = async (mediaUrl: string) => {
    try {
        const data = {
            function: "sieve/visual-qa",
            inputs: {
                file: { url: mediaUrl },
                backend: "gemini-1.5-flash",
                prompt: "Analyze this video by identifying distinct sequences based on significant changes in action or context. A sequence is defined as a continuous period in which the same main action or situation takes place. Do not create new sequences for minor changes or subtle camera movements." +
                        "" +
                        "For each sequence identified, provide :"+
                        "" +
                        "Start timestamp" +
                        "A precise description of the main action" +
                        "" +
                        "Important rules :" +
                        "" +    
                        "A new sequence should be created only when there is a significant change of action or scene." +
                        "Sequences must be at least 2 seconds long." +
                        "Ignores micro-changes that do not modify the main action" +
                        "Merges similar or continuous actions into a single sequence",
                fps: 1,
                function_json: {
                    "type": "list",
                    "items": {
                      "text": "description of the sequence",
                      "start": "The start of the sequence in second",
                      "duration": "Duration fo the sequence"
                    }
                },
                audio_context: false,
                start_time: 0,
                end_time: -1,
                crop_coordinates: "-1, -1, -1, -1"
            }
        };

        const response = await axios.post(`${SIEVE_API_URL}/push`, data, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': process.env.SIEVE_API_KEY
            }
        });

        return response.data.id;
    } catch (error: any) {
        logger.error('Error analyzing media:', error.response?.data || error.message);
        throw error;
    }
}

const handleAnalysisRetry = async (
    mediaUrl: string, 
    retryCount: number,
    isDetailedAnalysis: boolean
): Promise<string | null> => {
    const MAX_RETRIES = 3;
    
    if (retryCount >= MAX_RETRIES) {
        throw new Error('Échec de l\'analyse après plusieurs tentatives');
    }

    logger.warn(`Analyse échouée, nouvelle tentative ${retryCount + 1}/${MAX_RETRIES}...`);
    const analyzeFunction = isDetailedAnalysis ? analyzeVideoWithSieve : analyzeSimpleVideoWithSieve;
    const newJobId = await analyzeFunction(mediaUrl);
    return getAnalysisResult(newJobId, retryCount + 1, mediaUrl, isDetailedAnalysis);
}

export const getAnalysisResult = async (
    jobId: string, 
    retryCount = 0, 
    mediaUrl: string,
    isDetailedAnalysis = false
): Promise<any> => {
    try {
        const response = await axios.get(`${SIEVE_API_URL}/jobs/${jobId}/await`, {
            headers: {
                'X-API-Key': process.env.SIEVE_API_KEY
            }
        });

        const data = response.data;
        let responseData = data.outputs[0].data;

        if (!isDetailedAnalysis) {
            responseData = [{
                start: 0,
                text: responseData
            }]
        }

        if (data.status === 'error') {
            return handleAnalysisRetry(mediaUrl, retryCount, isDetailedAnalysis);
        }

        if (data.status === 'finished' && data.outputs && data.outputs.length > 0) {
            return responseData;
        }

        return null;
    } catch (error: any) {
        logger.error('Erreur lors de la récupération du résultat:', error.response?.data || error.message);
        throw error;
    }
}

export const getJobCost = async (jobId: string): Promise<SieveCostResponse> => {
    try {
        const response = await axios.get(`${SIEVE_API_URL}/usage/job/${jobId}`, {
            headers: {
                'X-API-Key': process.env.SIEVE_API_KEY
            }
        });

        logger.log('Sieve job cost response', { response: response.data })

        if (response.status !== 200) {
            throw new Error(`Sieve API returned status code ${response.status}`);
        }

        return response.data;
    } catch (error: any) {
        logger.error('Error getting job cost:', error.response?.data || error.message);
        throw error;
    }
}
