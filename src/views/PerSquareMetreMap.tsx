"use client";

import mapboxgl, { FilterSpecification, Map } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import MapPage, { mapEffect } from "@/components/MapPage";
import { Badge } from "@/components/ui/badge";

function PerSquareMetreMap() {

    const map = useRef<mapboxgl.Map | null>(null);
    const popup = useRef<mapboxgl.Popup | null>(null);
    const [minPrice, setMinPrice] = useState<number>(0);
    const [maxPrice, setMaxPrice] = useState<number>(100000);
    const [opacity, setOpacity] = useState<number>(0.6);
    const [showSliders, setShowSliders] = useState<boolean>(true);

    function setPsqmFilter(map: Map) {
        console.log(minPrice, maxPrice)
        const filter = ["all", [">=",["get", "priceper_median"], minPrice], ["<=", ["get", "priceper_median"], maxPrice]] as FilterSpecification
        map.setFilter('msoa copy', filter)
        map.setFilter('lad copy', filter)
        console.log(map.getFilter('msoa copy'))
    }

    function onClick(event: mapboxgl.MapMouseEvent) {
        if (!map.current) return;
        const features = map.current.queryRenderedFeatures(event.point)
        if (features.length > 0) {
            const feature = features[0];
            console.log(feature)
            console.log(feature.properties)
            const html = `
                <div>
                    <h3><b>${feature.properties?.MSOA21NM ? feature.properties?.MSOA21NM : feature.properties?.LAD22NM}</b></h3>
                    <p>
                        Median price per sqm: £${feature.properties?.priceper_median.toFixed(2)}
                    </p>
                    <p>
                        Mean price per sqm: £${feature.properties?.priceper_mean.toFixed(2)}
                    </p>
                    <p>
                        Observations: ${feature.properties?.priceper_count}
                    </p>
                </div>
            `
            popup.current = new mapboxgl.Popup({
                closeButton: true,
                closeOnClick: true,
            }).setLngLat(event.lngLat).setHTML(html).addTo(map.current);
        }
    }

    function updateOpacity(map: Map) {
        console.log(map.getPaintProperty('msoa', 'fill-opacity'))
        map.setPaintProperty('msoa copy', 'fill-opacity', [
            "interpolate",
            ["linear"],
            ["zoom"],
            8, 0,
            8.5,opacity
        ]);
        map.setPaintProperty('lad copy', 'fill-opacity', [
            "interpolate",
            ["linear"],
            ["zoom"],
            8, opacity,
            8.5, 0
        ]);
    }

    useEffect(mapEffect(map, setPsqmFilter), [minPrice, maxPrice]);
    useEffect(mapEffect(map, updateOpacity), [opacity]);

    return (
        <MapPage
            styleUrl='mapbox://styles/freddie-yimby/cm0z7za9j018701qob8g47v5b'
            map={map}
            mapOpts={{
                center: [-0.1276, 51.5074],
                zoom: 10,
                maxZoom: 13.9,
                minZoom: 6
            }}
            attributionControl={
                new mapboxgl.AttributionControl({
                    customAttribution: [
                        'Data from <a href="https://landregistry.data.gov.uk/app/ppd/">HM Land Registry</a> & <a href="https://epc.opendatacommunities.org/">EPC open data</a>',
                        '<a href="https://doi.org/10.14324/111.444/ucloe.000019">Analysis by UCL Centre for Advanced Spatial Analysis</a>',
                        '<a href="https://x.com/freddie_poser">Map by Freddie Poser</a>'
                    ]
                })
            }
            onClick={onClick}
            onLoad={() => {
                setPsqmFilter(map.current!);
                updateOpacity(map.current!);
            }}
        >
            <Image src="/logo_colour_tight.png" alt="Logo" width={200} height={50} className="absolute top-2.5 right-2.5 max-w-[50%] max-h-[8vh] h-auto w-auto object-contain opacity-40 z-[1000] transition-all duration-300 ease-in-out rounded-[10px] p-[2vh] bg-white md:bottom-10 md:left-2.5 md:top-auto md:right-auto md:max-w-[30%]" />
            <Badge className="absolute bottom-2.5 right-2.5 md:bottom-auto md:top-2.5 md:right-2.5 z-[1000] bg-primary text-primary-foreground shadow-md text-sm px-3 py-1">
                2023 Data
            </Badge>
            <div className="absolute top-2.5 left-2.5 z-[1000] bg-white rounded-[5px] p-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.1)] max-w-[300px] max-[450px]:w-[calc(100%-20px)] max-[450px]:left-[5px] max-[450px]:p-[5px]">
                <div className="flex justify-between items-center">
                    <h3 className="m-0">Controls</h3>
                    <button className="bg-transparent border-none text-lg cursor-pointer p-[5px] text-[#333] transition-opacity duration-300 hover:opacity-70" onClick={() => setShowSliders(!showSliders)}>
                        {showSliders ? '▼' : '▶'}
                    </button>
                </div>
                <div className={`flex justify-between items-center mb-2.5 transition-all duration-300 ease-out ${showSliders ? 'max-h-[50px] opacity-100' : 'max-h-0 opacity-0 mb-0 overflow-hidden'}`}>
                    <label className="max-w-[40%] flex-[1_0_100px] mr-2.5">
                        <b>Min Price:</b><br/>£{minPrice}
                    </label>
                    <input type="range" className="flex-1" min="0" max="10000" step="500" value={minPrice} onChange={(e) => {
                        const newMinPrice = Number(e.target.value);
                        setMinPrice(newMinPrice);
                        if (newMinPrice > maxPrice) {
                            setMaxPrice(newMinPrice * 1.1);
                        }
                    }} />
                </div>
                <div className={`flex justify-between items-center mb-2.5 transition-all duration-300 ease-out ${showSliders ? 'max-h-[50px] opacity-100' : 'max-h-0 opacity-0 mb-0 overflow-hidden'}`}>
                    <label className="max-w-[40%] flex-[1_0_100px] mr-2.5">
                        <b>Max Price:</b><br/>£{maxPrice}
                    </label>
                    <input type="range" className="flex-1" min="0" max="30000" step="500" value={maxPrice} onChange={(e) => {
                        const newMaxPrice = Number(e.target.value);
                        setMaxPrice(newMaxPrice);
                        if (newMaxPrice < minPrice) {
                            setMinPrice(newMaxPrice * 0.9);
                        }
                    }} />
                </div>
                <div className={`flex justify-between items-center mb-2.5 transition-all duration-300 ease-out ${showSliders ? 'max-h-[50px] opacity-100' : 'max-h-0 opacity-0 mb-0 overflow-hidden'}`}>
                    <label className="max-w-[40%] flex-[1_0_100px] mr-2.5">
                        <b>Opacity:</b><br/>{opacity * 100}%
                    </label>
                    <input type="range" className="flex-1" min="0" max="1" step="0.05" value={opacity} onChange={(e) => {
                        setOpacity(Number(e.target.value));
                    }} />
                </div>
            </div>
        </MapPage>
    )
}

export default PerSquareMetreMap;