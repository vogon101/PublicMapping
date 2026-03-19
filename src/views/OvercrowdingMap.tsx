"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useEffect, useRef, useState, useMemo, useCallback, memo } from "react";
import Image from "next/image";
import MapPage from "@/components/MapPage";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info, Search, ArrowLeft, ChevronUp, ChevronDown, Share2, Link2, Check, Maximize2, X } from "lucide-react";

// Lazy-load recharts — it's heavy and only needed when detail panel is open
import dynamic from "next/dynamic";
const LazyScatterChart = dynamic(() => import("recharts").then(m => {
    const { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, ReferenceLine } = m;
    // Return a wrapper component
    function Chart({ data, highlight, regression, margin }: {
        data: ScatterPoint[];
        highlight: ScatterPoint | null;
        regression: { slope: number; intercept: number; r2: number } | null;
        margin: { top: number; right: number; bottom: number; left: number };
    }) {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={margin}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="x" type="number" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}%`}>
                        <Label value="% Overcrowded" position="bottom" offset={8} style={{ fontSize: 11, fill: '#6b7280' }} />
                    </XAxis>
                    <YAxis dataKey="y" type="number" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}%`}>
                        <Label value="% Social rented" angle={-90} position="insideLeft" offset={10} style={{ fontSize: 11, fill: '#6b7280' }} />
                    </YAxis>
                    <Tooltip content={<ScatterTooltipContent />} />
                    {regression && (
                        <ReferenceLine
                            segment={[{ x: 0, y: regression.intercept }, { x: 28, y: regression.slope * 28 + regression.intercept }]}
                            stroke="#9ca3af" strokeDasharray="4 4" strokeWidth={1.5}
                        />
                    )}
                    <Scatter data={data} fill="#9ca3af" fillOpacity={0.3} r={2.5} isAnimationActive={false} />
                    {highlight && (
                        <Scatter data={[highlight]} fill={highlight.fill} r={7} stroke="#353741" strokeWidth={2} isAnimationActive={false} />
                    )}
                </ScatterChart>
            </ResponsiveContainer>
        );
    }
    return Chart;
}), { ssr: false, loading: () => <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Loading chart...</div> });

// ── Types ────────────────────────────────────────────────────────────────────

interface ConstituencyStats {
    PCON24CD: string;
    PCON24NM: string;
    pct_overcrowded: number;
    rank: number;
    band: string;
    total: number;
    overcrowded: number;
    mp_name: string;
    party: string;
    png: string;
    pct_social_rented: number;
    pct_private_rented: number;
    pct_owned: number;
    region: string;
}

interface CityData {
    city: string;
    pct_overcrowded: number;
    total: number;
    overcrowded: number;
    n_constituencies: number;
    centre: [number, number];
    zoom: number;
    constituencies: { code: string; name: string; pct: number; rank: number }[];
    rank: number;
}

interface ScatterPoint {
    x: number;
    y: number;
    PCON24NM: string;
    party: string;
    mp_name: string;
    fill: string;
}

// ── Color/util constants (stable, never change) ─────────────────────────────

const BAND_COLORS: Record<string, string> = {
    '<5%': '#440154', '5–10%': '#3b528b', '10–15%': '#21918c', '15–20%': '#5ec962', '>20%': '#fde725',
};
const BAND_ORDER = ['<5%', '5–10%', '10–15%', '15–20%', '>20%'];

function getBandColor(pct: number): string {
    if (pct >= 20) return '#fde725';
    if (pct >= 15) return '#5ec962';
    if (pct >= 10) return '#21918c';
    if (pct >= 5)  return '#3b528b';
    return '#440154';
}

const PARTY_COLORS: Record<string, string> = {
    'Labour': '#E4003B', 'Labour (Co-op)': '#E4003B', 'Conservative': '#0087DC',
    'Liberal Democrat': '#FAA61A', 'Green Party': '#02A95B', 'Reform UK': '#12B6CF',
    'Plaid Cymru': '#3F8428', 'Independent': '#6b7280', 'Speaker': '#6b7280',
};
const PARTY_SHORT: Record<string, string> = {
    'Labour': 'Labour', 'Labour (Co-op)': 'Labour', 'Conservative': 'Con',
    'Liberal Democrat': 'Lib Dem', 'Green Party': 'Green', 'Reform UK': 'Reform',
    'Plaid Cymru': 'Plaid', 'Independent': 'Ind', 'Speaker': 'Speaker',
};
const PARTY_LEGEND = Object.entries(PARTY_SHORT).filter(([k]) => !['Labour (Co-op)', 'Speaker'].includes(k));

