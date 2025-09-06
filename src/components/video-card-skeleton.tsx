'use client'

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

interface VideoCardSkeletonProps {
  hideActionButton?: boolean
}

export default function VideoCardSkeleton({ hideActionButton = false }: VideoCardSkeletonProps) {
  return (
    <div className="relative">
      <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-gray-200 animate-pulse" />
      <div className="mt-2 flex justify-between items-start space-x-2">
        <div className="flex-1 min-w-0">
          <div className={`h-6 bg-gray-200 rounded animate-pulse ${hideActionButton ? 'w-full' : 'w-3/4'}`} />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2 mt-2" />
        </div>
        {!hideActionButton && (
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
        )}
      </div>
    </div>
  )
}