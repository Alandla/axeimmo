'use client'

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IMedia, ISequence } from '@/src/types/video';
import { Trash2 } from 'lucide-react';
import SkeletonVideo from './skeleton-video';
import SkeletonImage from './skeleton-image';
import { useToast } from '@/src/hooks/use-toast';

const MediaItem = ({ sequence, sequenceIndex, media, source = 'aws', canRemove = false, setShowModalRemoveMedia, setSequenceMedia }: { sequence: ISequence, sequenceIndex: number, media: IMedia, source?: 'aws' | 'web', canRemove?: boolean, setShowModalRemoveMedia: (show: boolean) => void, setSequenceMedia: (sequenceIndex: number, media: IMedia) => void }) => {
    const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth > 768);
    const { toast } = useToast()

    // Définition des animations pour le conteneur parent
    const container = {
        hidden: {},
        visible: {}
    };

    useEffect(() => {
        const handleResize = () => {
            setIsLargeScreen(window.innerWidth > 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleDelete = async () => {
        if ((media.type === 'video' && media.video?.link === sequence.media?.video?.link) || (media.type === 'image' && media.image?.link === sequence.media?.image?.link)) {
            toast({
                title: 'You cannot delete the selected media',
                description: 'Please select another media before',
                variant: 'destructive'
            })
        } else {
            setShowModalRemoveMedia(true);
        }
    }

    // Définition des animations pour le nom et le bouton
    const itemAnimation = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.25 } }
    };

    const buttonAnimation = {
        hidden: { y: -20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.25 } }
    };

    return (
        <motion.div 
            className={`group relative overflow-hidden mb-4 break-inside-avoid cursor-pointer`}
            variants={container}
            initial={isLargeScreen ? "hidden" : "visible"}
            whileHover={isLargeScreen ? "visible" : ""}
            onClick={() => setSequenceMedia(sequenceIndex, media)}
        >
            <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-1/4 bg-gradient-to-t from-black to-transparent rounded-lg z-1"></div>

            {media.type === 'video' ? (
                <SkeletonVideo
                    srcImg={media.image?.link || ''}
                    srcVideo={media.video?.link || ''}
                    alt={media.name}
                    className={`w-full h-auto rounded-md object-cover ${media.video?.link === sequence.media?.video?.link ? 'border-2 border-primary rounded-lg' : ''}`}
                />
            ) : (
                <SkeletonImage
                    src={media.image?.link || ''}
                    alt={media.name}
                    width={media.image?.width || 100}
                    height={media.image?.height || 100}
                    className={`w-full h-auto rounded-md object-cover ${media.image?.link === sequence.media?.image?.link ? 'border-2 border-primary rounded-md' : ''}`}
                    unoptimized={source === 'web'}
                />
            )}
            <motion.div
                className="absolute bottom-0 left-0 bg-opacity-50 p-2 text-sm text-white"
                variants={itemAnimation}
            >
                {media.name}
            </motion.div>
            {canRemove && (
                <motion.button 
                    className="btn btn-circle btn-sm absolute top-0 right-0 bg-black bg-opacity-50 hover:bg-error text-white m-2"
                    variants={buttonAnimation}
                    onClick={(e) => {
                        e.stopPropagation(); // Empêche l'événement de clic du média d'être déclenché
                        handleDelete();
                    }}
                >
                    <Trash2 size={16} />
                </motion.button>
            )}
        </motion.div>
    );
};

export default MediaItem;