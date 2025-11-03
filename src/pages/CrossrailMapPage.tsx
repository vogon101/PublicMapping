import { useRef, useState, useEffect } from "react";
import { Map } from "mapbox-gl";
import MapPage from "../components/MapPage";

// Data structures
interface RoutePoint {
  name?: string; // Only for stations
  diagramX: number; // Normalized 0-1
  diagramY: number; // Normalized 0-1
  geoLat: number;
  geoLng: number;
  isStation: boolean; // true = station with circle, false = waypoint for routing only
  isInterchange?: boolean;
}

interface LineSegment {
  points: RoutePoint[]; // All points including stations and waypoints
}

interface CrossrailLine {
  name: string;
  color: string;
  segments: LineSegment[]; // Support multiple segments for branching
}

// Realistic crossrail routes based on London transport proposals
const crossrailLines: CrossrailLine[] = [
  // Elizabeth Line - branches at both ends
  {
    name: "Crossrail 1: Elizabeth",
    color: "#6950A1",
    segments: [
      // Main trunk through center
      {
        points: [
          { name: "Reading", diagramX: 0.05, diagramY: 0.42, geoLat: 51.4543, geoLng: -0.9781, isStation: true, isInterchange: true },
          // Waypoint for Thames valley routing
          { diagramX: 0.10, diagramY: 0.425, geoLat: 51.4800, geoLng: -0.7900, isStation: false },
          { name: "Slough", diagramX: 0.15, diagramY: 0.43, geoLat: 51.5113, geoLng: -0.5945, isStation: true, isInterchange: true },
          // Waypoint for M4 corridor
          { diagramX: 0.23, diagramY: 0.44, geoLat: 51.5100, geoLng: -0.3800, isStation: false },
          { name: "Paddington", diagramX: 0.32, diagramY: 0.46, geoLat: 51.5154, geoLng: -0.1755, isStation: true, isInterchange: true },
          { name: "Bond Street", diagramX: 0.38, diagramY: 0.47, geoLat: 51.5142, geoLng: -0.1494, isStation: true, isInterchange: true },
          { name: "Tottenham Court Road", diagramX: 0.43, diagramY: 0.48, geoLat: 51.5165, geoLng: -0.1308, isStation: true, isInterchange: true },
          { name: "Liverpool Street", diagramX: 0.52, diagramY: 0.49, geoLat: 51.5178, geoLng: -0.0823, isStation: true, isInterchange: true },
          { name: "Whitechapel", diagramX: 0.58, diagramY: 0.5, geoLat: 51.5194, geoLng: -0.0612, isStation: true, isInterchange: true },
          { name: "Canary Wharf", diagramX: 0.68, diagramY: 0.51, geoLat: 51.5054, geoLng: -0.0235, isStation: true, isInterchange: true },
          // Waypoint for Thames routing
          { diagramX: 0.75, diagramY: 0.525, geoLat: 51.4980, geoLng: 0.0500, isStation: false },
          { name: "Abbey Wood", diagramX: 0.82, diagramY: 0.54, geoLat: 51.4906, geoLng: 0.1209, isStation: true, isInterchange: true },
        ],
      },
      // Heathrow branch
      {
        points: [
          { name: "Heathrow", diagramX: 0.08, diagramY: 0.52, geoLat: 51.4700, geoLng: -0.4543, isStation: true, isInterchange: true },
          // Waypoint for airport approach
          { diagramX: 0.20, diagramY: 0.49, geoLat: 51.4900, geoLng: -0.3100, isStation: false },
          { name: "Paddington", diagramX: 0.32, diagramY: 0.46, geoLat: 51.5154, geoLng: -0.1755, isStation: true, isInterchange: true },
        ],
      },
      // Shenfield branch
      {
        points: [
          { name: "Abbey Wood", diagramX: 0.82, diagramY: 0.54, geoLat: 51.4906, geoLng: 0.1209, isStation: true, isInterchange: true },
          // Waypoint curving north
          { diagramX: 0.88, diagramY: 0.51, geoLat: 51.5500, geoLng: 0.2200, isStation: false },
          { name: "Shenfield", diagramX: 0.95, diagramY: 0.48, geoLat: 51.6314, geoLng: 0.3236, isStation: true },
        ],
      },
    ],
  },
  // Thameslink - north-south through center
  {
    name: "Crossrail 2: Thameslink",
    color: "#D81B60",
    segments: [
      {
        points: [
          { name: "Luton", diagramX: 0.48, diagramY: 0.05, geoLat: 51.8827, geoLng: -0.3952, isStation: true, isInterchange: true },
          // Waypoint north of London
          { diagramX: 0.48, diagramY: 0.15, geoLat: 51.7000, geoLng: -0.2000, isStation: false },
          { name: "St Pancras", diagramX: 0.48, diagramY: 0.25, geoLat: 51.5308, geoLng: -0.1267, isStation: true, isInterchange: true },
          { name: "Farringdon", diagramX: 0.48, diagramY: 0.32, geoLat: 51.5203, geoLng: -0.1053, isStation: true, isInterchange: true },
          { name: "Blackfriars", diagramX: 0.48, diagramY: 0.40, geoLat: 51.5120, geoLng: -0.1040, isStation: true, isInterchange: true },
          { name: "London Bridge", diagramX: 0.48, diagramY: 0.48, geoLat: 51.5045, geoLng: -0.0865, isStation: true, isInterchange: true },
          // Waypoint for south London curve
          { diagramX: 0.48, diagramY: 0.60, geoLat: 51.4200, geoLng: -0.0950, isStation: false },
          { name: "East Croydon", diagramX: 0.48, diagramY: 0.70, geoLat: 51.3758, geoLng: -0.0928, isStation: true, isInterchange: true },
          // Waypoint for Surrey routing
          { diagramX: 0.48, diagramY: 0.85, geoLat: 51.2500, geoLng: -0.1300, isStation: false },
          { name: "Gatwick", diagramX: 0.48, diagramY: 0.95, geoLat: 51.1564, geoLng: -0.1611, isStation: true, isInterchange: true },
        ],
      },
    ],
  },
  // Livery - orbital northeast to southwest
  {
    name: "Crossrail 3: Livery",
    color: "#F9A825",
    segments: [
      {
        points: [
          { name: "Chingford", diagramX: 0.82, diagramY: 0.12, geoLat: 51.6327, geoLng: -0.0096, isStation: true, isInterchange: true },
          { name: "Tottenham Hale", diagramX: 0.72, diagramY: 0.22, geoLat: 51.5882, geoLng: -0.0594, isStation: true, isInterchange: true },
          { name: "Finsbury Park", diagramX: 0.62, diagramY: 0.28, geoLat: 51.5642, geoLng: -0.1065, isStation: true, isInterchange: true },
          // Waypoint for Camden curve
          { diagramX: 0.55, diagramY: 0.32, geoLat: 51.5500, geoLng: -0.1500, isStation: false },
          { name: "West Hampstead", diagramX: 0.48, diagramY: 0.36, geoLat: 51.5469, geoLng: -0.1905, isStation: true, isInterchange: true },
          // Waypoint curving south
          { diagramX: 0.42, diagramY: 0.50, geoLat: 51.5000, geoLng: -0.1750, isStation: false },
          { name: "Clapham Junction", diagramX: 0.35, diagramY: 0.62, geoLat: 51.4644, geoLng: -0.1704, isStation: true, isInterchange: true },
          { name: "Richmond", diagramX: 0.25, diagramY: 0.72, geoLat: 51.4633, geoLng: -0.3015, isStation: true, isInterchange: true },
          { name: "Twickenham", diagramX: 0.18, diagramY: 0.80, geoLat: 51.4476, geoLng: -0.3263, isStation: true, isInterchange: true },
          { name: "Shepperton", diagramX: 0.10, diagramY: 0.90, geoLat: 51.3956, geoLng: -0.4453, isStation: true },
        ],
      },
    ],
  },
  // Chiltern Downs - west to southeast
  {
    name: "Crossrail 4: Chiltern Downs",
    color: "#AB47BC",
    segments: [
      {
        points: [
          { name: "Aylesbury", diagramX: 0.02, diagramY: 0.30, geoLat: 51.8165, geoLng: -0.8120, isStation: true, isInterchange: true },
          // Waypoint for Chiltern Hills
          { diagramX: 0.18, diagramY: 0.36, geoLat: 51.6700, geoLng: -0.5000, isStation: false },
          // { name: "Marylebone", diagramX: 0.35, diagramY: 0.42, geoLat: 51.5226, geoLng: -0.1635, isStation: true, isInterchange: true },
          { name: "Baker Street", diagramX: 0.40, diagramY: 0.43, geoLat: 51.5226, geoLng: -0.1571, isStation: true, isInterchange: true },
          { name: "Liverpool Street", diagramX: 0.52, diagramY: 0.49, geoLat: 51.5178, geoLng: -0.0823, isStation: true, isInterchange: true },
          { name: "Stratford", diagramX: 0.62, diagramY: 0.52, geoLat: 51.5416, geoLng: -0.0042, isStation: true, isInterchange: true },
          // Waypoint for southeast curve
          { diagramX: 0.72, diagramY: 0.62, geoLat: 51.4500, geoLng: 0.0500, isStation: false },
          { name: "Orpington", diagramX: 0.82, diagramY: 0.72, geoLat: 51.3729, geoLng: 0.0974, isStation: true, isInterchange: true },
          { name: "Swanley", diagramX: 0.90, diagramY: 0.78, geoLat: 51.3968, geoLng: 0.1729, isStation: true },
        ],
      },
    ],
  },
  // Oldcastle - north-south via central
  {
    name: "Crossrail 5: Oldcastle",
    color: "#29B6F6",
    segments: [
      {
        points: [
          { name: "Welwyn Garden City", diagramX: 0.58, diagramY: 0.08, geoLat: 51.8014, geoLng: -0.2046, isStation: true, isInterchange: true },
          // Waypoint for ECML corridor
          { diagramX: 0.58, diagramY: 0.16, geoLat: 51.6500, geoLng: -0.1700, isStation: false },
          { name: "Kings Cross", diagramX: 0.58, diagramY: 0.24, geoLat: 51.5308, geoLng: -0.1238, isStation: true, isInterchange: true },
          { name: "Farringdon", diagramX: 0.58, diagramY: 0.32, geoLat: 51.5203, geoLng: -0.1053, isStation: true, isInterchange: true },
          { name: "Blackfriars", diagramX: 0.58, diagramY: 0.40, geoLat: 51.5120, geoLng: -0.1040, isStation: true, isInterchange: true },
          // Waypoint for south London
          { diagramX: 0.58, diagramY: 0.50, geoLat: 51.4800, geoLng: -0.1400, isStation: false },
          { name: "Clapham Junction", diagramX: 0.58, diagramY: 0.58, geoLat: 51.4644, geoLng: -0.1704, isStation: true, isInterchange: true },
          { name: "Wimbledon", diagramX: 0.58, diagramY: 0.72, geoLat: 51.4214, geoLng: -0.2064, isStation: true, isInterchange: true },
          { name: "Sutton", diagramX: 0.58, diagramY: 0.88, geoLat: 51.3619, geoLng: -0.1945, isStation: true, isInterchange: true },
        ],
      },
    ],
  },
  // Fenterloo - east-west via south
  {
    name: "Crossrail 6: Fenterloo",
    color: "#EC407A",
    segments: [
      {
        points: [
          { name: "Shoeburyness", diagramX: 0.98, diagramY: 0.45, geoLat: 51.5312, geoLng: 0.7947, isStation: true },
          // Waypoint for Thames estuary
          { diagramX: 0.95, diagramY: 0.465, geoLat: 51.5100, geoLng: 0.5500, isStation: false },
          { name: "Grays", diagramX: 0.92, diagramY: 0.48, geoLat: 51.4759, geoLng: 0.3263, isStation: true, isInterchange: true },
          // Waypoint curving into east London
          { diagramX: 0.77, diagramY: 0.50, geoLat: 51.5200, geoLng: 0.1500, isStation: false },
          { name: "Stratford", diagramX: 0.62, diagramY: 0.52, geoLat: 51.5416, geoLng: -0.0042, isStation: true, isInterchange: true },
          // Waypoint across central London
          { diagramX: 0.48, diagramY: 0.57, geoLat: 51.5000, geoLng: -0.0900, isStation: false },
          { name: "Clapham Junction", diagramX: 0.35, diagramY: 0.62, geoLat: 51.4644, geoLng: -0.1704, isStation: true, isInterchange: true },
          // Waypoint southwest
          { diagramX: 0.26, diagramY: 0.65, geoLat: 51.4550, geoLng: -0.2900, isStation: false },
          { name: "Feltham", diagramX: 0.18, diagramY: 0.68, geoLat: 51.4489, geoLng: -0.4083, isStation: true, isInterchange: true },
          { name: "Staines", diagramX: 0.08, diagramY: 0.70, geoLat: 51.4340, geoLng: -0.5080, isStation: true },
        ],
      },
    ],
  },
];

