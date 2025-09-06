'use client'

import { Paperclip, Upload, FolderOpen, ImageIcon } from "lucide-react"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { useTranslations } from "next-intl"
import { useState } from "react"

interface UploadDropdownProps {
  onFileUpload: () => void
  onAssetSelect: () => void
  disabled?: boolean
}

export function UploadDropdown({ onFileUpload, onAssetSelect, disabled = false }: UploadDropdownProps) {
  const t = useTranslations('upload-dropdown')
  const [open, setOpen] = useState(false)

  const handleAssetSelect = () => {
    setOpen(false) // Fermer le dropdown d'abord
    onAssetSelect()
  }

  const handleFileUpload = () => {
    setOpen(false) // Fermer le dropdown d'abord
    onFileUpload()
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          disabled={disabled}
          className="h-7 w-7"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={handleFileUpload}>
          <Upload className="h-4 w-4" />
          {t('upload-files')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleAssetSelect}>
          <ImageIcon className="h-4 w-4" />
          {t('select-assets')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
