'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Globe, Loader2 } from 'lucide-react'
import { TextShimmer } from './ui/text-shimmer'
import { useTranslations } from 'next-intl'

export interface ToolCall {
  toolCallId: string
  toolName: string
  args: any
  result?: any
  status: 'pending' | 'completed' | 'error'
}

interface ToolDisplayProps {
  toolCalls: ToolCall[]
  showTools: boolean
}

// Animations définies au niveau du fichier pour éviter la recréation à chaque rendu
const animations = {
  toolBlock: {
    initial: { opacity: 0, height: 0, marginBottom: 0 },
    animate: { opacity: 1, height: "auto", marginBottom: 8 },
    exit: { opacity: 0, height: 0, marginBottom: 0 },
    transition: { 
      duration: 0.3,
      ease: "easeInOut"
    }
  },
  toolText: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  }
}

export function ToolDisplay({ toolCalls, showTools }: ToolDisplayProps) {
  const tAi = useTranslations('ai-chat')
  
  // Fonction pour obtenir le dernier outil actif
  const getLastActiveTool = (toolCalls: ToolCall[]) => {
    if (!toolCalls || toolCalls.length === 0) return null
    
    // Chercher d'abord les outils en état pending
    const pendingTool = [...toolCalls].reverse().find(t => t.status === 'pending')
    if (pendingTool) return pendingTool
    
    // Sinon, prendre le dernier outil complété ou en erreur
    return toolCalls[toolCalls.length - 1]
  }
  
  const lastTool = getLastActiveTool(toolCalls)
  
  return (
    <AnimatePresence>
      {showTools && toolCalls && toolCalls.length > 0 && lastTool && (
        <motion.div
          className="mb-3"
          {...animations.toolBlock}
        >
          <div 
            className={`p-2 rounded-lg text-sm overflow-hidden border ${
              lastTool.status === 'error'
                ? 'border-red-500 border-opacity-10'
                : lastTool.status === 'completed'
                ? 'border-black border-opacity-10'
                : ''
            }`}
            style={{
              backgroundColor: lastTool.status === 'completed' 
                ? 'rgba(251, 86, 136, 0.1)' 
                : lastTool.status === 'error'
                ? 'rgba(239, 68, 68, 0.1)'
                : 'rgba(0, 0, 0, 0.05)',
              color: lastTool.status === 'completed'
                ? '#CDF546'
                : lastTool.status === 'error'
                ? '#EF4444'
                : '#000000'
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div 
                key={`tool-${lastTool.toolCallId}-${lastTool.status}`}
                {...animations.toolText}
                className="text-xs"
              >
                {lastTool.status === 'completed' ? (
                  <>
                    {(lastTool.toolName === 'urlScraping' || lastTool.toolName === 'getWebContent' || lastTool.toolName === 'webSearch') ? (
                      <div className="flex items-center gap-2">
                        {(() => {
                          const resultsList = lastTool.result?.results || lastTool.result?.content?.results || []
                          const hasFavicon = resultsList.length > 0 && resultsList.some((item: any) => item.favicon)
                          return (
                            <>
                              {hasFavicon ? (
                                <div className="flex items-center gap-1">
                                  <img
                                    src={resultsList[0].favicon}
                                    alt="favicon"
                                    className="w-4 h-4 rounded shadow border border-white"
                                  />
                                  {resultsList.length > 1 && (
                                    <span className="ml-1 text-xs font-semibold bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">+{resultsList.length - 1}</span>
                                  )}
                                </div>
                              ) : (
                                <Globe className="h-3 w-3" />
                              )}
                              <span>{tAi(`tool.${lastTool.toolName}.result`, { count: resultsList.length })}</span>
                            </>
                          )
                        })()}
                      </div>
                    ) : (
                      <div>{tAi(`tool.success`)}</div>
                    )}
                  </>
                ) : lastTool.status === 'error' ? (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3" />
                    <span>{lastTool.result?.error || tAi(`tool.error`)}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <TextShimmer className="text-xs" duration={1.5}>
                      {tAi(`tool.${lastTool.toolName}.loading`, { keyword: lastTool.args?.query })}
                    </TextShimmer>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 