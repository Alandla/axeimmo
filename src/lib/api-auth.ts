import { NextRequest } from 'next/server';
import { validateApiKey } from '../dao/apiKeyDao';
import { PlanName } from '../types/enums';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const API_ERROR_CODES = {
  INVALID_API_KEY: 'invalid_api_key',
  INSUFFICIENT_CREDITS: 'insufficient_credits',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INVALID_VOICE_ID: 'invalid_voice_id',
  INVALID_AVATAR_ID: 'invalid_avatar_id',
  JOB_NOT_FOUND: 'job_not_found',
  UNAUTHORIZED_JOB: 'unauthorized_job',
  PLAN_REQUIRED: 'plan_required',
  MISSING_CONTENT: 'missing_content',
  MISSING_VOICE: 'missing_voice',
  INVALID_FORMAT: 'invalid_format',
  INVALID_ANIMATE_MODE: 'invalid_animate_mode',
  INVALID_MEDIA_URL: 'invalid_media_url',
  INVALID_VOICE_URL: 'invalid_voice_url',
  INVALID_AVATAR_URL: 'invalid_avatar_url',
  INTERNAL_ERROR: 'internal_error'
};

/**
 * Authentifier une requête API avec clé API
 */
export async function authenticateApiKey(request: NextRequest): Promise<{ space: any; apiKey: any }> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    throw new ApiError('Missing Authorization header', 401, API_ERROR_CODES.INVALID_API_KEY);
  }

  const apiKey = authHeader.replace('Bearer ', '').trim();
  
  if (!apiKey || !apiKey.startsWith('hx_')) {
    throw new ApiError('Invalid API key format', 401, API_ERROR_CODES.INVALID_API_KEY);
  }

  const result = await validateApiKey(apiKey);
  
  if (!result) {
    throw new ApiError('Invalid API key', 401, API_ERROR_CODES.INVALID_API_KEY);
  }

  const { space, apiKey: apiKeyData } = result;

  // Vérifier que le space a un plan Entreprise
  if (space.plan?.name !== PlanName.ENTREPRISE) {
    throw new ApiError('Enterprise plan required for API access', 403, API_ERROR_CODES.PLAN_REQUIRED);
  }

  return { 
    space, 
    apiKey: {
      ...apiKeyData,
      keyMasked: apiKey.substring(0, 12) + '...'
    }
  };
}

/**
 * Vérifier les permissions d'une clé API
 */
export function checkPermission(apiKey: any, permission: string): boolean {
  return apiKey.permissions.includes(permission);
}

/**
 * Valider une URL
 */
export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}