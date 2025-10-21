import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRef } from "react";
import logoImage from '../assets/logo_colour_tight.png';
import MapPage from '../components/MapPage';

const mapbox_token = import.meta.env.VITE_APP_MAPBOX_TOKEN
mapboxgl.accessToken = mapbox_token

function RentsPerSquareMetreMap() {

    const map = useRef<mapboxgl.Map | null>(null);
    const popup = useRef<mapboxgl.Popup | null>(null);

    function onClick(event: mapboxgl.MapMouseEvent) {
        if (!map.current) return;
        const features = map.current.queryRenderedFeatures(event.point)
        if (features.length > 0) {
            const feature = features[0];
            console.log(feature)
            console.log(feature.properties)
            const html = `
                <div>
                    <h3><b>${feature.properties?.LAD25NM}</b></h3>
                    <p>
                        Median rent per sqm: £${feature.properties?.cpm2_overall.toFixed(2)}
                    </p>
                    <p>
                        1 bed average rent per sqm: £${feature.properties?.cpm2_1.toFixed(2)}
                    </p>
                    <p>
                        2 bed average rent per sqm: £${feature.properties?.cpm2_2.toFixed(2)}
                    </p>
                </div>
            `
            popup.current = new mapboxgl.Popup({
                closeButton: true,
                closeOnClick: true,
            }).setLngLat(event.lngLat).setHTML(html).addTo(map.current);
        }
    }

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
            }}
        >
            <img src={logoImage} alt="Logo" className="map-logo" />
        </MapPage>
    )
}

export default RentsPerSquareMetreMap;