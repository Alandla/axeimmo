import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, ReactNode } from "react";
import { Button } from "./button";

interface HorizontalScrollListProps {
  children: ReactNode;
  className?: string;
}

export function HorizontalScrollList({ children, className = "" }: HorizontalScrollListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  const checkScrollable = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollWidth > container.clientWidth &&
        container.scrollLeft < container.scrollWidth - container.clientWidth
      );
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScrollable();
      container.addEventListener('scroll', checkScrollable);
      window.addEventListener('resize', checkScrollable);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScrollable);
        window.removeEventListener('resize', checkScrollable);
      }
    };
  }, [children]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className={`w-full overflow-hidden relative ${className}`}>
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center pointer-events-none">
          <div className="h-full w-12 bg-gradient-to-r from-white via-white via-50% to-transparent to-100%"></div>
          <Button 
            size="icon" 
            variant="ghost" 
            className="absolute left-0 h-8 w-8 pointer-events-auto" 
            onClick={scrollLeft}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center pointer-events-none">
          <div className="h-full w-12 bg-gradient-to-l from-white via-white via-50% to-transparent to-100%"></div>
          <Button 
            size="icon" 
            variant="ghost" 
            className="absolute right-0 h-8 w-8 pointer-events-auto" 
            onClick={scrollRight}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div 
        ref={scrollContainerRef}
        className="w-full overflow-x-auto scrollbar-hide"
        onWheel={handleWheel}
      >
        <div className="flex gap-2 flex-nowrap">
          {children}
        </div>
      </div>
    </div>
  );
} 