import { subtitles } from "@/src/config/subtitles.config"
import Subtitle from "./subtitle"
import { useEffect, useState } from "react"
import { ISpaceSubtitleStyle } from "@/src/types/space"
import { basicApiCall, basicApiGetCall } from "@/src/lib/api"
import { useSubtitleStyleStore } from "@/src/store/subtitlesStyleSore"
import { useToast } from "@/src/hooks/use-toast"
import { useTranslations } from "next-intl"
import { Settings } from "lucide-react"
import { Button } from "../ui/button"

export default function Subtitles({ video, setSubtitleStyle, setActiveTabMobile, isMobile = false }: { video: any, setSubtitleStyle: any, setActiveTabMobile?: (tab: string) => void, isMobile?: boolean }) {
    const { subtitleStyles, setSubtitleStyles } = useSubtitleStyleStore()
    const { toast } = useToast()
    const t = useTranslations('edit.subtitle')

    const handleChangeMobileTab = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isMobile && setActiveTabMobile) {
            setActiveTabMobile('settings-subtitle');
        }
    };

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
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">{t('title-presets-space')}</h3>
                        {isMobile && (
                            <Button size="icon" variant="outline" onClick={handleChangeMobileTab}>
                                <Settings size={16} />
                            </Button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {subtitleStyles.map((subtitleStyle: ISpaceSubtitleStyle, index: number) => (
                            <Subtitle key={index} video={video} subtitle={subtitleStyle} setSubtitleStyle={setSubtitleStyle} canEdit={true} handleDelete={deleteSubtitleStyle} handleUpdate={updateSubtitleStyle} />
                        ))}
                    </div>
                </>
            )}
            {(subtitleStyles || isMobile) && (
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{t('title-presets')}</h3>
                    {isMobile && !subtitleStyles?.length && (
                        <Button size="icon" variant="outline" onClick={handleChangeMobileTab}>
                            <Settings size={16} />
                        </Button>
                    )}
                </div>
            )}
            <div className="grid grid-cols-2 gap-4">
                {subtitles.map((subtitle: any, index: number) => (
                    <Subtitle key={index} video={video} subtitle={subtitle} setSubtitleStyle={setSubtitleStyle} />
                ))}
            </div>
        </>
    )
}