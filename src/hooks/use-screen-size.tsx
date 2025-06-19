import { useState, useEffect } from 'react'

export function useScreenSize() {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [itemsPerPage, setItemsPerPage] = useState(20)

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      
      if (width < 640) { // sm breakpoint
        setScreenSize('mobile')
        setItemsPerPage(8)
      } else if (width < 1024) { // lg breakpoint
        setScreenSize('tablet')
        setItemsPerPage(15)
      } else {
        setScreenSize('desktop')
        setItemsPerPage(20)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return { screenSize, itemsPerPage }
} 