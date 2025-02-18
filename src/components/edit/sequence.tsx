import { ISequence } from "@/src/types/video";
import { Card, CardContent } from "../ui/card";
import SkeletonImage from "../ui/skeleton-image";
import { Clock, Edit, FileImage, AlertTriangle, MoreVertical, Trash2, Plus, Pen } from "lucide-react";
import { motion } from 'framer-motion';
import React, { useRef, useState, useCallback } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { RefreshCw } from "lucide-react"
import { cn } from "@/src/lib/utils";
import { useTranslations } from "next-intl";
import { PlayerRef } from "@remotion/player";

interface SequenceProps {
  sequence: ISequence;
  index: number;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  handleWordInputChange: (sequenceIndex: number, wordIndex: number, newWord: string) => void;
  handleWordAdd: (sequenceIndex: number, wordIndex: number) => number;
  handleWordDelete: (sequenceIndex: number, wordIndex: number) => void;
  onCutSequence: (cutIndex: number) => void;
  setActiveTabMobile?: (tab: string) => void;
  isMobile?: boolean;
  isLastSequenceWithAudioIndex: boolean;
  needsAudioRegeneration?: boolean;
  onRegenerateAudio?: (index: number) => void;
  onDeleteSequence?: (index: number) => void;
  onUpdateDuration?: (index: number, newDuration: number) => void;
  playerRef?: React.RefObject<PlayerRef>;
  canDelete: boolean;
}

