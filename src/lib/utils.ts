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
