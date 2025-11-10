import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import logoImage from '../assets/logo_colour_tight.png';
import MapPage from '../components/MapPage';

const mapbox_token = import.meta.env.VITE_APP_MAPBOX_TOKEN
mapboxgl.accessToken = mapbox_token

interface AreaData {
    name: string;
    ladCode: string;
    cpm2_overall: number;
    cpm2_1: number;
    cpm2_2: number;
    cpm2_3: number;
}

function RentsPerSquareMetreMap() {

    const map = useRef<mapboxgl.Map | null>(null);
    const [selectedArea, setSelectedArea] = useState<AreaData | null>(null);
    const [searchParams] = useSearchParams();

    function onClick(event: mapboxgl.MapMouseEvent) {
        if (!map.current) return;
        const features = map.current.queryRenderedFeatures(event.point)
        console.log('onClick - features found:', features.length);
        if (features.length > 0) {
            const feature = features[0];
            console.log('onClick - feature:', feature)
            console.log('onClick - feature.properties:', feature.properties)
            console.log('onClick - LAD code:', feature.properties?.LAD25CD);

            setSelectedArea({
                name: feature.properties?.LAD25NM || 'Unknown Area',
                ladCode: feature.properties?.LAD25CD || '',
                cpm2_overall: feature.properties?.cpm2_overall || 0,
                cpm2_1: feature.properties?.cpm2_1 || 0,
                cpm2_2: feature.properties?.cpm2_2 || 0,
                cpm2_3: feature.properties?.cpm2_3 || 0
            });
            console.log('onClick - selectedArea set with LAD code:', feature.properties?.LAD25CD);
        }
    }

    // Handle URL parameters to zoom to and select an area
    useEffect(() => {
        const ladCode = searchParams.get('lad');
        if (ladCode && map.current && map.current.isStyleLoaded()) {
            console.log('Looking for LAD:', ladCode);

            // Query for features with this LAD code
            const features = map.current.querySourceFeatures('composite', {
                sourceLayer: 'psqm-rents-lad-24-byyear-6rj6d2'
            });

            console.log('Found features:', features.length);
            const feature = features.find(f => f.properties?.LAD25CD === ladCode);
            console.log('Matched feature:', feature);

            if (feature && feature.properties) {
                setSelectedArea({
                    name: feature.properties.LAD25NM || 'Unknown Area',
                    ladCode: feature.properties.LAD25CD || '',
                    cpm2_overall: feature.properties.cpm2_overall || 0,
                    cpm2_1: feature.properties.cpm2_1 || 0,
                    cpm2_2: feature.properties.cpm2_2 || 0,
                    cpm2_3: feature.properties.cpm2_3 || 0
                });

                // Zoom to the feature if it has geometry
                if (feature.geometry && feature.geometry.type === 'Polygon') {
                    const coordinates = feature.geometry.coordinates[0];
                    const bounds = coordinates.reduce((bounds: mapboxgl.LngLatBounds, coord: number[]) => {
                        return bounds.extend(coord as [number, number]);
                    }, new mapboxgl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number]));

                    map.current.fitBounds(bounds, {
                        padding: 50,
                        maxZoom: 10
                    });
                }
            }
        }
    }, [searchParams]);

    return (
        <MapPage
            styleUrl='mapbox://styles/freddie-yimby/cmgzop50e009201sa7qqcgtwd'
            map={map}
            mapOpts={{
                center: [-0.5, 52],
                zoom: 7,
                maxZoom: 12,
                minZoom: 6
            }}
            attributionControl={
                new mapboxgl.AttributionControl({
                    customAttribution: [
                        'Data from <a href="https://landregistry.data.gov.uk/app/ukhpi/">HM Land Registry</a> & <a href="https://epc.opendatacommunities.org/">EPC open data</a>',
                        '<a href="https://github.com/thicknavyrain">Analysis by Ricky Nathvani</a>',
                        '<a href="https://x.com/freddie_poser">Map by Freddie Poser</a>'
                    ]
                })
            }
            onClick={onClick}
            onLoad={() => {
                console.log('=== RENTS MAP LOADED ===');

                if (!map.current) return;

                // Wait for the style to be fully loaded before querying features
                const handleStyleLoad = () => {
                    console.log('=== RENTS MAP STYLE LOADED ===');
                    const ladCode = searchParams.get('lad');
                    console.log('URL parameter lad:', ladCode);

                    if (ladCode && map.current) {
                        console.log('Map loaded, looking for LAD:', ladCode);
                        console.log('Map style loaded:', map.current.isStyleLoaded());

                        // Log available layers
                        const style = map.current.getStyle();
                        console.log('Available layers:', style?.layers?.map(l => l.id));
                        console.log('Available sources:', Object.keys(style?.sources || {}));

                        // Try queryRenderedFeatures instead which gets visible features
                        const allFeatures = map.current.queryRenderedFeatures();
                        console.log('Total rendered features:', allFeatures.length);

                        // Get LAD layer features specifically
                        const ladLayerFeatures = allFeatures.filter(f =>
                            f.sourceLayer === 'psqm-rents-lad-24-byyear-6rj6d2' ||
                            f.layer?.id?.includes('rents') ||
                            f.properties?.LAD25CD
                        );
                        console.log('LAD layer features:', ladLayerFeatures.length);

                        if (ladLayerFeatures.length > 0) {
                            console.log('Sample LAD codes from rendered features:', ladLayerFeatures.slice(0, 10).map(f => ({
                                code: f.properties?.LAD25CD,
                                name: f.properties?.LAD25NM,
                                layer: f.layer?.id,
                                sourceLayer: f.sourceLayer
                            })));
                        }

                        // Search for the LAD code
                        console.log('Searching for LAD code:', ladCode);
                        const matchingFeatures = ladLayerFeatures.filter(f => {
                            const matches = f.properties?.LAD25CD === ladCode;
                            if (matches) {
                                console.log('FOUND MATCH!', f.properties?.LAD25CD, f.properties?.LAD25NM);
                            }
                            return matches;
                        });
                        console.log('Number of matching features:', matchingFeatures.length);

                        const feature = matchingFeatures[0];
                        console.log('Matched feature:', feature);

                        if (feature && feature.properties) {
                            console.log('Setting selected area for:', feature.properties.LAD25NM);
                            setSelectedArea({
                                name: feature.properties.LAD25NM || 'Unknown Area',
                                ladCode: feature.properties.LAD25CD || '',
                                cpm2_overall: feature.properties.cpm2_overall || 0,
                                cpm2_1: feature.properties.cpm2_1 || 0,
                                cpm2_2: feature.properties.cpm2_2 || 0,
                                cpm2_3: feature.properties.cpm2_3 || 0
                            });

                            // Zoom to the feature if it has geometry
                            if (feature.geometry && feature.geometry.type === 'Polygon') {
                                console.log('Zooming to feature bounds');
                                const coordinates = feature.geometry.coordinates[0];
                                const bounds = coordinates.reduce((bounds: mapboxgl.LngLatBounds, coord: number[]) => {
                                    return bounds.extend(coord as [number, number]);
                                }, new mapboxgl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number]));

                                map.current.fitBounds(bounds, {
                                    padding: 50,
                                    maxZoom: 10
                                });
                            }
                        } else {
                            console.error('No matching feature found for LAD code:', ladCode);
                        }
                    } else {
                        if (!ladCode) console.log('No LAD parameter in URL');
                        if (!map.current) console.error('Map not initialized');
                    }
                };

                if (map.current.isStyleLoaded()) {
                    handleStyleLoad();
                } else {
                    map.current.once('idle', handleStyleLoad);
                }
            }}
        >
            <img src={logoImage} alt="Logo" className="absolute top-2.5 right-2.5 max-w-[50%] max-h-[8vh] opacity-40 z-[1000] transition-all duration-300 ease-in-out rounded-[10px] p-[2vh] bg-white md:bottom-10 md:left-2.5 md:top-auto md:right-auto md:max-w-[30%]" />

            {/* Slide-in panel */}
            {selectedArea && (
                <>
                    {/* Panel */}
                    <div className="fixed bottom-0 left-0 right-0 max-h-[60vh] md:bottom-auto md:top-0 md:right-0 md:left-auto md:w-[400px] md:h-auto md:max-h-full bg-white z-[1002] shadow-xl animate-slide-up md:animate-slide-left overflow-y-auto">
                        <div className="sticky top-0 bg-white z-10 p-5 pb-3 border-b shadow-sm">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold m-0">{selectedArea.name}</h3>
                                <button
                                    onClick={() => setSelectedArea(null)}
                                    className="bg-transparent border-none text-2xl cursor-pointer p-0 leading-none hover:opacity-70"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        <div className="p-5 pt-3">
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-50 rounded">
                                    <p className="text-sm text-gray-600 m-0 mb-1">Median rent per m<sup>2</sup> per month</p>
                                    <p className="text-2xl font-bold m-0">£{selectedArea.cpm2_overall.toFixed(2)}/m<sup>2</sup>/mo</p>
                                </div>

                                <div className="border-t pt-3">
                                    <p className="font-semibold text-base mb-2">By Bedroom Count</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span className="text-sm font-medium">1 bed average</span>
                                            <span className="text-base font-bold">£{selectedArea.cpm2_1.toFixed(2)}/m<sup>2</sup>/mo</span>
                                        </div>
                                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span className="text-sm font-medium">2 bed average</span>
                                            <span className="text-base font-bold">£{selectedArea.cpm2_2.toFixed(2)}/m<sup>2</sup>/mo</span>
                                        </div>
                                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span className="text-sm font-medium">3 bed average</span>
                                            <span className="text-base font-bold">£{selectedArea.cpm2_3.toFixed(2)}/m<sup>2</sup>/mo</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-3">
                                    <a
                                        href={`/psqm-over-time?lad=${selectedArea.ladCode}`}
                                        className="block w-full p-3 bg-blue-600 text-white text-center rounded font-semibold hover:bg-blue-700 transition-colors no-underline"
                                    >
                                        View sales prices for {selectedArea.name} →
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </MapPage>
    )
}

export default RentsPerSquareMetreMap;