function partyColor(p: string) { return PARTY_COLORS[p] || '#6b7280'; }

function ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ── Map constants ────────────────────────────────────────────────────────────

const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v11';
const CONST_TILESET = 'freddie-yimby.overcrowding_constituencies';
const CONST_LAYER = 'overcrowding-constituencies';
const MSOA_TILESET = 'freddie-yimby.overcrowding_msoa';
const MSOA_LAYER = 'overcrowding-msoa';
const DETAIL_ZOOM_START = 9;
const DETAIL_ZOOM_END = 10;

const FILL_COLOR_EXPR: mapboxgl.Expression = [
    'interpolate', ['linear'], ['get', 'pct_overcrowded'],
    0, '#440154', 5, '#3b528b', 10, '#21918c', 15, '#5ec962', 20, '#fde725',
];

type SortField = 'rank' | 'name';
type SortDir = 'asc' | 'desc';
type Tab = 'constituencies' | 'cities';

// ── Memoized list row ────────────────────────────────────────────────────────

const ConstituencyRow = memo(function ConstituencyRow({ d, onSelect }: { d: ConstituencyStats; onSelect: (d: ConstituencyStats) => void }) {
    return (
        <button onClick={() => onSelect(d)}
            className="w-full flex items-center px-3 py-2.5 border-b border-border/50 hover:bg-secondary transition-colors text-left">
            <span className="w-10 text-right shrink-0 text-xs font-bold text-muted-foreground">{d.rank}</span>
            <div className="flex-1 min-w-0 ml-3">
                <div className="text-sm font-semibold text-foreground truncate">{d.PCON24NM}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: partyColor(d.party) }} />
                    <span className="text-[11px] text-muted-foreground truncate">{d.mp_name}</span>
                </div>
            </div>
            <span className="w-20 text-center shrink-0 text-sm font-bold" style={{ color: getBandColor(d.pct_overcrowded) }}>{d.pct_overcrowded.toFixed(1)}%</span>
        </button>
    );
});

// ── Scatter tooltip (stable, no deps) ────────────────────────────────────────

function ScatterTooltipContent({ active, payload }: { active?: boolean; payload?: Array<{ payload: ScatterPoint }> }) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="bg-white border border-border rounded-md p-2.5 shadow-lg text-xs font-[Lato]">
            <div className="font-bold text-foreground mb-1">{d.PCON24NM}</div>
            <div className="text-muted-foreground">Overcrowded: <span className="font-bold text-accent">{d.x.toFixed(1)}%</span></div>
            <div className="text-muted-foreground">Social rented: <span className="font-bold text-accent">{d.y.toFixed(1)}%</span></div>
            {d.mp_name && <div className="mt-1 pt-1 border-t border-border text-muted-foreground">{d.mp_name} &middot; <span style={{ color: partyColor(d.party), fontWeight: 700 }}>{PARTY_SHORT[d.party] || d.party}</span></div>}
        </div>
    );
}

// ── Main component ───────────────────────────────────────────────────────────

