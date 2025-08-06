import { Redis } from 'ioredis';
import { ApiError, API_ERROR_CODES } from './api-auth';

// Configuration Redis
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

/**
 * Vérifier et appliquer le rate limiting
 */
export async function checkRateLimit(
  spaceId: string, 
  limit: number = 100, 
  windowMs: number = 60000 // 1 minute par défaut
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const key = `rate_limit:${spaceId}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    // Utiliser une pipeline Redis pour les opérations atomiques
    const pipeline = redis.pipeline();
    
    // Supprimer les entrées expirées
    pipeline.zremrangebyscore(key, '-inf', windowStart);
    
    // Ajouter la requête actuelle
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    
    // Compter les requêtes dans la fenêtre
    pipeline.zcard(key);
    
    // Définir l'expiration de la clé
    pipeline.expire(key, Math.ceil(windowMs / 1000));
    
    const results = await pipeline.exec();
    
    if (!results) {
      throw new Error('Redis pipeline failed');
    }

    const count = results[2][1] as number;
    const remaining = Math.max(0, limit - count);
    const resetTime = now + windowMs;

    if (count > limit) {
      // Supprimer la requête actuelle car elle dépasse la limite
      await redis.zrem(key, `${now}-${Math.random()}`);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime
      };
    }

    return {
      allowed: true,
      remaining,
      resetTime
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // En cas d'erreur Redis, on autorise la requête pour ne pas bloquer l'API
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: now + windowMs
    };
  }
}

/**
 * Middleware de rate limiting pour les routes API
 */
export async function applyRateLimit(spaceId: string, limit: number = 100): Promise<{
  remaining: number;
  resetTime: number;
}> {
  const result = await checkRateLimit(spaceId, limit);
  
  if (!result.allowed) {
    throw new ApiError(
      `Rate limit exceeded. Maximum ${limit} requests per minute.`,
      429,
      API_ERROR_CODES.RATE_LIMIT_EXCEEDED
    );
  }
  
  return {
    remaining: result.remaining,
    resetTime: result.resetTime
  };
}

/**
 * Obtenir les headers de rate limiting
 */
export function getRateLimitHeaders(remaining: number, resetTime: number, limit: number = 100) {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
  };
}