'use client'

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IMedia, ISequence } from '@/src/types/video';
import { Trash2 } from 'lucide-react';
import SkeletonVideo from './skeleton-video';
import SkeletonImage from './skeleton-image';
import { useToast } from '@/src/hooks/use-toast';
import { Button } from './button';
import ModalConfirmDeleteAsset from '../modal/confirm-delete-asset';
import { basicApiCall } from '@/src/lib/api';
import { useTranslations } from 'next-intl';

const MediaItem = ({ sequence, sequenceIndex, spaceId, media, source = 'aws', canRemove = false, setSequenceMedia, onDeleteMedia = () => {} }: { sequence: ISequence, sequenceIndex: number, spaceId?: string, media: IMedia, source?: 'aws' | 'web', canRemove?: boolean, setSequenceMedia: (sequenceIndex: number, media: IMedia) => void, onDeleteMedia?: (media: IMedia) => void }) => {
    const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth > 768);
    const [showModalDelete, setShowModalDelete] = useState(false);
    const t = useTranslations('assets')
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

    const handleDelete = async (media: IMedia) => {
        console.log('handleDelete', media)
        if ((media.type === 'video' && media.video?.link === sequence.media?.video?.link) || (media.type === 'image' && media.image?.link === sequence.media?.image?.link)) {
            toast({
                title: 'You cannot delete the selected media',
                description: 'Please select another media before',
                variant: 'destructive'
            })
        } else {
            setShowModalDelete(true);
        }
    }

    const handleDeleteMedia = async (mediaToDelete: IMedia) => {
        try {
          await basicApiCall('/media/delete', {
            media: mediaToDelete,
            spaceId: spaceId
          })
    
          onDeleteMedia?.(mediaToDelete)
          
          toast({
            title: t('toast.deleted'),
            description: t('toast.deleted-description'),
            variant: "confirm",
          })
        } catch (error) {
          console.error('Error deleting media:', error)
          toast({
            title: t('toast.error'),
            description: t('toast.error-deleted-description'),
            variant: "destructive",
          })
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
        <>
        <ModalConfirmDeleteAsset
            isOpen={showModalDelete}
            setIsOpen={setShowModalDelete}
            media={media}
            handleDeleteAsset={handleDeleteMedia}
        />
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
                    className={`w-full h-fit rounded-md object-cover ${media.video?.link === sequence.media?.video?.link ? 'border-2 border-primary rounded-lg' : ''}`}
                />
            ) : (
                <SkeletonImage
                    src={media.image?.link || ''}
                    alt={media.name}
                    width={media.image?.width || 100}
                    height={media.image?.height || 100}
                    className={`w-full h-fit rounded-md object-cover ${media.image?.link === sequence.media?.image?.link ? 'border-2 border-primary rounded-md' : ''}`}
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
                <motion.div 
                    className="absolute top-2 right-2"
                    variants={buttonAnimation}
                >
                    <Button size="iconRounded" className="hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200" onClick={(e) => {
                        e.stopPropagation(); // Empêche l'événement de clic du média d'être déclenché
                        handleDelete(media);
                    }}>
                        <Trash2 size={16} />
                    </Button>
                </motion.div>
            )}
        </motion.div>
        </>
    );
};

export default MediaItem;