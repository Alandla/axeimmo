/**
 * Split a script into sentences while preserving ellipsis and proper punctuation
 */
export function splitScriptIntoSentences(script: string): string[] {
  return script
    .replace(/\.\.\./g, '___ELLIPSIS___') // Temporarily replace ellipsis
    .split(/(?<=[.!?])\s+(?=[A-Z])/g)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0)
    .map(sentence => sentence.replace(/___ELLIPSIS___/g, '...')); // Restore ellipsis
}

