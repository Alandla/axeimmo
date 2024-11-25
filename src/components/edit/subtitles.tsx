import { subtitles } from "@/src/config/subtitles.config"
import Subtitle from "./subtitle"

export default function Subtitles({ video, setSubtitleStyle }: { video: any, setSubtitleStyle: any }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subtitles.map((subtitle: any) => (
                <Subtitle video={video} subtitle={subtitle} setSubtitleStyle={setSubtitleStyle} />
            ))}
        </div>
    )
}