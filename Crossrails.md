# London Crossrail Proposals - Interactive Map

An interactive web visualization showing proposed London crossrail and orbital rail routes. The map features a smooth transition between a schematic diagrammatic view and a geographic map view, inspired by transport network diagrams.

## Overview

This project displays six proposed crossrail lines for London:
1. **Crossrail 1: Elizabeth** - East-west with branches (Reading/Heathrow to Abbey Wood/Shenfield)
2. **Crossrail 2: Thameslink** - North-south (Luton to Gatwick)
3. **Crossrail 3: Livery** - Orbital northeast to southwest
4. **Crossrail 4: Chiltern Downs** - West to southeast
5. **Crossrail 5: Oldcastle** - North-south via central London
6. **Crossrail 6: Fenterloo** - East-west via south London

## Key Features

### Zoom-Based Mode Transitions
- **Diagrammatic Mode (zoom ≤ 7)**: Schematic view with centered, normalized layout
- **Transition Mode (zoom 7-10)**: Smooth interpolation between schematic and geographic positions
- **Geographic Mode (zoom ≥ 10)**: Full geographic accuracy with Mapbox integration

### Smooth Animations
- Cubic easing function for natural-feeling transitions
- Real-time position interpolation during zoom
- Synchronized fade between SVG overlay and GeoJSON layers

### Interactive Controls
- Scroll/trackpad zoom with custom rates for smooth control
- Pan enabled only in geographic mode
- Bidirectional transitions (can zoom back out to diagrammatic view)
- Auto-centering in diagrammatic and transition modes

## Project Structure

```
src/
├── components/
│   ├── CrossrailInfoPanel.tsx      # Info panel showing line legend and status
│   ├── DiagrammaticOverlay.tsx     # SVG overlay for diagrammatic/transition views
│   └── MapPage.tsx                 # Mapbox wrapper component (existing)
├── data/
│   └── crossrailData.ts            # Line definitions, stations, and route data
├── hooks/
│   └── useMapZoom.ts               # Custom hook for zoom/mode state management
├── pages/
│   └── CrossrailMapPage.tsx        # Main page component (orchestration)
└── utils/
    └── geometry.ts                 # Math utilities (lerp, easing functions)
```

## Component Documentation

### `CrossrailMapPage.tsx`
**Location**: `src/pages/CrossrailMapPage.tsx`

Main orchestration component. Responsibilities:
- Map initialization and configuration
- GeoJSON layer setup
- Dimension tracking (for responsive SVG overlay)
- Composition of child components

**Key Functions**:
- `setupGeoJSONLayers()`: Creates Mapbox layers for geographic mode

### `DiagrammaticOverlay.tsx`
**Location**: `src/components/DiagrammaticOverlay.tsx`

Renders the SVG overlay for diagrammatic and transition modes.

**Key Functions**:
- `getStationPosition()`: Interpolates between diagrammatic and geographic coordinates
- `generateLinePath()`: Creates SVG path strings for line segments
- `renderSegment()`: Renders a single line segment with stations
- `renderLine()`: Renders a complete crossrail line with all segments

**Props**:
- `crossrailLines`: Array of line data
- `map`: Ref to Mapbox map instance
- `mapReady`: Boolean indicating if map is initialized
- `transitionProgress`: Number 0-1 indicating zoom-based transition
- `dimensions`: Current window dimensions

### `CrossrailInfoPanel.tsx`
**Location**: `src/components/CrossrailInfoPanel.tsx`

Info panel displaying line legend, current mode, and zoom level.

**Props**:
- `crossrailLines`: Array of line data
- `mode`: Current mode ('diagrammatic' | 'transition' | 'geographic')
- `zoomLevel`: Current zoom level
- `transitionProgress`: Number 0-1 for progress bar
- `debugMode`: Boolean to show debug info

### `useMapZoom` Hook
**Location**: `src/hooks/useMapZoom.ts`

Custom hook managing zoom state and mode transitions.

**Parameters**:
- `map`: Ref to Mapbox map instance
- `onMapReady`: Optional callback when map is ready

