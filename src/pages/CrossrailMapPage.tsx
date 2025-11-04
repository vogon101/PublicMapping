import { useRef, useState, useEffect } from "react";
import { Map } from "mapbox-gl";
import MapPage from "../components/MapPage";
import DiagrammaticOverlay from "../components/DiagrammaticOverlay";
import CrossrailInfoPanel from "../components/CrossrailInfoPanel";
import { crossrailLines } from "../data/crossrailData";
import { useMapZoom } from "../hooks/useMapZoom";
import { easeInOutCubic } from "../utils/geometry";

// Debug mode - set to true to always show map at full opacity
const DEBUG_MODE = false;

export default function CrossrailMapPage() {
  const map = useRef<Map | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Use custom hook for zoom/mode management
  const { mode, zoomLevel, transitionProgress, mapReady } = useMapZoom({
    map,
    onMapReady: () => {
      setupGeoJSONLayers();
    },
  });

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

      // Enable touch controls for mobile
      map.current.touchZoomRotate.enable();
      map.current.touchZoomRotate.disableRotation(); // Allow pinch zoom but not rotation

      // Disable rotation and pan initially (controlled by mode)
      map.current.dragRotate.disable();
      map.current.dragPan.disable();

      // Set min zoom to prevent zooming out too far
      map.current.setMinZoom(7);
    };

    setupMap();
  }, []);

  // Load GeoJSON layers once at startup with opacity expressions
  const setupGeoJSONLayers = () => {
    if (!map.current || !map.current.isStyleLoaded()) return;

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
    }
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
      <DiagrammaticOverlay
        crossrailLines={crossrailLines}
        map={map}
        mapReady={mapReady}
        transitionProgress={transitionProgress}
        dimensions={dimensions}
      />

      {/* Info panel */}
      <CrossrailInfoPanel
        crossrailLines={crossrailLines}
        mode={mode}
        zoomLevel={zoomLevel}
        transitionProgress={transitionProgress}
        debugMode={DEBUG_MODE}
      />
    </>
  );
}
