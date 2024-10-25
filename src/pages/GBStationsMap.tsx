import  { LogarithmicRange } from "@/components/inputs/DebouncedRange";
import MapPage, { mapEffect } from "@/components/MapPage";
import mapboxgl, { FilterSpecification } from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import logoImage from '../assets/logo_colour_tight.png';

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
        if (features.length > 0 && features[0].layer?.id.startsWith(layer_pattern)) {
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
        <img src={logoImage} alt="Logo" className="map-logo" />
        <div className="map-control">
            <div className="price-slider-header">
                <h3>Controls</h3>
                <button className="toggle-button" onClick={() => setShowSliders(!showSliders)}>
                    {showSliders ? '▼' : '▶'}
                </button>
            </div>
            <div className={`slider-row ${showSliders ? 'visible' : 'hidden'}`}>
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
            <div className={`slider-row ${showSliders ? 'visible' : 'hidden'}`}>
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
            <div className={`slider-row ${showSliders ? 'visible' : 'hidden'}`}>
                <label>
                    <b>Show constituencies: </b>
                </label>
                <input type="checkbox" checked={showConstituencies} onChange={() => setShowConstituencies(!showConstituencies)} />
            </div>
            <div className={`slider-row ${showSliders ? 'visible' : 'hidden'}`}>
                <label>
                    <b>Min price per sqm: £{minPricePerSqm.toFixed(0)}</b>
                </label>
                <input
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
            <div className={`slider-row ${showSliders ? 'visible' : 'hidden'}`}>
                <label>
                    <b>Max price per sqm: £{maxPricePerSqm.toFixed(0)}</b>
                </label>
                <input
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
