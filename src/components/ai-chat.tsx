'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTranslations } from "next-intl"
import { Check, Pencil, Clock } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { useSession } from 'next-auth/react'
import { generateScript, improveScript, readStream } from '../lib/stream'
import { getArticleContentFromUrl } from '../lib/article'
import { CreationStep } from '../types/enums'
import { Textarea } from './ui/textarea'
import { AiChatTab } from './ai-chat-tab'
import { Button } from './ui/button'
import { motion } from 'framer-motion'
import { VoicesGridComponent } from './voices-grid'
import { useCreationStore } from '../store/creationStore'
import { AvatarGridComponent } from './avatar-grid'
import { Steps, StepState } from '../types/step'
import { GenerationProgress } from './generation-progress'
import { startGeneration } from '../service/generation.service'
import { useActiveSpaceStore } from '../store/activeSpaceStore'
import { useRouter } from 'next/navigation'

enum MessageType {
  TEXT = 'text',
  VOICE = 'voice',
  AVATAR = 'avatar',
  GENERATION = 'generation',
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  type: MessageType;
  content: string;
  script: string;
  prompt: string;
}

export function AiChat() {
  const { script, setScript, totalCost, setTotalCost, addToTotalCost, selectedAvatar, selectedVoice, files, addStep, resetSteps } = useCreationStore()
  const { activeSpace } = useActiveSpaceStore()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [creationStep, setCreationStep] = useState(CreationStep.START)
  const { data: session } = useSession()
  const t = useTranslations('ai');
  const tAi = useTranslations('ai-chat');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (message: string, duration: number) => {
    if (creationStep === CreationStep.START) {
      resetSteps()
      if (files.length !== 0) {
        addStep({ id: 0, name: Steps.MEDIA_UPLOAD, state: StepState.PENDING, progress: 0 })
        addStep({ id: 1, name: Steps.TRANSCRIPTION, state: StepState.PENDING, progress: 0 })
        
        if (files.some(file => file.usage === 'media')) {
          addStep({ id: 2, name: Steps.ANALYZE, state: StepState.PENDING, progress: 0 })
        }

        if (files.some(file => file.usage === 'voice')) {
          setCreationStep(CreationStep.AVATAR)
          const messageAi = getRandomMessage('ai-get-audio-select-avatar');
          addMessageAi(messageAi, MessageType.AVATAR);
          return;
        } else if (files.some(file => file.usage === 'avatar')) {
          addStep({ id: 3, name: Steps.SEARCH_MEDIA, state: StepState.PENDING, progress: 0 })
          setCreationStep(CreationStep.GENERATION)
          const messageAi = getRandomMessage('ai-get-all-start-generation');
          addMessageAi(messageAi, MessageType.GENERATION);
          handleStartGeneration()
          return;
        }
      }
      setCreationStep(CreationStep.SCRIPT)
      handleAiChat(message, duration)
    } else if (creationStep === CreationStep.SCRIPT) {
      handleAiChat(message, duration, true)
    }
  }

  const handleAiChat = async (message: string, duration: number, improve: boolean = false) => {
    const messageAiThinking = getRandomMessage('thinking');
    const messageUserId = addMessageUser(message)
    const messageAiId = addMessageAi(
      messageAiThinking,
      MessageType.TEXT
    );

    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        setMessages(prevMessages => prevMessages.map(msg => {
          if (msg.id === messageAiId) {
            return {
              ...msg,
              content: "Voici un script mockup pour le mode développement",
              script: "Ceci est un exemple de script mockup.\nIl contient plusieurs lignes.\nPour tester le comportement de l'interface.",
              prompt: message
            };
          }
          return msg;
        }));
        setScript("Ceci est un exemple de script mockup.\nIl contient plusieurs lignes.\nPour tester le comportement de l'interface.");
      }, 1000); // Simulation d'un délai réseau
      return;
    }

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = message.match(urlRegex);
    let prompt = message;
    let url = '';

    if (match && match.length > 0) {
      url = match[0];
      const { text, title, images } = await getArticleContentFromUrl(url);
      prompt = message.replace(url, `Title: ${title}\n\nContent: ${text}`).trim();
    }

    setMessages(prevMessages => prevMessages.map(msg => 
      msg.id === messageUserId ? { ...msg, prompt } : msg
    ));

    let stream;
    if (improve) {
      stream = await improveScript(prompt, messages)
    } else {
      stream = await generateScript(prompt, duration)
    }

    setMessages(prevMessages => prevMessages.map(msg => 
      msg.id === messageAiId ? { ...msg, content: ''} : msg
    ));

    if (!stream) {
      return;
    }

    readStream(stream, (chunk: string) => {
      setMessages(prevMessages => prevMessages.map(msg => {
        if (msg.id === messageAiId) {
          const scriptStartIndex = chunk.indexOf('```');
          if (scriptStartIndex !== -1) {
            const content = chunk.slice(0, scriptStartIndex).trim();
            let script = chunk.slice(scriptStartIndex + 3);

            const scriptEndIndex = script.lastIndexOf('```');
            if (scriptEndIndex !== -1) {
              script = script.slice(0, scriptEndIndex);
            }
            
            script = script.trim();
            setTimeout(() => {
              const textarea = document.querySelector(`textarea[data-message-id="${msg.id}"]`);
              if (textarea) { // Ajout de cette vérification
                adjustTextareaHeight(textarea as HTMLTextAreaElement);
              }
            }, 0);
            return { ...msg, content, script, prompt: chunk };
          }
          return { ...msg, content: chunk, prompt: chunk };
        }

        return msg;
      }));
    }).then(({ cost }) => {
      if (cost) {
        addToTotalCost(cost);
        console.log('Total cost:', totalCost + cost);
      }
    });
  }

  const handleConfirmScript = (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message && message.script) {
      setScript(message.script);
      setCreationStep(CreationStep.VOICE);
      const messageUser = getRandomMessage('user-valid-script');
      const messageAi = getRandomMessage('ai-select-voice');
      addMessageUser(messageUser)
      addMessageAi(messageAi, MessageType.VOICE);
    }
  }

  const handleConfirmVoice = () => {
    addStep({ id: 2, name: Steps.VOICE_GENERATION, state: StepState.PENDING, progress: 0 })
    addStep({ id: 3, name: Steps.TRANSCRIPTION, state: StepState.PENDING, progress: 0 })
    setCreationStep(CreationStep.AVATAR);
    const messageUser = getRandomMessage('user-select-voice', { "name": selectedVoice?.name || '' });
    const messageAi = getRandomMessage('ai-select-avatar');
    addMessageUser(messageUser)
    addMessageAi(messageAi, MessageType.AVATAR);
  }

  const handleConfirmAvatar = () => {
    let messageUser1 = '';
    let messageUser2 = '';
    let messageAi = '';
    if (selectedAvatar) {
      messageUser1 = getRandomMessage('user-select-avatar', { "name": selectedVoice?.name || '' });
      addStep({ id: 5, name: Steps.ANALYZE, state: StepState.PENDING, progress: 0 })
    } else {
      messageUser1 = getRandomMessage('user-no-avatar');
    }

    messageUser2 = getRandomMessage('user-start-generation');
    messageAi = getRandomMessage('ai-generation-progress');
    const messageUser = messageUser1 + ' ' + messageUser2;

    addStep({ id: 4, name: Steps.SEARCH_MEDIA, state: StepState.PENDING, progress: 0 })
    setCreationStep(CreationStep.GENERATION)
    handleStartGeneration()

    addMessageUser(messageUser)
    addMessageAi(messageAi, MessageType.GENERATION);
  }

  const handleStartGeneration = async () => {
    const videoId = await startGeneration(session?.user?.id || '', activeSpace?.id || '')
    if (videoId) {
      router.push(`/edit/${videoId}`)
    }
  }

  const addMessageUser = (userMessage: string) => {
    const messageId = Date.now().toString();
    setMessages(prevMessages => [
      ...prevMessages,
      { id: messageId, sender: 'user', type: MessageType.TEXT, content: userMessage, script: '', prompt: '' },
    ]);
    return messageId;
  }

  const addMessageAi = (aiMessage: string, type: MessageType) => {
    const newMessageId = Date.now().toString();
    const messageId = `${newMessageId}-ai`;
    setMessages(prevMessages => [
      ...prevMessages,
      { id: messageId, sender: 'ai', type: type, content: aiMessage, script: '', prompt: '' }
    ]);
    return messageId;
  }

  const getRandomMessage = (messageType: string, params?: Record<string, string>) => {
    const randomIndex = Math.floor(Math.random() * 29);
    return tAi(`${messageType}.${randomIndex}`, params);
  };

  const handleScriptChange = (messageId: string, newScript: string) => {
    setMessages(prevMessages => prevMessages.map(msg => 
      msg.id === messageId ? { ...msg, script: newScript } : msg
    ));
  }

  const adjustTextareaHeight = (element: HTMLTextAreaElement | React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!element) return; // Ajout d'une protection supplémentaire
    const target = 'target' in element ? element.target : element;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  }

  const calculateDuration = (script: string): string => {
    const characters = script.length;
    const minutes = Math.floor(characters / 936);
    const seconds = Math.round((characters % 936) / 936 * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  const messageAnimation = {
    user: {
      initial: { opacity: 0, x: 20, y: 0 },
      animate: { opacity: 1, x: 0, y: 0 },
      transition: { 
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    ai: {
      initial: { opacity: 0, x: -20, y: 0 },
      animate: { opacity: 1, x: 0, y: 0 },
      transition: { 
        duration: 0.2,
        delay: 0.1,
        ease: "easeInOut"
      }
    }
  }

  // Ajouter cette fonction pour gérer le défilement
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Ajouter un useEffect pour surveiller les changements de messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col justify-center items-center p-4">
        {messages.length === 0 ? (
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">{t('hello')}{session?.user?.name}</h1>
              <p className="text-xl mb-4">{t('title-1')}</p>
              <p className="text-sm text-gray-500">{t('title-2')}</p>
            </div>
          </div>
        ) : (
          <div 
            ref={messagesContainerRef}
            className="w-full max-w-5xl h-[calc(100vh-200px)] overflow-y-auto mb-4 bg-white rounded-lg p-4 overflow-hidden"
          >
            {messages.map((message) => (
              <motion.div
                key={message.id}
                {...messageAnimation[message.sender]}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
              >
                {message.sender === 'ai' && (
                  <Avatar className="w-8 h-8 mr-2 flex-shrink-0 bg-muted hidden sm:block">
                    <img src="/img/logo-square.png" alt="AI Avatar" className="rounded-full" />
                  </Avatar>
                )}
                <div className={`rounded-lg p-3 max-w-[85vw] sm:max-w-xl ${message.script && 'w-full'} shadow ${message.sender === 'user' ? 'bg-primary text-white' : 'bg-white text-primary'}`}>
                  {message.content}
                  {message.type === MessageType.TEXT && message.script && (
                    <>
                      <div className="relative mt-2">
                        <Textarea
                          data-message-id={message.id}
                          value={message.script}
                          onChange={(e) => {
                            handleScriptChange(message.id, e.target.value);
                            adjustTextareaHeight(e);
                          }}
                          className="w-full pt-2 resize-none overflow-hidden"
                        />
                        <Pencil className="absolute bottom-2 right-2 h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <Button 
                          onClick={() => handleConfirmScript(message.id)}
                        >
                          <Check/> {t('next-step')}
                        </Button>
                        <div className="flex text-sm items-center text-gray-500">
                          <span>{calculateDuration(message.script)}</span>
                          <Clock className="h-4 w-4 ml-1" />
                        </div>
                      </div>
                    </>
                  )}
                  {message.type === MessageType.AVATAR && (
                    <AvatarGridComponent />
                  )}
                  {message.type === MessageType.VOICE && (
                    <VoicesGridComponent />
                  )}
                  {message.type === MessageType.GENERATION && (
                    <GenerationProgress />
                  )}
                </div>
                {message.sender === 'user' && (
                  <Avatar className="h-8 w-8 ml-2 flex-shrink-0 hidden sm:block">
                    {session?.user?.image && <AvatarImage src={session?.user?.image} alt={session?.user?.name ?? ''} />}
                    <AvatarFallback className="rounded-lg">{(session?.user?.name?.charAt(0).toUpperCase() ?? session?.user?.email?.charAt(0).toUpperCase() ?? '')}</AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}
          </div>
        )}
        <AiChatTab creationStep={creationStep} sendMessage={handleSendMessage} handleConfirmAvatar={handleConfirmAvatar} handleConfirmVoice={handleConfirmVoice} />
      </div>
    </div>
  )
}
