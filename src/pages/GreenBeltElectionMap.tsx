import { useEffect, useRef, useState } from "react";
import { mapEffect } from "../components/MapPage";
import mapboxgl from "mapbox-gl";
import SplitMapPage from "../components/SplitMapPage";
import logoImage from "../assets/logo_colour_tight.png";

export default function GreenBeltElectionMap() {

    const leftMap = useRef<mapboxgl.Map | null>(null);
    const rightMap = useRef<mapboxgl.Map | null>(null);

    const popup = useRef<mapboxgl.Popup | null>(null);

    const [splitMode, setSplitMode] = useState(true);

    type Election = "2015" | "2017" | "2019" | "2024";
    const [electionLeft, setElectionLeft] = useState<Election>("2019");
    const [electionRight, setElectionRight] = useState<Election>("2024");

    function updateElection(map: mapboxgl.Map, election: Election) {
        const layer = `constituencies-${election}`
        const otherLayers = ["constituencies-2015", "constituencies-2017", "constituencies-2019", "constituencies-2024"].filter(l => l !== layer)

        map.moveLayer(layer)

        otherLayers.forEach(l => {
            map.setPaintProperty(l, 'fill-opacity', 0)
            map.setPaintProperty(l, 'fill-opacity-transition', 
                {
                duration: 2000,
                delay: 100
                }
            )
        })
        map.setPaintProperty(layer, 'fill-opacity', 1)
        map.setPaintProperty(layer, 'fill-opacity-transition', 
            {
                duration: 1000,
                delay: 0
            }
        )
    }

    const updateElectionLeft = (map: mapboxgl.Map) => updateElection(map, electionLeft)
    const updateElectionRight = (map: mapboxgl.Map) => updateElection(map, electionRight)

    useEffect(mapEffect(leftMap, updateElectionLeft), [electionLeft])
    useEffect(mapEffect(rightMap, updateElectionRight), [electionRight])

    function onClick(map: mapboxgl.Map, event: mapboxgl.MapMouseEvent) {
        const features = map.queryRenderedFeatures(event.point)
        if (popup.current) {
            popup.current.remove()
        }
        if (features.length > 0) {
            const feature = features[0];
            const layer = feature.layer?.id
            const election = layer?.split("-")[1] as Election
            console.log(feature)
            const html = `
                <div>
                    <h3>${election == "2024" ? feature.properties?.PCON24NM : feature.properties?.Name}</h3>
                    <p>
                        Winner: ${feature.properties?.[`Winner ${election}`]}
                    </p>
                </div>
            `
            popup.current = new mapboxgl.Popup({
                closeButton: true,
                closeOnClick: true,
            }).setLngLat(event.lngLat).setHTML(html).addTo(map);
        }
    }

    useEffect(() => {
        if (leftMap.current) {
            leftMap.current.resize()
            leftMap.current.triggerRepaint()
        }
        if (rightMap.current) {
            rightMap.current.resize()
            rightMap.current.triggerRepaint()
        }
    })



    return (
        <>
        <SplitMapPage
            showRight={splitMode}
            leftMap={{
                styleUrl: "mapbox://styles/freddie-yimby/cm1j6efpa00ks01qp3wfrf6in/draft",
                map: leftMap,
                onClick: (e) => onClick(leftMap.current!, e),
                mapOpts: {
                    minZoom: 5,
                }
            }}
            rightMap={{
                styleUrl: "mapbox://styles/freddie-yimby/cm1j6efpa00ks01qp3wfrf6in/draft",
                map: rightMap,
                onClick: (e) => onClick(rightMap.current!, e),
                mapOpts: {
                    minZoom: 5,
                }
            }}
        >
            <img src={logoImage} alt="Logo" className="map-logo" />
            <div className="map-control">
                <div className="slider-row">
                    <label>{splitMode ? "Left" : ""} Election</label>
                    <select onChange={(e) => setElectionLeft(e.target.value as Election)} value={electionLeft}>
                        <option value="2015">2015</option>
                        <option value="2017">2017</option>
                        <option value="2019">2019</option>
                        <option value="2024">2024</option>
                    </select>
                </div>
                {splitMode && (
                    <div className="slider-row">
                        <label>Right Election</label>
                        <select onChange={(e) => setElectionRight(e.target.value as Election)} value={electionRight}>
                        <option value="2015">2015</option>
                        <option value="2017">2017</option>
                        <option value="2019">2019</option>
                        <option value="2024">2024</option>
                        </select>
                    </div>
                )}
                <button onClick={() => setSplitMode(!splitMode)}>Switch to {splitMode ? "Single" : "Split"} Map</button>
            </div>


        </SplitMapPage> 
    </>
    )
}