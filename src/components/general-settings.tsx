import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Camera, Settings2, User2, Languages, Save, Loader2, X } from 'lucide-react'
import { User } from "next-auth"
import { basicApiCall } from "../lib/api"
import { useLocale, useTranslations } from "next-intl"
import { IUser } from "../types/user"
import { getMediaUrlFromFileByPresignedUrl } from "../service/upload.service"

export function GeneralSettings({ user }: { user: User }) {
  const t = useTranslations('general-settings')
  const [isHovering, setIsHovering] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(user.name || '')
  const [language, setLanguage] = useState(user.options?.lang || 'fr')
  const [avatarUrl, setAvatarUrl] = useState(user.image || undefined)
  const [avatarFileInUpload, setAvatarFileInUpload] = useState<File | undefined>(undefined)
  const [originalName, setOriginalName] = useState(user.name || '')
  const [originalLanguage, setOriginalLanguage] = useState(user.options?.lang || 'fr')
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState(user.image || undefined)
  const locale = useLocale()
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploading(true)
    const file = event.target.files?.[0]
    setAvatarFileInUpload(file)
    if (!file) return
    
    try {
      getMediaUrlFromFileByPresignedUrl(file).then(async (response) => {
        setAvatarUrl(response.mediaUrl)
      })
    } catch (error) {
      console.error('Error uploading avatar:', error)
    } finally {
      setAvatarFileInUpload(undefined)
      setIsUploading(false)
    }
  }

  const handleDeleteAvatar = () => {
    setAvatarUrl(undefined)
  }

  const handleSave = async () => {
    setIsLoading(true)
    let updateData: Partial<IUser> = {};
    if (name !== originalName) {
      updateData.name = name
      setOriginalName(name)
    }
    if (language !== originalLanguage) {
      updateData.options = { lang: language }
      setOriginalLanguage(language)
    }
    if (avatarUrl !== originalAvatarUrl) {
      updateData.image = avatarUrl
      setOriginalAvatarUrl(avatarUrl)
    }
    await basicApiCall('/user/update', { updateData })
    setIsLoading(false)
    window.location.reload()
  }

  return (
    <div className="space-y-6 px-12">
      <h2 className="text-2xl font-bold">{t('title')}</h2>

      <div className="flex items-start justify-between h-24">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            <Label htmlFor="avatar" className="text-base">Avatar</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('avatar.description')}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => document.getElementById('avatar-upload')?.click()}
          >
            {t('avatar.change')}
          </Button>
          <Avatar 
            className="h-16 w-16 cursor-pointer relative rounded-lg"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={() => avatarUrl ? handleDeleteAvatar() : document.getElementById('avatar-upload')?.click()}
          >
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg z-10">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
            )}
            {avatarFileInUpload && <AvatarImage src={URL.createObjectURL(avatarFileInUpload)} alt={user.name ?? ''} />}
            {!avatarFileInUpload && (avatarUrl || avatarUrl === undefined) && <AvatarImage src={avatarUrl} alt={user.name ?? ''} />}
            <AvatarFallback className="rounded-lg">{user.name?.charAt(0).toUpperCase() ?? user.email?.charAt(0).toUpperCase() ?? ''}</AvatarFallback>
            {isHovering && !isUploading && avatarUrl === undefined && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <Camera className="h-6 w-6 text-white" />
              </div>
            )}
            {isHovering && !isUploading && avatarUrl !== undefined && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <X className="h-6 w-6 text-white" />
              </div>
            )}
          </Avatar>
        </div>
        <Input 
            type="file" 
            className="hidden" 
            id="avatar-upload" 
            accept="image/*"
            onChange={handleFileChange}
          />
      </div>

      <div className="flex items-start justify-between h-24">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <User2 className="h-4 w-4" />
            <Label htmlFor="name" className="text-base">{t('name.title')}</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('name.description')}
          </p>
        </div>
        <Input id="name" placeholder={t('name.placeholder')} className="w-[250px]" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="flex items-start justify-between h-24">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            <Label htmlFor="language" className="text-base">{t('language.title')}</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('language.description')}
          </p>
        </div>
        <Select onValueChange={(value) => setLanguage(value)} value={language}>
          <SelectTrigger id="language" className="w-[250px]">
            <SelectValue placeholder={t('language.placeholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">{t('language.options.en')}</SelectItem>
            <SelectItem value="fr">{t('language.options.fr')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-start justify-between h-24">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t('save-button')}
        </Button>
      </div>
    </div>
  )
}

