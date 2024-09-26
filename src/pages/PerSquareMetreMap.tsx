import mapboxgl, { FilterSpecification, Map } from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from "react";
import logoImage from '../assets/logo_colour_tight.png';
import MapPage, { mapEffect } from '../components/MapPage';

const mapbox_token = import.meta.env.VITE_APP_MAPBOX_TOKEN
mapboxgl.accessToken = mapbox_token

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
        map.setFilter('msoa', filter)
        map.setFilter('lad', filter)
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
                    <h3>${feature.properties?.MSOA21NM ? feature.properties?.MSOA21NM : feature.properties?.LAD22NM}</h3>
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
        map.setPaintProperty('msoa', 'fill-opacity', [
            "interpolate",
            ["linear"],
            ["zoom"],
            8, 0,
            8.5,opacity
        ]);
        map.setPaintProperty('lad', 'fill-opacity', [
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
                maxZoom: 14,
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
                        <b>Min Price:</b><br/>£{minPrice}
                    </label>
                    <input type="range" min="0" max="10000" step="500" value={minPrice} onChange={(e) => {
                        const newMinPrice = Number(e.target.value);
                        setMinPrice(newMinPrice);
                        if (newMinPrice > maxPrice) {
                            setMaxPrice(newMinPrice * 1.1);
                        }
                    }} />
                </div>
                <div className={`slider-row ${showSliders ? 'visible' : 'hidden'}`}>
                    <label>
                        <b>Max Price:</b><br/>£{maxPrice}
                    </label>
                    <input type="range" min="0" max="30000" step="500" value={maxPrice} onChange={(e) => {
                        const newMaxPrice = Number(e.target.value);
                        setMaxPrice(newMaxPrice);
                        if (newMaxPrice < minPrice) {
                            setMinPrice(newMaxPrice * 0.9);
                        }
                    }} />
                </div>
                <div className={`slider-row ${showSliders ? 'visible' : 'hidden'}`}>
                    <label>
                        <b>Opacity:</b><br/>{opacity * 100}%
                    </label>
                    <input type="range" min="0" max="1" step="0.05" value={opacity} onChange={(e) => {
                        setOpacity(Number(e.target.value));
                    }} />
                </div>
            </div>
        </MapPage>
    )
}

export default PerSquareMetreMap;