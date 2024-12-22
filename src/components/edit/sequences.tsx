import { ISequence } from "@/src/types/video";
import { ScrollArea } from "../ui/scroll-area";
import Sequence from "./sequence";

export default function Sequences({ sequences, selectedSequenceIndex, setSelectedSequenceIndex, handleWordInputChange, handleCutSequence, onRegenerateAudio }: { sequences: ISequence[], selectedSequenceIndex: number, setSelectedSequenceIndex: (index: number) => void, handleWordInputChange: (sequenceIndex: number, wordIndex: number, newWord: string) => void, handleCutSequence: (cutIndex: number) => void, onRegenerateAudio: (index: number) => void }) {

    return (
        <ScrollArea className="h-[calc(100vh-8rem)]">
            {sequences && sequences.map((sequence, index) => (
                <Sequence key={index} sequence={sequence} index={index} selectedIndex={selectedSequenceIndex} setSelectedIndex={setSelectedSequenceIndex} handleWordInputChange={handleWordInputChange} onCutSequence={handleCutSequence} onRegenerateAudio={onRegenerateAudio} />
            ))}
        </ScrollArea>
    )
}