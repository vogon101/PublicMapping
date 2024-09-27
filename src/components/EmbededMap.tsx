import { useRef } from "react";
import MapPage from "./MapPage";

export default function EmbededMap({ mapboxStyle }: { mapboxStyle: string }) {

    const map = useRef<mapboxgl.Map | null>(null);

    return <MapPage useContainer={false} map={map} styleUrl={mapboxStyle} mapClassName="w-full h-full" />
}