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
  const { creationStep, setCreationStep, script, setScript, totalCost, setTotalCost, addToTotalCost, selectedAvatar } = useCreationStore()
  const [messages, setMessages] = useState<Message[]>([])
  const { data: session } = useSession()
  const t = useTranslations('ai');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (message: string, duration: number) => {
    if (creationStep === CreationStep.START) {
      setCreationStep(CreationStep.SCRIPT)
      handleAiChat(message, duration)
    } else if (creationStep === CreationStep.SCRIPT) {
      handleAiChat(message, duration, true)
    }
  }

  const handleAiChat = async (message: string, duration: number, improve: boolean = false) => {
    const newMessageId = Date.now().toString();
    setMessages([
      ...messages,
      { id: newMessageId, sender: 'user', type: MessageType.TEXT, content: message, script: '', prompt: '' },
      { id: `${newMessageId}-ai`, sender: 'ai', type: MessageType.TEXT, content: t('thinking'), script: '', prompt: '' }
    ]);

    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        setMessages(prevMessages => prevMessages.map(msg => {
          if (msg.id === `${newMessageId}-ai`) {
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
      }, 300); // Simulation d'un délai réseau
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
      msg.id === newMessageId ? { ...msg, prompt } : msg
    ));

    let stream;
    if (improve) {
      stream = await improveScript(prompt, messages)
    } else {
      stream = await generateScript(prompt, duration)
    }

    setMessages(prevMessages => prevMessages.map(msg => 
      msg.id === `${newMessageId}-ai` ? { ...msg, content: ''} : msg
    ));

    if (!stream) {
      return;
    }

    readStream(stream, (chunk: string) => {
      setMessages(prevMessages => prevMessages.map(msg => {
        if (msg.id === `${newMessageId}-ai`) {
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
      const newMessageId = Date.now().toString();
      setScript(message.script);
      setCreationStep(CreationStep.AVATAR);
      setMessages([
        ...messages,
        { id: newMessageId, sender: 'user', type: MessageType.TEXT, content: 'Utilise ce script pour la vidéo, on peut passer à l\'étape suivante.', script: '', prompt: '' },
        { id: `${newMessageId}-ai`, sender: 'ai', type: MessageType.AVATAR, content: 'Parfait ! Maintenant tu peux choisir un avatar pour incarner ta vidéo, ce n\'est pas obligatoire et tu peux passer à l\'étape suivante si tu n\'en as pas besoin.', script: '', prompt: '' }
      ]);
    }
  }

  const handleConfirmAvatar = () => {
    const newMessageId = Date.now().toString();
    setCreationStep(CreationStep.VOICE);
    setMessages([
      ...messages,
      { id: newMessageId, sender: 'user', type: MessageType.TEXT, content: selectedAvatar ? 'Je choisis l\'avatar de Nicolas, passons à l\'étape suivante' : 'Je n\'ai pas besoin d\'avatar, passons à l\'étape suivante', script: '', prompt: '' },
      { id: `${newMessageId}-ai`, sender: 'ai', type: MessageType.VOICE, content: 'Parfait ! Maintenant il faut choisir la voix pour ta vidéo, voici la liste des voix disponibles.', script: '', prompt: '' }
    ]);
  }

  const handleStartGeneration = () => {
    const newMessageId = Date.now().toString();
    setCreationStep(CreationStep.GENERATION);
    setMessages([
      ...messages,
      { id: newMessageId, sender: 'user', type: MessageType.TEXT, content: 'Je suis prêt à générer ma vidéo, passons à l\'étape suivante.', script: '', prompt: '' },
      { id: `${newMessageId}-ai`, sender: 'ai', type: MessageType.GENERATION, content: 'Voici l\'avancer de la génération de la vidéo.', script: '', prompt: '' }
    ]);
  }

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
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <img src="/placeholder.svg?height=96&width=96" alt="AI Avatar" className="rounded-full" />
              </Avatar>
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
                  <Avatar className="w-8 h-8 mr-2 flex-shrink-0">
                    <img src="/placeholder.svg?height=32&width=32" alt="AI Avatar" className="rounded-full" />
                  </Avatar>
                )}
                <div className={`rounded-lg p-3 max-w-xl ${message.script && 'w-full'} shadow ${message.sender === 'user' ? 'bg-primary text-white' : 'bg-white text-primary'}`}>
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
                  {message.type === MessageType.VOICE && (
                    <VoicesGridComponent />
                  )}
                  {message.type === MessageType.AVATAR && (
                    <div>
                      <p>Avatar</p>
                    </div>
                  )}
                  {message.type === MessageType.GENERATION && (
                    <div>
                      <p>Generation</p>
                    </div>
                  )}
                </div>
                {message.sender === 'user' && (
                  <Avatar className="h-8 w-8 ml-2 flex-shrink-0">
                    {session?.user?.image && <AvatarImage src={session?.user?.image} alt={session?.user?.name ?? ''} />}
                    <AvatarFallback className="rounded-lg">{(session?.user?.name?.charAt(0) ?? '')}</AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}
          </div>
        )}
        <AiChatTab sendMessage={handleSendMessage} handleConfirmAvatar={handleConfirmAvatar} handleStartGeneration={handleStartGeneration} />
      </div>
    </div>
  )
}
