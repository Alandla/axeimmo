export function getDataForAnalysis() {
  return '';
}

interface SimpleSequence {
  id: number;
  text: string;
  mediaDescription: string;
}

export function simplifySequences(sequences: any[]): SimpleSequence[] {
  return sequences.map((sequence, index) => ({
    id: index + 1,
    text: sequence.text,
    mediaDescription: sequence.media?.description || ''
  }));
}