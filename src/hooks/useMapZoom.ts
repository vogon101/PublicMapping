import { useEffect, useRef, useState } from "react";
import { Map } from "mapbox-gl";

export type MapMode = 'transition' | 'geographic';

const DIAGRAMMATIC_THRESHOLD = 7;
const GEOGRAPHIC_THRESHOLD = 10;
const LONDON_CENTER: [number, number] = [-0.095, 51.52];

interface UseMapZoomOptions {
  map: React.RefObject<Map | null>;
  onMapReady?: () => void;
}

interface UseMapZoomReturn {
  mode: MapMode;
  zoomLevel: number;
  transitionProgress: number;
  mapReady: boolean;
  DIAGRAMMATIC_THRESHOLD: number;
  GEOGRAPHIC_THRESHOLD: number;
}

/**
 * Custom hook to manage map zoom state and mode transitions
 * Handles touch vs mouse interactions differently for optimal UX
 */
export function useMapZoom({ map, onMapReady }: UseMapZoomOptions): UseMapZoomReturn {
  const [zoomLevel, setZoomLevel] = useState(7);
  const [mapReady, setMapReady] = useState(false);
  const [mode, setMode] = useState<MapMode>('transition');
  const [, setForceUpdate] = useState(0);
  const modeRef = useRef<MapMode>(mode);

  // Calculate transition progress (0 = diagrammatic, 1 = geographic)
  const currentZoom = map.current?.getZoom() || 7;
  const transitionProgress = Math.max(0, Math.min(1,
    (currentZoom - DIAGRAMMATIC_THRESHOLD) / (GEOGRAPHIC_THRESHOLD - DIAGRAMMATIC_THRESHOLD)
  ));

  // Setup map listeners for zoom and movement
  useEffect(() => {
    if (!map.current) return;

    const setupMapListeners = () => {
      if (!map.current || !map.current.isStyleLoaded()) {
        setTimeout(setupMapListeners, 100);
        return;
      }

      setMapReady(true);
      onMapReady?.();

      let recenterTimeout: NodeJS.Timeout | null = null;
      let isZooming = false;

      const handleZoomStart = () => {
        isZooming = true;
        if (recenterTimeout) {
          clearTimeout(recenterTimeout);
          recenterTimeout = null;
        }
      };

      const handleZoomEnd = () => {
        isZooming = false;
        // Re-center after zoom animation completes (if not in geographic mode)
        if (map.current && modeRef.current !== 'geographic') {
          recenterTimeout = setTimeout(() => {
            if (map.current && modeRef.current !== 'geographic') {
              map.current.easeTo({
                center: LONDON_CENTER,
                duration: 200
              });
            }
          }, 50);
        }
      };

      const handleMoveEnd = () => {
        // Re-center on moveend too (for pan gestures in non-geographic modes)
        if (map.current && modeRef.current !== 'geographic' && !isZooming) {
          if (recenterTimeout) {
            clearTimeout(recenterTimeout);
          }
          recenterTimeout = setTimeout(() => {
            if (map.current && modeRef.current !== 'geographic') {
              map.current.easeTo({
                center: LONDON_CENTER,
                duration: 200
              });
            }
          }, 100);
        }
      };

      const handleZoom = () => {
        if (map.current) {
          const currentZoom = map.current.getZoom();

          // Simple mode transitions based on zoom level
          if (currentZoom >= GEOGRAPHIC_THRESHOLD) {
            // Fully zoomed in - geographic mode
            if (modeRef.current !== 'geographic') {
              setMode('geographic');
            }
          } else {
            // Below threshold - transition mode (includes diagrammatic at zoom 7)
            if (modeRef.current !== 'transition') {
              setMode('transition');
            }
          }

          setZoomLevel(currentZoom);
        }
      };

      const handleMove = () => {
        setForceUpdate((prev) => prev + 1);
      };

      // Track zoom changes
      map.current.on("zoomstart", handleZoomStart);
      map.current.on("zoom", handleZoom);
      map.current.on("zoomend", handleZoomEnd);
      // Track move for SVG overlay updates
      map.current.on("move", handleMove);
      map.current.on("moveend", handleMoveEnd);

      return () => {
        if (recenterTimeout) {
          clearTimeout(recenterTimeout);
        }
        if (map.current) {
          map.current.off("zoomstart", handleZoomStart);
          map.current.off("zoom", handleZoom);
          map.current.off("zoomend", handleZoomEnd);
          map.current.off("move", handleMove);
          map.current.off("moveend", handleMoveEnd);
        }
      };
    };

    const cleanup = setupMapListeners();
    return () => {
      if (cleanup) cleanup();
    };
  }, [map, onMapReady]);

  // Update mode ref when mode changes
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Control pan based on mode
  useEffect(() => {
    if (!map.current) return;

    if (mode === 'geographic') {
      // Enable panning in geographic mode
      map.current.dragPan.enable();
    } else {
      // Disable pan in non-geographic modes to keep map locked to center
      // Only zoom is allowed - map stays centered
      map.current.dragPan.disable();
      map.current.setMinZoom(7);
    }
  }, [mode, map]);

  return {
    mode,
    zoomLevel,
    transitionProgress,
    mapReady,
    DIAGRAMMATIC_THRESHOLD,
    GEOGRAPHIC_THRESHOLD,
  };
}
