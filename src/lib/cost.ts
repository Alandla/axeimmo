interface TokenUsage {
  completionTokens: number;
  promptTokens: number;
  totalTokens: number;
}

export function calculateAnthropicCost(usage: TokenUsage): number {
  const INPUT_COST_PER_TOKEN = 0.000003;  // $3 par million de tokens
  const OUTPUT_COST_PER_TOKEN = 0.000015;  // $15 par million de tokens

  const inputCost = usage.promptTokens * INPUT_COST_PER_TOKEN;
  const outputCost = usage.completionTokens * OUTPUT_COST_PER_TOKEN;

  return inputCost + outputCost;
}

