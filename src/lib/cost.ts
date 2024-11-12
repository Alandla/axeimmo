interface TokenUsage {
  completionTokens: number;
  promptTokens: number;
  totalTokens: number;
}

export function calculateAnthropicCost(usage: TokenUsage): number {
  const INPUT_COST_PER_TOKEN = 0.000003;  // $3 par million de tokens pour claude 3.5 sonnet
  const OUTPUT_COST_PER_TOKEN = 0.000015;  // $15 par million de tokens pour claude 3.5 sonnet

  const inputCost = usage.promptTokens * INPUT_COST_PER_TOKEN;
  const outputCost = usage.completionTokens * OUTPUT_COST_PER_TOKEN;

  return inputCost + outputCost;
}

export function calculateElevenLabsCost(text: string, isTurbo: boolean = false): number {
  const COST_PER_1000_CHARS = 0.30;
  const TURBO_DISCOUNT = 0.5;

  // Calculer le coût de base pour 1000 caractères
  const baseRate = isTurbo ? COST_PER_1000_CHARS * TURBO_DISCOUNT : COST_PER_1000_CHARS;
  
  // Calculer le coût pour la longueur réelle du texte
  return (text.length / 1000) * baseRate;
}

