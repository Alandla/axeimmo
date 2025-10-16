import { ISequence, ITransition, ZoomType } from "@/src/types/video";
import { ScrollArea } from "../ui/scroll-area";
import Sequence from "./sequence";
import Transition from "./transition";
import { PlayerRef } from "@remotion/player";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
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
    setActiveTabMobile?: (tab: string) => void;
    isMobile?: boolean;
    handleWordInputChange: (sequenceIndex: number, wordIndex: number, newWord: string) => void;
    handleWordAdd: (sequenceIndex: number, wordIndex: number) => number;
    handleWordDelete: (sequenceIndex: number, wordIndex: number) => void;
    handleWordCut: (sequenceIndex: number, wordIndex: number) => void;
    onRegenerateAudio: (index: number) => void;
    onDeleteSequence: (index: number) => void;
    onDeleteTransition: (index: number) => void;
    onAddSequence: (index: number, before?: boolean) => void;
    onAddTransition?: (afterIndex: number) => void;
    onUpdateDuration: (index: number, newDuration: number) => void;
    playerRef?: React.RefObject<PlayerRef>;
    avatar?: { videoUrl?: string; previewUrl?: string; thumbnail?: string };
    handleMergeWordWithPrevious?: (sequenceIndex: number, wordIndex: number) => void;
    handleMergeWordWithNext?: (sequenceIndex: number, wordIndex: number) => void;
    onWordZoomChange?: (sequenceIndex: number, wordIndex: number, zoom: ZoomType | undefined) => void;
    useVeo3?: boolean;
}

export default function Sequences({ 
    sequences, 
    transitions = [],
    selectedSequenceIndex,
    selectedTransitionIndex,
    setSelectedSequenceIndex,
    setSelectedTransitionIndex,
    setActiveTabMobile,
    isMobile,
    handleWordInputChange, 
    handleWordAdd, 
    handleWordDelete, 
    handleWordCut,
    onRegenerateAudio,
    onDeleteSequence,
    onDeleteTransition,
    onAddSequence,
    onAddTransition,
    onUpdateDuration,
    playerRef,
    avatar,
    handleMergeWordWithPrevious,
    handleMergeWordWithNext,
    onWordZoomChange,
    useVeo3,
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

    return (
        <ScrollArea className="h-[calc(100vh-25rem)] sm:h-[calc(100vh-8rem)]">
            <div className="relative">
                {selectedSequenceIndex === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="mx-2 mb-1"
                    >
                        <Button 
                            variant="outline" 
                            className="w-full flex items-center justify-center gap-2"
                            onClick={() => onAddSequence(0, true)}
                        >
                            <Plus className="w-4 h-4" />
                            {t('add-sequence')}
                        </Button>
                    </motion.div>
                )}
                {sequences && sequences.map((sequence, index) => {
                    const canMergeWithPrevious = index > 0 && sequences[index - 1].audioIndex === sequence.audioIndex;
                    const canMergeWithNext = index < sequences.length - 1 && sequences[index + 1].audioIndex === sequence.audioIndex;

                    return (
                    <React.Fragment key={index}>
                        <Sequence 
                            sequence={sequence} 
                            index={index} 
                            selectedIndex={selectedSequenceIndex} 
                            setSelectedIndex={handleSequenceClick}
                            setActiveTabMobile={setActiveTabMobile}
                            isMobile={isMobile}
                            isLastSequenceWithAudioIndex={isLastSequenceWithAudioIndex(sequences, index)}
                            handleWordInputChange={handleWordInputChange}
                            handleWordAdd={handleWordAdd}
                            handleWordDelete={handleWordDelete}
                            handleWordCut={handleWordCut}
                            onRegenerateAudio={onRegenerateAudio}
                            onDeleteSequence={onDeleteSequence}
                            onUpdateDuration={onUpdateDuration}
                            canDelete={isSequenceDeletable(sequences, index)}
                            playerRef={playerRef}
                            avatar={avatar}
                            handleMergeWordWithPrevious={handleMergeWordWithPrevious}
                            handleMergeWordWithNext={handleMergeWordWithNext}
                            canMergeWithPrevious={canMergeWithPrevious}
                            canMergeWithNext={canMergeWithNext}
                            onWordZoomChange={onWordZoomChange}
                            useVeo3={useVeo3}
                        />
                        {transitions.map((transition, transitionIndex) => 
                            transition.indexSequenceBefore === index && (
                                <Transition
                                    key={`transition-${transitionIndex}`}
                                    transition={transition}
                                    index={transitionIndex}
                                    sequenceThumbnail={sequence.media?.image?.link || ""}
                                    sequenceVideoUrl={sequence.media?.type === 'video' && sequence.media.video?.link ? sequence.media.video.link : undefined}
                                    sequenceStartAt={sequence.media?.startAt}
                                    sequenceFrames={sequence.media?.video?.frames}
                                    selectedIndex={selectedTransitionIndex}
                                    setSelectedIndex={handleTransitionClick}
                                    setActiveTabMobile={setActiveTabMobile}
                                    isMobile={isMobile}
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
                                {hasTransitionAfterSequence(index) ? (
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
                                )}
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
                    );
                })}
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