// Utility functions
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Debug mode - set to true to always show map at full opacity
const DEBUG_MODE = false;


export default function CrossrailMapPage() {
  const map = useRef<Map | null>(null);
  const [zoomLevel, setZoomLevel] = useState(7); // Start zoomed out
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [mapReady, setMapReady] = useState(false);
  const [mode, setMode] = useState('diagrammatic');
  const [forceUpdate, setForceUpdate] = useState(0);
  const modeRef = useRef(mode);

  // Define zoom regions
  const DIAGRAMMATIC_THRESHOLD = 7;
  const GEOGRAPHIC_THRESHOLD = 10;

  // Calculate transition progress (0 = diagrammatic, 1 = geographic)
  // Read zoom from ref which is updated synchronously in event handler
  const currentZoom = map.current?.getZoom() || 7;
  const transitionProgress = Math.max(0, Math.min(1,
    (currentZoom - DIAGRAMMATIC_THRESHOLD) / (GEOGRAPHIC_THRESHOLD - DIAGRAMMATIC_THRESHOLD)
  ));

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);



  // Map movement handler - track zoom and force re-render when map moves
  useEffect(() => {
    if (!map.current) return;

    const setupMapListeners = () => {
      if (!map.current || !map.current.isStyleLoaded()) {
        setTimeout(setupMapListeners, 100);
        return;
      }

      setMapReady(true);

      const handleZoom = () => {
        if (map.current) {
          const currentZoom = map.current.getZoom();

          // Bidirectional mode transitions based on zoom level
          if (currentZoom >= GEOGRAPHIC_THRESHOLD) {
            // Fully zoomed in - geographic mode
            if (modeRef.current !== 'geographic') {
              setMode('geographic');
            }
          } else if (currentZoom <= DIAGRAMMATIC_THRESHOLD) {
            // Fully zoomed out - diagrammatic mode
            if (modeRef.current !== 'diagrammatic') {
              setMode('diagrammatic');
            }
            // Re-center when in diagrammatic mode
            map.current.setCenter([-0.095, 51.52]);
          } else {
            // Between thresholds - transition mode
            if (modeRef.current !== 'transition') {
              setMode('transition');
            }
            // Re-center when in transition mode
            map.current.setCenter([-0.095, 51.52]);
          }

          setZoomLevel(currentZoom);
        }
      };

      const handleMove = () => {
        setForceUpdate((prev) => prev + 1);
      };

      // Track zoom changes
      map.current.on("zoom", handleZoom);
      // Track move for SVG overlay updates
      map.current.on("move", handleMove);

      return () => {
        if (map.current) {
          map.current.off("zoom", handleZoom);
          map.current.off("move", handleMove);
        }
      };
    };

    const cleanup = setupMapListeners();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  // Setup map - initial configuration
  useEffect(() => {
    if (!map.current) return;

    const setupMap = () => {
      if (!map.current || !map.current.isStyleLoaded()) {
        setTimeout(setupMap, 100);
        return;
      }

      // Enable smooth scroll zoom around center
      map.current.scrollZoom.enable({ around: 'center' });
      // Tweak rates for smoother feel (slower wheel + moderate trackpad)
      map.current.scrollZoom.setWheelZoomRate(1 / 2000);
      map.current.scrollZoom.setZoomRate(1 / 500);

      map.current.doubleClickZoom.disable();
      map.current.boxZoom.disable();
      map.current.keyboard.disable();
      map.current.touchZoomRotate.disable();

      // Disable rotation and pan initially (controlled by mode)
      map.current.dragRotate.disable();
      map.current.dragPan.disable();

      // Set min zoom to prevent zooming out too far
      map.current.setMinZoom(7);
    };

    setupMap();
  }, []);

  // Control pan based on mode
  useEffect(() => {
    modeRef.current = mode;
    console.log(`mode: ${mode}`);
    console.log(`map.current: ${map.current} isStyleLoaded: ${map.current?.isStyleLoaded()}`);

    if (!map.current) return;
    
    if (mode === 'geographic') {
      // Enable panning in geographic mode
      map.current.dragPan.enable();
      // Set minimum zoom to prevent going back
      // map.current.setMinZoom(GEOGRAPHIC_THRESHOLD);
    } else {
      // Disable panning in diagrammatic and transition modes
      map.current.dragPan.disable();
      map.current.setMinZoom(7);
    }
  }, [mode]);

  // Load GeoJSON layers once at startup with opacity expressions
  useEffect(() => {
    if (!map.current || !mapReady || !map.current.isStyleLoaded()) return;

    let layersAdded = false;

    // Add GeoJSON sources and layers for each crossrail line
    crossrailLines.forEach((line, lineIdx) => {
      line.segments.forEach((segment, segIdx) => {
        const sourceId = `crossrail-${lineIdx}-${segIdx}`;
        const layerId = `crossrail-layer-${lineIdx}-${segIdx}`;

        // Skip if already added
        if (map.current!.getLayer(layerId)) return;

        // Create GeoJSON LineString from segment points
        const coordinates = segment.points.map(p => [p.geoLng, p.geoLat]);

        const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
          type: 'Feature',
          properties: { color: line.color },
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        };

        // Add source
        map.current!.addSource(sourceId, {
          type: 'geojson',
          data: geojson
        });

        // Add layer with opacity expression (fade in from zoom 9.9)
        map.current!.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': line.color,
            'line-width': 6,
            'line-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              9.9, 0,    // Fully transparent at zoom 9.9
              10, 1    // Fully opaque at zoom 10.1
            ]
          }
        });

        layersAdded = true;
      });
    });

    // Add station circles
    if (!map.current!.getLayer('stations-layer')) {
      const stationPoints: GeoJSON.Feature<GeoJSON.Point>[] = [];
      crossrailLines.forEach(line => {
        line.segments.forEach(segment => {
          segment.points.forEach(point => {
            if (point.isStation) {
              stationPoints.push({
                type: 'Feature',
                properties: {
                  name: point.name,
                  color: line.color,
                  isInterchange: point.isInterchange || false
                },
                geometry: {
                  type: 'Point',
                  coordinates: [point.geoLng, point.geoLat]
                }
              });
            }
          });
        });
      });

      const stationsGeojson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: 'FeatureCollection',
        features: stationPoints
      };

      map.current!.addSource('stations', {
        type: 'geojson',
        data: stationsGeojson
      });

      map.current!.addLayer({
        id: 'stations-layer',
        type: 'circle',
        source: 'stations',
        paint: {
          'circle-radius': ['case', ['get', 'isInterchange'], 8, 6],
          'circle-color': '#ffffff',
          'circle-stroke-width': ['case', ['get', 'isInterchange'], 4, 3],
          'circle-stroke-color': ['get', 'color'],
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            9.9, 0,    // Fully transparent at zoom 9.9
            10, 1    // Fully opaque at zoom 10
          ],
          'circle-stroke-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            9.9, 0,    // Fully transparent at zoom 9.9
            10, 1    // Fully opaque at zoom 10
          ]
        }
      });

      layersAdded = true;
    }
  }, [mapReady]);

  // Calculate station positions - recalculates on every render when map moves
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

  const renderDiagrammaticLines = () => {
    // Calculate SVG opacity - fade out from zoom 9.9 to 10 as GeoJSON fades in
    // Use current zoom from ref to avoid state lag
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

    // console.log(`transitionProgress: ${transitionProgress}, easedProgress: ${easeInOutCubic(transitionProgress)} realTimeZoom: ${realTimeZoom}`);

    // Don't render at all if fully transparent
    if (svgOpacity === 0) return null;

    return (
      <svg
        className="fixed top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10, opacity: svgOpacity }}
      >
        {crossrailLines.map((line, idx) => renderLine(line, idx, transitionProgress))}
      </svg>
    );
  };

  // Calculate map opacity based on mode (or always visible in debug mode)
  const mapOpacity = DEBUG_MODE ? 1 : easeInOutCubic(transitionProgress);

  return (
    <>
      {/* Background layer */}
      <div className="fixed top-0 left-0 w-full h-screen bg-gray-900" style={{ zIndex: 0 }} />

      {/* Mapbox base layer - always interactive */}
      <div
        className="fixed top-0 left-0 w-full h-screen"
        style={{ opacity: mapOpacity, zIndex: 1 }}
      >
        <MapPage
          useContainer={false}
          map={map}
          styleUrl="mapbox://styles/mapbox/dark-v11"
          mapOpts={{
            center: [-0.095, 51.52],
            zoom: 7,
          }}
          mapClassName="w-full h-full"
        />
      </div>

      {/* Diagrammatic overlay */}
      {renderDiagrammaticLines()}

      {/* Info panel */}
      <div className="fixed top-8 left-8 bg-black/70 text-white p-6 rounded-lg z-20 backdrop-blur-sm max-w-md">
        <h1 className="text-2xl font-bold mb-2">London Crossrail Proposals</h1>
        <p className="text-sm text-gray-300 mb-4">
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
          {mode === 'diagrammatic' && 'Zoom in to start transition (zoom < 7)'}
          {mode === 'transition' && 'Transitioning to geographic view (zoom 7-10)'}
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
        {DEBUG_MODE && (
          <p className="text-xs text-yellow-400 mt-2">
            🔧 Debug mode active
          </p>
        )}
      </div>
    </>
  );
}
