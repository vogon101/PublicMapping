import mapboxgl, { FilterSpecification } from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from "react";
import logoImage from '../assets/logo_colour_tight.png'; // Add this import

const mapbox_token = "pk.eyJ1IjoiZnJlZGRpZS15aW1ieSIsImEiOiJjbHBjdHJrdTAwcno2MnFrN3NvZjFoanZoIn0.a9zXaiHigQQBu1cgBKPxmg"
mapboxgl.accessToken = mapbox_token

function PerSquareMetreMap() {

    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const popup = useRef<mapboxgl.Popup | null>(null);
    const [minPrice, setMinPrice] = useState<number>(0);
    const [maxPrice, setMaxPrice] = useState<number>(100000);
    const [showSliders, setShowSliders] = useState<boolean>(true);

    function initialiseMap() {
        if (map.current) return;
        if (mapContainer.current) {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/freddie-yimby/cm0z7za9j018701qob8g47v5b',
                center: [-0.1276, 51.5074],
                zoom: 10,
                maxZoom: 14,
                minZoom: 6,
                attributionControl: false  // Disable default attribution control
            });

            // Add custom attribution
            map.current.addControl(
                new mapboxgl.AttributionControl({
                    customAttribution: ['Data from <a href="https://landregistry.data.gov.uk/app/ppd/">HM Land Registry</a> & <a href="https://epc.opendatacommunities.org/">EPC open data</a>',
                        '<a href="https://doi.org/10.14324/111.444/ucloe.000019">Analysis by UCL Centre for Advanced Spatial Analysis</a>'
                    ]
                }),
                'bottom-right'
            );

            map.current.on('click', onClick);
            
            map.current.on('style.load', () => {
                setPsqmFilter(minPrice, maxPrice);
            });

        }
    }

    function setPsqmFilter(minPrice: number, maxPrice: number) {
        if (!map.current) return;
        console.log(minPrice, maxPrice)
        const filter = ["all", [">=",["get", "priceper_median"], minPrice], ["<=", ["get", "priceper_median"], maxPrice]] as FilterSpecification
        map.current.setFilter('msoa', filter)
        map.current.setFilter('lad', filter)

    }

    function onClick(event: mapboxgl.MapMouseEvent) {
        
        if (!map.current) return;
        console.log(event.lngLat.lng, event.lngLat.lat)
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

            // setPsqmFilter(feature.properties?.priceper_median, feature.properties?.priceper_mean)
        }
    }

    useEffect(() => {
        if (!mapContainer.current) setTimeout(initialiseMap, 100);
        else initialiseMap();
    }, []);

    useEffect(() => {
        if (!map.current || !map.current.isStyleLoaded()) return;
        setPsqmFilter(minPrice, maxPrice)
    }, [minPrice, maxPrice])

    return (
        <div className="map-container">
            <div
            ref={mapContainer}
            className="mapbox-map"
            />
            <img src={logoImage} alt="Logo" className="map-logo" />
            <div className="price-slider">
                <div className="price-slider-header">
                    <h3>Price Filter</h3>
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
            </div>
        </div>
    )
}

export default PerSquareMetreMap;