export function simplifySequences(sequences: any[]) {
  return sequences.map((seq, index) => ({
    sequence_id: String(index),
    text: seq.text,
    b_roll_description: seq.media?.description?.[0]?.text || ""
  }));
}

export function simplifyMediaFromPexels(result: any[]): any[] {
  return result.map((r, index) => ({
    id: index,
    description: r.media.description?.[0]?.text || ''
  }));
}

export interface ShowBrollResult {
  cost: number;
  show: Array<{
    id: number;
    show: 'full' | 'half' | 'hide';
  }>;
}