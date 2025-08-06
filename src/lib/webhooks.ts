/**
 * Système de webhooks pour notifier les clients API
 */

export interface WebhookPayload {
  job_id: string;
  status: 'completed' | 'failed';
  result?: {
    video_id?: string;
    thumbnail_url?: string;
    cost?: number;
    created_at?: string;
    // Pour les exports
    video_url?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Envoyer un webhook de notification
 */
export async function sendWebhook(url: string, payload: WebhookPayload): Promise<boolean> {
  try {
    console.log(`[WEBHOOK] Sending webhook to ${url}`, payload);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Hoox-API/1.0',
        'X-Hoox-Webhook': 'true'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000) // 10 secondes timeout
    });

    if (response.ok) {
      console.log(`[WEBHOOK] Successfully sent webhook to ${url}`);
      return true;
    } else {
      console.error(`[WEBHOOK] Webhook failed with status ${response.status}: ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error(`[WEBHOOK] Webhook error for ${url}:`, error);
    return false;
  }
}

/**
 * Envoyer un webhook avec retry automatique
 */
export async function sendWebhookWithRetry(
  url: string, 
  payload: WebhookPayload, 
  maxRetries: number = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const success = await sendWebhook(url, payload);
    
    if (success) {
      return true;
    }
    
    if (attempt < maxRetries) {
      // Attendre avant de réessayer (backoff exponentiel)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`[WEBHOOK] Retrying webhook in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error(`[WEBHOOK] Failed to send webhook after ${maxRetries} attempts`);
  return false;
}