import mapboxgl, { Map } from "mapbox-gl";
import React, { EffectCallback, ReactNode, useEffect, useRef } from "react";

const mapbox_token = import.meta.env.VITE_APP_MAPBOX_TOKEN
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
    children?: ReactNode
    useContainer?: boolean
    mapClassName?: string
}

export default function MapPage ({styleUrl, map, mapOpts, attributionControl, onClick, onLoad, children, useContainer = true, mapClassName} : MapPageProps) {

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

    return (<>
        {useContainer ?
            <div className="h-screen absolute top-0 left-0 w-full">
                <div className="absolute top-0 bottom-0 w-full h-screen" ref={mapContainer} />
                {children}
            </div> :
            <div className={`${mapClassName ?? 'absolute top-0 bottom-0 w-full h-screen'}`} ref={mapContainer} />
        }
    </>)



}

export function mapEffect(map: React.MutableRefObject<mapboxgl.Map | null>, effect: (map: Map) => void): EffectCallback {
    function f () {
        if (map.current && map.current.isStyleLoaded()) return effect(map.current)
        else setTimeout(f, 100)
    }
    return f
}
