import { ISequence } from "@/src/types/video";
import { ScrollArea } from "../ui/scroll-area";
import Sequence from "./sequence";

export default function Panel1({ sequences, selectedSequenceIndex, setSelectedSequenceIndex, handleWordInputChange, handleCutSequence }: { sequences: ISequence[], selectedSequenceIndex: number, setSelectedSequenceIndex: (index: number) => void, handleWordInputChange: (sequenceIndex: number, wordIndex: number, newWord: string) => void, handleCutSequence: (cutIndex: number) => void }) {

    return (
        <ScrollArea className="h-[calc(100vh-5rem)]">
            {sequences && sequences.map((sequence, index) => (
                <Sequence key={index} sequence={sequence} index={index} selectedIndex={selectedSequenceIndex} setSelectedIndex={setSelectedSequenceIndex} handleWordInputChange={handleWordInputChange} onCutSequence={handleCutSequence} />
            ))}
        </ScrollArea>
    )
}