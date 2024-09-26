import { useEffect, useState, useRef } from "react"
import MapPage, { MapPageProps } from "./MapPage"
import syncMaps from "../utils/syncMaps";

interface SplitMapPageProps {
    leftMap: MapPageProps
    rightMap: MapPageProps
    children?: React.ReactNode
    showRight?: boolean
}

export default function SplitMapPage({leftMap, rightMap, children, showRight = true }: SplitMapPageProps) {

    const [border, setBorder] = useState(0)
    const [isDragging, setIsDragging] = useState(false)

    const overlayRef = useRef<HTMLDivElement>(null)

    function onLoad() {
        if (!leftMap.map.current) return;
        if (!rightMap.map.current) return;

        syncMaps(leftMap.map.current, rightMap.map.current)

    }
    function startDragging(_: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) {
        setIsDragging(true)
    }

    function onDrag(event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) {
        if (!isDragging) return
        
        const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
        const rect = event.currentTarget.getBoundingClientRect()
        const x = clientX - rect.left
        setBorder(Math.max(0, Math.min(x, rect.width)))
    }

    useEffect(() => {
        setBorder(window.innerWidth / 2 )
        window.addEventListener('resize', () => {
            setBorder(window.innerWidth / 2 )
        })

    }, [])

    useEffect(() => {
        const handleMouseUp = () => setIsDragging(false)
        document.addEventListener('mouseup', handleMouseUp)
        document.addEventListener('touchend', handleMouseUp)

        return () => {
            document.removeEventListener('mouseup', handleMouseUp)
            document.removeEventListener('touchend', handleMouseUp)
        }
    }, [])

    useEffect(() => {
        if (leftMap.map.current && rightMap.map.current) {
            onLoad()
        } else {
            setTimeout(() => {
                if (leftMap.map.current && rightMap.map.current) {
                    onLoad()
                }
            }, 250)
        }
    }, [leftMap.map.current, rightMap.map.current])


    return (
        <div 
            className="split-map-page" 
            onMouseMove={onDrag}
            onTouchMove={onDrag}
        >
            <div className="split-map-left" style={{clipPath: showRight ? `rect(0 ${border}px 100vh 0)` : 'rect(0 100vw 100vh 0)', transform: `translateZ(0)`}}>
                <MapPage {...leftMap} />
            </div>
            <div className="split-map-right" style={{clipPath: `rect(0 100vw 100vh ${border}px)`, transform: `translateZ(0)`, visibility: showRight ? 'visible' : 'hidden'}}>
                <MapPage {...rightMap} />
            </div>
            {showRight && (
                <div 
                    ref={overlayRef}
                    className="split-map-overlay" 
                    style={{transform: `translateX(${border}px)`}}
                    onMouseDown={startDragging}
                    onTouchStart={startDragging}
                />
            )}
            {children}
        </div>
    )

}