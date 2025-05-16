import { Check, Paperclip, Send, Globe } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import SelectDuration from "./ui/select/select-duration";
import { useState, useEffect } from "react";
import { CreationStep, PlanName } from "../types/enums";
import { useTranslations } from "next-intl";
import { useCreationStore } from "../store/creationStore";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "./ui/tooltip";
import { FilePreview } from "./file-preview";
import { FileToUpload } from "../types/files";
import { Badge } from "./ui/badge";
import { useActiveSpaceStore } from "../store/activeSpaceStore";
import { usePremiumToast } from "@/src/utils/premium-toast";

interface DurationOption {
  name: string;
  value: number;
}

export function AiChatTab({ 
  creationStep, 
  sendMessage, 
  handleConfirmAvatar, 
  handleConfirmVoice, 
  isDisabled = false,
  inputMessage,
  setInputMessage
}: { 
  creationStep: CreationStep, 
  sendMessage: (message: string, duration: number) => void, 
  handleConfirmAvatar: () => void, 
  handleConfirmVoice: () => void,
  isDisabled?: boolean,
  inputMessage: string,
  setInputMessage: (message: string) => void
}) {
    const { files, selectedVoice, selectedLook, setFiles, isWebMode, setWebMode } = useCreationStore()
    const { activeSpace } = useActiveSpaceStore()
    const { showPremiumToast } = usePremiumToast()
    const [videoDuration, setVideoDuration] = useState<DurationOption | undefined>(undefined)
    const [isDragging, setIsDragging] = useState(false);
    const t = useTranslations('ai');
    const pricingT = useTranslations('pricing');
    const planT = useTranslations('plan');

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

    const handleFileUsageChange = (fileIndex: number, newUsage: "voice" | "avatar" | "media") => {
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

    return (
        <div className="w-full max-w-xl">
          {creationStep === CreationStep.START ? (
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
                        <FilePreview
                          key={index}
                          file={file.file}
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
                  disabled={isDisabled || files.some(file => file.usage === "voice" || file.usage === "avatar")}
                  onInput={!isDisabled ? adjustTextareaHeight : undefined}
                  className={`w-full mb-2 border-none shadow-none focus:ring-0 resize-none ${isDragging ? 'opacity-50' : ''}`}
                  rows={1}
                  variant="no-focus-border"
                  onKeyDown={(e) => {
                    if (!isDisabled && e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(inputMessage, videoDuration?.value || 936);
                    }
                  }}
                />
                <div className={`flex items-center justify-between ${isDragging ? 'opacity-50' : ''}`}>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => !isDisabled && document.getElementById('file-input')?.click()}
                      disabled={isDisabled}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <SelectDuration 
                      value={videoDuration} 
                      onChange={setVideoDuration} 
                      disabled={isDisabled || files.some(file => file.usage === "voice" || file.usage === "avatar")}
                    />
                    <input
                      id="file-input"
                      type="file"
                      multiple
                      className="hidden"
                      accept={files.some(file => file.usage === "voice") ? 
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
                            <Badge variant="secondary" className="bg-gradient-to-r from-[#FB5688] to-[#9C2779] text-white border-none">
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
                            onClick={() => !isDisabled && handleSendMessage(inputMessage, videoDuration?.value || 936)} 
                            disabled={
                              isDisabled ||
                              !files.some(file => file.usage === "voice" || file.usage === "avatar") && 
                              (!inputMessage.trim() || !videoDuration)
                            }
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {(!files.some(file => file.usage === "voice" || file.usage === "avatar") && (!inputMessage.trim() || !videoDuration)) && 
                        <TooltipContent>
                          {t('select-to-start.title')} {!inputMessage.trim() ? t('select-to-start.need-prompt') : ''}{(!inputMessage.trim() && !videoDuration) ? t('select-to-start.and') : ''}{!videoDuration ? t('select-to-start.need-duration') : ''}.
                        </TooltipContent>
                      }
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
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
                  <Check />{files.some(file => file.usage === 'media') ? t('next-step') : t('start-generation')}
                </Button>
              ) : (
                <Button className="w-full" onClick={!isDisabled ? handleConfirmAvatar : undefined} disabled={isDisabled}>
                  <Check />{t('start-generation')}
                </Button>
              )}
            </>
          ) : creationStep === CreationStep.GENERATION ? (
            <>
              
            </>
          ) : (
            <>
              Default
            </>
          )}
      </div>
    )
}