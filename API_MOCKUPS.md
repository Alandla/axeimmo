# API v1 Public - Exemples de Réponses

Ce document contient des exemples de réponses pour toutes les APIs publiques v1 de Hoox afin d'aider nos clients dans l'intégration.

## Authentication

Toutes les APIs nécessitent un header d'authentification :
```
Authorization: Bearer YOUR_API_KEY
```

## Rate Limiting

Toutes les réponses incluent des headers de rate limiting :
```
X-RateLimit-Remaining: 98
X-RateLimit-Reset: 1704067200
X-RateLimit-Limit: 100
```

---

## 1. Resources - Voix Disponibles

### `GET /api/public/v1/resources/voices`

**Paramètres optionnels :**
- `language` : Filtrer par langue (ex: "en", "fr")
- `gender` : Filtrer par genre ("male", "female")
- `tags` : Filtrer par tags séparés par virgules

**Exemple sans paramètres :**
`GET /api/public/v1/resources/voices`

**Exemple avec paramètres :**
`GET /api/public/v1/resources/voices?language=fr&gender=female`

**Exemple de réponse sans paramètres (200 OK) :**
```json
{
  "voices": [
    {
      "id": "voice_1234567890",
      "name": "Emma",
      "language": "en",
      "accent": "US",
      "gender": "female",
      "tags": ["professional", "warm", "corporate"],
      "preview": "https://storage.hoox.ai/voices/emma_preview.mp3"
    },
    {
      "id": "voice_0987654321",
      "name": "Jean",
      "language": "fr",
      "accent": "FR",
      "gender": "male",
      "tags": ["energetic", "young", "marketing"],
      "preview": "https://storage.hoox.ai/voices/jean_preview.mp3"
    },
    {
      "id": "voice_marie_fr",
      "name": "Marie",
      "language": "fr",
      "accent": "FR",
      "gender": "female",
      "tags": ["professional", "news", "clear"],
      "preview": "https://storage.hoox.ai/voices/marie_preview.mp3"
    },
    {
      "id": "voice_custom_001",
      "name": "Sarah Custom",
      "language": "en",
      "accent": "UK",
      "gender": "female",
      "tags": ["custom", "elegant", "premium"],
      "preview": "https://storage.hoox.ai/voices/sarah_custom_preview.mp3"
    }
  ]
}
```

**Exemple de réponse avec paramètres `?language=fr&gender=female` (200 OK) :**
```json
{
  "voices": [
    {
      "id": "voice_marie_fr",
      "name": "Marie",
      "language": "fr",
      "accent": "FR",
      "gender": "female",
      "tags": ["professional", "news", "clear"],
      "preview": "https://storage.hoox.ai/voices/marie_preview.mp3"
    }
  ]
}
```

---

## 2. Resources - Avatars Disponibles

### `GET /api/public/v1/resources/avatars`

**Paramètres optionnels :**
- `gender` : Filtrer par genre ("male", "female")
- `tags` : Filtrer par tags séparés par virgules

**Exemple sans paramètres :**
`GET /api/public/v1/resources/avatars`

**Exemple avec paramètres :**
`GET /api/public/v1/resources/avatars?gender=male&tags=professional,business`

**Exemple de réponse sans paramètres (200 OK) :**
```json
{
  "avatars": [
    {
      "id": "avatar_alex_casual",
      "name": "Alex - Casual",
      "gender": "male",
      "tags": ["casual", "friendly", "young"],
      "preview": "https://storage.hoox.ai/avatars/alex_casual_preview.jpg"
    },
    {
      "id": "avatar_sophia_business",
      "name": "Sophia - Business",
      "gender": "female",
      "tags": ["professional", "business", "corporate"],
      "preview": "https://storage.hoox.ai/avatars/sophia_business_preview.jpg"
    },
    {
      "id": "avatar_marcus_teacher",
      "name": "Marcus - Teacher",
      "gender": "male",
      "tags": ["educational", "warm", "experienced"],
      "preview": "https://storage.hoox.ai/avatars/marcus_teacher_preview.jpg"
    },
    {
      "id": "avatar_david_business",
      "name": "David - Executive",
      "gender": "male",
      "tags": ["professional", "business", "executive"],
      "preview": "https://storage.hoox.ai/avatars/david_business_preview.jpg"
    }
  ]
}
```

