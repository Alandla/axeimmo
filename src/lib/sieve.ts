import axios from 'axios';
import { logger } from "@trigger.dev/sdk/v3";

const SIEVE_API_URL = 'https://mango.sievedata.com/v2';

export interface SieveCostResponse {
    cost: number;
    currency: string;
    details?: {
        compute_cost?: number;
        storage_cost?: number;
        network_cost?: number;
    }
}

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

export const createSieveTranscription = async (audioUrl: string, text?: string) => {
    try {
        const data = {
            function: "sieve/transcribe",
            inputs: {
                file: { url: audioUrl },
                backend: "stable-ts-whisper-large-v3",
                word_level_timestamps: true,
                diarization_backend: "None",
                min_speakers: -1,
                max_speakers: -1,
                custom_vocabulary: {},
                translation_backend: "None",
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
