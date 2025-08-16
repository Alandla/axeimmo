import SpaceModel from '../models/Space';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { executeWithRetry } from '../lib/db';

export interface IApiKey {
  keyHash: string;
  keyPrefix: string;
  name?: string;
  lastUsedAt?: Date;
  permissions: string[];
  isActive: boolean;
  revokedAt?: Date;
  rateLimitPerMinute: number;
  createdAt?: Date;
}

/**
 * Génère une nouvelle clé API sécurisée
 */
export function generateApiKey(environment: 'live' | 'test' = 'live'): { apiKey: string; keyHash: string; keyPrefix: string } {
  // Générer une clé aléatoire de 32 bytes (64 caractères hex)
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const prefix = environment === 'live' ? 'hx_live_' : 'hx_test_';
  const apiKey = `${prefix}${randomBytes}`;
  
  // Hasher la clé complète pour le stockage
  const keyHash = bcrypt.hashSync(apiKey, 12);
  
  // Préfixe pour l'affichage (premiers 12 caractères)
  const keyPrefix = apiKey.substring(0, 12);
  
  return { apiKey, keyHash, keyPrefix };
}

/**
 * Fonction helper pour créer les données d'une clé API
 */
function createApiKeyData(existingName?: string, customName?: string): { apiKeyData: any; plainKey: string } {
  const { apiKey: plainKey, keyHash, keyPrefix } = generateApiKey('live');
  
  const apiKeyData = {
    keyHash,
    keyPrefix,
    name: customName || existingName || 'API Key',
    permissions: ['video:generate', 'video:export', 'resources:read'],
    isActive: true,
    rateLimitPerMinute: 100,
    createdAt: new Date()
  };

  return { apiKeyData, plainKey };
}

/**
 * Créer une nouvelle clé API pour un space
 */
export async function createApiKey(spaceId: string, name?: string): Promise<{ apiKey: IApiKey; plainKey: string }> {
  try {
    return await executeWithRetry(async () => {
      // Vérifier qu'il n'y a pas déjà une clé pour ce space
      const space = await SpaceModel.findById(spaceId);
      if (!space) {
        throw new Error('Space not found');
      }

      console.log('space.apiKey', space.apiKey);
      console.log('space.apiKey.isActive', space.apiKey.isActive);
      
      if (space.apiKey && space.apiKey.isActive) {
        throw new Error('API key already exists for this space');
      }

      const { apiKeyData, plainKey } = createApiKeyData(undefined, name);

      // Mettre à jour le space avec la nouvelle clé API
      const updatedSpace = await SpaceModel.findByIdAndUpdate(
        spaceId,
        { apiKey: apiKeyData },
        { new: true }
      );
      
      if (!updatedSpace) {
        throw new Error('Failed to create API key');
      }
      
      return { apiKey: updatedSpace.apiKey!, plainKey };
    });
  } catch (error) {
    console.error("Error while creating API key: ", error);
    throw error;
  }
}

/**
 * Récupérer une clé API par son hash
 */
export async function getApiKeyByHash(keyHash: string): Promise<{ space: any; apiKey: IApiKey } | null> {
  try {
    return await executeWithRetry(async () => {
      const space = await SpaceModel.findOne({ 
        'apiKey.keyHash': keyHash, 
        'apiKey.isActive': true 
      });
      
      if (!space || !space.apiKey) {
        return null;
      }
      
      return {
        space: space.toJSON(),
        apiKey: space.apiKey
      };
    });
  } catch (error) {
    console.error("Error while getting API key by hash: ", error);
    throw error;
  }
}

/**
 * Valider une clé API et retourner les informations du space
 * OPTIMISÉ : Utilise le préfixe de la clé pour limiter la recherche
 */
export async function validateApiKey(plainKey: string): Promise<{ space: any; apiKey: IApiKey } | null> {
  try {
    return await executeWithRetry(async () => {
      if (!plainKey || !plainKey.startsWith('hx_')) {
        return null;
      }

      // Extraire le préfixe (premiers 12 caractères) pour optimiser la recherche
      const keyPrefix = plainKey.substring(0, 12);
      
      // Recherche optimisée : on trouve d'abord les spaces avec ce préfixe
      const space = await SpaceModel.findOne({ 
        'apiKey.isActive': true,
        'apiKey.keyPrefix': keyPrefix,
        'apiKey.keyHash': { $exists: true }
      });
      
      // Si aucun space trouvé avec ce préfixe, la clé n'est pas valide
      if (!space || !space.apiKey) {
        return null;
      }
      
      // Vérifier le hash complet seulement pour ce space
      if (bcrypt.compareSync(plainKey, space.apiKey.keyHash)) {
        // Mettre à jour la date de dernière utilisation
        await SpaceModel.findByIdAndUpdate(space._id, { 
          'apiKey.lastUsedAt': new Date() 
        });
        
        return {
          space: space.toJSON(),
          apiKey: space.apiKey
        };
      }
      
      return null;
    });
  } catch (error) {
    console.error("Error while validating API key: ", error);
    throw error;
  }
}

/**
 * Récupérer la clé API d'un space
 */
export async function getApiKeyBySpaceId(spaceId: string): Promise<IApiKey | null> {
  try {
    return await executeWithRetry(async () => {
      const space = await SpaceModel.findById(spaceId);
      
      if (!space || !space.apiKey || !space.apiKey.isActive) {
        return null;
      }
      
      return space.apiKey;
    });
  } catch (error) {
    console.error("Error while getting API key by space ID: ", error);
    throw error;
  }
}

/**
 * Révoquer une clé API
 */
export async function revokeApiKey(spaceId: string): Promise<boolean> {
  try {
    return await executeWithRetry(async () => {
      const result = await SpaceModel.findByIdAndUpdate(
        spaceId,
        { 
          'apiKey.isActive': false, 
          'apiKey.revokedAt': new Date() 
        }
      );
      
      return !!result;
    });
  } catch (error) {
    console.error("Error while revoking API key: ", error);
    throw error;
  }
}

/**
 * Régénérer une clé API
 */
export async function regenerateApiKey(spaceId: string): Promise<{ apiKey: IApiKey; plainKey: string }> {
  try {
    return await executeWithRetry(async () => {
      const space = await SpaceModel.findById(spaceId);
      if (!space) {
        throw new Error('Space not found');
      }

      const { apiKeyData, plainKey } = createApiKeyData(space.apiKey?.name);

      // Mettre à jour le space avec la nouvelle clé API
      const updatedSpace = await SpaceModel.findByIdAndUpdate(
        spaceId,
        { apiKey: apiKeyData },
        { new: true }
      );
      
      if (!updatedSpace) {
        throw new Error('Failed to regenerate API key');
      }
      
      return { apiKey: updatedSpace.apiKey!, plainKey };
    });
  } catch (error) {
    console.error("Error while regenerating API key: ", error);
    throw error;
  }
}