import { useEffect, useRef, useState } from "react";
import MapPage, { mapEffect } from "../components/MapPage";
import { Map, MapMouseEvent } from "mapbox-gl";


export default function TestMapPage() {

    const map = useRef<mapboxgl.Map | null>(null);
    const [opacity, setOpacity] = useState(0.5)

    function onClick(event: MapMouseEvent) {
        console.log("On click", event)
        console.log(map.current!.queryRenderedFeatures(event.point))
    } 

    function updateOpacity(map: Map) {
        map.setPaintProperty('msoa', 'fill-opacity', opacity)
    }


    useEffect(mapEffect(map, updateOpacity), [opacity])

    return (
        <MapPage
            styleUrl="mapbox://styles/freddie-yimby/cm0z7za9j018701qob8g47v5b"
            map={map}
            onClick={onClick}
        >
            <div className="price-slider">
                <div className="slider-row">
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