import { Button } from "@/src/components/ui/button"
import { MoreVertical, Check } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { PreviewSubtitle } from "@/src/remotion/previewSubtitle/Composition";

export default function Subtitle({ video, subtitle, setSubtitleStyle }: { video: any, subtitle: any, setSubtitleStyle: any }) {
    const playerRef = useRef<PlayerRef>(null);
    const [isHovering, setIsHovering] = useState(false);
    const handleMouseEnter = useCallback(() => setIsHovering(true), []);
    const handleMouseLeave = useCallback(() => setIsHovering(false), []);

    const isSelected = video.video.subtitle.name === subtitle.name;

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
                <div className="flex items-center justify-center w-full h-full">
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
            <div className="p-2 flex justify-between items-center">
                <span className="ml-2">{subtitle.name}</span>
                <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}