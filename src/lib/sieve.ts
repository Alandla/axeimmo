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

export const analyzeMediaWithSieve = async (mediaUrl: string) => {
    try {
        const data = {
            function: "sieve/visual-qa",
            inputs: {
                file: { url: mediaUrl },
                backend: "gemini-1.5-flash",
                prompt: "Give me a description of what you see in the video",
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

const handleAnalysisRetry = async (mediaUrl: string, retryCount: number): Promise<string | null> => {
    const MAX_RETRIES = 3;
    
    if (retryCount >= MAX_RETRIES) {
        throw new Error('Échec de l\'analyse après plusieurs tentatives');
    }

    logger.warn(`Analyse échouée, nouvelle tentative ${retryCount + 1}/${MAX_RETRIES}...`);
    const newJobId = await analyzeMediaWithSieve(mediaUrl);
    return getAnalysisResult(newJobId, retryCount + 1, mediaUrl);
}

export const getAnalysisResult = async (jobId: string, retryCount = 0, mediaUrl: string): Promise<string | null> => {
    try {
        const response = await axios.get(`${SIEVE_API_URL}/jobs/${jobId}/await`, {
            headers: {
                'X-API-Key': process.env.SIEVE_API_KEY
            }
        });

        const data = response.data as SieveJobResponse;

        if (data.status === 'error') {
            return handleAnalysisRetry(mediaUrl, retryCount);
        }

        if (data.status === 'finished' && data.outputs && data.outputs.length > 0) {
            return data.outputs[0].data;
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
