"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import MapPage from "@/components/MapPage";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Feature flag to enable cross-linking between maps
const ENABLE_CROSS_LINKING = false;

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
    const searchParams = useSearchParams();
    const { toast } = useToast();

    function onClick(event: mapboxgl.MapMouseEvent) {
        if (!map.current) return;
        const features = map.current.queryRenderedFeatures(event.point)
        if (features.length > 0) {
            const feature = features[0];

            setSelectedArea({
                name: feature.properties?.LAD25NM || 'Unknown Area',
                ladCode: feature.properties?.LAD25CD || '',
                cpm2_overall: feature.properties?.cpm2_overall || 0,
                cpm2_1: feature.properties?.cpm2_1 || 0,
                cpm2_2: feature.properties?.cpm2_2 || 0,
                cpm2_3: feature.properties?.cpm2_3 || 0
            });
        }
    }


    return (
        <MapPage
            styleUrl='mapbox://styles/freddie-yimby/cmgzop50e009201sa7qqcgtwd'
            map={map}
            mapOpts={
                searchParams.get('lad') ? {
                    bounds: [[-6.5, 49.8], [2.0, 59.0]],
                    fitBoundsOptions: { padding: 20 },
                    maxZoom: 12,
                    minZoom: 6
                } : {
                    center: [-0.5, 52],
                    zoom: 7,
                    maxZoom: 12,
                    minZoom: 6
                }
            }
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
                if (!ENABLE_CROSS_LINKING || !map.current) return;

                const handleStyleLoad = () => {
                    const ladCode = searchParams.get('lad');
                    if (!ladCode || !map.current) return;

                    const sourceFeatures = map.current.querySourceFeatures('composite', {
                        sourceLayer: 'psqm-rents'
                    });

                    const feature = sourceFeatures.find(f => f.properties?.LAD25CD === ladCode);

                    if (!feature) {
                        toast({
                            title: "Area not found",
                            description: `Could not find rental data for LAD code: ${ladCode}`,
                            variant: "destructive",
                        });
                        return;
                    }

                    if (feature && feature.properties) {
                        setSelectedArea({
                            name: feature.properties.LAD25NM || 'Unknown Area',
                            ladCode: feature.properties.LAD25CD || '',
                            cpm2_overall: feature.properties.cpm2_overall || 0,
                            cpm2_1: feature.properties.cpm2_1 || 0,
                            cpm2_2: feature.properties.cpm2_2 || 0,
                            cpm2_3: feature.properties.cpm2_3 || 0
                        });

                        // Zoom to the feature
                        if (feature.geometry) {
                            let bounds = new mapboxgl.LngLatBounds();

                            if (feature.geometry.type === 'Polygon') {
                                const coordinates = feature.geometry.coordinates[0];
                                coordinates.forEach((coord: number[]) => {
                                    bounds.extend(coord as [number, number]);
                                });
                            } else if (feature.geometry.type === 'MultiPolygon') {
                                feature.geometry.coordinates.forEach((polygon: number[][][]) => {
                                    polygon[0].forEach((coord: number[]) => {
                                        bounds.extend(coord as [number, number]);
                                    });
                                });
                            }

                            if (!bounds.isEmpty()) {
                                map.current.fitBounds(bounds, {
                                    padding: 50,
                                    maxZoom: 10
                                });
                            }
                        }
                    }
                };

                if (map.current.isStyleLoaded()) {
                    handleStyleLoad();
                } else {
                    map.current.once('idle', handleStyleLoad);
                }
            }}
        >
            <Image src="/logo_colour_tight.png" alt="Logo" width={200} height={50} className="absolute top-2.5 right-2.5 max-w-[50%] max-h-[8vh] h-auto w-auto object-contain opacity-40 z-[1000] transition-all duration-300 ease-in-out rounded-[10px] p-[2vh] bg-white md:bottom-10 md:left-2.5 md:top-auto md:right-auto md:max-w-[30%]" />
            <Badge className="absolute bottom-2.5 right-2.5 md:bottom-auto md:top-2.5 md:right-2.5 z-[1000] bg-primary text-primary-foreground shadow-md text-sm px-3 py-1">
                2025 Data
            </Badge>

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

                                {ENABLE_CROSS_LINKING && selectedArea.ladCode && (
                                    <div className="border-t pt-3">
                                        <a
                                            href={`/psqm-over-time?lad=${selectedArea.ladCode}`}
                                            className="block w-full p-3 bg-blue-600 text-white text-center rounded font-semibold hover:bg-blue-700 transition-colors no-underline"
                                        >
                                            View sales prices for {selectedArea.name} →
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </MapPage>
    )
}

export default RentsPerSquareMetreMap;