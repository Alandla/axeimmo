import { ITransition } from "@/src/types/video";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { MoreVertical, Pen, Trash2 } from "lucide-react";
import { motion } from 'framer-motion';
import { useTranslations } from "next-intl";
import SkeletonVideo from "../ui/skeleton-video";
import SkeletonVideoFrame from "../ui/skeleton-video-frame";
import SkeletonImage from "../ui/skeleton-image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "@/src/lib/utils";

interface TransitionProps {
  transition: ITransition;
  index: number;
  sequenceThumbnail: string;
  sequenceVideoUrl?: string;
  sequenceStartAt?: number;
  sequenceFrames?: string[];
  onDeleteTransition: (index: number) => void;
  selectedIndex?: number;
  setSelectedIndex?: (index: number) => void;
  setActiveTabMobile?: (tab: string) => void;
  isMobile?: boolean;
}

export default function Transition({ 
  transition,
  index,
  sequenceThumbnail,
  sequenceVideoUrl,
  sequenceStartAt,
  sequenceFrames,
  onDeleteTransition,
  selectedIndex,
  setSelectedIndex,
  setActiveTabMobile,
  isMobile
}: TransitionProps) {
  const t = useTranslations('edit.transition')
  const isSelected = selectedIndex === index;

  const handleEdit = () => {
    if (isMobile && setActiveTabMobile) {
      setActiveTabMobile('settings-transition');
    }
    setSelectedIndex?.(index);
  };

  return (
    <motion.div
      layout="position"
      className="cursor-pointer"
      onClick={() => setSelectedIndex?.(index)}
    >
      <Card className={`m-2 transition-card relative h-11 overflow-hidden ${isSelected ? 'ring-2 ring-primary' : ''}`}>
        <div 
          className="absolute inset-0 w-full h-11 mix-blend-lighten bg-center z-10"
          style={{ backgroundImage: `url(${transition.thumbnail})`}}
        />
        
        {sequenceThumbnail ? (
          <div 
            className="absolute inset-0 w-full h-11 bg-center blur-sm scale-125"
            style={{ backgroundImage: `url(${sequenceThumbnail})`}}
          />
        ) : sequenceVideoUrl ? (
          <div className="absolute inset-0 w-full h-11 overflow-hidden">
            {/* Si on a un média vidéo avec startAt à 0 et des frames disponibles, utiliser la première frame */}
            {sequenceStartAt === 0 && sequenceFrames && sequenceFrames.length > 0 ? (
              <SkeletonImage
                src={sequenceFrames[0]}
                height={400}
                width={400}
                alt="Sequence background"
                className="w-full h-11 object-cover blur-sm scale-125"
              />
            ) : (
              <SkeletonVideoFrame
                srcVideo={sequenceVideoUrl}
                className="w-full h-11 object-cover blur-sm scale-125"
                startAt={0}
              />
            )}
          </div>
        ) : null}

        <CardContent className="flex items-center justify-between p-2 relative z-10">
          <Badge variant="outline" className={"bg-white"}>
            {t('transition')} {index + 1}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className={cn("flex items-center bg-white bg-opacity-50 hover:bg-accent hover:bg-opacity-100 rounded-md p-1 cursor-pointer transition-all duration-200", isSelected && "bg-accent bg-opacity-100")}>
                    <MoreVertical className="w-4 h-4" />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-48 rounded-lg"
                align="end"
                sideOffset={4}
            >
                {isMobile && (
                    <>
                        <DropdownMenuItem 
                            onClick={handleEdit}
                            className="cursor-pointer"
                        >
                            <Pen size={16} />
                            {t('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}
                <DropdownMenuItem
                    className={cn(
                    "flex items-center text-destructive cursor-pointer hover:bg-red-200 hover:text-destructive focus:bg-red-200 focus:text-destructive"
                    )}
                    onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTransition(index);
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                    {t('delete')}
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>
    </motion.div>
  )
} 