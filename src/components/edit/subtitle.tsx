import { Button } from "@/src/components/ui/button"
import { MoreVertical, Check, Pencil, Trash2, FileEdit, ArrowUp } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { PreviewSubtitle } from "@/src/remotion/previewSubtitle/Composition";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import { cn } from "@/src/lib/utils";
import { useTranslations } from "next-intl";

export default function Subtitle({ video, subtitle, setSubtitleStyle, canEdit = false, handleDelete, handleUpdate }: { video: any, subtitle: any, setSubtitleStyle: any, canEdit?: boolean, handleDelete?: any, handleUpdate?: any }) {
    const t = useTranslations('edit.subtitle')
    const playerRef = useRef<PlayerRef>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(subtitle.name);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleMouseEnter = useCallback(() => setIsHovering(true), []);
    const handleMouseLeave = useCallback(() => setIsHovering(false), []);

    const isSelected = video.video.subtitle.id === subtitle.id;

    useEffect(() => {
        if (playerRef.current) {
            if (isHovering) {
                playerRef.current.play();
            } else {
                playerRef.current.seekTo(5);
                playerRef.current.pause();
            }
        }
    }, [isHovering]);

    const handleNameSave = useCallback(() => {
        setIsEditing(false);
        if (editedName !== subtitle.name) {
            subtitle.name = editedName
            handleUpdate(subtitle.id, { ...subtitle, name: editedName });
        }
    }, [editedName, subtitle, handleUpdate]);

    return (
        <div 
            key={subtitle.id} 
            className={`border rounded-lg overflow-hidden hover:cursor-pointer relative
                ${isSelected ? 'border-primary' : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => setSubtitleStyle(subtitle)}
        >
            {isSelected && (
                <Check className="h-4 w-4 text-primary absolute top-2 right-2 z-10" />
            )}

            {/* Preview area - à implémenter plus tard */}
            <div className="w-full h-24 bg-gray-100">
                <div className="flex items-center justify-center w-full h-full overflow-hidden">
                    <Player
                        ref={playerRef}
                        component={PreviewSubtitle}
                        durationInFrames={500}
                        compositionWidth={1080}
                        compositionHeight={500}
                        fps={60}
                        inputProps={{
                            data: video,
                            subtitle: subtitle,
                        }}
                        loop
                        controls={false}
                    />
                </div>
            </div>
            
            {/* Bottom section with name and settings */}
            
            <div className="p-2 h-14 flex justify-between items-center">
                {canEdit && isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onBlur={handleNameSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                        className="ml-2 border-0 border-b border-b-input focus:outline-none focus:ring-0"
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                    />
                ) : (
                    <span 
                        className={cn("ml-2", canEdit && "cursor-text")}
                        onClick={(e) => {
                            if (canEdit) {
                                e.stopPropagation();
                                setIsEditing(true);
                            }
                        }}
                    >
                        {subtitle.name}
                    </span>
                )}
                {canEdit && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdate(subtitle.id, video.video.subtitle);
                                }} 
                                className="flex items-center"
                            >
                                <ArrowUp className="h-4 w-4" />
                                {t('update')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(subtitle.id);
                                }}
                                className={cn(
                                    "flex items-center",
                                    "hover:bg-red-200 hover:text-red-600",
                                    "focus:bg-red-200 focus:text-red-600"
                                )}
                            >
                                <Trash2 className="h-4 w-4" />
                                {t('delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    )
}