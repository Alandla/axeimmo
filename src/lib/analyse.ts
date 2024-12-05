export function getDataForAnalysis() {
  return '';
}

export interface SimpleSequence {
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

export interface ShowBrollResult {
  cost: number;
  show: Array<{
    id: number;
    show: 'full' | 'half' | 'hide';
  }>;
}

export function applyShowBrollToSequences(sequences: any[], showBrollResult: ShowBrollResult): any[] {
  return sequences.map((sequence, index) => {
    const showInfo = showBrollResult.show.find(s => s.id === index + 1);
    return {
      ...sequence,
      media: {
        ...sequence.media,
        show: showInfo?.show || 'full' // 'full' comme valeur par défaut
      }
    };
  });
}