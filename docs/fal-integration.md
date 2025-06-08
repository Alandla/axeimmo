# Intégration Fal.ai - Kling 2.1

## Configuration

Pour utiliser la génération vidéo avec Kling 2.1, vous devez ajouter votre clé API Fal.ai :

```bash
# Dans votre fichier .env
FAL_KEY=your_fal_api_key_here
```

### Mode Test

En développement, vous pouvez activer un mode test pour éviter de consommer l'API Fal.ai (et économiser des coûts) :

1. Ce mode simulera tout le processus de génération vidéo :
   - Retourne toujours le même ID de requête : `a07e8111-d339-4b5c-8563-9887bb4bd146`
   - Simule une file d'attente pendant 10 secondes
   - Simule une génération en cours pendant 10 secondes supplémentaires
   - Retourne une URL de vidéo factice après 20 secondes
2. Le mode test n'est actif qu'en environnement de développement (`NODE_ENV=development`)

## Fonctionnalités

### 1. Modes de génération vidéo avec Kling 2.1

L'application prend maintenant en charge trois modes de génération vidéo via l'API Fal.ai :

```typescript
export enum KlingGenerationMode {
  STANDARD = 'standard',  // Version économique
  PRO = 'pro',           // Version haute qualité  
  MASTER = 'master'      // Version premium (si disponible)
}
```

Chaque mode utilise un endpoint spécifique :
- **Standard** : `fal-ai/kling-video/v2.1/standard/image-to-video`
- **Pro** : `fal-ai/kling-video/v2.1/pro/image-to-video`  
- **Master** : `fal-ai/kling-video/v2.1/master/image-to-video`

### 2. Flux de génération

1. **Démarrage** : Quand un utilisateur demande une génération vidéo
   - Génération du prompt amélioré avec WorkflowAI
   - Soumission de la requête à Fal.ai avec le mode choisi
   - Enregistrement du `requestId` et du `generationMode` dans la base de données

2. **Suivi** : Polling automatique pour vérifier l'état
   - Vérification du statut toutes les 10 secondes
   - Utilisation du mode stocké pour appeler le bon endpoint
   - Mise à jour automatique une fois la génération terminée

3. **Finalisation** : Récupération du résultat
   - Mise à jour du média avec l'URL de la vidéo générée
   - Analyse automatique pour générer une description

### 3. Structure des données

Le modèle `Media` a été étendu avec :
```typescript
interface IMedia {
  // ... autres champs existants
  requestId?: string; // ID de la requête Fal.ai
  generationMode?: KlingGenerationMode; // Mode de génération utilisé
  generationStatus?: GenerationStatus;
}
```

### 4. Routes API

#### `/api/media/enhance`
- **Modifiée** : Utilise maintenant la méthode générique `startKlingVideoGeneration`
- **Paramètre** : `mode` (KlingGenerationMode) pour choisir le mode de génération
- **Rétrocompatibilité** : L'ancien paramètre `isPro` est remplacé par `mode`

#### `/api/media/check-generation`
- **Fonction** : Vérifier l'état des requêtes Fal.ai en cours
- **Amélioration** : Utilise automatiquement le mode stocké dans le média
- **Paramètres** : `mediaSpace`, `spaceId`
- **Retour** : Statut de la génération et données mises à jour si terminée

### 5. API Fal.ai

#### Méthode principale
```typescript
// Nouvelle méthode générique
startKlingVideoGeneration(request: KlingRequest, mode: KlingGenerationMode)

// Méthodes dépréciées (maintenues pour compatibilité)
startKlingVideoStandard(request: KlingRequest)
startKlingVideoPro(request: KlingRequest)
```

#### Vérification et récupération
```typescript
// Utilise automatiquement le bon endpoint selon le mode
checkKlingRequestStatus(requestId: string, mode: KlingGenerationMode)
getKlingRequestResult(requestId: string, mode: KlingGenerationMode)
```

### 6. Polling côté client

Le système de polling a été divisé en deux :

1. **Polling legacy** : Pour les médias sans `requestId` (anciennes générations)
   - Intervalle : 1-5 secondes selon le type
   - Durée : 5 minutes maximum

2. **Polling Fal.ai** : Pour les médias avec `requestId`
   - Intervalle : 10 secondes
   - Durée : Jusqu'à completion
   - Gestion automatique du mode de génération

## Types de génération supportés

- **Image vers Vidéo** : Conversion d'images statiques en vidéos animées
- **Durées** : 5 ou 10 secondes
- **Formats** : 16:9, 9:16, 1:1
- **Qualité** : HD (1920x1080)

## Gestion d'erreurs

Le système gère automatiquement :
- **Timeouts** : Si une requête prend trop de temps
- **Échecs de génération** : Marquage du média comme "failed"
- **Erreurs réseau** : Retry automatique sur les vérifications de statut
- **Modes invalides** : Validation des modes de génération

## Coûts par mode

- **Standard** : Plus économique, génération plus lente
- **Pro** : Prix moyen, génération plus rapide et qualité supérieure
- **Master** : Plus cher, qualité premium (si disponible)

La facturation est gérée directement par Fal.ai selon l'utilisation et le mode choisi. 