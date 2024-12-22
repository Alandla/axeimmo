import { ISequence } from "@/src/types/video";
import { Card, CardContent } from "../ui/card";
import SkeletonImage from "../ui/skeleton-image";
import { Clock, Edit, FileImage, Scissors, AlertTriangle, MoreVertical, Trash2 } from "lucide-react";
import { motion } from 'framer-motion';
import React from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Trash, RefreshCw } from "lucide-react"
import { cn } from "@/src/lib/utils";

interface SequenceProps {
  sequence: ISequence;
  index: number;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  handleWordInputChange: (sequenceIndex: number, wordIndex: number, newWord: string) => void;
  onCutSequence: (cutIndex: number) => void;
  setActiveTabMobile?: (tab: string) => void;
  isMobile?: boolean;
  needsAudioRegeneration?: boolean;
  onRegenerateAudio?: (index: number) => void;
  onDeleteSequence?: (index: number) => void;
}

export default function Sequence({ 
  sequence, 
  index, 
  selectedIndex, 
  setSelectedIndex, 
  handleWordInputChange, 
  onCutSequence,
  setActiveTabMobile,
  isMobile = false,
  onRegenerateAudio = () => {},
  onDeleteSequence = () => {},
}: SequenceProps) {

    const handleImageClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isMobile && setActiveTabMobile) {
            setActiveTabMobile('settings-sequence');
        }
        setSelectedIndex(index);
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
                                <Badge variant="destructive">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Régénération audio nécessaire
                                </Badge>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div className="flex items-center hover:bg-accent rounded-md p-1 cursor-pointer transition-all duration-200">
                                        <MoreVertical className="w-4 h-4" />
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                    align="end"
                                    sideOffset={4}
                                >
                                    <DropdownMenuItem 
                                        onClick={() => onRegenerateAudio(index)}
                                        className="cursor-pointer"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Régénérer l'audio
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                    onClick={() => onDeleteSequence(index)}
                                    className={cn(
                                        "flex items-center cursor-pointer",
                                        "hover:bg-red-200 hover:text-red-600",
                                        "focus:bg-red-200 focus:text-red-600"
                                    )}
                                    >
                                    <Trash2 />
                                    Supprimer la séquence
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    
                    {/* Zone de texte qui ne déclenche pas la sélection */}
                    <div className="flex flex-wrap">
                        {sequence.words.map((word, wordIndex) => (
                            <div 
                                key={wordIndex} 
                                className="inline-block"
                            >
                                <div 
                                    contentEditable="true"
                                    suppressContentEditableWarning={true}
                                    onBlur={(e) => handleWordInputChange(index, wordIndex, e.currentTarget.textContent || '')}
                                    className="text-sm sm:text-base px-0.5 py-[0.1rem] sm:py-1 hover:ring-1 focus:ring-2 ring-primary rounded transition-all duration-200"
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