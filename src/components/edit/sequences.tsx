import { ISequence } from "@/src/types/video";
import { ScrollArea } from "../ui/scroll-area";
import Sequence from "./sequence";
import { PlayerRef } from "@remotion/player";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import React from "react";

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
    onAddSequence: (afterIndex: number) => void;
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
    onAddSequence,
    playerRef,
}: SequencesProps) {
    const t = useTranslations('edit.sequence');

    return (
        <ScrollArea className="h-[calc(100vh-25rem)] sm:h-[calc(100vh-8rem)]">
            <div className="relative">
                {sequences && sequences.map((sequence, index) => (
                    <React.Fragment key={index}>
                        <Sequence 
                            sequence={sequence} 
                            index={index} 
                            selectedIndex={selectedSequenceIndex} 
                            setSelectedIndex={setSelectedSequenceIndex}
                            handleWordInputChange={handleWordInputChange}
                            handleWordAdd={handleWordAdd}
                            handleWordDelete={handleWordDelete}
                            onCutSequence={handleCutSequence}
                            onRegenerateAudio={onRegenerateAudio}
                            onDeleteSequence={onDeleteSequence}
                            canDelete={isSequenceDeletable(sequences, index)}
                            playerRef={playerRef}
                        />
                        {index === selectedSequenceIndex && isLastSequenceWithAudioIndex(sequences, index) && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                exit={{ opacity: 0, y: -20, height: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                className="mx-2 my-1"
                            >
                                <Button 
                                    variant="outline" 
                                    className="w-full flex items-center justify-center gap-2"
                                    onClick={() => onAddSequence(index)}
                                >
                                    <Plus className="w-4 h-4" />
                                    {t('add-sequence')}
                                </Button>
                            </motion.div>
                        )}
                        {index > selectedSequenceIndex && (
                            <motion.div
                                initial={false}
                                animate={{ 
                                    y: selectedSequenceIndex === index - 1 ? 48 : 0 
                                }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* Cette div vide permet de créer l'espace pour l'animation */}
                            </motion.div>
                        )}
                    </React.Fragment>
                ))}
            </div>
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

function isLastSequenceWithAudioIndex(sequences: ISequence[], index: number): boolean {
    const currentSequence = sequences[index];
    const audioIndex = currentSequence.audioIndex;
    
    const sequencesWithSameAudio = sequences.filter(seq => seq.audioIndex === audioIndex);
    return sequencesWithSameAudio[sequencesWithSameAudio.length - 1] === currentSequence;
}