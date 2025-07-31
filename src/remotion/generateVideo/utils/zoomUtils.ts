import { interpolate, Easing } from "remotion";
import { ZoomType } from "@/src/types/video";

// Zoom configurations with speed and intensity
export const ZOOM_CONFIGS = {
    // Punctual zooms
    'zoom-in': { intensity: 0.2, duration: 25 },
    'zoom-in-impact': { intensity: 0.4, duration: 10 },
    'zoom-in-fast': { intensity: 0.2, duration: 15 },
    'zoom-in-instant': { intensity: 0.1, duration: 0 },
    'zoom-out': { intensity: -0.2, duration: 25 },
    'zoom-out-impact': { intensity: -0.4, duration: 10 },
    'zoom-out-fast': { intensity: -0.2, duration: 15 },
    'zoom-out-instant': { intensity: -0.1, duration: 0 },
    
    // Continuous zooms (until end of sequence)
    'zoom-in-continuous': { intensity: 0.3, duration: -1, continuous: true },
    'zoom-out-continuous': { intensity: -0.3, duration: -1, continuous: true },
};

// Analyze all zoom points in sequence to determine zoom levels
export const analyzeSequenceZooms = (sequence: any) => {
    if (!sequence?.words) return { initialZoom: 1.0, zoomPoints: [] };
    
    const zoomPoints: Array<{
        frame: number;
        type: ZoomType;
        config: any;
        targetLevel: number;
    }> = [];
    
    // Collect all zoom points
    sequence.words.forEach((word: any) => {
        if (word.zoom && word.zoom in ZOOM_CONFIGS) {
            const wordStartFrame = (word.start - sequence.start) * 60;
            zoomPoints.push({
                frame: wordStartFrame,
                type: word.zoom,
                config: ZOOM_CONFIGS[word.zoom as keyof typeof ZOOM_CONFIGS],
                targetLevel: 0 // Will be calculated
            });
        }
    });
    
    // Sort by frame order
    zoomPoints.sort((a, b) => a.frame - b.frame);
    
    // Determine initial zoom level based on first zoom action
    let initialZoom = 1.0;
    
    if (zoomPoints.length > 0) {
        const firstZoom = zoomPoints[0]; // First zoom chronologically
        
        if (firstZoom.config.intensity < 0) {
            // If first action has negative intensity, we need to start higher
            // We want to end up at least at 1.0 after the negative zoom
            const targetAfterNegativeZoom = 1.0;
            initialZoom = targetAfterNegativeZoom - firstZoom.config.intensity; // intensity is negative, so this adds
            console.log(`First zoom has negative intensity (${firstZoom.config.intensity}), starting at ${initialZoom} to reach ${targetAfterNegativeZoom}`);
        }
        
        // Additional check: ensure we never go below 0.5 throughout the sequence
        let simulatedLevel = initialZoom;
        for (const point of zoomPoints) {
            if (!point.config.continuous) {
                simulatedLevel += point.config.intensity;
                if (simulatedLevel < 0.5) {
                    const adjustment = 0.5 - simulatedLevel;
                    initialZoom += adjustment;
                    simulatedLevel = 0.5;
                }
            }
        }
    }
    
    // Now calculate target levels with the correct initial zoom
    let currentLevel = initialZoom;
    zoomPoints.forEach((point) => {
        if (point.config.continuous) {
            // Continuous zooms don't change the base level immediately
            point.targetLevel = currentLevel;
        } else {
            // Apply the intensity change to current level
            currentLevel += point.config.intensity;
            point.targetLevel = currentLevel;
        }
    });
    
    // Debug log
    if (zoomPoints.length > 0) {
        console.log('Sequence zoom analysis:', {
            initialZoom,
            zoomCount: zoomPoints.length,
            zooms: zoomPoints.map(p => ({ frame: p.frame, type: p.type, target: p.targetLevel }))
        });
    }
    
    return { initialZoom, zoomPoints };
};

// Calculate zoom scale based on sequence analysis and current frame
export const calculateZoomScale = (sequences: any, sequenceIndex: number, currentFrameInSequence: number) => {
    const sequence = sequences[sequenceIndex];
    if (!sequence?.words) return 1.0;
    
    const { initialZoom, zoomPoints } = analyzeSequenceZooms(sequence);
    
    // Start with initial zoom level
    let currentZoomLevel = initialZoom;
    
    // Find the active zoom transitions at current frame
    let activeRegularTransition = null;
    let activeContinuousTransition = null;
    let baseLevel = initialZoom;
    
    // First pass: process all regular (non-continuous) transitions to establish base level
    for (const point of zoomPoints) {
        if (!point.config.continuous) {
            // Regular zoom transitions
            const transitionEnd = point.config.duration === 0 ? point.frame : point.frame + point.config.duration;
            
            if (currentFrameInSequence >= transitionEnd) {
                // This transition is completed
                baseLevel = point.targetLevel;
            } else if (currentFrameInSequence >= point.frame) {
                // This transition is active
                activeRegularTransition = point;
                break; // Only break for regular transitions, as they are mutually exclusive
            }
        }
    }
    
    // Second pass: find active continuous transition (can coexist with regular transitions)
    for (const point of zoomPoints) {
        if (point.config.continuous) {
            // Continuous zoom is active from its start frame until end of sequence
            if (currentFrameInSequence >= point.frame) {
                activeContinuousTransition = point;
                // Don't break here, continue to find the latest continuous transition
            }
        }
    }
    
    // Start with base level
    currentZoomLevel = baseLevel;
    
    // Apply regular transition if any
    if (activeRegularTransition) {
        const framesSinceStart = currentFrameInSequence - activeRegularTransition.frame;
        const config = activeRegularTransition.config;
        
        if (config.duration === 0) {
            // Instant zoom: apply immediately
            currentZoomLevel = baseLevel + config.intensity;
        } else {
            const zoomProgress = interpolate(
                framesSinceStart,
                [0, config.duration],
                [0, config.intensity],
                {
                    easing: Easing.out(Easing.ease),
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp'
                }
            );
            
            currentZoomLevel = baseLevel + zoomProgress;
        }
    }
    
    // Apply continuous transition if any (additive to regular transitions)
    if (activeContinuousTransition) {
        const framesSinceStart = currentFrameInSequence - activeContinuousTransition.frame;
        const config = activeContinuousTransition.config;
        
        // Continuous zoom: progress throughout the remaining sequence duration
        const sequenceDuration = sequence.durationInFrames || 100; // Fallback duration
        const totalFramesFromWordStart = sequenceDuration - (activeContinuousTransition.frame / 60); // Convert back from frame timing
        
        const continuousProgress = interpolate(
            framesSinceStart,
            [0, totalFramesFromWordStart],
            [0, config.intensity],
            {
                easing: (t: number) => t, // Linear easing for continuous zoom
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp'
            }
        );
        
        // Add continuous zoom to current level (can be base level or level with regular transition)
        currentZoomLevel += continuousProgress;
    }
    
    const finalZoom = Math.max(0.1, currentZoomLevel);
    
    // Debug log for active transitions
    if ((activeRegularTransition || activeContinuousTransition) && currentFrameInSequence % 10 === 0) { // Log every 10 frames to avoid spam
        const activeTypes = [
            activeRegularTransition?.type,
            activeContinuousTransition?.type
        ].filter(Boolean).join(', ');
        console.log(`Frame ${currentFrameInSequence}: base=${baseLevel.toFixed(2)}, active=[${activeTypes}], final=${finalZoom.toFixed(2)}`);
    }
    
    return finalZoom;
}; 