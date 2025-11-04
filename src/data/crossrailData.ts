// Data structures
export interface RoutePoint {
  name?: string; // Only for stations
  diagramX: number; // Normalized 0-1
  diagramY: number; // Normalized 0-1
  geoLat: number;
  geoLng: number;
  isStation: boolean; // true = station with circle, false = waypoint for routing only
  isInterchange?: boolean;
}

export interface LineSegment {
  points: RoutePoint[]; // All points including stations and waypoints
}

export interface CrossrailLine {
  name: string;
  color: string;
  segments: LineSegment[]; // Support multiple segments for branching
}

// Realistic crossrail routes based on London transport proposals
export const crossrailLines: CrossrailLine[] = [
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
