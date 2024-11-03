import { Check, Paperclip, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import SelectDuration from "./ui/select/select-duration";
import { useState } from "react";
import { CreationStep } from "../types/enums";
import { useTranslations } from "next-intl";
import { useCreationStore } from "../store/creationStore";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { FilePreview } from "./file-preview";

interface DurationOption {
  name: string;
  value: number;
}

export interface UploadedFile {
  file: File;
  type: "voice" | "avatar" | "media";
}

export function AiChatTab({ sendMessage, handleConfirmAvatar, handleStartGeneration }: { sendMessage: (message: string, duration: number) => void, handleConfirmAvatar: () => void, handleStartGeneration: () => void }) {
    const { creationStep, files, selectedVoice, selectedAvatar, setFiles } = useCreationStore()
    const [inputMessage, setInputMessage] = useState('')
    const [videoDuration, setVideoDuration] = useState<DurationOption | undefined>(undefined)
    const [isDragging, setIsDragging] = useState(false);
    const t = useTranslations('ai');

    const adjustTextareaHeight = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      event.target.style.height = 'auto';
      event.target.style.height = `${event.target.scrollHeight}px`;
    }

    const handleSendMessage = (message: string, duration: number) => {
        setInputMessage('')
        sendMessage(message, duration)
    }

    const handleFileUpload = (newFiles: File[]) => {
      const updatedFiles: UploadedFile[] = newFiles.map(file => {
        let type: "voice" | "avatar" | "media" = "media";
        if (file.type.startsWith('audio/')) {
          type = "voice";
        }
        if (file.type.startsWith('video/') && files.filter(file => file.type === "avatar").length === 0) {
          type = "avatar";
        }
        return {
          file,
          type
        };
      });
      setFiles([...files, ...updatedFiles]);
    };

    const handleFileTypeChange = (fileIndex: number, newType: "voice" | "avatar" | "media") => {
      setFiles(files.map((file, index) => 
        index === fileIndex ? { ...file, type: newType } : file
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
        if (!hasVoice) return files;
        return files.filter(file => !file.type.startsWith('audio/'));
    };

    return (
        <div className="w-full max-w-xl">
          {creationStep === CreationStep.START ? (
            <div 
              className={`relative rounded-lg`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className={`relative rounded-lg border p-2 ${isDragging ? 'border-dashed border-2 border-gray-300' : ''}`}>
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
                          type={file.type}
                          onTypeChange={(newType) => handleFileTypeChange(index, newType)}
                          onRemove={() => handleFileRemove(index)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <Textarea
                  placeholder={t('placeholder.start')}
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value);
                    adjustTextareaHeight(e);
                  }}
                  disabled={files.some(file => file.type === "voice" || file.type === "avatar")}
                  onInput={adjustTextareaHeight}
                  className={`w-full mb-2 border-none shadow-none focus:ring-0 resize-none ${isDragging ? 'opacity-50' : ''}`}
                  rows={1}
                  variant="no-focus-border"
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(inputMessage, videoDuration?.value || 936)}
                />
                <div className={`flex items-center justify-between ${isDragging ? 'opacity-50' : ''}`}>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => document.getElementById('file-input')?.click()}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <SelectDuration 
                      value={videoDuration} 
                      onChange={setVideoDuration} 
                      disabled={files.some(file => file.type === "voice" || file.type === "avatar")}
                    />
                    <input
                      id="file-input"
                      type="file"
                      multiple
                      className="hidden"
                      accept={files.some(file => file.type === "voice") ? 
                        'image/*,video/*' : 
                        'image/*,video/*,audio/*'}
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFileUpload(filterFiles(Array.from(e.target.files)));
                        }
                      }}
                    />
                  </div>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div>
                        <Button 
                          size="icon" 
                          onClick={() => handleSendMessage(inputMessage, videoDuration?.value || 936)} 
                          disabled={
                            !files.some(file => file.type === "voice" || file.type === "avatar") && 
                            (!inputMessage.trim() || !videoDuration)
                          }
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {(!files.some(file => file.type === "voice" || file.type === "avatar") && (!inputMessage.trim() || !videoDuration)) && 
                      <TooltipContent>
                        {t('select-to-start.title')} {!inputMessage.trim() ? t('select-to-start.need-prompt') : ''}{(!inputMessage.trim() && !videoDuration) ? t('select-to-start.and') : ''}{!videoDuration ? t('select-to-start.need-duration') : ''}.
                      </TooltipContent>
                    }
                  </Tooltip>
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
                    setInputMessage(e.target.value);
                    adjustTextareaHeight(e);
                  }}
                  onInput={adjustTextareaHeight}
                  className="w-full border-none shadow-none focus:ring-0 resize-none"
                  rows={1}
                  variant="no-focus-border"
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(inputMessage, 0)}
                />
                <Button 
                  size="icon" 
                  onClick={() => handleSendMessage(inputMessage, 0)} 
                  disabled={!inputMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : creationStep === CreationStep.AVATAR ? (
              <>
                {selectedAvatar ? (
                  <Button className="w-full" onClick={handleConfirmAvatar}>
                    <Check />{t('next-step')}
                  </Button>
                ) : (
                  <Button className="w-full" onClick={handleConfirmAvatar}>
                    <Check />{t('no-avatar')}
                  </Button>
                )}
              </>
          ) : creationStep === CreationStep.VOICE ? (
              <>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div>
                      <Button className="w-full" disabled={!selectedVoice} onClick={handleStartGeneration}>
                        <Check />{t('start-generation')}
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