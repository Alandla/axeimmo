import { Check, Paperclip, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import SelectDuration from "./ui/select/select-duration";
import { useState } from "react";
import { CreationStep } from "../types/enums";


interface DurationOption {
  name: string;
  value: number;
}
  
export function AiChatTab({ sendMessage, creationStep }: { sendMessage: (message: string, duration: number) => void, creationStep: CreationStep }) {
    const [inputMessage, setInputMessage] = useState('');
    const [videoDuration, setVideoDuration] = useState<DurationOption | undefined>(undefined)

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
          <div className="rounded-lg border p-2">
            {creationStep === CreationStep.START ? (
              <>
                <Textarea
                  placeholder="Une vidéo qui parle de ..."
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
                  <Button 
                    size="icon" 
                    onClick={() => handleSendMessage(inputMessage, videoDuration?.value || 936)} 
                    disabled={!inputMessage.trim() || !videoDuration}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : creationStep === CreationStep.SCRIPT ? (
              <>
                <div className="flex items-end">
                  <Textarea
                    placeholder="Est-ce que tu pourrais modifier le script pour ..."
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
              </>
            ) : creationStep === CreationStep.VOICE ? (
                <>
                  <Button className="w-full">
                    <Check />
                    Passer à l'étape suivante
                  </Button>
                </>
            ) : (
              <>
                Default
              </>
            )}
          </div>
        </div>
    )
}