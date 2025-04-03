"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

const features = [
  {
    title: "Simple edit",
    description: "Never been easier to edit a video",
    image: "/feature-1.png",
  },
  {
    title: "Smart automation",
    description: "AI-powered tools to speed up your workflow",
    image: "/feature-2.png",
  },
  {
    title: "Team collaboration",
    description: "Work together seamlessly on projects",
    image: "/feature-3.png",
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
          setTimeout(() => {
            setCurrentFeature((prev) => (prev + 1) % features.length)
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
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        {features.map((_, index) => (
          <div key={index} className={`h-1 rounded-full relative ${index === currentFeature ? "flex-grow" : "w-6"}`}>
            <div className="absolute inset-0 bg-gray-600 rounded-full" />

            {index === currentFeature && (
              <motion.div
                className="absolute inset-0 bg-white rounded-full origin-left"
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
        >
          <h3 className="text-xl font-bold">{features[currentFeature].title}</h3>
          <p className="text-sm text-gray-400">{features[currentFeature].description}</p>

          <div className="mt-4 rounded-lg overflow-hidden">
            <Image
              src={features[currentFeature].image || "/placeholder.svg"}
              alt={features[currentFeature].title}
              width={240}
              height={160}
              className="w-full h-auto"
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

