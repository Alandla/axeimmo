import { ISequence } from "@/src/types/video";
import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import SkeletonImage from "../ui/skeleton-image";
import { Clock, Edit, FileImage, Scissors } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import React from "react";
import { Badge } from "../ui/badge";

export default function Sequence({ sequence, index, selectedIndex, setSelectedIndex, handleWordInputChange, onCutSequence}: { sequence: ISequence, index: number, selectedIndex: number, setSelectedIndex: (index: number) => void, handleWordInputChange: (wordIndex: number, newWord: string) => void, onCutSequence: (cutIndex: number) => void }) {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    const handleCutSequence = (cutIndex: number) => {
        cutIndex++
        onCutSequence(cutIndex);
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
                    <div className="relative">  
                        {sequence.media?.image ? (
                            <SkeletonImage
                                src={typeof sequence.media.image === 'string' ? sequence.media.image : sequence.media.image.link}
                                height={1200}
                                width={630}
                                alt={sequence.text}
                                className='w-24 h-24 rounded-md object-cover opacity-100 hover:opacity-50'
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-md bg-gray-200 flex items-center justify-center">
                                <FileImage className="text-gray-400 text-3xl" />
                            </div>
                        )}
                        <div className="absolute rounded-md inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                            <Edit className="text-white text-xl" />
                        </div>
                    </div>
                </div>

                {/* Contenu à droite de l'image */}
                <div className="flex-1 space-y-2 ml-4">
                    <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        {((sequence.end - sequence.start)).toFixed(2)}
                    </Badge>
                    
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
                                    onBlur={(e) => handleWordInputChange(wordIndex, e.currentTarget.textContent || '')}
                                    className="px-0.5 py-1 hover:ring-1 focus:ring-2 ring-primary rounded transition-all duration-200"
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