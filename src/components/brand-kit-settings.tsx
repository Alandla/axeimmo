import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Switch } from "@/src/components/ui/switch"
import { Camera, Save, Loader2, X, Image } from 'lucide-react'
import { useTranslations } from "next-intl"
import { useActiveSpaceStore } from "@/src/store/activeSpaceStore"
import { basicApiCall } from "../lib/api"
import { useToast } from "../hooks/use-toast"
import { getMediaUrlFromFileByPresignedUrl } from "../service/upload.service"
import { SimpleSpace } from "../types/space"
import { LogoPositionSelector } from "@/src/components/ui/logo-position-selector"

type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'middle-left' | 'middle-right'

export function BrandKitSettings() {
  const t = useTranslations('settings.brand-kit')
  const tErrors = useTranslations('errors')
  const { activeSpace, setActiveSpace } = useActiveSpaceStore()
  const { toast } = useToast()
  const [isHovering, setIsHovering] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState(activeSpace?.logoUrl || undefined)
  const [logoFileInUpload, setLogoFileInUpload] = useState<File | undefined>(undefined)
  const [originalLogoUrl, setOriginalLogoUrl] = useState(activeSpace?.logoUrl || undefined)
  const [logoPosition, setLogoPosition] = useState<LogoPosition>(activeSpace?.logoPosition || 'bottom-right')
  const [originalLogoPosition, setOriginalLogoPosition] = useState<LogoPosition>(activeSpace?.logoPosition || 'bottom-right')
  const [showLogo, setShowLogo] = useState(activeSpace?.showLogo ?? true)
  const [originalShowLogo, setOriginalShowLogo] = useState(activeSpace?.showLogo ?? true)

  useEffect(() => {
    setOriginalLogoUrl(activeSpace?.logoUrl || undefined)
    setOriginalLogoPosition(activeSpace?.logoPosition || 'bottom-right')
    setOriginalShowLogo(activeSpace?.showLogo ?? true)
    setLogoUrl(activeSpace?.logoUrl || undefined)
    setLogoPosition(activeSpace?.logoPosition || 'bottom-right')
    setShowLogo(activeSpace?.showLogo ?? true)
  }, [activeSpace])
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploading(true)
    const file = event.target.files?.[0]
    setLogoFileInUpload(file)
    if (!file) return
    
    try {
      getMediaUrlFromFileByPresignedUrl(file).then(async (response) => {
        setLogoUrl(response.mediaUrl)
      })
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast({
        title: tErrors('generic-title'),
        description: tErrors('generic-description'),
        variant: "destructive",
      })
    } finally {
      setLogoFileInUpload(undefined)
      setIsUploading(false)
    }
  }

  const handleDeleteLogo = () => {
    setLogoUrl(undefined)
  }

  const handleSave = async () => {
    if (!activeSpace) return
    setIsLoading(true)
    
    try {
      const updatedSpace: SimpleSpace = await basicApiCall(`/space/${activeSpace.id}`, {
        logoUrl: logoUrl,
        logoPosition: logoPosition,
        showLogo: showLogo
      })
      setActiveSpace(updatedSpace)
      setOriginalLogoUrl(logoUrl)
      setOriginalLogoPosition(logoPosition)
      setOriginalShowLogo(showLogo)
      toast({
        title: t('update-success-title'),
        description: t('update-success-description'),
        variant: "confirm",
      })
    } catch (error) {
      toast({
        title: tErrors('generic-title'),
        description: tErrors('generic-description'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const hasChanges = logoUrl !== originalLogoUrl || logoPosition !== originalLogoPosition || showLogo !== originalShowLogo

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-start justify-between sm:h-24">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              <Label htmlFor="logo" className="text-base">{t('logo.title')}</Label>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t('logo.description')}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="hidden sm:block"
              onClick={() => document.getElementById('logo-upload')?.click()}
            >
              {t('logo.change')}
            </Button>
            <Avatar 
              className="h-16 w-16 cursor-pointer relative rounded-lg"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onClick={() => logoUrl ? handleDeleteLogo() : document.getElementById('logo-upload')?.click()}
            >
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg z-10">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
              {logoFileInUpload && <AvatarImage src={URL.createObjectURL(logoFileInUpload)} alt="Logo" />}
              {!logoFileInUpload && logoUrl && <AvatarImage src={logoUrl} alt="Logo" />}
              <AvatarFallback className="rounded-lg">
                <Image className="h-6 w-6" />
              </AvatarFallback>
              {isHovering && !isUploading && !logoUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              )}
              {isHovering && !isUploading && logoUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                  <X className="h-6 w-6 text-white" />
                </div>
              )}
            </Avatar>
          </div>
          <Input 
            type="file" 
            className="hidden" 
            id="logo-upload" 
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        {logoUrl && (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">{t('logo.show')}</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('logo.show-description')}
                </p>
              </div>
              <Switch
                checked={showLogo}
                onCheckedChange={setShowLogo}
              />
            </div>

            {showLogo && (
              <LogoPositionSelector
                value={logoPosition}
                onChange={setLogoPosition}
              />
            )}
          </>
        )}

        <div className="flex items-start justify-between h-24">
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !hasChanges} 
            className="w-full sm:w-auto"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t('save-button')}
          </Button>
        </div>
      </div>
    </div>
  )
} 