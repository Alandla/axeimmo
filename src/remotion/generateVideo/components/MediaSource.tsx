import React from 'react';

export const MediaSource = ({ source }: { source: string }) => {
    return (
        <div
            style={{
                position: 'absolute',
                top: '450px',
                right: '80px',
                transform: 'translateX(100%) rotate(270deg)',
                transformOrigin: 'left center',
                color: 'white',
                fontSize: '34px',
                fontWeight: 'bold',
                textShadow: 
                    '0 0 15px rgba(0, 0, 0, 0.4), ' + // Ombre complète avec opacité faible
                    '2px 2px 3px rgba(0, 0, 0, 0.8)',  // Ombre en dessous plus forte
                zIndex: 100,
                whiteSpace: 'nowrap',
                userSelect: 'none',
                pointerEvents: 'none'
            }}
        >
            Source: {source}
        </div>
    );
}; 