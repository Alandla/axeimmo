"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

const features = [
  {
    title: "Simple edit",
    description: "Never been easier to edit a video with our intuitive editor",
    image: "/onboarding/onboarding-edit.png",
  },
  {
    title: "Video automation",
    description: "Generate engaging videos in minutes without any editing skills",
    image: "/onboarding/onboarding-create.png",
  },
  {
    title: "Game changer",
    description: "All our users see an improvement in their workflow and results",
  },
]

export default function FeatureShowcase() {
  const [currentFeature, setCurrentFeature] = useState(0)
  const [progress, setProgress] = useState(0)
  const animationRef = useRef<NodeJS.Timeout | null>(null)
  const animationDuration = 5000 // 5 seconds per feature
  const animationInterval = 50 // Update progress every 50ms

  useEffect(() => {
    // Reset progress when feature changes
    setProgress(0)

    // Clear any existing interval
    if (animationRef.current) {
      clearInterval(animationRef.current)
    }

    // Set up new interval for progress animation
    animationRef.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (animationInterval / animationDuration) * 100

        // If progress is complete, move to next feature
        if (newProgress >= 100) {
          clearInterval(animationRef.current as NodeJS.Timeout)
          
          // Détermine explicitement la prochaine fonctionnalité
          setTimeout(() => {
            if (currentFeature === 0) {
              setCurrentFeature(1) // De "Simple edit" à "Smart automation"
            } else if (currentFeature === 1) {
              setCurrentFeature(2) // De "Smart automation" à "Team collaboration"
            } else {
              setCurrentFeature(0) // De "Team collaboration" retour à "Simple edit"
            }
          }, 200) // Small delay before changing feature
          
          return 100
        }

        return newProgress
      })
    }, animationInterval)

    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current)
      }
    }
  }, [currentFeature])

  return (
    <div className="bg-gray-950 rounded-lg pl-4 pt-4 h-64 overflow-hidden">
      <div className="flex items-center gap-2 mb-4 pr-4">
        {features.map((_, index) => (
          <div key={index} className={`h-1 rounded-full relative ${index === currentFeature ? "flex-grow" : "w-6"}`}>
            <div className="absolute inset-0 bg-gray-600 rounded-full will-change-transform" />

            {index === currentFeature && (
              <motion.div
                className="absolute inset-0 bg-white rounded-full origin-left will-change-transform"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: progress / 100 }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentFeature}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <h3 className="text-xl font-bold pr-4">{features[currentFeature].title}</h3>
          <p className="text-sm text-gray-400 pr-4">{features[currentFeature].description}</p>

          <div className="mt-6 rounded-lg overflow-hidden -mr-4">
            {features[currentFeature].image && (
              <Image
                src={features[currentFeature].image}
                alt={features[currentFeature].title}
                width={320}
                height={213}
                className="w-[calc(100%+2rem)] h-auto"
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

