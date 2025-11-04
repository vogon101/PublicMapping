import { Map } from "mapbox-gl";
import { CrossrailLine, RoutePoint, LineSegment } from "../data/crossrailData";
import { lerp, easeInOutCubic } from "../utils/geometry";

interface DiagrammaticOverlayProps {
  crossrailLines: CrossrailLine[];
  map: React.RefObject<Map | null>;
  mapReady: boolean;
  transitionProgress: number;
  dimensions: { width: number; height: number };
}

export default function DiagrammaticOverlay({
  crossrailLines,
  map,
  mapReady,
  transitionProgress,
  dimensions,
}: DiagrammaticOverlayProps) {

  // Calculate SVG opacity - fade out from zoom 9.9 to 10 as GeoJSON fades in
  const realTimeZoom = map.current?.getZoom() || 7;
  let svgOpacity = 1;
  if (realTimeZoom >= 9.9) {
    if (realTimeZoom >= 10) {
      svgOpacity = 0;
    } else {
      // Linear fade from 1 to 0 between zoom 9.9 and 10
      svgOpacity = 1 - ((realTimeZoom - 9.9) / 0.1);
    }
  }

  // Don't render at all if fully transparent
  if (svgOpacity === 0) return null;

  // Calculate station positions - interpolate between diagrammatic and geographic
  const getStationPosition = (point: RoutePoint, progress: number) => {
    const easedProgress = easeInOutCubic(progress);

    // Diagrammatic position (center of screen, normalized coordinates)
    const diagramCenterX = dimensions.width / 2;
    const diagramCenterY = dimensions.height / 2;
    const diagramScale = Math.min(dimensions.width, dimensions.height) * 0.7;

    const diagramX = diagramCenterX + (point.diagramX - 0.5) * diagramScale;
    const diagramY = diagramCenterY + (point.diagramY - 0.5) * diagramScale;

    // Geographic position (using Mapbox projection)
    let geoX = diagramX;
    let geoY = diagramY;

    // Project works even during tile loading, so don't check isStyleLoaded()
    if (mapReady && map.current) {
      try {
        const mapPoint = map.current.project([point.geoLng, point.geoLat]);
        geoX = mapPoint.x;
        geoY = mapPoint.y;
      } catch (e) {
        // Fallback to diagram position if projection fails
        console.warn("Projection failed for point:", point.name, e);
      }
    }

    // Interpolate between positions
    const x = lerp(diagramX, geoX, easedProgress);
    const y = lerp(diagramY, geoY, easedProgress);

    return { x, y };
  };

  // Generate straight line path connecting all points
  const generateLinePath = (points: { x: number; y: number }[]): string => {
    if (points.length < 2) return "";

    // Start with move to first point
    let path = `M ${points[0].x} ${points[0].y}`;

    // Draw straight lines to each subsequent point
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }

    return path;
  };

  // Render a single segment of a line (SVG)
  const renderSegment = (
    segment: LineSegment,
    lineColor: string,
    lineIndex: number,
    segmentIndex: number,
    progress: number
  ) => {
    // Get all point positions for this segment (stations + waypoints)
    const pointPositions = segment.points.map((point) =>
      getStationPosition(point, progress)
    );

    // Generate straight line path through all points
    const pathString = generateLinePath(pointPositions);

    return (
      <g key={`line-${lineIndex}-segment-${segmentIndex}`}>
        {/* The line itself */}
        <path
          d={pathString}
          fill="none"
          stroke={lineColor}
          strokeWidth={10}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Station circles - only render for actual stations, not waypoints */}
        {pointPositions.map((pos, pointIdx) => {
          const point = segment.points[pointIdx];

          // Skip waypoints - only render circles for stations
          if (!point.isStation) return null;

          const radius = point.isInterchange ? 8 : 6;
          const strokeW = point.isInterchange ? 4 : 3;

          return (
            <circle
              key={`station-${lineIndex}-${segmentIndex}-${pointIdx}`}
              cx={pos.x}
              cy={pos.y}
              r={radius}
              fill="white"
              stroke={lineColor}
              strokeWidth={strokeW}
            />
          );
        })}
      </g>
    );
  };

  // Render a complete line (all segments)
  const renderLine = (
    lineData: CrossrailLine,
    lineIndex: number,
    progress: number
  ) => {
    return (
      <g key={`line-${lineIndex}`}>
        {lineData.segments.map((segment, segmentIdx) =>
          renderSegment(segment, lineData.color, lineIndex, segmentIdx, progress)
        )}
      </g>
    );
  };

  return (
    <svg
      className="fixed top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 10, opacity: svgOpacity }}
    >
      {crossrailLines.map((line, idx) => renderLine(line, idx, transitionProgress))}
    </svg>
  );
}
