import { useState } from "react";
import { CrossrailLine } from "../data/crossrailData";
import { MapMode } from "../hooks/useMapZoom";

interface CrossrailInfoPanelProps {
  crossrailLines: CrossrailLine[];
  mode: MapMode;
  zoomLevel: number;
  transitionProgress: number;
  debugMode?: boolean;
}

export default function CrossrailInfoPanel({
  crossrailLines,
  mode,
  zoomLevel,
  transitionProgress,
  debugMode = false,
}: CrossrailInfoPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed top-8 md:left-8 left-1/2 md:translate-x-0 -translate-x-1/2 bg-black/70 text-white p-4 md:p-6 rounded-lg z-20 backdrop-blur-sm max-w-md">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-lg md:text-2xl font-bold">London Crossrail Proposals</h1>
          <span className="ml-2 text-sm md:hidden">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </button>

      {/* Expandable content - hidden on mobile unless expanded, always visible on desktop */}
      <div className={`${isExpanded ? 'block' : 'hidden'} md:block`}>
        <p className="text-xs md:text-sm text-gray-300 mt-2 mb-4">
          Proposed new orbital and crossrail routes from transport planning studies
        </p>
        <div className="space-y-2">
          {crossrailLines.map((line, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: line.color }}
              />
              <span className="font-medium">{line.name}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">
          {mode === 'transition' && 'Zoom in to explore (zoom < 10)'}
          {mode === 'geographic' && 'Geographic mode - pan and explore! (zoom 10+)'}
        </p>
        <div className="mt-2 bg-gray-700 h-1 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-100"
            style={{
              width: `${transitionProgress * 100}%`,
              background: 'linear-gradient(90deg, #9B59B6, #E67E22, #16A085)'
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Zoom: {zoomLevel.toFixed(1)} | Mode: {mode}
        </p>
        {mode === 'geographic' && (
          <p className="text-xs text-green-400 mt-2">
            ✓ Using GeoJSON layers
          </p>
        )}
        {debugMode && (
          <p className="text-xs text-yellow-400 mt-2">
            🔧 Debug mode active
          </p>
        )}
      </div>
    </div>
  );
}
