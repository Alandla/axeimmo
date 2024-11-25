import { subtitles } from "@/src/config/subtitles.config"
import Subtitle from "./subtitle"
import { useEffect, useState } from "react"
import { ISpaceSubtitleStyle } from "@/src/types/space"
import { basicApiCall, basicApiGetCall } from "@/src/lib/api"
import { useSubtitleStyleStore } from "@/src/store/subtitlesStyleSore"
import { useToast } from "@/src/hooks/use-toast"
import { useTranslations } from "next-intl"

export default function Subtitles({ video, setSubtitleStyle }: { video: any, setSubtitleStyle: any }) {
    const { subtitleStyles, setSubtitleStyles } = useSubtitleStyleStore()
    const { toast } = useToast()
    const t = useTranslations('edit.subtitle')

    useEffect(() => {
        const fetchSpaceSubtitleStyles = async () => {
            if (video?.spaceId && !subtitleStyles) {
                const spaceSubtitleStyles = await basicApiGetCall<ISpaceSubtitleStyle[]>(`/space/${video.spaceId}/getSubtitleStyles`)
                setSubtitleStyles(spaceSubtitleStyles)
            }
        }

        if (video?.spaceId) {
            fetchSpaceSubtitleStyles()
        }
    }, [video])

    const updateSubtitleStyle = async (subtitleStyleId: string, subtitleStyle: ISpaceSubtitleStyle) => {
        const response : ISpaceSubtitleStyle[]= await basicApiCall(`/space/subtitleStyle/update`, { spaceId: video.spaceId, subtitleStyleId, subtitleStyle })
        if (response) {
            setSubtitleStyles(response)
            toast({
                title: t('toast.title-saved'),
                description: t('toast.description-saved'),
                variant: 'confirm',
            })
        }
    }

    const deleteSubtitleStyle = async (subtitleStyleId: string) => {
        const response : ISpaceSubtitleStyle[]= await basicApiCall(`/space/subtitleStyle/delete`, { spaceId: video.spaceId, subtitleStyleId })
        if (response) {
            setSubtitleStyles(response)
            toast({
                title: t('toast.title-saved'),
                description: t('toast.description-saved'),
                variant: 'confirm',
            })
        }
    }
    
    return (
        <>
            {subtitleStyles && subtitleStyles.length > 0 && (
                <>
                    <h3 className="text-lg font-semibold mb-2">{t('title-presets-space')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {subtitleStyles.map((subtitleStyle: ISpaceSubtitleStyle, index: number) => (
                            <Subtitle key={index} video={video} subtitle={subtitleStyle} setSubtitleStyle={setSubtitleStyle} canEdit={true} handleDelete={deleteSubtitleStyle} handleUpdate={updateSubtitleStyle} />
                        ))}
                    </div>
                </>
            )}
            {subtitleStyles && <h3 className="text-lg font-semibold mb-2">{t('title-presets')}</h3>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subtitles.map((subtitle: any, index: number) => (
                    <Subtitle key={index} video={video} subtitle={subtitle} setSubtitleStyle={setSubtitleStyle} />
                ))}
            </div>
        </>
    )
}