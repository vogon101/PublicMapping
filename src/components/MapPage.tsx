import mapboxgl, { Map } from "mapbox-gl";
import React, { EffectCallback, ReactNode, useEffect, useRef } from "react";

const mapbox_token = "pk.eyJ1IjoiZnJlZGRpZS15aW1ieSIsImEiOiJjbHBjdHJrdTAwcno2MnFrN3NvZjFoanZoIn0.a9zXaiHigQQBu1cgBKPxmg"
mapboxgl.accessToken = mapbox_token


export interface MapPageProps {
    styleUrl: string;
    map: React.MutableRefObject<mapboxgl.Map | null>;
    mapOpts?: {
        zoom?: number
        maxZoom?: number
        minZoom?: number
        center?: [number, number]
    }
    attributionControl?: mapboxgl.AttributionControl,
    onClick?: (event: mapboxgl.MapMouseEvent) => void,
    onLoad?: () => void,
    children: ReactNode
}

export default function MapPage ({styleUrl, map, mapOpts, attributionControl, onClick, onLoad, children} : MapPageProps) {

    const mapContainer = useRef<HTMLDivElement>(null);

    function initialiseMap() {
        if (map.current) return;
        if (mapContainer.current) {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: styleUrl,
                attributionControl: attributionControl == undefined,
                ...mapOpts
            })

            if (attributionControl)
                map.current.addControl(attributionControl)

            if (onClick)
                map.current.on('click', onClick)


            if (onLoad)
                map.current.on('style.load', onLoad)
        } else {
            setTimeout(initialiseMap, 100);
        }
    }

    useEffect(initialiseMap, [])

    return (
        <div className="map-container">
            <div className="mapbox-map" ref={mapContainer} />
            {children}
        </div>
    )



}

export function mapEffect(map: React.MutableRefObject<mapboxgl.Map | null>, effect: (map: Map) => void): EffectCallback {
    function f () {
        if (map.current && map.current.isStyleLoaded()) return effect(map.current)
        else setTimeout(f, 100)
    }
    return f
}
