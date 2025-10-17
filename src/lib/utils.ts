import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMostFrequentString(strings: string[]) {
  if (strings.length === 0) return null;

  const frequencyMap: { [key: string]: number } = {};

  // Compter les occurrences de chaque string
  strings.forEach((string) => {
    if (!frequencyMap[string]) frequencyMap[string] = 0;
    frequencyMap[string]++;
  });

  // Trouver le string avec la plus grande occurrence
  let mostFrequentString = null;
  let maxFrequency = 0;

  for (const [string, count] of Object.entries(frequencyMap)) {
    if (count > maxFrequency) {
      mostFrequentString = string;
      maxFrequency = count;
    }
  }

  return mostFrequentString;
}

/**
 * Convert an ObjectId to a string
 */
export function objectIdToString(id: any): string {
  if (!id) return '';

  if (typeof id === 'string') return id;

  if (typeof id === 'object' && id !== null && id.toString) {
    return id.toString();
  }

  return String(id);
}

/**
 * Remove emojis from text
 */
export function removeEmojis(text: string): string {
  return text
    .replace(/[\u2600-\u26FF]/g, '') // Miscellaneous Symbols
    .replace(/[\u2700-\u27BF]/g, '') // Dingbats
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') // Surrogate pairs (emojis)
    .replace(/[\u2194-\u2199\u21A9-\u21AA]/g, '') // Arrows
    .replace(/[\u231A-\u231B\u23E9-\u23EC\u23F0\u23F3]/g, '') // Clock and media symbols
    .replace(/[\u25FD-\u25FE]/g, '') // Squares
    .replace(/[\u2B50\u2B55]/g, '') // Stars and circles
    .replace(/✅/g, '') // Check mark
    .replace(/💬/g, ''); // Speech balloon
}
