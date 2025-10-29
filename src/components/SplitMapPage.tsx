import { useEffect, useState, useRef } from "react"
import MapPage, { MapPageProps } from "./MapPage"
import syncMaps from "../utils/syncMaps";

interface SplitMapPageProps {
    leftMap: MapPageProps
    rightMap: MapPageProps
    children?: React.ReactNode
    showRight?: boolean
    showAnimate?: boolean
}

export default function SplitMapPage({leftMap, rightMap, children, showRight = true, showAnimate = false }: SplitMapPageProps) {

    const [border, setBorder] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false);
    const animationRef = useRef<number | null>(null);

    const overlayRef = useRef<HTMLDivElement>(null)

    function onLoad() {
        if (!leftMap.map.current) return;
        if (!rightMap.map.current) return;

        syncMaps(leftMap.map.current, rightMap.map.current)

    }
    function startDragging(event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) {
        event.preventDefault(); // Prevent default touch behavior
        setIsDragging(true)
    }

    function onDrag(event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) {
        if (!isDragging) return
        
        event.preventDefault(); // Prevent default touch behavior
        const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
        const rect = event.currentTarget.getBoundingClientRect()
        const x = clientX - rect.left
        setBorder(Math.max(30, Math.min(x, rect.width - 30)))
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

    const animate = () => {
        if (isAnimating) return;
        setIsAnimating(true);

        const startTime = Date.now();
        const duration = 10000; // 10 seconds
        const startBorder = border;
        const endBorder = window.innerWidth - 30; // End at the right edge, minus 30px buffer

        const animateFrame = () => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const newBorder = startBorder + (endBorder - startBorder) * progress;

            setBorder(newBorder);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animateFrame);
            } else {
                setIsAnimating(false);
            }
        };

        animationRef.current = requestAnimationFrame(animateFrame);
    };

    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <div
            className="relative w-screen h-screen"
            onMouseMove={onDrag}
            onTouchMove={onDrag}
            onTouchStart={(e) => e.preventDefault()}
        >
            <div style={{clipPath: showRight ? `rect(0 ${border}px 100vh 0)` : 'rect(0 100vw 100vh 0)', transform: `translateZ(0)`}}>
                <MapPage {...leftMap} />
            </div>
            <div style={{clipPath: `rect(0 100vw 100vh ${border}px)`, transform: `translateZ(0)`, visibility: showRight ? 'visible' : 'hidden'}}>
                <MapPage {...rightMap} />
            </div>
            {showRight && (
                <div
                    ref={overlayRef}
                    className="absolute top-0 -left-2.5 w-5 h-screen bg-black/50 cursor-col-resize z-[1000] touch-none md:-left-3 md:w-6 before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-1 before:h-10 before:bg-white before:rounded-[2px]"
                    style={{transform: `translateX(${border}px)`}}
                    onMouseDown={startDragging}
                    onTouchStart={startDragging}
                />
            )}
            {children}
            {showAnimate && (
                <div className="absolute top-2.5 left-2.5 z-[1000] bg-white rounded-[5px] p-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.1)] max-w-[300px] max-[450px]:w-[calc(100%-20px)] max-[450px]:left-[5px] max-[450px]:p-[5px]" style={{transform: `translateY(200px)`}} >
                    <button onClick={animate} disabled={isAnimating || !showRight}>
                        {isAnimating ? "Animating..." : "Animate"}
                    </button>
                </div>
            )}

        </div>
    )

}