**Returns**:
- `mode`: Current mode
- `zoomLevel`: Current zoom level
- `transitionProgress`: Calculated 0-1 transition value
- `mapReady`: Boolean map ready state
- `DIAGRAMMATIC_THRESHOLD`: Constant (7)
- `GEOGRAPHIC_THRESHOLD`: Constant (10)

**Key Logic**:
- Listens to Mapbox zoom and move events
- Manages mode transitions based on zoom thresholds
- Controls pan enable/disable based on mode
- Auto-centers map in non-geographic modes

## Data Structure

### `crossrailData.ts`
**Location**: `src/data/crossrailData.ts`

**Types**:
```typescript
interface RoutePoint {
  name?: string;              // Station name (only for stations)
  diagramX: number;           // Normalized 0-1 position for diagram
  diagramY: number;           // Normalized 0-1 position for diagram
  geoLat: number;             // Geographic latitude
  geoLng: number;             // Geographic longitude
  isStation: boolean;         // true = station, false = routing waypoint
  isInterchange?: boolean;    // true for major interchange stations
}

interface LineSegment {
  points: RoutePoint[];       // All points including waypoints
}

interface CrossrailLine {
  name: string;               // Line name
  color: string;              // Hex color code
  segments: LineSegment[];    // Array supports branching lines
}
```

**Data**:
- `crossrailLines`: Array of 6 proposed crossrail routes
- Each route includes main trunk and branches (where applicable)
- Waypoints included for realistic curved routing

## Utility Functions

### `geometry.ts`
**Location**: `src/utils/geometry.ts`

**Functions**:
- `lerp(start, end, t)`: Linear interpolation between two values
- `easeInOutCubic(t)`: Cubic easing function for smooth transitions

## Technical Details

### Zoom Thresholds
- **DIAGRAMMATIC_THRESHOLD**: 7
- **GEOGRAPHIC_THRESHOLD**: 10

### Map Configuration
- **Base style**: Mapbox Dark (`mapbox://styles/mapbox/dark-v11`)
- **Initial center**: [-0.095, 51.52] (London)
- **Initial zoom**: 7
- **Min zoom**: 7 (prevents over-zooming out)
- **Scroll zoom rates**:
  - Wheel: 1/2000 (slow, precise)
  - Trackpad: 1/500 (moderate, smooth)

### Rendering Strategy

**Diagrammatic/Transition Mode (zoom < 10)**:
- SVG overlay renders lines and stations
- Positions interpolated between diagram and geographic coordinates
- Opacity: 100% at zoom 7, fades to 0% by zoom 10

**Geographic Mode (zoom ≥ 10)**:
- GeoJSON layers on Mapbox render lines and stations
- Opacity: 0% at zoom 9.9, fades to 100% by zoom 10
- Smooth crossfade between SVG and GeoJSON

### Performance Optimizations

1. **Direct map reads**: Uses `map.current.getZoom()` directly instead of state to avoid lag
2. **Render skipping**: SVG overlay returns null when fully transparent
3. **Layer reuse**: GeoJSON layers created once, opacity controlled via expressions
4. **Waypoint handling**: Waypoints guide routing but don't render circles

## Known Issues & Solutions

### Issue: Jumping at Integer Zoom Levels
**Cause**: Tile loading caused `isStyleLoaded()` to return false temporarily
**Solution**: Removed `isStyleLoaded()` check from projection logic - `project()` works during tile loading

### Issue: Mode State Lag During Smooth Scroll
**Cause**: Async state updates lagged behind actual zoom changes
**Solution**: Read zoom directly from `map.current.getZoom()` instead of relying on state

## Debug Mode

Set `DEBUG_MODE = true` in `CrossrailMapPage.tsx` to:
- Keep map visible at 100% opacity in all modes
- Show "Debug mode active" indicator in info panel

## Future Enhancements

Potential improvements:
- Station name labels on hover/click
- Toggle individual lines on/off
- Route details and travel time estimates
- Mobile touch gesture support
- URL-based state persistence (zoom level, position)
- Alternative base map styles
- Animation of "train" moving along routes

## Dependencies

- **React** - UI framework
- **Mapbox GL JS** - Geographic map rendering
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Credits

Based on London transport planning studies and proposals. Line data is conceptual and for demonstration purposes.

---

**Last Updated**: 2025-01-03
**Version**: 1.0.0
