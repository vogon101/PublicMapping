import mapboxgl, { FilterSpecification, Map } from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from "react";
import logoImage from '../assets/logo_colour_tight.png';
import MapPage, { mapEffect } from '../components/MapPage';

const mapbox_token = import.meta.env.VITE_APP_MAPBOX_TOKEN
mapboxgl.accessToken = mapbox_token

function PerSquareMetreMapOverTime() {

    const map = useRef<mapboxgl.Map | null>(null);
    const popup = useRef<mapboxgl.Popup | null>(null);
    const [minPrice, setMinPrice] = useState<number>(0);
    const [maxPrice, setMaxPrice] = useState<number>(100000);
    const [opacity, setOpacity] = useState<number>(0.6);
    const [showSliders, setShowSliders] = useState<boolean>(true);
    const [year, setYear] = useState<number>(2023);

    function setPsqmFilter(map: Map) {
        console.log(minPrice, maxPrice)
        const filter = ["all", [">=",["get", `priceper_median_${year}`], minPrice], ["<=", ["get", `priceper_median_${year}`], maxPrice]] as FilterSpecification
        // map.setFilter('msoa copy', filter)
        map.setFilter('psqm-sales-lad-24-byyear', filter)
        // console.log(map.getFilter('msoa copy'))
    }

    function activateYear(map: Map) {
        console.log(map)
        const paint = map.getPaintProperty('psqm-sales-lad-24-byyear', 'fill-color')
        map.setPaintProperty('psqm-sales-lad-24-byyear', 'fill-color', [
            "interpolate",
            ["linear"],
            ["get", `priceper_median_${year}`],
            1400,
            "#0031f5",
            12000,
            "#f00000"
        ])
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
                    <h3><b>${feature.properties?.MSOA21NM ? feature.properties?.MSOA21NM : feature.properties?.LAD25NM}</b></h3>
                    <p>
                        Median price per sqm: £${feature.properties?.[`priceper_median_${year}`].toFixed(2)}
                    </p>
                    <p>
                        Mean price per sqm: £${feature.properties?.[`priceper_mean_${year}`].toFixed(2)}
                    </p>
                    <p>
                        Observations: ${feature.properties?.[`priceper_count_${year}`]}
                    </p>
                </div>
            `
            popup.current = new mapboxgl.Popup({
                closeButton: true,
                closeOnClick: true,
            }).setLngLat(event.lngLat).setHTML(html).addTo(map.current);
        }
    }

    // function updateOpacity(map: Map) {
    //     console.log(map.getPaintProperty('msoa', 'fill-opacity'))
    //     map.setPaintProperty('msoa copy', 'fill-opacity', [
    //         "interpolate",
    //         ["linear"],
    //         ["zoom"],
    //         8, 0,
    //         8.5,opacity
    //     ]);
    //     map.setPaintProperty('psqm-sales-lad-24-byyear', 'fill-opacity', [
    //         "interpolate",
    //         ["linear"],
    //         ["zoom"],
    //         8, opacity,
    //         8.5, 0
    //     ]);
    // }

    useEffect(mapEffect(map, setPsqmFilter), [minPrice, maxPrice]);
    useEffect(mapEffect(map, activateYear), [year]);
    // useEffect(mapEffect(map, updateOpacity), [opacity]);

    return (
        <MapPage
            styleUrl='mapbox://styles/freddie-yimby/cmhasxe7s000k01qzhh70hlsv'
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
                // updateOpacity(map.current!);
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
                    <label><b>Year:</b><br/>{year}</label>
                    <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                        {[
                            ...Array.from({ length: 10 }, (_, i) => i + 2015).reverse().map((year) => (
                                <option value={year} key={year}>{year}</option>
                            ))
                        ]}
                    </select>
                </div>
                {/* <div className={`slider-row ${showSliders ? 'visible' : 'hidden'}`}>
                    <label>
                        <b>Opacity:</b><br/>{opacity * 100}%
                    </label>
                    <input type="range" min="0" max="1" step="0.05" value={opacity} onChange={(e) => {
                        setOpacity(Number(e.target.value));
                    }} />
                </div> */}
            </div>
        </MapPage>
    )
}

export default PerSquareMetreMapOverTime;