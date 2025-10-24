"use client"

import { useOnboardingStore } from "@/src/store/onboardingStore"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Upload, X } from "lucide-react"

interface Step9Props {
  errors?: Record<string, boolean>
}

export default function Step9LogoUpload({ errors = {} }: Step9Props) {
  const { logoUrl, updateLogoUrl } = useOnboardingStore();
  const t = useTranslations('onboarding.step9');
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      await updateLogoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const removeLogo = async () => {
    await updateLogoUrl("");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('title')}</h2>
      <p className="text-gray-600">{t('subtitle')}</p>

      <div className="space-y-4">
        {logoUrl ? (
          <div className="relative">
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="w-32 h-32 object-contain border border-gray-200 rounded-lg mx-auto"
            />
            <button
              onClick={removeLogo}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? "border-primary bg-primary/5" 
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">{t('upload-text')}</p>
            <p className="text-sm text-gray-400 mb-4">{t('upload-formats')}</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              className="inline-block bg-primary text-black px-4 py-2 rounded-lg cursor-pointer hover:bg-primary/90"
            >
              {t('choose-file')}
            </label>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-500 text-center">
        {t('optional-note')}
      </div>
    </div>
  )
}
