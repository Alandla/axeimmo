import { ISequence } from "@/src/types/video";
import { Card, CardContent } from "../ui/card";
import SkeletonImage from "../ui/skeleton-image";
import { Clock, Edit, FileImage, Scissors, AlertTriangle, MoreVertical, Trash2, Plus, Pen } from "lucide-react";
import { motion } from 'framer-motion';
import React, { useRef, useState, useCallback } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Trash, RefreshCw } from "lucide-react"
import { cn } from "@/src/lib/utils";
import { useTranslations } from "next-intl";
import AutoResizingInput from "../auto-resizing-input";
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
  needsAudioRegeneration?: boolean;
  onRegenerateAudio?: (index: number) => void;
  onDeleteSequence?: (index: number) => void;
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
  onRegenerateAudio = () => {},
  onDeleteSequence = () => {},
  playerRef,
  canDelete,
}: SequenceProps) {

    const wordRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingWordIndex, setEditingWordIndex] = useState<number | null>(null);

    const handleImageClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isMobile && setActiveTabMobile) {
            setActiveTabMobile('settings-sequence');
        }
        setSelectedIndex(index);
    };

    const t = useTranslations('edit.sequence')

    const startWordEditing = useCallback((wordIndex: number) => {
        setOpenDropdownIndex(null);
        setIsEditing(true);
        setEditingWordIndex(wordIndex);
        const element = wordRefs.current[wordIndex];
        if (element) {
            setTimeout(() => {
                element.focus();
            }, 200);
        }
    }, []);

    const handleDropdownChange = (open: boolean, wordIndex: number) => {
        if (isEditing && wordIndex === editingWordIndex) {
            return;
        }
        setOpenDropdownIndex(open ? wordIndex : null);
        setSelectedIndex(index);
        
        if (!open && openDropdownIndex === wordIndex) {
            startWordEditing(wordIndex);
        }
        
        setTimeout(() => {
            if (playerRef?.current && sequence.words[wordIndex]) {
                playerRef.current.seekTo(sequence.words[wordIndex].start * 60);
            }
        }, 50);
    };

    const handleAddWord = useCallback((wordIndex: number) => {
        const newWordIndex = handleWordAdd(index, wordIndex);
        if (newWordIndex !== -1) {
            setTimeout(() => {
                setIsEditing(true);
                setEditingWordIndex(newWordIndex);
                const element = wordRefs.current[newWordIndex];
                if (element) {
                    element.focus();
                    const range = document.createRange();
                    range.selectNodeContents(element);
                    const selection = window.getSelection();
                    if (selection) {
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }
            }, 250);
        }
    }, [index, handleWordAdd]);

    const handleKeyDown = (e: React.KeyboardEvent, wordIndex: number) => {
        if (e.key === 'Enter' || (e.key === ' ' && isEditing)) {
            e.preventDefault();
            const target = e.currentTarget as HTMLDivElement;
            handleWordInputChange(index, wordIndex, target.textContent || '');
            setIsEditing(false);
            setEditingWordIndex(null);
            target.blur();

            if (e.key === ' ') {
                handleAddWord(wordIndex);
            }
        }
    };

    return (
        <>
        <motion.div
            layout="position"
            className={`cursor-pointer`}
            onClick={() => setSelectedIndex(index)}
        >
        <Card key={index} className={`m-2 ${selectedIndex === index ? 'ring-2 ring-primary' : ''}`}>
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
                        <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            {((sequence.end - sequence.start)).toFixed(2)}
                        </Badge>

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
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => onDeleteSequence(index)}
                                        className={cn(
                                            "flex items-center",
                                            canDelete 
                                                ? "cursor-pointer hover:bg-red-200 hover:text-red-600 focus:bg-red-200 focus:text-red-600"
                                                : "cursor-not-allowed opacity-50"
                                        )}
                                        disabled={!canDelete}
                                    >
                                        <Trash2 size={16} />
                                        {canDelete ? t('button-delete') : t('button-delete-disabled')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    
                    {/* Zone de texte qui ne déclenche pas la sélection */}
                    <div className="flex flex-wrap">
                        {sequence.words.map((word, wordIndex) => (
                            <DropdownMenu 
                                key={wordIndex} 
                                open={openDropdownIndex === wordIndex} 
                                onOpenChange={(open) => handleDropdownChange(open, wordIndex)}
                            >
                                <DropdownMenuTrigger 
                                    asChild
                                    disabled={isEditing && editingWordIndex === wordIndex}
                                >
                                    <div className="inline-block">
                                        <div 
                                            ref={(el: HTMLInputElement | null) => {
                                                wordRefs.current[wordIndex] = el;
                                            }}
                                            contentEditable="true"
                                            suppressContentEditableWarning={true}
                                            onBlur={(e) => {
                                                handleWordInputChange(index, wordIndex, e.currentTarget.textContent || '');
                                                setIsEditing(false);
                                                setEditingWordIndex(null);
                                            }}
                                            onKeyDown={(e) => handleKeyDown(e, wordIndex)}
                                            className={cn(
                                                "text-sm sm:text-base px-0.5 py-[0.1rem] sm:py-1",
                                                "hover:ring-1 focus:ring-2 ring-primary rounded transition-all duration-200",
                                                isEditing && editingWordIndex === wordIndex ? "cursor-text" : "cursor-pointer",
                                                openDropdownIndex === wordIndex ? "ring-1 ring-primary" : ""
                                            )}
                                        >
                                            {word.word}
                                        </div>
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                startWordEditing(wordIndex);
                                            }}
                                        >
                                            <Pen size={16} />
                                            {t('edit-word')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleAddWord(wordIndex)}>
                                            <Plus size={16} />
                                            {t('add-word')}
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => handleWordDelete(index, wordIndex)}
                                        className={cn(
                                            "flex items-center cursor-pointer",
                                            "hover:bg-red-200 hover:text-red-600",
                                            "focus:bg-red-200 focus:text-red-600"
                                        )}
                                    >
                                        <Trash2 size={16} />
                                        {t('remove-word')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
        </motion.div>
        </>
    )
}