**Exemple de réponse avec paramètres `?gender=male&tags=professional,business` (200 OK) :**
```json
{
  "avatars": [
    {
      "id": "avatar_david_business",
      "name": "David - Executive",
      "gender": "male",
      "tags": ["professional", "business", "executive"],
      "preview": "https://storage.hoox.ai/avatars/david_business_preview.jpg"
    }
  ]
}
```

---

## 3. Génération de Vidéo - Démarrage

### `POST /api/public/v1/generation/start`

**Exemple de requête :**
```json
{
  "prompt": "Create a video about sustainable energy solutions",
  "voice_id": "voice_1234567890",
  "avatar_id": "avatar_sophia_business",
  "format": "vertical",
  "webSearch": {
    "script": true,
    "images": true
  },
  "animate_image": true,
  "animate_mode": "standard",
  "webhook_url": "https://yoursite.com/webhook/video-generation"
}
```

**Exemple de réponse (201 Created) :**
```json
{
  "data": {
    "job_id": "job_67890abcdef12345",
    "status": "pending",
    "estimated_credits": 25
  }
}
```

**Autres exemples de requêtes :**

### Avec script personnalisé :
```json
{
  "script": "Bonjour et bienvenue dans cette présentation sur l'intelligence artificielle. Aujourd'hui, nous allons explorer les dernières innovations...",
  "voice_id": "voice_0987654321",
  "avatar_id": "avatar_marcus_teacher",
  "format": "square",
  "media_urls": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.png"
  ]
}
```

### Avec voix personnalisée :
```json
{
  "script": "Welcome to our quarterly business review...",
  "voice_url": "https://yourstorage.com/custom_voice.mp3",
  "avatar_id": "avatar_sophia_business",
  "format": "ads"
}
```

---

## 4. Génération de Vidéo - Statut

### `GET /api/public/v1/generation/status/{job_id}`

**Exemple de réponse - En cours (200 OK) :**
```json
{
  "data": {
    "job_id": "job_67890abcdef12345",
    "status": "processing",
    "progress_step": 3,
    "current_step": "Generating video with avatar"
  }
}
```

**Exemple de réponse - Terminé (200 OK) :**
```json
{
  "data": {
    "job_id": "job_67890abcdef12345",
    "status": "completed",
    "progress_step": 5,
    "current_step": null,
    "result": {
      "video_id": "video_abc123def456",
      "thumbnail_url": "https://storage.hoox.ai/thumbnails/video_abc123def456.jpg",
      "duration": 45.7,
      "cost": 23,
      "created_at": "2024-12-19T10:30:45Z"
    }
  }
}
```

**Exemple de réponse - Échec (200 OK) :**
```json
{
  "data": {
    "job_id": "job_67890abcdef12345",
    "status": "failed",
    "progress_step": 2,
    "current_step": null,
    "error": {
      "code": "VOICE_GENERATION_FAILED",
      "message": "Unable to generate audio from the provided script"
    }
  }
}
```

---

## 5. Export de Vidéo - Démarrage

### `POST /api/public/v1/export/start`

**Exemple de requête :**
```json
{
  "video_id": "video_abc123def456",
  "format": "vertical",
  "webhook_url": "https://yoursite.com/webhook/video-export"
}
```

**Exemple de réponse (201 Created) :**
```json
{
  "data": {
    "job_id": "job_export_xyz789",
    "status": "pending",
    "estimated_credits": 5
  }
}
```

---

## 6. Export de Vidéo - Statut

### `GET /api/public/v1/export/status/{job_id}`

**Exemple de réponse - En cours (200 OK) :**
```json
{
  "data": {
    "job_id": "job_export_xyz789",
    "status": "processing",
    "progress": 45,
    "current_step": "Rendering video"
  }
}
```