function OvercrowdingMap() {
    const map = useRef<mapboxgl.Map | null>(null);
    const popup = useRef<mapboxgl.Popup | null>(null);
    const [stats, setStats] = useState<ConstituencyStats[]>([]);
    const statsRef = useRef<ConstituencyStats[]>([]);
    const [cities, setCities] = useState<CityData[]>([]);
    const [selectedConstituency, setSelectedConstituency] = useState<ConstituencyStats | null>(null);
    const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>('rank');
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [panelOpen, setPanelOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('constituencies');
    const [scatterModalOpen, setScatterModalOpen] = useState(false);
    useEffect(() => {
        fetch('/overcrowding_stats.json').then(r => r.json()).then((data: ConstituencyStats[]) => { setStats(data); statsRef.current = data; });
        fetch('/overcrowding_cities.json').then(r => r.json()).then((data: CityData[]) => setCities(data));
    }, []);

    // ── Derived data (memoized) ─────────────────────────────────────────────

    const statsById = useMemo(() => {
        const m: Record<string, ConstituencyStats> = {};
        stats.forEach(d => { m[d.PCON24CD] = d; });
        return m;
    }, [stats]);

    const nationalAvg = useMemo(() => stats.length > 0 ? stats.reduce((s, d) => s + d.pct_overcrowded, 0) / stats.length : 0, [stats]);

    const partyRankings = useMemo(() => {
        const groups: Record<string, ConstituencyStats[]> = {};
        stats.forEach(d => { const key = d.party === 'Labour (Co-op)' ? 'Labour' : d.party; (groups[key] ??= []).push(d); });
        const r: Record<string, { rank: number; total: number; partyLabel: string }> = {};
        Object.entries(groups).forEach(([party, seats]) => {
            seats.sort((a, b) => a.rank - b.rank).forEach((seat, i) => { r[seat.PCON24CD] = { rank: i + 1, total: seats.length, partyLabel: party }; });
        });
        return r;
    }, [stats]);

    const filteredStats = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return stats
            .filter(d => d.PCON24NM.toLowerCase().includes(q) || d.mp_name.toLowerCase().includes(q) || d.region.toLowerCase().includes(q))
            .sort((a, b) => sortField === 'rank'
                ? (sortDir === 'asc' ? a.rank - b.rank : b.rank - a.rank)
                : (sortDir === 'asc' ? a.PCON24NM.localeCompare(b.PCON24NM) : b.PCON24NM.localeCompare(a.PCON24NM)));
    }, [stats, searchQuery, sortField, sortDir]);

    // Scatter data: slim objects with only the fields recharts needs
    const scatterData: ScatterPoint[] = useMemo(() =>
        stats.filter(d => d.pct_overcrowded != null && d.pct_social_rented != null)
             .map(d => ({ x: d.pct_overcrowded, y: d.pct_social_rented, PCON24NM: d.PCON24NM, party: d.party, mp_name: d.mp_name, fill: partyColor(d.party) }))
    , [stats]);

    const regression = useMemo(() => {
        if (scatterData.length < 2) return null;
        const n = scatterData.length;
        const mx = scatterData.reduce((s, d) => s + d.x, 0) / n;
        const my = scatterData.reduce((s, d) => s + d.y, 0) / n;
        const num = scatterData.reduce((s, d) => s + (d.x - mx) * (d.y - my), 0);
        const den = scatterData.reduce((s, d) => s + (d.x - mx) ** 2, 0);
        if (den === 0) return null;
        const slope = num / den, intercept = my - slope * mx;
        const ssTot = scatterData.reduce((s, d) => s + (d.y - my) ** 2, 0);
        const ssRes = scatterData.reduce((s, d) => s + (d.y - (slope * d.x + intercept)) ** 2, 0);
        return { slope, intercept, r2: ssTot > 0 ? 1 - ssRes / ssTot : 0 };
    }, [scatterData]);

    const highlightPoint: ScatterPoint | null = useMemo(() =>
        selectedConstituency ? { x: selectedConstituency.pct_overcrowded, y: selectedConstituency.pct_social_rented, PCON24NM: selectedConstituency.PCON24NM, party: selectedConstituency.party, mp_name: selectedConstituency.mp_name, fill: partyColor(selectedConstituency.party) } : null
    , [selectedConstituency]);

    const maxCityPct = useMemo(() => Math.max(...cities.map(c => c.pct_overcrowded), 1), [cities]);

    // ── Map layer setup ────────────────────────────────────────────────────

    const addOvercrowdingLayer = useCallback(() => {
        const m = map.current;
        if (!m) return;

        m.addSource('overcrowding', { type: 'vector', url: `mapbox://${CONST_TILESET}` });
        m.addLayer({ id: 'const-fill', type: 'fill', source: 'overcrowding', 'source-layer': CONST_LAYER, paint: {
            'fill-color': FILL_COLOR_EXPR,
            'fill-opacity': ['interpolate', ['linear'], ['zoom'], DETAIL_ZOOM_START, 0.7, DETAIL_ZOOM_END, 0],
        } });
        m.addLayer({ id: 'const-border', type: 'line', source: 'overcrowding', 'source-layer': CONST_LAYER, paint: {
            'line-color': ['interpolate', ['linear'], ['zoom'], DETAIL_ZOOM_START, '#ffffff', DETAIL_ZOOM_END, '#666666'],
            'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.5, 9, 1, 11, 2, 14, 2.5],
            'line-opacity': ['interpolate', ['linear'], ['zoom'], 5, 0.5, 9, 0.7, 11, 0.9],
        } });
        m.addLayer({ id: 'const-selected', type: 'line', source: 'overcrowding', 'source-layer': CONST_LAYER, paint: { 'line-color': '#353741', 'line-width': 3 }, filter: ['==', 'PCON24CD', ''] });

        m.addSource('overcrowding-msoa', { type: 'vector', url: `mapbox://${MSOA_TILESET}` });
        m.addLayer({ id: 'msoa-fill', type: 'fill', source: 'overcrowding-msoa', 'source-layer': MSOA_LAYER, paint: {
            'fill-color': FILL_COLOR_EXPR,
            'fill-opacity': ['interpolate', ['linear'], ['zoom'], DETAIL_ZOOM_START, 0, DETAIL_ZOOM_END, 0.7],
        } });
        m.addLayer({ id: 'msoa-border', type: 'line', source: 'overcrowding-msoa', 'source-layer': MSOA_LAYER, paint: {
            'line-color': '#666666',
            'line-width': 0.3,
            'line-opacity': ['interpolate', ['linear'], ['zoom'], DETAIL_ZOOM_START, 0, DETAIL_ZOOM_END, 0.5],
        } });

        popup.current = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });

        m.on('mouseenter', 'const-fill', () => { m.getCanvas().style.cursor = 'pointer'; });
        m.on('mouseleave', 'const-fill', () => { m.getCanvas().style.cursor = ''; popup.current?.remove(); });
        m.on('mousemove', 'const-fill', (e) => {
            if (!e.features?.length) return;
            const p = e.features[0].properties!;
            popup.current?.setLngLat(e.lngLat).setHTML(
                `<div style="font-family:'Lato',sans-serif;font-size:13px;line-height:1.5"><div style="font-weight:700;color:#353741">${p.PCON24NM}</div><div style="font-weight:700;color:${getBandColor(Number(p.pct_overcrowded))}">${Number(p.pct_overcrowded).toFixed(1)}% overcrowded</div><div style="color:#6b7280;font-size:12px">Rank #${p.rank} of 575</div></div>`
            ).addTo(m);
        });

        m.on('mouseenter', 'msoa-fill', () => { m.getCanvas().style.cursor = 'pointer'; });
        m.on('mouseleave', 'msoa-fill', () => { m.getCanvas().style.cursor = ''; popup.current?.remove(); });
        m.on('mousemove', 'msoa-fill', (e) => {
            if (!e.features?.length) return;
            const p = e.features[0].properties!;
            const pct = Number(p.pct_overcrowded);
            const name = p.MSOA21NM || '';
            popup.current?.setLngLat(e.lngLat).setHTML(
                `<div style="font-family:'Lato',sans-serif;font-size:13px;line-height:1.5">${name ? `<div style="font-weight:700;color:#353741">${name}</div>` : ''}<div style="font-weight:700;color:${getBandColor(pct)}">${pct.toFixed(1)}% overcrowded</div></div>`
            ).addTo(m);
        });

    }, []);

    // ── Stable callbacks ────────────────────────────────────────────────────

    // Zoom to a feature's bounds using its geometry
    const zoomToFeature = useCallback((geom: GeoJSON.Geometry) => {
        const m = map.current;
        if (!m) return;
        const bounds = new mapboxgl.LngLatBounds();
        if (geom.type === 'Polygon') (geom.coordinates[0] as [number, number][]).forEach(c => bounds.extend(c));
        else if (geom.type === 'MultiPolygon') geom.coordinates.forEach((poly: number[][][]) => (poly[0] as unknown as [number, number][]).forEach(c => bounds.extend(c)));
        if (!bounds.isEmpty()) m.fitBounds(bounds, { padding: 50, maxZoom: 11, duration: 1200 });
    }, []);

    // Select constituency — optionally with a pre-fetched feature for immediate zoom
    const selectConstituency = useCallback((d: ConstituencyStats, feature?: mapboxgl.MapboxGeoJSONFeature) => {
        setSelectedConstituency(d);
        setSelectedCity(null);
        setActiveTab('constituencies');
        setPanelOpen(true);
        const m = map.current;
        if (!m) return;
        m.setFilter('const-selected', ['==', 'PCON24CD', d.PCON24CD]);

        if (feature?.geometry) {
            // Map click path — use the already-available rendered geometry
            zoomToFeature(feature.geometry);
        } else {
            // List click path — query rendered features (fast, only checks current viewport tiles)
            // If feature not in viewport, querySourceFeatures as fallback
            const rendered = m.queryRenderedFeatures({ layers: ['const-fill', 'const-border'], filter: ['==', 'PCON24CD', d.PCON24CD] });
            if (rendered.length > 0 && rendered[0].geometry) {
                zoomToFeature(rendered[0].geometry);
            } else {
                const source = m.querySourceFeatures('overcrowding', { sourceLayer: CONST_LAYER, filter: ['==', 'PCON24CD', d.PCON24CD] });
                if (source.length > 0 && source[0].geometry) {
                    zoomToFeature(source[0].geometry);
                }
            }
        }
    }, [zoomToFeature]);

    const selectCity = useCallback((city: CityData) => {
        setSelectedCity(city); setSelectedConstituency(null); setPanelOpen(true);
        if (map.current) {
            map.current.setFilter('const-selected', ['==', 'PCON24CD', '']);
            map.current.flyTo({ center: [city.centre[1], city.centre[0]], zoom: city.zoom, duration: 800 });
        }
    }, []);

    const backToList = useCallback(() => {
        setSelectedConstituency(null); setSelectedCity(null);
        if (map.current) map.current.setFilter('const-selected', ['==', 'PCON24CD', '']);
    }, []);

    const onClick = useCallback((event: mapboxgl.MapMouseEvent) => {
        if (!map.current) return;
        const s = statsRef.current;
        // Try MSOA first (visible at high zoom), then constituency fill
        let features = map.current.queryRenderedFeatures(event.point, { layers: ['msoa-fill'] });
        if (features.length > 0) {
            const code = features[0].properties?.PCON24CD;
            if (code) {
                const match = s.find(d => d.PCON24CD === code);
                if (match) { selectConstituency(match); return; }
            }
        }
        features = map.current.queryRenderedFeatures(event.point, { layers: ['const-fill'] });
        if (features.length > 0) {
            const code = features[0].properties?.PCON24CD;
            if (code) { const match = s.find(d => d.PCON24CD === code); if (match) selectConstituency(match, features[0]); }
        }
    }, [selectConstituency]);

    const toggleSort = useCallback((field: SortField) => {
        setSortField(prev => { if (prev === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return prev; } setSortDir('asc'); return field; });
    }, []);

    const shareToX = useCallback((d: ConstituencyStats) => {
        const text = `How overcrowded is your constituency?\n\n${d.PCON24NM}: ${d.pct_overcrowded.toFixed(1)}% of households are overcrowded — ranked #${d.rank}.`;
        window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(`${window.location.origin}/overcrowding?c=${d.PCON24CD}`)}`, '_blank');
    }, []);

    const copyLink = useCallback((d: ConstituencyStats) => {
        navigator.clipboard.writeText(`${window.location.origin}/overcrowding?c=${d.PCON24CD}`);
        setCopied(true); setTimeout(() => setCopied(false), 2000);
    }, []);

    const SortIcon = useCallback(({ field }: { field: SortField }) => {
        if (sortField !== field) return null;
        return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />;
    }, [sortField, sortDir]);

    // ── Scatter chart margins (stable refs) ─────────────────────────────────

    const INLINE_MARGIN = useMemo(() => ({ top: 5, right: 10, bottom: 25, left: 5 }), []);
    const MODAL_MARGIN = useMemo(() => ({ top: 20, right: 30, bottom: 50, left: 50 }), []);

    // ── Render ─────────────────────────────────────────────────────────────

    const showDetail = selectedConstituency || selectedCity;
    const sc = selectedConstituency; // shorthand

    return (
        <MapPage styleUrl={MAPBOX_STYLE} map={map}
            mapOpts={{ center: [-1.5, 53], zoom: 6, maxZoom: 14, minZoom: 5 }}
            attributionControl={new mapboxgl.AttributionControl({ customAttribution: ['Data from <a href="https://www.ons.gov.uk/">ONS Census 2021</a> (TS052, TS054)', '<a href="https://github.com/j-a-m-e-s-g/overcrowding-map">Analysis by James G</a>', '<a href="https://x.com/freddie_poser">Map by Freddie Poser</a>'] })}
            onClick={onClick} onLoad={addOvercrowdingLayer}
        >
            <Image src="/logo_colour_tight.png" alt="Logo" width={200} height={50} className="absolute top-2.5 right-2.5 max-w-[50%] max-h-[8vh] h-auto w-auto object-contain opacity-40 z-[1000] transition-all duration-300 ease-in-out rounded-[10px] p-[2vh] bg-white md:bottom-10 md:left-2.5 md:top-auto md:right-auto md:max-w-[30%]" />

            <Popover>
                <PopoverTrigger asChild>
                    <Badge className="absolute bottom-2.5 right-2.5 md:bottom-auto md:top-2.5 md:right-2.5 z-[1000] bg-primary text-primary-foreground shadow-md text-base px-4 py-1.5 cursor-pointer hover:bg-primary/90 transition-colors">
                        <Info className="w-4 h-4 mr-1.5" />Census 2021
                    </Badge>
                </PopoverTrigger>
                <PopoverContent className="w-80 z-[1001]" side="bottom" align="end">
                    <div className="space-y-3">
                        <h4 className="font-bold text-base">Data Sources & Methodology</h4>
                        <div className="space-y-2 text-sm">
                            <div><p className="font-semibold text-foreground">Overcrowding</p><p className="text-muted-foreground">ONS Census 2021, Table TS052: Occupancy rating for bedrooms</p></div>
                            <div><p className="font-semibold text-foreground">Tenure</p><p className="text-muted-foreground">ONS Census 2021, Table TS054: Tenure of household</p></div>
                            <div><p className="font-semibold text-foreground">Definition</p><p className="text-muted-foreground">Overcrowded = bedroom occupancy rating of -1 or below</p></div>
                            <div><p className="font-semibold text-foreground">Boundaries</p><p className="text-muted-foreground">2024 Constituencies &amp; 2021 LSOAs (England &amp; Wales)</p></div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Legend */}
            <div className="absolute bottom-12 left-2.5 md:bottom-2.5 z-[1000] bg-white/95 rounded-[5px] border border-border p-3 shadow-[0_2px_4px_rgba(0,0,0,0.1)] text-xs">
                <div className="font-bold text-foreground mb-1.5 uppercase tracking-wider text-[10px]">% households overcrowded</div>
                {BAND_ORDER.map(band => (
                    <div key={band} className="flex items-center gap-2 mb-1">
                        <span className="w-4 h-3 rounded-sm border border-black/10 inline-block" style={{ background: BAND_COLORS[band] }} />
                        <span className="text-muted-foreground">{band}</span>
                    </div>
                ))}
            </div>

            {/* Mobile toggle */}
            <button onClick={() => setPanelOpen(o => !o)} className="md:hidden fixed bottom-0 left-0 right-0 z-[1003] bg-white border-t border-border py-3 px-4 text-sm font-bold text-center shadow-lg">
                {panelOpen ? 'Hide panel' : showDetail ? (sc?.PCON24NM || selectedCity?.city || 'Details') : `Explore (${stats.length} constituencies)`}
            </button>

            {/* Side panel */}
            <div className={`fixed top-0 right-0 w-full md:w-[380px] h-[60vh] md:h-full bg-white z-[1002] shadow-xl flex flex-col transition-transform duration-300 ${panelOpen ? 'translate-y-[40vh] md:translate-y-0' : 'translate-y-full md:translate-y-0'} md:translate-x-0`}>
                {sc ? (
                    <>
                        <div className="sticky top-0 bg-white z-10 p-4 border-b shadow-sm shrink-0">
                            <button onClick={backToList} className="text-primary hover:underline text-sm font-semibold flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> All constituencies</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            <h2 className="text-2xl font-black text-foreground mb-1">{sc.PCON24NM}</h2>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                {sc.mp_name && <span>{sc.mp_name}</span>}
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-bold text-white" style={{ background: partyColor(sc.party) }}>{PARTY_SHORT[sc.party] || sc.party}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mb-4">{sc.region}</div>

                            <div className="bg-secondary rounded-lg border-l-4 border-primary p-4 mb-5">
                                <div className="text-3xl font-black text-foreground">{sc.pct_overcrowded.toFixed(1)}%</div>
                                <div className="text-sm text-muted-foreground mt-1">of households are overcrowded</div>
                                <div className="text-xs text-muted-foreground mt-2">{ordinal(sc.rank)} most overcrowded of {stats.length}</div>
                                {partyRankings[sc.PCON24CD] && <div className="text-xs text-muted-foreground mt-1">{ordinal(partyRankings[sc.PCON24CD].rank)} most overcrowded {partyRankings[sc.PCON24CD].partyLabel} seat (of {partyRankings[sc.PCON24CD].total})</div>}
                                {nationalAvg > 0 && <div className="text-xs text-muted-foreground mt-1">National avg: {nationalAvg.toFixed(1)}% — <span className="font-bold text-foreground">{sc.pct_overcrowded > nationalAvg ? `${(sc.pct_overcrowded / nationalAvg).toFixed(1)}x above` : `${(nationalAvg / sc.pct_overcrowded).toFixed(1)}x below`}</span></div>}
                            </div>

                            <div className="space-y-2 mb-5">
                                <StatRow label="Total households" value={sc.total.toLocaleString()} />
                                <StatRow label="Overcrowded households" value={sc.overcrowded.toLocaleString()} />
                            </div>

                            <div className="mb-5">
                                <SectionTitle>Tenure breakdown</SectionTitle>
                                <div className="space-y-2">
                                    <TenureBar label="Owned" pct={sc.pct_owned} color="#73AB96" />
                                    <TenureBar label="Private rented" pct={sc.pct_private_rented} color="#3D6657" />
                                    <TenureBar label="Social rented" pct={sc.pct_social_rented} color="#353741" />
                                </div>
                            </div>

                            <div className="mb-2">
                                <div className="flex items-center justify-between mb-2">
                                    <SectionTitle>Overcrowding vs social housing{regression && <span className="ml-1 normal-case font-normal"> (R² = {regression.r2.toFixed(2)})</span>}</SectionTitle>
                                    <button onClick={() => setScatterModalOpen(true)} className="text-primary hover:text-accent transition-colors" title="Full screen"><Maximize2 className="w-4 h-4" /></button>
                                </div>
                                <div className="h-52 -mx-2">
                                    <LazyScatterChart data={scatterData} highlight={highlightPoint} regression={regression} margin={INLINE_MARGIN} />
                                </div>
                            </div>

                            <div className="flex gap-2 mb-5">
                                <button onClick={() => shareToX(sc)} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded text-xs font-semibold text-foreground hover:bg-muted transition-colors"><Share2 className="w-3.5 h-3.5" /> Share on X</button>
                                <button onClick={() => copyLink(sc)} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded text-xs font-semibold text-foreground hover:bg-muted transition-colors">{copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Link2 className="w-3.5 h-3.5" />}{copied ? 'Copied!' : 'Copy link'}</button>
                            </div>

                            <div className="text-[11px] text-muted-foreground leading-relaxed">Source: ONS Census 2021 (TS052, TS054).<br />Overcrowded = bedroom occupancy rating of -1 or below.</div>
                        </div>
                    </>
                ) : selectedCity ? (
                    <>
                        <div className="sticky top-0 bg-white z-10 p-4 border-b shadow-sm shrink-0">
                            <button onClick={backToList} className="text-primary hover:underline text-sm font-semibold flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> All cities</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            <h2 className="text-2xl font-black text-foreground mb-1">{selectedCity.city}</h2>
                            <div className="text-xs text-muted-foreground mb-4">#{selectedCity.rank} of {cities.length} most overcrowded cities</div>
                            <div className="bg-secondary rounded-lg border-l-4 border-primary p-4 mb-5">
                                <div className="text-3xl font-black text-foreground">{selectedCity.pct_overcrowded.toFixed(1)}%</div>
                                <div className="text-sm text-muted-foreground mt-1">of households are overcrowded</div>
                                <div className="text-xs text-muted-foreground mt-2">{selectedCity.total.toLocaleString()} households &middot; {selectedCity.overcrowded.toLocaleString()} overcrowded</div>
                            </div>
                            <SectionTitle>{selectedCity.n_constituencies} {selectedCity.n_constituencies === 1 ? 'constituency' : 'constituencies'}</SectionTitle>
                            {selectedCity.constituencies.map(seat => {
                                const ss = statsById[seat.code];
                                const maxPct = Math.max(...selectedCity.constituencies.map(s => s.pct), 1);
                                return (
                                    <button key={seat.code} onClick={() => { if (ss) selectConstituency(ss); }}
                                        className="w-full flex items-center gap-2 py-2.5 border-b border-border/50 hover:bg-secondary transition-colors text-left">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-foreground truncate">{seat.name}</div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ss ? partyColor(ss.party) : '#6b7280' }} />
                                                <span className="text-[11px] text-muted-foreground">{ss ? (PARTY_SHORT[ss.party] || ss.party) : ''}</span>
                                            </div>
                                        </div>
                                        <div className="w-16 shrink-0"><div className="h-1.5 bg-border/50 rounded overflow-hidden"><div className="h-full rounded bg-primary" style={{ width: `${(seat.pct / maxPct) * 100}%` }} /></div></div>
                                        <span className="text-sm font-bold text-foreground w-14 text-right shrink-0">{seat.pct.toFixed(1)}%</span>
                                        <span className="text-[11px] text-muted-foreground w-10 text-right shrink-0">#{seat.rank}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex border-b shrink-0">
                            {(['constituencies', 'cities'] as Tab[]).map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === tab ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}>
                                    {tab === 'constituencies' ? 'Constituencies' : 'Cities'}
                                </button>
                            ))}
                        </div>
                        {activeTab === 'constituencies' ? (
                            <>
                                <div className="p-3 border-b shrink-0">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input type="text" placeholder="Search constituencies, MPs, or regions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                            className="w-full pl-8 pr-3 py-2 border border-input rounded text-sm focus:outline-none focus:border-primary bg-secondary focus:bg-white transition-colors" />
                                    </div>
                                </div>
                                <div className="flex items-center px-3 py-1.5 border-b bg-secondary text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                                    <button className="w-10 text-right shrink-0 hover:text-foreground transition-colors" onClick={() => toggleSort('rank')}>Rank<SortIcon field="rank" /></button>
                                    <button className="flex-1 min-w-0 ml-3 text-left hover:text-foreground transition-colors" onClick={() => toggleSort('name')}>Constituency<SortIcon field="name" /></button>
                                    <span className="w-20 text-center shrink-0">% Overcr.</span>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {filteredStats.map((d: ConstituencyStats) => <ConstituencyRow key={d.PCON24CD} d={d} onSelect={selectConstituency} />)}
                                    {filteredStats.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No constituencies match &ldquo;{searchQuery}&rdquo;</div>}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 overflow-y-auto">
                                {cities.map(city => (
                                    <button key={city.city} onClick={() => selectCity(city)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 border-b border-border/50 hover:bg-secondary transition-colors text-left">
                                        <span className="text-xs font-bold text-muted-foreground w-8 text-right shrink-0">#{city.rank}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-foreground">{city.city}</div>
                                            <div className="h-1.5 bg-border/50 rounded overflow-hidden mt-1"><div className="h-full rounded bg-primary" style={{ width: `${(city.pct_overcrowded / maxCityPct) * 100}%` }} /></div>
                                        </div>
                                        <span className="text-sm font-bold text-foreground w-14 text-right shrink-0">{city.pct_overcrowded.toFixed(1)}%</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Full-screen scatter modal — only mounted when open */}
            {scatterModalOpen && (
                <div className="fixed inset-0 z-[10000] flex flex-col" onClick={() => setScatterModalOpen(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="relative m-4 md:m-8 flex-1 bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Overcrowding vs social housing by constituency</h2>
                                <p className="text-xs text-muted-foreground">England &amp; Wales &middot; ONS Census 2021 &middot; {stats.length} constituencies{regression && ` · R² = ${regression.r2.toFixed(2)}`}</p>
                            </div>
                            <button onClick={() => setScatterModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="flex-1 p-4">
                            <LazyScatterChart data={scatterData} highlight={highlightPoint} regression={regression} margin={MODAL_MARGIN} />
                        </div>
                        <div className="flex items-center gap-4 px-4 py-2 border-t text-xs text-muted-foreground flex-wrap shrink-0">
                            <span className="font-bold uppercase tracking-wider text-[10px]">Party</span>
                            {PARTY_LEGEND.map(([full, short]) => (
                                <span key={full} className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: PARTY_COLORS[full] }} />{short}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </MapPage>
    );
}

// ── Small pure components ────────────────────────────────────────────────────

const SectionTitle = memo(function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{children}</h3>;
});

const StatRow = memo(function StatRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between p-2 bg-secondary rounded text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-bold text-foreground">{value}</span>
        </div>
    );
});

const TenureBar = memo(function TenureBar({ label, pct, color }: { label: string; pct: number; color: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
            <div className="flex-1 h-4 bg-secondary rounded overflow-hidden">
                <div className="h-full rounded" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-xs font-bold text-foreground w-12 text-right">{pct.toFixed(1)}%</span>
        </div>
    );
});

export default OvercrowdingMap;
