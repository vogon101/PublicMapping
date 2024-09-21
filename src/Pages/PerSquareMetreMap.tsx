import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef } from "react";

const mapbox_token = "pk.eyJ1IjoiZnJlZGRpZS15aW1ieSIsImEiOiJjbHBjdHJrdTAwcno2MnFrN3NvZjFoanZoIn0.a9zXaiHigQQBu1cgBKPxmg"
mapboxgl.accessToken = mapbox_token

function PerSquareMetreMap() {

    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const popup = useRef<mapboxgl.Popup | null>(null);

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
            });

            map.current.on('click', onClick);   
        }
    }

    function onClick(event: mapboxgl.MapMouseEvent) {
        if (!map.current) return;
        console.log(event.lngLat.lng, event.lngLat.lat)
        const features = map.current.queryRenderedFeatures(event.point)
        if (features.length > 0) {
            const feature = features[0];


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

    useEffect(() => {
        if (!mapContainer.current) setTimeout(initialiseMap, 100);
        else initialiseMap();
    }, []);


    return (
        <div className="map-container">
            <div
            ref={mapContainer}
            className="mapbox-map"
            />
            <div className="content">
                More content
            </div>
        </div>
    )
}

export default PerSquareMetreMap;