**Exemple de réponse - Terminé (200 OK) :**
```json
{
  "data": {
    "job_id": "job_export_xyz789",
    "status": "completed",
    "progress": 100,
    "current_step": null,
    "result": {
      "video_url": "https://storage.hoox.ai/exports/video_abc123def456_vertical.mp4",
      "thumbnail_url": "https://storage.hoox.ai/thumbnails/video_abc123def456.jpg",
      "cost": 5,
      "created_at": "2024-12-19T10:45:30Z"
    }
  }
}
```

**Exemple de réponse - Échec (200 OK) :**
```json
{
  "data": {
    "job_id": "job_export_xyz789",
    "status": "failed",
    "progress": 25,
    "current_step": null,
    "error": {
      "code": "EXPORT_FAILED",
      "message": "Video export failed due to insufficient storage space"
    }
  }
}
```

---

## Codes d'Erreur Communs

### Erreurs d'authentification (401) :
```json
{
  "error": "Invalid API key",
  "details": [
    {
      "code": "INVALID_API_KEY",
      "message": "The provided API key is invalid or expired"
    }
  ]
}
```

### Erreurs de validation (400) :
```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "MISSING_CONTENT",
      "message": "At least one of 'prompt', 'script', 'voice_url', or 'avatar_url' must be provided"
    },
    {
      "code": "INVALID_FORMAT",
      "message": "Format must be one of: 'vertical', 'square', 'ads'",
      "field": "format"
    }
  ]
}
```

### Erreurs de crédits (402) :
```json
{
  "error": "Insufficient credits",
  "details": [
    {
      "code": "INSUFFICIENT_CREDITS",
      "message": "Required 25 credits, but only 10 available"
    }
  ]
}
```

### Erreurs de ressource non trouvée (404) :
```json
{
  "error": "Video not found",
  "details": [
    {
      "code": "VIDEO_NOT_FOUND",
      "message": "Video with ID \"video_abc123def456\" not found"
    }
  ]
}
```

### Erreurs de rate limiting (429) :
```json
{
  "error": "Rate limit exceeded",
  "details": [
    {
      "code": "RATE_LIMIT_EXCEEDED",
      "message": "Too many requests. Try again in 60 seconds."
    }
  ]
}
```

---

## Webhooks

Si vous spécifiez une `webhook_url` lors de la génération ou de l'export, Hoox enverra une notification POST à votre endpoint avec le résultat final.

**Exemple de payload webhook - Génération terminée :**
```json
{
  "event": "generation.completed",
  "job_id": "job_67890abcdef12345",
  "data": {
    "video_id": "video_abc123def456",
    "thumbnail_url": "https://storage.hoox.ai/thumbnails/video_abc123def456.jpg",
    "duration": 45.7,
    "cost": 23,
    "created_at": "2024-12-19T10:30:45Z"
  }
}
```

**Exemple de payload webhook - Export terminé :**
```json
{
  "event": "export.completed",
  "job_id": "job_export_xyz789",
  "data": {
    "video_url": "https://storage.hoox.ai/exports/video_abc123def456_vertical.mp4",
    "thumbnail_url": "https://storage.hoox.ai/thumbnails/video_abc123def456.jpg",
    "cost": 5,
    "created_at": "2024-12-19T10:45:30Z"
  }
}
```

**Exemple de payload webhook - Échec :**
```json
{
  "event": "generation.failed",
  "job_id": "job_67890abcdef12345",
  "error": {
    "code": "VOICE_GENERATION_FAILED",
    "message": "Unable to generate audio from the provided script"
  }
}
```

---

## Workflow Typique

1. **Récupérer les ressources disponibles :**
   ```bash
   GET /api/public/v1/resources/voices
   GET /api/public/v1/resources/avatars
   ```

2. **Démarrer une génération :**
   ```bash
   POST /api/public/v1/generation/start
   ```

3. **Suivre le statut (polling) :**
   ```bash
   GET /api/public/v1/generation/status/{job_id}
   ```

4. **Exporter la vidéo :**
   ```bash
   POST /api/public/v1/export/start
   ```

5. **Suivre l'export :**
   ```bash
   GET /api/public/v1/export/status/{job_id}
   ```