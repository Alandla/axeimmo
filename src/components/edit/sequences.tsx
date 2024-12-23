import { ISequence } from "@/src/types/video";
import { ScrollArea } from "../ui/scroll-area";
import Sequence from "./sequence";

export default function Sequences({ sequences, selectedSequenceIndex, setSelectedSequenceIndex, handleWordInputChange, handleWordAdd, handleWordDelete, handleCutSequence, onRegenerateAudio }: { sequences: ISequence[], selectedSequenceIndex: number, setSelectedSequenceIndex: (index: number) => void, handleWordInputChange: (sequenceIndex: number, wordIndex: number, newWord: string) => void, handleWordAdd: (sequenceIndex: number, wordIndex: number) => void, handleWordDelete: (sequenceIndex: number, wordIndex: number) => void, handleCutSequence: (cutIndex: number) => void, onRegenerateAudio: (index: number) => void }) {

    return (
        <ScrollArea className="h-[calc(100vh-8rem)]">
            {sequences && sequences.map((sequence, index) => (
                <Sequence key={index} sequence={sequence} index={index} selectedIndex={selectedSequenceIndex} setSelectedIndex={setSelectedSequenceIndex} handleWordInputChange={handleWordInputChange} handleWordAdd={handleWordAdd} handleWordDelete={handleWordDelete} onCutSequence={handleCutSequence} onRegenerateAudio={onRegenerateAudio} />
            ))}
        </ScrollArea>
    )
}