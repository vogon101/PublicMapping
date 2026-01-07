"use client";

import { LogarithmicRange } from "@/components/inputs/DebouncedRange";
import MapPage, { mapEffect } from "@/components/MapPage";
import mapboxgl, { FilterSpecification } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function GBStationsMap() {

    const map = useRef<mapboxgl.Map | null>(null)
    const popup = useRef<mapboxgl.Popup | null>(null)

    const [showSliders, setShowSliders] = useState(true)
    const [showConstituencies, setShowConstituencies] = useState(true)
    const [minPopulationDensity, setMinPopulationDensity] = useState(40)
    const [maxPopulationDensity, setMaxPopulationDensity] = useState(16000)
    const [minPricePerSqm, setMinPricePerSqm] = useState(0)
    const [maxPricePerSqm, setMaxPricePerSqm] = useState(30000)

    const distances = [250, 500, 750, 1000]
    const layer_pattern = 'stn-'

    function setPopulationDensityFilter(map: mapboxgl.Map) {
        console.log(minPopulationDensity, maxPopulationDensity)
        const filter = ["all", [">=", ["get", "population_density"], minPopulationDensity], ["<=", ["get", "population_density"], maxPopulationDensity]] as FilterSpecification
        distances.forEach(distance => {
            map.setFilter(`${layer_pattern}${distance}`, filter)
        })
        map.setFilter(`${layer_pattern}1000-line`, filter)
    }

    function toggleConstituencies(map: mapboxgl.Map) {
        if (showConstituencies) {
            map.setLayoutProperty('constituencies', 'visibility', 'visible')
        } else {
            map.setLayoutProperty('constituencies', 'visibility', 'none')
        }
    }

    function onClick(event: mapboxgl.MapMouseEvent) {
        if (!map.current) return;
        const features = map.current.queryRenderedFeatures(event.point)
        if (features.length > 0 ) {
            if (features[0].layer?.id.startsWith(layer_pattern)) {
                const feature = features[0];
                console.log(feature)
                console.log(feature.properties)
                const html = `
                    <div>
                        <h2>${feature.properties?.MSOA21NM ? feature.properties?.MSOA21NM : feature.properties?.LAD22NM}</h2>
                        <p>
                            Median price per sqm: £${feature.properties?.priceper_median.toFixed(2)}
                        </p>
                        <p>
                            Population density: ${feature.properties?.population_density.toFixed(2)}
                        </p>
                    </div>
                `
                popup.current = new mapboxgl.Popup({
                    closeButton: true,
                    closeOnClick: true,
                }).setLngLat(event.lngLat).setHTML(html).addTo(map.current);
            } else if (features[0].layer?.id === 'constituencies') {
                const feature = features[0];
                console.log(feature)
                console.log(feature.properties)
                const html = `
                    <div>
                        <h2>${feature.properties?.['Constituency name']}</h2>
                        <p>
                            Majority (Absolute): ${feature.properties?.Majority}
                        </p>
                        <p>
                            Majority (Percentage): ${((feature.properties?.Majority / feature.properties?.['Valid votes']) * 100).toFixed(2)}%
                        </p>
                    </div>
                `
                popup.current = new mapboxgl.Popup({
                    closeButton: true,
                    closeOnClick: true,
                }).setLngLat(event.lngLat).setHTML(html).addTo(map.current);
            }
        }
    }

    function setPricePerSqmFilter(map: mapboxgl.Map) {
        console.log(minPricePerSqm, maxPricePerSqm)
        const filter = ["all",
            [">=", ["get", "population_density"], minPopulationDensity],
            ["<=", ["get", "population_density"], maxPopulationDensity],
            [">=", ["get", "priceper_median"], minPricePerSqm],
            ["<=", ["get", "priceper_median"], maxPricePerSqm]
        ] as FilterSpecification
        distances.forEach(distance => {
            map.setFilter(`${layer_pattern}${distance}`, filter)
        })
        map.setFilter(`${layer_pattern}1000-line`, filter)
    }

    useEffect(mapEffect(map, setPopulationDensityFilter), [minPopulationDensity, maxPopulationDensity])
    useEffect(mapEffect(map, toggleConstituencies), [showConstituencies])
    useEffect(mapEffect(map, setPricePerSqmFilter), [minPopulationDensity, maxPopulationDensity, minPricePerSqm, maxPricePerSqm])

    return <MapPage
        styleUrl='mapbox://styles/freddie-yimby/cm1upjcn3013r01qvhvhqdl1i'
        map={map}
        mapOpts={{
            center: [-0.1276, 51.5074],
            zoom: 10,
            maxZoom: 14,
            minZoom: 8
        }}
        onClick={onClick}
    >
        <Image src="/logo_colour_tight.png" alt="Logo" width={200} height={50} className="absolute top-2.5 right-2.5 max-w-[50%] max-h-[8vh] opacity-40 z-[1000] transition-all duration-300 ease-in-out rounded-[10px] p-[2vh] bg-white md:bottom-10 md:left-2.5 md:top-auto md:right-auto md:max-w-[30%]" />
        <div className="absolute top-2.5 left-2.5 z-[1000] bg-white rounded-[5px] p-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.1)] max-w-[300px] max-[450px]:w-[calc(100%-20px)] max-[450px]:left-[5px] max-[450px]:p-[5px]">
            <div className="flex justify-between items-center">
                <h3 className="m-0">Controls</h3>
                <button className="bg-transparent border-none text-lg cursor-pointer p-[5px] text-[#333] transition-opacity duration-300 hover:opacity-70" onClick={() => setShowSliders(!showSliders)}>
                    {showSliders ? '▼' : '▶'}
                </button>
            </div>
            <div className={`flex justify-between items-center mb-2.5 transition-all duration-300 ease-out ${showSliders ? 'max-h-[50px] opacity-100' : 'max-h-0 opacity-0 mb-0 overflow-hidden'}`}>
                <label>
                    <b>Min population density: {minPopulationDensity.toFixed(0)}</b>
                </label>
                <LogarithmicRange
                    value={minPopulationDensity}
                    min={40}
                    max={16000}
                    onChange={(value) => {
                        setMinPopulationDensity(value);
                        if (value > maxPopulationDensity) {
                            setMaxPopulationDensity(value * 1.1);
                        }
                    }} />
            </div>
            <div className={`flex justify-between items-center mb-2.5 transition-all duration-300 ease-out ${showSliders ? 'max-h-[50px] opacity-100' : 'max-h-0 opacity-0 mb-0 overflow-hidden'}`}>
                <label>
                    <b>Max population density: {maxPopulationDensity.toFixed(0)}</b>
                </label>
                <LogarithmicRange
                    value={maxPopulationDensity}
                    min={40}
                    max={16000}
                    onChange={(value) => {
                        setMaxPopulationDensity(value);
                    }} />
            </div>
            <div className={`flex justify-between items-center mb-2.5 transition-all duration-300 ease-out ${showSliders ? 'max-h-[50px] opacity-100' : 'max-h-0 opacity-0 mb-0 overflow-hidden'}`}>
                <label>
                    <b>Show constituencies: </b>
                </label>
                <input type="checkbox" checked={showConstituencies} onChange={() => setShowConstituencies(!showConstituencies)} />
            </div>
            <div className={`flex justify-between items-center mb-2.5 transition-all duration-300 ease-out ${showSliders ? 'max-h-[50px] opacity-100' : 'max-h-0 opacity-0 mb-0 overflow-hidden'}`}>
                <label className="max-w-[40%] flex-[1_0_100px] mr-2.5">
                    <b>Min price per sqm: £{minPricePerSqm.toFixed(0)}</b>
                </label>
                <input
                    className="flex-1"
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={minPricePerSqm}
                    onChange={(e) => {
                        const newMinPrice = Number(e.target.value);
                        setMinPricePerSqm(newMinPrice);
                        if (newMinPrice > maxPricePerSqm) {
                            setMaxPricePerSqm(newMinPrice * 1.1);
                        }
                    }}
                />
            </div>
            <div className={`flex justify-between items-center mb-2.5 transition-all duration-300 ease-out ${showSliders ? 'max-h-[50px] opacity-100' : 'max-h-0 opacity-0 mb-0 overflow-hidden'}`}>
                <label className="max-w-[40%] flex-[1_0_100px] mr-2.5">
                    <b>Max price per sqm: £{maxPricePerSqm.toFixed(0)}</b>
                </label>
                <input
                    className="flex-1"
                    type="range"
                    min="0"
                    max="30000"
                    step="100"
                    value={maxPricePerSqm}
                    onChange={(e) => {
                        const newMaxPrice = Number(e.target.value);
                        setMaxPricePerSqm(newMaxPrice);
                        if (newMaxPrice < minPricePerSqm) {
                            setMinPricePerSqm(newMaxPrice * 0.9);
                        }
                    }}
                />
            </div>
        </div>
    </MapPage>
}
