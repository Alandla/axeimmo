import { useState } from 'react';
import Image from 'next/image';

export default function SkeletonImage({ src, style, alt, width, height, className, unoptimized = true }: { src: string, style?: React.CSSProperties, alt: string, width: number, height: number, className?: string, unoptimized?: boolean }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`${!loaded ? 'bg-gray-200 animate-pulse' : ''} ${className}`}>
      <Image
        src={src}
        height={height}
        width={width}
        className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={style}
        alt={alt}
        onLoad={() => setLoaded(true)}
        unoptimized={unoptimized}
      />
    </div>
  );
};