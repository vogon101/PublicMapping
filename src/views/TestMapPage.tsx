import { useRef } from "react";
import { Map } from "mapbox-gl";
import SplitMapPage from "../components/SplitMapPage";


export default function TestMapPage() {

    const leftMap = useRef<Map | null>(null)
    const rightMap = useRef<Map | null>(null)


    return (
        <SplitMapPage
            leftMap={{
                styleUrl: "mapbox://styles/freddie-yimby/cm1j6efpa00ks01qp3wfrf6in/draft",
                map: leftMap,
            }}
            rightMap={{
                styleUrl: "mapbox://styles/freddie-yimby/cm1j6efpa00ks01qp3wfrf6in/draft",
                map: rightMap,
            }}
        />
    )

}