export default function Sequence({ 
  sequence, 
  index, 
  selectedIndex, 
  setSelectedIndex, 
  handleWordInputChange,
  handleWordAdd,
  handleWordDelete,
  onCutSequence,
  setActiveTabMobile,
  isMobile = false,
  isLastSequenceWithAudioIndex,
  onRegenerateAudio = () => {},
  onDeleteSequence = () => {},
  onUpdateDuration = () => {},
  playerRef,
  canDelete,
}: SequenceProps) {

    const wordRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingWordIndex, setEditingWordIndex] = useState<number | null>(null);
    const t = useTranslations('edit.sequence')
    const [duration, setDuration] = useState(sequence.end - sequence.start);

    const focusWord = useCallback((wordIndex: number) => {
        setTimeout(() => {
            if (wordRefs.current[wordIndex]) {
                wordRefs.current[wordIndex]?.focus();
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(wordRefs.current[wordIndex]!);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        }, 0);
    }, []);

    const handleWordAddWithFocus = (wordIndex: number) => {
        const newIndex = handleWordAdd(index, wordIndex);
        setEditingWordIndex(newIndex);
        setIsEditing(true);
        focusWord(newIndex);
    };

    const handleImageClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isMobile && setActiveTabMobile) {
            setActiveTabMobile('settings-sequence');
        }
        setSelectedIndex(index);
    };

    const handleClickOnWord = (wordIndex: number) => {
        setEditingWordIndex(wordIndex);
        setIsEditing(true);
        setTimeout(() => {
          if (playerRef?.current && sequence.words[wordIndex]) {
            playerRef.current.seekTo(sequence.words[wordIndex].start * 60);
          }
        }, 130);
    }

    const handleKeyDown = (e: React.KeyboardEvent, wordIndex: number) => {
        if (e.key === 'Enter' || (e.key === ' ' && isEditing)) {
            e.preventDefault();
            const target = e.currentTarget as HTMLDivElement;
            handleWordInputChange(index, wordIndex, target.textContent || '');
            target.blur();
            
            if (e.key === 'Enter') {
                setEditingWordIndex(null);
                setIsEditing(false);
            } else if (e.key === ' ') {
                handleWordAddWithFocus(wordIndex);
            }
        }
    };

    const handleClickOutside = useCallback((e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const clickedOnAnotherWord = target.hasAttribute('contenteditable');
        
        if (!target.closest('[contenteditable="true"]') && !target.closest('button')) {
            setEditingWordIndex(null);
            setIsEditing(false);
        } else if (clickedOnAnotherWord) {
            const currentSequence = target.closest('.sequence-card');
            const isInSameSequence = currentSequence?.getAttribute('data-sequence-index') === String(index);
            
            if (!isInSameSequence) {
                setEditingWordIndex(null);
                setIsEditing(false);
            }
        }
    }, [index]);

    React.useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setDuration(parseFloat(value) || 0);
    };

    const handleDurationBlur = () => {
        const lastWord = sequence.words[sequence.words.length - 1];
        const minDuration = lastWord.start - sequence.start;
        
        let finalDuration = Math.max(duration, minDuration);
        finalDuration = parseFloat(finalDuration.toFixed(2));
        
        setDuration(finalDuration);
        onUpdateDuration(index, finalDuration);
    };

    const handleDurationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    return (
        <>
        <motion.div
            layout="position"
            className={`cursor-pointer`}
            onClick={() => setSelectedIndex(index)}
        >
        <Card 
            key={index} 
            className={`m-2 sequence-card ${selectedIndex === index ? 'ring-2 ring-primary' : ''}`}
            data-sequence-index={index}
        >
            <CardContent className="flex p-2">
                {/* Image et icônes à gauche */}
                <div className="flex flex-col">
                    <div 
                        className="relative"
                        onClick={handleImageClick}
                    >  
                        {sequence.media?.image ? (
                            <SkeletonImage
                                src={sequence.media.image.link}
                                height={1200}
                                width={630}
                                alt={sequence.text}
                                className='w-12 h-12 sm:w-24 sm:h-24 rounded-md object-cover opacity-100 hover:opacity-50'
                            />
                        ) : (
                            <div className="w-12 h-12 sm:w-24 sm:h-24 rounded-md bg-gray-200 flex items-center justify-center">
                                <FileImage className="text-gray-400 text-3xl" />
                            </div>
                        )}
                        <div className="absolute rounded-md inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                            <Edit className="text-white text-xl" />
                        </div>
                    </div>
                </div>

                {/* Contenu à droite de l'image */}
                <div className="flex-1 sm:space-y-2 ml-4">
                    <div className="flex items-center justify-between gap-2">
                        {isLastSequenceWithAudioIndex ? (
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="ghost"
                                        className={cn(
                                            "inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 h-auto",
                                        )}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                        }}
                                    >
                                        <Clock className="!w-3 !h-3" />
                                        {duration.toFixed(2)}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent 
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-[--radix-dropdown-menu-trigger-width] max-w-32 rounded-lg p-2"
                                    side="bottom"
                                    align="start"
                                    sideOffset={5}
                                >
                                    <Input
                                        type="number"
                                        value={duration}
                                        step={0.1}
                                        min={sequence.words[sequence.words.length - 1].start - sequence.start}
                                        onChange={handleDurationChange}
                                        onKeyDown={handleDurationKeyDown}
                                        onBlur={handleDurationBlur}
                                        className="w-full border-none focus:ring-0 text-sm"
                                        onClick={(e) => e.stopPropagation()}
                                        autoFocus
                                    />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button 
                                variant="ghost"
                                className={cn(
                                    "inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 h-auto opacity-50 cursor-not-allowed"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                                disabled={true}
                            >
                                <Clock className="!w-3 !h-3" />
                                {duration.toFixed(2)}
                            </Button>
                        )}

                        <div className="flex items-center gap-2">
                            {sequence.needsAudioRegeneration && (
                                <Badge variant="destructive" onClick={() => onRegenerateAudio(index)}>
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    {t('regeneration-needed')}
                                </Badge>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div className="flex items-center hover:bg-accent rounded-md p-1 cursor-pointer transition-all duration-200">
                                        <MoreVertical className="w-4 h-4" />
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-[--radix-dropdown-menu-trigger-width] min-w-48 rounded-lg"
                                    align="end"
                                    sideOffset={4}
                                >
                                    <DropdownMenuItem 
                                        onClick={() => onRegenerateAudio(index)}
                                        className="cursor-pointer"
                                    >
                                        <RefreshCw size={16} />
                                        {t('button-regenerate')}
                                    </DropdownMenuItem>
                                    {isMobile && (
                                        <DropdownMenuItem 
                                            onClick={handleImageClick}
                                            className="cursor-pointer"
                                        >
                                            <Pen size={16} />
                                            {t('edit')}
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => onDeleteSequence(index)}
                                        className={cn(
                                            "flex items-center text-destructive",
                                            canDelete 
                                                ? "cursor-pointer hover:bg-red-200 hover:text-destructive focus:bg-red-200 focus:text-destructive"
                                                : "cursor-not-allowed opacity-50"
                                        )}
                                        disabled={!canDelete}
                                    >
                                        <Trash2 size={16} />
                                        {t('button-delete')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    
                    {/* Zone de texte qui ne déclenche pas la sélection */}
                    <div className="flex flex-wrap">
                        {sequence.words.map((word, wordIndex) => (
                            <div className="inline-block relative" key={wordIndex}>
                                {editingWordIndex === wordIndex && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute bottom-full left-0 mb-2 flex items-center gap-1 bg-white border shadow-lg rounded-md p-1 z-10"
                                    >
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleWordAddWithFocus(wordIndex);
                                            }}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-destructive hover:bg-red-200 hover:text-destructive"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleWordDelete(index, wordIndex);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </motion.div>
                                )}
                                <div 
                                    ref={(el) => {
                                        wordRefs.current[wordIndex] = el;
                                    }}
                                    contentEditable="true"
                                    suppressContentEditableWarning={true}
                                    onBlur={(e) => {
                                        handleWordInputChange(index, wordIndex, e.currentTarget.textContent || '');
                                        setIsEditing(false);
                                    }}
                                    onKeyDown={(e) => handleKeyDown(e, wordIndex)}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        handleClickOnWord(wordIndex);
                                    }}
                                    className={cn(
                                        "text-sm sm:text-base px-0.5 py-[0.1rem]",
                                        "hover:ring-1 focus:ring-2 ring-border ring-opacity-100 rounded transition-all duration-200",
                                        isEditing && editingWordIndex === wordIndex ? "cursor-text" : "cursor-pointer",
                                        editingWordIndex === wordIndex ? "ring-1 ring-border" : ""
                                    )}
                                >
                                    {word.word}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
        </motion.div>
        </>
    )
}