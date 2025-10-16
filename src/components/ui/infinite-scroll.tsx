'use client'

import { useEffect, useRef } from 'react'

interface InfiniteScrollProps {
  onLoadMore: () => void | Promise<void>
  hasMore: boolean
  isLoading?: boolean
  root?: Element | null
  rootMargin?: string
  threshold?: number
  loader?: React.ReactNode
  endMessage?: React.ReactNode
  className?: string
}

export function InfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading = false,
  root = null,
  rootMargin = '200px',
  threshold = 0,
  loader,
  endMessage,
  className,
}: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore()
        }
      },
      { root: root ?? null, rootMargin, threshold }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, isLoading, onLoadMore, root, rootMargin, threshold])

  return (
    <div className={className}>
      <div ref={sentinelRef} />
      {isLoading && loader}
      {!hasMore && !isLoading && endMessage}
    </div>
  )
}

export default InfiniteScroll


