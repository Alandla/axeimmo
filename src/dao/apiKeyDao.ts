import SpaceModel from '../models/Space';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { executeWithRetry } from '../lib/db';

export interface IApiKey {
  _id?: string;
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
      const space = await SpaceModel.findById(spaceId);
      if (!space) {
        throw new Error('Space not found');
      }

      const { apiKeyData, plainKey } = createApiKeyData(undefined, name);

      // Initialiser apiKeys si ce champ n'existe pas, puis ajouter la nouvelle clé
      const updatedSpace = await SpaceModel.findByIdAndUpdate(
        spaceId,
        [
          {
            $set: {
              apiKeys: {
                $cond: {
                  if: { $isArray: "$apiKeys" },
                  then: { $concatArrays: ["$apiKeys", [apiKeyData]] },
                  else: [apiKeyData]
                }
              }
            }
          }
        ],
        { new: true }
      );
      
      if (!updatedSpace) {
        throw new Error('Failed to create API key');
      }
      
      // Récupérer la clé créée (la dernière ajoutée)
      const createdApiKey = updatedSpace.apiKeys[updatedSpace.apiKeys.length - 1];
      
      return { apiKey: createdApiKey, plainKey };
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
        'apiKeys.keyHash': keyHash, 
        'apiKeys.isActive': true 
      });
      
      if (!space || !space.apiKeys) {
        return null;
      }
      
      const apiKey = space.apiKeys.find((key: any) => key.keyHash === keyHash && key.isActive);
      
      if (!apiKey) {
        return null;
      }
      
      return {
        space: space.toJSON(),
        apiKey
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
        'apiKeys.isActive': true,
        'apiKeys.keyPrefix': keyPrefix,
        'apiKeys.keyHash': { $exists: true }
      });
      
      // Si aucun space trouvé avec ce préfixe, la clé n'est pas valide
      if (!space || !space.apiKeys) {
        return null;
      }
      
      // Chercher la clé correspondante dans le tableau
      const apiKey = space.apiKeys.find((key: any) => 
        key.keyPrefix === keyPrefix && key.isActive && bcrypt.compareSync(plainKey, key.keyHash)
      );
      
      if (!apiKey) {
        return null;
      }
      
      // Mettre à jour la date de dernière utilisation
      await SpaceModel.findOneAndUpdate(
        { _id: space._id, 'apiKeys._id': apiKey._id },
        { $set: { 'apiKeys.$.lastUsedAt': new Date() } }
      );
      
      return {
        space: space.toJSON(),
        apiKey
      };
    });
  } catch (error) {
    console.error("Error while validating API key: ", error);
    throw error;
  }
}

/**
 * Récupérer toutes les clés API d'un space
 */
export async function getApiKeysBySpaceId(spaceId: string): Promise<IApiKey[]> {
  try {
    return await executeWithRetry(async () => {
      const space = await SpaceModel.findById(spaceId);
      
      if (!space) {
        return [];
      }
      
      // Si apiKeys n'existe pas, retourner un tableau vide
      if (!space.apiKeys || !Array.isArray(space.apiKeys)) {
                return [];
      }
      
      return space.apiKeys.filter((key: any) => key.isActive);
    });
  } catch (error) {
    console.error("Error while getting API keys by space ID: ", error);
    throw error;
  }
}

/**
 * Récupérer une clé API spécifique d'un space
 */
export async function getApiKeyById(spaceId: string, keyId: string): Promise<IApiKey | null> {
  try {
    return await executeWithRetry(async () => {
      const space = await SpaceModel.findById(spaceId);
      
      if (!space || !space.apiKeys || !Array.isArray(space.apiKeys)) {
        return null;
      }
      
      const apiKey = space.apiKeys.find((key: any) => key._id.toString() === keyId && key.isActive);
      
      return apiKey || null;
    });
  } catch (error) {
    console.error("Error while getting API key by ID: ", error);
    throw error;
  }
}

/**
 * Fonction de compatibilité - récupère la première clé API active d'un space
 * @deprecated Utiliser getApiKeysBySpaceId pour récupérer toutes les clés
 */
export async function getApiKeyBySpaceId(spaceId: string): Promise<IApiKey | null> {
  try {
    const apiKeys = await getApiKeysBySpaceId(spaceId);
    return apiKeys.length > 0 ? apiKeys[0] : null;
  } catch (error) {
    console.error("Error while getting API key by space ID: ", error);
    throw error;
  }
}

/**
 * Révoquer une clé API spécifique
 */
export async function revokeApiKey(spaceId: string, keyId: string): Promise<boolean> {
  try {
    return await executeWithRetry(async () => {
      const result = await SpaceModel.findOneAndUpdate(
        { _id: spaceId, 'apiKeys._id': keyId },
        { 
          $set: {
            'apiKeys.$.isActive': false, 
            'apiKeys.$.revokedAt': new Date()
          }
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
 * Régénérer une clé API spécifique
 */
export async function regenerateApiKey(spaceId: string, keyId: string): Promise<{ apiKey: IApiKey; plainKey: string }> {
  try {
    return await executeWithRetry(async () => {
      const space = await SpaceModel.findById(spaceId);
      if (!space) {
        throw new Error('Space not found');
      }

      const existingKey = space.apiKeys?.find((key: any) => key._id.toString() === keyId);
      if (!existingKey) {
        throw new Error('API key not found');
      }

      const { apiKeyData, plainKey } = createApiKeyData(existingKey.name);

      // Mettre à jour la clé spécifique
      const result = await SpaceModel.findOneAndUpdate(
        { _id: spaceId, 'apiKeys._id': keyId },
        { 
          $set: {
            'apiKeys.$.keyHash': apiKeyData.keyHash,
            'apiKeys.$.keyPrefix': apiKeyData.keyPrefix,
            'apiKeys.$.createdAt': apiKeyData.createdAt,
            'apiKeys.$.lastUsedAt': undefined,
            'apiKeys.$.revokedAt': undefined
          }
        },
        { new: true }
      );
      
      if (!result) {
        throw new Error('Failed to regenerate API key');
      }
      
      const updatedKey = result.apiKeys.find((key: any) => key._id.toString() === keyId);
      
      return { apiKey: updatedKey, plainKey };
    });
  } catch (error) {
    console.error("Error while regenerating API key: ", error);
    throw error;
  }
}