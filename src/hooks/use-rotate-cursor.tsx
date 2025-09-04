import { useMemo } from 'react';

export const useRotateCursor = (rotationAngle: number = 0) => {
  const rotateCursorUrl = useMemo(() => {
    // SVG avec rotation CSS au lieu de transform SVG interne
    const svg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g style="transform-origin: 10px 10px; transform: rotate(${rotationAngle}deg);">
        <!-- Contour noir -->
        <path d="M8.5 4C11.81 4 14.5 6.69 14.5 10C14.5 13.31 11.81 16 8.5 16H6" stroke="black" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8.5 19L5.5 16L8.5 13" stroke="black" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9.5 7L6.5 4L9.5 1" stroke="black" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Intérieur blanc -->
        <path d="M8.5 4C11.81 4 14.5 6.69 14.5 10C14.5 13.31 11.81 16 8.5 16H6" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8.5 19L5.5 16L8.5 13" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9.5 7L6.5 4L9.5 1" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </svg>`;
    
    // Encoder le SVG en URL encodé
    const encoded = encodeURIComponent(svg);
    return `url("data:image/svg+xml,${encoded}") 10 10, auto`;
  }, [rotationAngle]);

  return rotateCursorUrl;
};
