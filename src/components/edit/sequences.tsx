import { ISequence, ITransition } from "@/src/types/video";
import { ScrollArea } from "../ui/scroll-area";
import Sequence from "./sequence";
import Transition from "./transition";
import { PlayerRef } from "@remotion/player";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { ListVideo, Wand2 } from "lucide-react";

interface SequencesProps {
    sequences: ISequence[];
    transitions?: ITransition[];
    selectedSequenceIndex: number;
    selectedTransitionIndex?: number;
    setSelectedSequenceIndex: (index: number) => void;
    setSelectedTransitionIndex?: (index: number) => void;
    handleWordInputChange: (sequenceIndex: number, wordIndex: number, newWord: string) => void;
    handleWordAdd: (sequenceIndex: number, wordIndex: number) => number;
    handleWordDelete: (sequenceIndex: number, wordIndex: number) => void;
    handleCutSequence: (cutIndex: number) => void;
    onRegenerateAudio: (index: number) => void;
    onDeleteSequence: (index: number) => void;
    onDeleteTransition: (index: number) => void;
    onAddSequence: (afterIndex: number) => void;
    onAddTransition?: (afterIndex: number) => void;
    playerRef?: React.RefObject<PlayerRef>;
}

export default function Sequences({ 
    sequences, 
    transitions = [],
    selectedSequenceIndex,
    selectedTransitionIndex,
    setSelectedSequenceIndex,
    setSelectedTransitionIndex,
    handleWordInputChange, 
    handleWordAdd, 
    handleWordDelete, 
    handleCutSequence, 
    onRegenerateAudio,
    onDeleteSequence,
    onDeleteTransition,
    onAddSequence,
    onAddTransition,
    playerRef,
}: SequencesProps) {
    const t = useTranslations('edit.sequence');

    const handleTransitionClick = (index: number) => {
        setSelectedTransitionIndex?.(index);
        setSelectedSequenceIndex(-1); // Désélectionne la séquence
    };

    const handleSequenceClick = (index: number) => {
        setSelectedSequenceIndex(index);
        setSelectedTransitionIndex?.(-1); // Désélectionne la transition
    };

    const hasTransitionAfterSequence = (sequenceIndex: number) => {
        return transitions.some(t => t.indexSequenceBefore === sequenceIndex);
    };

    const canAddSequence = (index: number) => {
        return isLastSequenceWithAudioIndex(sequences, index);
    };

    return (
        <ScrollArea className="h-[calc(100vh-25rem)] sm:h-[calc(100vh-8rem)]">
            <div className="relative">
                {sequences && sequences.map((sequence, index) => (
                    <React.Fragment key={index}>
                        <Sequence 
                            sequence={sequence} 
                            index={index} 
                            selectedIndex={selectedSequenceIndex} 
                            setSelectedIndex={handleSequenceClick}
                            handleWordInputChange={handleWordInputChange}
                            handleWordAdd={handleWordAdd}
                            handleWordDelete={handleWordDelete}
                            onCutSequence={handleCutSequence}
                            onRegenerateAudio={onRegenerateAudio}
                            onDeleteSequence={onDeleteSequence}
                            canDelete={isSequenceDeletable(sequences, index)}
                            playerRef={playerRef}
                        />
                        {transitions.map((transition, transitionIndex) => 
                            transition.indexSequenceBefore === index && (
                                <Transition
                                    key={`transition-${transitionIndex}`}
                                    transition={transition}
                                    index={transitionIndex}
                                    sequenceThumbnail={sequence.media?.image?.link || ""}
                                    selectedIndex={selectedTransitionIndex}
                                    setSelectedIndex={handleTransitionClick}
                                    onDeleteTransition={onDeleteTransition}
                                />
                            )
                        )}
                        {(index === selectedSequenceIndex || (selectedTransitionIndex !== undefined && transitions.find((t, i) => i === selectedTransitionIndex && t.indexSequenceBefore === index))) && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                exit={{ opacity: 0, y: -20, height: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                className="mx-2 my-1"
                            >
                                {canAddSequence(index) ? (
                                    hasTransitionAfterSequence(index) ? (
                                        <Button 
                                            variant="outline" 
                                            className="w-full flex items-center justify-center gap-2"
                                            onClick={() => onAddSequence(index)}
                                        >
                                            <Plus className="w-4 h-4" />
                                            {t('add-sequence')}
                                        </Button>
                                    ) : (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button 
                                                    variant="outline" 
                                                    className="w-full flex items-center justify-center gap-2"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    {t('add')}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[var(--radix-dropdown-trigger-width)]">
                                                <DropdownMenuItem onClick={() => onAddSequence(index)} className="flex items-center gap-2">
                                                    <ListVideo className="w-4 h-4" />
                                                    {t('add-sequence')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onAddTransition?.(index)} className="flex items-center gap-2">
                                                    <Wand2 className="w-4 h-4" />
                                                    {t('add-transition')}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )
                                ) : !hasTransitionAfterSequence(index) ? (
                                    <Button 
                                        variant="outline" 
                                        className="w-full flex items-center justify-center gap-2"
                                        onClick={() => onAddTransition?.(index)}
                                    >
                                        <Plus className="w-4 h-4" />
                                        {t('add-transition')}
                                    </Button>
                                ) : null}
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