import { ISequence } from "@/src/types/video";
import { ScrollArea } from "../ui/scroll-area";
import Sequence from "./sequence";
import { PlayerRef } from "@remotion/player";

interface SequencesProps {
    sequences: ISequence[];
    selectedSequenceIndex: number;
    setSelectedSequenceIndex: (index: number) => void;
    handleWordInputChange: (sequenceIndex: number, wordIndex: number, newWord: string) => void;
    handleWordAdd: (sequenceIndex: number, wordIndex: number) => number;
    handleWordDelete: (sequenceIndex: number, wordIndex: number) => void;
    handleCutSequence: (cutIndex: number) => void;
    onRegenerateAudio: (index: number) => void;
    onDeleteSequence: (index: number) => void;
    playerRef?: React.RefObject<PlayerRef>;
}

export default function Sequences({ 
    sequences, 
    selectedSequenceIndex, 
    setSelectedSequenceIndex, 
    handleWordInputChange, 
    handleWordAdd, 
    handleWordDelete, 
    handleCutSequence, 
    onRegenerateAudio,
    onDeleteSequence,
    playerRef,
}: SequencesProps) {

    return (
        <ScrollArea className="h-[calc(100vh-25rem)] sm:h-[calc(100vh-8rem)]">
            {sequences && sequences.map((sequence, index) => (
                <Sequence key={index} sequence={sequence} index={index} selectedIndex={selectedSequenceIndex} setSelectedIndex={setSelectedSequenceIndex} handleWordInputChange={handleWordInputChange} handleWordAdd={handleWordAdd} handleWordDelete={handleWordDelete} onCutSequence={handleCutSequence} onRegenerateAudio={onRegenerateAudio} onDeleteSequence={onDeleteSequence} canDelete={isSequenceDeletable(sequences, index)} playerRef={playerRef} />
            ))}
        </ScrollArea>
    )
}

function isSequenceDeletable(sequences: ISequence[], index: number): boolean {
    const currentSequence = sequences[index];
    const audioIndex = currentSequence.audioIndex;
    
    const sequencesWithSameAudio = sequences.filter(seq => seq.audioIndex === audioIndex);
    const isFirst = sequencesWithSameAudio[0] === currentSequence;
    const isLast = sequencesWithSameAudio[sequencesWithSameAudio.length - 1] === currentSequence;
    
    return isFirst || isLast;
}