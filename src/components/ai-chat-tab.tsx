import { Check, Paperclip, Send, Globe, X, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import SelectDuration, { DurationOption } from "./ui/select/select-duration";
import { useState, useEffect } from "react";
import { CreationStep, PlanName } from "../types/enums";
import { useTranslations } from "next-intl";
import { useCreationStore } from "../store/creationStore";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "./ui/tooltip";
import { FileOrAssetPreview } from "./file-or-asset-preview";
import { FileToUpload, AssetToUpload, FileOrAssetToUpload } from "../types/files";
import { UploadDropdown } from "./upload-dropdown";
import { AssetSelectionModal } from "./modal/asset-selection-modal";
import { Badge } from "./ui/badge";
import { useActiveSpaceStore } from "../store/activeSpaceStore";
import { usePremiumToast } from "@/src/utils/premium-toast";
import { Alert, AlertDescription } from "./ui/alert";
import { calculateAnimationCost } from "../lib/video-estimation";
import VideoFormatSelector from "./edit/video-format-selector";

export function AiChatTab({ 
  creationStep, 
  sendMessage, 
  handleConfirmAvatar, 
  handleConfirmVoice,
  handleConfirmImages,
  isDisabled = false,
  inputMessage,
  setInputMessage
}: { 
  creationStep: CreationStep, 
  sendMessage: (message: string, duration: number) => void, 
  handleConfirmAvatar: () => void, 
  handleConfirmVoice: () => void,
  handleConfirmImages?: () => void,
  isDisabled?: boolean,
  inputMessage: string,
  setInputMessage: (message: string) => void
}) {
    const { files, selectedVoice, selectedLook, setFiles, isWebMode, setWebMode, extractedImagesMedia, animationMode, setAnimateImages, script, videoFormat, setVideoFormat } = useCreationStore()
    const { activeSpace } = useActiveSpaceStore()
    const { showPremiumToast } = usePremiumToast()
    const [isDragging, setIsDragging] = useState(false);
    const t = useTranslations('ai');
    const pricingT = useTranslations('pricing');
    const planT = useTranslations('plan');
    const durationT = useTranslations('select.duration');
    const [videoDuration, setVideoDuration] = useState<DurationOption | undefined>({ name: durationT('options.30-seconds'), value: 30, requiredPlan: PlanName.FREE });
    const [showAssetModal, setShowAssetModal] = useState(false);

    // Function to detect URLs in text
    const detectUrls = (text: string): boolean => {
        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.[a-z]{2,})/gi;
        return urlRegex.test(text);
    };

    // Check if current plan is FREE and if URL is detected
    const isUrlDetected = detectUrls(inputMessage);
    const shouldShowUrlWarning = isUrlDetected && 
        (activeSpace?.planName === PlanName.FREE);

    const adjustTextareaHeight = (event: React.FormEvent<HTMLTextAreaElement>) => {
      const target = event.target as HTMLTextAreaElement;
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
    }

    useEffect(() => {
      const textarea = document.getElementById('ai-chat-textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [inputMessage]);

    const handleSendMessage = (message: string, duration: number) => {
        setInputMessage('')
        sendMessage(message, duration)
    }

    const handleFileUpload = (newFiles: File[]) => {
      console.log('newFiles', newFiles)
      const updatedFiles: FileToUpload[] = newFiles.map(file => {
        let usage: "voice" | "avatar" | "media" = "media";
        if (file.type.startsWith('audio/')) {
          usage = "voice";
        }
        const type = file.type.startsWith('image/') ? "image" : file.type.startsWith('video/') ? "video" : "audio";
        return {
          file,
          type,
          usage,
        };
      });
      console.log('updatedFiles', updatedFiles)
      setFiles([...files, ...updatedFiles]);
    };

    const hasUsage = (usage: "voice" | "avatar" | "media" | "element") => {
      return files.some(file => file.usage === usage);
    };

    const hasVideoAvatar = () => {
      return files.some(file => file.usage === "avatar" && file.type === "video");
    };

    const handleFileUsageChange = (fileIndex: number, newUsage: "voice" | "avatar" | "media" | "element") => {
      setFiles(files.map((file, index) => 
        index === fileIndex ? { ...file, usage: newUsage } : file
      ));
    };

    const handleFileRemove = (fileIndex: number) => {
      setFiles(files.filter((_, index) => index !== fileIndex));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        handleFileUpload(filterFiles(droppedFiles));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const filterFiles = (files: File[]) => {
        const hasVoice = files.some(file => file.type === "voice");
        const filteredFiles = hasVoice ? files.filter(file => !file.type.startsWith('audio/')) : files;
        
        return filteredFiles.filter(file => {
            if (file.type.startsWith('image/')) {
                return !['image/avif', 'image/webp'].includes(file.type);
            }
            return true;
        });
    };

    const handleWebModeClick = () => {
      if (!isDisabled) {
        if (activeSpace?.planName === PlanName.FREE) {
          showPremiumToast(
            pricingT('premium-toast.title'),
            pricingT('premium-toast.description', { plan: planT(PlanName.START) }),
            pricingT('upgrade')
          );
        } else {
          setWebMode(!isWebMode);
        }
      }
    };

    const handleUpgradeClick = () => {
      window.open('/dashboard/pricing', '_blank');
    };

    return (
        <div className="w-full max-w-xl">
          {creationStep === CreationStep.START ? (
            <>
              {shouldShowUrlWarning && (
                <Alert className="mb-4 border-amber-200 bg-amber-50">
                  <AlertDescription className="flex items-center justify-between">
                    <div className="flex-1">
                      <strong className="font-medium text-amber-800">{t('url-detected.title')}</strong>
                      <p className="text-amber-700 mt-1">{t('url-detected.description')}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUpgradeClick}
                      className="ml-4 border-amber-300 text-amber-800 hover:bg-amber-100"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t('url-detected.upgrade')}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              <div 
                className={`relative rounded-lg`}
                onDrop={!isDisabled ? handleDrop : undefined}
                onDragOver={!isDisabled ? handleDragOver : undefined}
                onDragLeave={!isDisabled ? handleDragLeave : undefined}
              >
              <div className={`relative rounded-lg border p-2 ${isDragging ? 'border-dashed border-2 border-gray-300' : ''} ${isDisabled ? 'opacity-60' : ''}`}>
                {isDragging && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/50 z-10">
                    <Paperclip className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                
                {files.length > 0 && (
                  <div className="overflow-x-auto mb-2">
                    <div className="flex gap-4">
                      {files.map((file, index) => (
                        <FileOrAssetPreview
                          key={index}
                          item={file}
                          usage={file.usage}
                          onUsageChange={(newUsage) => !isDisabled && handleFileUsageChange(index, newUsage)}
                          onRemove={() => !isDisabled && handleFileRemove(index)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <Textarea
                  id='ai-chat-textarea'
                  placeholder={t('placeholder.start')}
                  value={inputMessage}
                  onChange={(e) => {
                    !isDisabled && setInputMessage(e.target.value);
                    !isDisabled && adjustTextareaHeight(e);
                  }}
                  disabled={isDisabled || files.some(file => file.usage === "voice" || hasVideoAvatar())}
                  onInput={!isDisabled ? adjustTextareaHeight : undefined}
                  className={`w-full mb-2 border-none shadow-none focus:ring-0 resize-none ${isDragging ? 'opacity-50' : ''}`}
                  rows={1}
                  variant="no-focus-border"
                  onKeyDown={(e) => {
                    if (!isDisabled && e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(inputMessage, videoDuration?.value || 30);
                    }
                  }}
                />
                <div className={`flex justify-between ${isDragging ? 'opacity-50' : ''}`}>
                  <div className="flex items-end">
                    <UploadDropdown
                      onFileUpload={() => document.getElementById('file-input')?.click()}
                      onAssetSelect={() => setShowAssetModal(true)}
                      disabled={isDisabled}
                    />
                    <div className="flex h-7 items-center">
                      <div className="w-px h-4 bg-border mx-1"></div>
                    </div>
                    <SelectDuration 
                      value={videoDuration} 
                      onChange={setVideoDuration} 
                      disabled={isDisabled || hasUsage("voice") || hasVideoAvatar()}
                    />
                    <div className="flex h-7 items-center">
                      <div className="w-px h-4 bg-border mx-1"></div>
                    </div>
                    <VideoFormatSelector
                      value={videoFormat}
                      onValueChange={setVideoFormat}
                      disabled={isDisabled || hasUsage("voice") || hasVideoAvatar()}
                      light={true}
                    />
                    <input
                      id="file-input"
                      type="file"
                      multiple
                      className="hidden"
                      accept={hasUsage("voice") ? 
                        'image/jpeg,image/png,image/gif,video/*' : 
                        'image/jpeg,image/png,image/gif,video/*,audio/*'}
                      onChange={(e) => {
                        if (!isDisabled && e.target.files) {
                          handleFileUpload(filterFiles(Array.from(e.target.files)));
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button 
                              variant={isWebMode ? "default" : "outline"} 
                              onClick={handleWebModeClick}
                              disabled={isDisabled}
                              className={isWebMode ? "bg-[#FB5688]/10 border border-[#FB5688] text-[#FB5688] hover:bg-[#FB5688]/20 px-2" : "px-2"}
                            >
                              <Globe className="h-4 w-4"/>
                              Web
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <div className="flex items-center gap-2">
                            <Badge variant="plan">
                              Start
                            </Badge>
                            <p>{t('web-mode-tooltip')}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div>
                          <Button 
                            size="icon" 
                            onClick={() => !isDisabled && handleSendMessage(inputMessage, videoDuration?.value || 30)} 
                            disabled={
                              isDisabled ||
                              !(hasUsage("voice") || hasVideoAvatar()) && 
                              (!inputMessage.trim() || !videoDuration)
                            }
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {(!(hasUsage("voice") || hasVideoAvatar()) && (!inputMessage.trim() || !videoDuration)) && 
                        <TooltipContent>
                          {t('select-to-start.title')} {!inputMessage.trim() ? t('select-to-start.need-prompt') : ''}{(!inputMessage.trim() && !videoDuration) ? t('select-to-start.and') : ''}{!videoDuration ? t('select-to-start.need-duration') : ''}.
                        </TooltipContent>
                      }
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
            </>
          ) : creationStep === CreationStep.SCRIPT ? (
            <div className="rounded-lg border p-2">
              <div className="flex items-end">
                <Textarea
                  placeholder={t('placeholder.edit-script')}
                  value={inputMessage}
                  onChange={(e) => {
                    !isDisabled && setInputMessage(e.target.value);
                    !isDisabled && adjustTextareaHeight(e);
                  }}
                  disabled={isDisabled}
                  onInput={!isDisabled ? adjustTextareaHeight : undefined}
                  className="w-full border-none shadow-none focus:ring-0 resize-none"
                  rows={1}
                  variant="no-focus-border"
                  onKeyDown={(e) => {
                    if (!isDisabled && e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(inputMessage, 0);
                    }
                  }}
                />
                <Button 
                  size="icon" 
                  onClick={() => !isDisabled && handleSendMessage(inputMessage, 0)} 
                  disabled={isDisabled || !inputMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : creationStep === CreationStep.VOICE ? (
              <>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div>
                      <Button className="w-full" disabled={isDisabled || !selectedVoice} onClick={!isDisabled ? handleConfirmVoice : undefined}>
                        <Check />{t('next-step')}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {!selectedVoice && (
                    <TooltipContent>
                        {t('select-voice-first')}
                    </TooltipContent>
                  )}
                </Tooltip>
              </>
          ) : creationStep === CreationStep.AVATAR ? (
            <>
              {selectedLook ? (
                <Button className="w-full" onClick={!isDisabled ? handleConfirmAvatar : undefined} disabled={isDisabled}>
                  <Check />{(extractedImagesMedia.length > 0 || files.some(file => file.usage === 'media' && file.type === 'image')) ? t('next-step') : t('start-generation')}
                </Button>
              ) : (
                <Button className="w-full" onClick={!isDisabled ? handleConfirmAvatar : undefined} disabled={isDisabled}>
                  <Check />{(extractedImagesMedia.length > 0 || files.some(file => file.usage === 'media' && file.type === 'image')) ? t('next-step') : t('start-generation')}
                </Button>
              )}
            </>
          ) : creationStep === CreationStep.IMAGES ? (
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  if (!isDisabled) {
                    setAnimateImages(false);
                    handleConfirmImages?.();
                  }
                }}
                disabled={isDisabled}
              >
                <X className="h-4 w-4" />
                {t('skip-animation')}
              </Button>
              <Button 
                className="w-full" 
                onClick={() => {
                  if (!isDisabled) {
                    setAnimateImages(true);
                    handleConfirmImages?.();
                  }
                }}
                disabled={isDisabled}
              >
                <Check className="h-4 w-4" />
                {t('animate-images')} ({
                  calculateAnimationCost(
                    extractedImagesMedia.length + files.filter(file => file.usage === 'media' && file.type === 'image').length, 
                    script, 
                    animationMode
                  )
                } {t('credits')})
              </Button>
            </div>
          ) : creationStep === CreationStep.GENERATION ? (
            <>
              
            </>
          ) : (
            <>
              Default
            </>
          )}
          
          <AssetSelectionModal
            isOpen={showAssetModal}
            onClose={() => setShowAssetModal(false)}
            onConfirm={(selectedAssets) => setFiles([...files, ...selectedAssets])}
          />
      </div>
    )
}