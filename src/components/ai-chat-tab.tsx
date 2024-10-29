import { Check, Paperclip, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import SelectDuration from "./ui/select/select-duration";
import { useState } from "react";
import { CreationStep } from "../types/enums";
import { useTranslations } from "next-intl";
import { useCreationStore } from "../store/creationStore";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface DurationOption {
  name: string;
  value: number;
}
  
export function AiChatTab({ sendMessage, handleConfirmAvatar, handleStartGeneration }: { sendMessage: (message: string, duration: number) => void, handleConfirmAvatar: () => void, handleStartGeneration: () => void }) {
    const { creationStep, selectedVoice, selectedAvatar } = useCreationStore()
    const [inputMessage, setInputMessage] = useState('');
    const [videoDuration, setVideoDuration] = useState<DurationOption | undefined>(undefined)
    const t = useTranslations('ai');

    const adjustTextareaHeight = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      event.target.style.height = 'auto';
      event.target.style.height = `${event.target.scrollHeight}px`;
    }

    const handleSendMessage = (message: string, duration: number) => {
        setInputMessage('')
        sendMessage(message, duration)
    }

    return (
        <div className="w-full max-w-xl">
          {creationStep === CreationStep.START ? (
            <div className="rounded-lg border p-2">
              <Textarea
                placeholder={t('placeholder.start')}
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  adjustTextareaHeight(e);
                }}
                onInput={adjustTextareaHeight}
                className="w-full mb-2 border-none shadow-none focus:ring-0 resize-none"
                rows={1}
                variant="no-focus-border"
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(inputMessage, videoDuration?.value || 936)}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <SelectDuration value={videoDuration} onChange={setVideoDuration} />
                </div>  
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div>
                      <Button 
                        size="icon" 
                        onClick={() => handleSendMessage(inputMessage, videoDuration?.value || 936)} 
                        disabled={!inputMessage.trim() || !videoDuration}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {(!inputMessage.trim() || !videoDuration) && 
                    <TooltipContent>
                      {t('select-to-start.title')} {!inputMessage.trim() ? t('select-to-start.need-prompt') : ''}{(!inputMessage.trim() && !videoDuration) ? t('select-to-start.and') : ''}{!videoDuration ? t('select-to-start.need-duration') : ''}.
                    </TooltipContent>
                  }
                </Tooltip>
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