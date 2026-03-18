"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import MapPage from "@/components/MapPage";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info, Search, ArrowLeft, ChevronUp, ChevronDown, Share2, Link2, Check } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, ReferenceLine } from "recharts";

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

const PARTY_COLORS: Record<string, string> = {
    'Labour': '#E4003B',
    'Labour (Co-op)': '#E4003B',
    'Conservative': '#0087DC',
    'Liberal Democrat': '#FAA61A',
    'Green Party': '#02A95B',
    'Reform UK': '#12B6CF',
    'Plaid Cymru': '#3F8428',
    'Independent': '#6b7280',
    'Speaker': '#6b7280',
};

const BAND_COLORS: Record<string, string> = {
    '<5%': '#ead5f5',
    '5–10%': '#c084e8',
    '10–15%': '#9333cc',
    '15–20%': '#6b0fa3',
    '>20%': '#3b0066',
};

const BAND_ORDER = ['<5%', '5–10%', '10–15%', '15–20%', '>20%'];

function partyColor(party: string): string {
    return PARTY_COLORS[party] || '#6b7280';
}

function ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v11';
const TILESET_ID = 'freddie-yimby.overcrowding_constituencies';
const SOURCE_LAYER = 'overcrowding-constituencies';

type SortField = 'rank' | 'name' | 'region';
type SortDir = 'asc' | 'desc';

function OvercrowdingMap() {
    const map = useRef<mapboxgl.Map | null>(null);
    const popup = useRef<mapboxgl.Popup | null>(null);
    const [stats, setStats] = useState<ConstituencyStats[]>([]);
    const [selectedConstituency, setSelectedConstituency] = useState<ConstituencyStats | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>('rank');
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [panelOpen, setPanelOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const listScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('/overcrowding_stats.json')
            .then(r => r.json())
            .then((data: ConstituencyStats[]) => setStats(data));
    }, []);

    function addOvercrowdingLayer() {
        const m = map.current;
        if (!m) return;

        m.addSource('overcrowding', {
            type: 'vector',
            url: `mapbox://${TILESET_ID}`,
        });

        m.addLayer({
            id: 'overcrowding-fill',
            type: 'fill',
            source: 'overcrowding',
            'source-layer': SOURCE_LAYER,
            paint: {
                'fill-color': [
                    'step',
                    ['get', 'pct_overcrowded'],
                    '#ead5f5',
                    5, '#c084e8',
                    10, '#9333cc',
                    15, '#6b0fa3',
                    20, '#3b0066',
                ],
                'fill-opacity': 0.75,
            },
        });

        m.addLayer({
            id: 'overcrowding-border',
            type: 'line',
            source: 'overcrowding',
            'source-layer': SOURCE_LAYER,
            paint: {
                'line-color': '#ffffff',
                'line-width': 0.5,
                'line-opacity': 0.6,
            },
        });

        m.addLayer({
            id: 'overcrowding-hover',
            type: 'line',
            source: 'overcrowding',
            'source-layer': SOURCE_LAYER,
            paint: {
                'line-color': '#353741',
                'line-width': 2.5,
            },
            filter: ['==', 'PCON24CD', ''],
        });

        // Hover tooltip
        popup.current = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 12,
        });

        m.on('mouseenter', 'overcrowding-fill', () => {
            m.getCanvas().style.cursor = 'pointer';
        });

        m.on('mouseleave', 'overcrowding-fill', () => {
            m.getCanvas().style.cursor = '';
            m.setFilter('overcrowding-hover', ['==', 'PCON24CD', '']);
            popup.current?.remove();
        });

        m.on('mousemove', 'overcrowding-fill', (e) => {
            if (!e.features || e.features.length === 0) return;
            const f = e.features[0];
            const props = f.properties;
            if (!props) return;

            m.setFilter('overcrowding-hover', ['==', 'PCON24CD', props.PCON24CD || '']);

            const pct = Number(props.pct_overcrowded);
            const rank = Number(props.rank);
            const name = props.PCON24NM || '';

            popup.current
                ?.setLngLat(e.lngLat)
                .setHTML(`
                    <div style="font-family:'Lato',sans-serif;font-size:13px;line-height:1.4">
                        <div style="font-weight:700;color:#353741;margin-bottom:3px">${name}</div>
                        <div style="color:#6b0fa3;font-weight:700">${pct.toFixed(1)}% overcrowded</div>
                        <div style="color:#6b7280;font-size:12px">Rank #${rank} of 575</div>
                    </div>
                `)
                .addTo(m);
        });
    }

    const nationalAvg = stats.length > 0
        ? stats.reduce((sum, d) => sum + d.pct_overcrowded, 0) / stats.length
        : 0;

    const filteredStats: ConstituencyStats[] = stats
        .filter(d => d.PCON24NM.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     d.mp_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     d.region.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortField === 'rank') {
                return sortDir === 'asc' ? a.rank - b.rank : b.rank - a.rank;
            }
            if (sortField === 'region') {
                const cmp = a.region.localeCompare(b.region);
                return sortDir === 'asc' ? cmp : -cmp;
            }
            return sortDir === 'asc'
                ? a.PCON24NM.localeCompare(b.PCON24NM)
                : b.PCON24NM.localeCompare(a.PCON24NM);
        });

    const scatterData = stats
        .filter(d => d.pct_overcrowded != null && d.pct_social_rented != null)
        .map(d => ({
            ...d,
            x: d.pct_overcrowded,
            y: d.pct_social_rented,
            fill: partyColor(d.party),
        }));

    // Compute regression line
    const regression = useCallback(() => {
        if (scatterData.length < 2) return null;
        const n = scatterData.length;
        const mx = scatterData.reduce((s, d) => s + d.x, 0) / n;
        const my = scatterData.reduce((s, d) => s + d.y, 0) / n;
        const num = scatterData.reduce((s, d) => s + (d.x - mx) * (d.y - my), 0);
        const den = scatterData.reduce((s, d) => s + (d.x - mx) ** 2, 0);
        if (den === 0) return null;
        const slope = num / den;
        const intercept = my - slope * mx;
        const ssTot = scatterData.reduce((s, d) => s + (d.y - my) ** 2, 0);
        const ssRes = scatterData.reduce((s, d) => s + (d.y - (slope * d.x + intercept)) ** 2, 0);
        const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
        return { slope, intercept, r2 };
    }, [scatterData])();

    function selectConstituency(d: ConstituencyStats) {
        setSelectedConstituency(d);
        setPanelOpen(true);

        if (map.current) {
            map.current.setFilter('overcrowding-hover', ['==', 'PCON24CD', d.PCON24CD]);

            const features = map.current.querySourceFeatures('overcrowding', {
                sourceLayer: SOURCE_LAYER,
                filter: ['==', 'PCON24CD', d.PCON24CD]
            });
            if (features.length > 0 && features[0].geometry) {
                const bounds = new mapboxgl.LngLatBounds();
                const geom = features[0].geometry;
                if (geom.type === 'Polygon') {
                    (geom.coordinates[0] as [number, number][]).forEach(c => bounds.extend(c));
                } else if (geom.type === 'MultiPolygon') {
                    geom.coordinates.forEach((poly: number[][][]) => {
                        (poly[0] as unknown as [number, number][]).forEach(c => bounds.extend(c));
                    });
                }
                if (!bounds.isEmpty()) {
                    map.current.fitBounds(bounds, { padding: 50, maxZoom: 11 });
                }
            }
        }
    }

    function onClick(event: mapboxgl.MapMouseEvent) {
        if (!map.current) return;
        const features = map.current.queryRenderedFeatures(event.point, { layers: ['overcrowding-fill'] });
        if (features.length > 0) {
            const code = features[0].properties?.PCON24CD;
            if (code) {
                const match = stats.find(d => d.PCON24CD === code);
                if (match) selectConstituency(match);
            }
        }
    }

    function toggleSort(field: SortField) {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    }

    function shareToX(d: ConstituencyStats) {
        const text = `How overcrowded is your constituency?\n\n${d.PCON24NM}: ${d.pct_overcrowded.toFixed(1)}% of households are overcrowded — ranked #${d.rank} of ${stats.length} in England & Wales.`;
        const url = `${window.location.origin}/overcrowding?c=${d.PCON24CD}`;
        window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    }

    function copyLink(d: ConstituencyStats) {
        const url = `${window.location.origin}/overcrowding?c=${d.PCON24CD}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null;
        return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />;
    };

    return (
        <MapPage
            styleUrl={MAPBOX_STYLE}
            map={map}
            mapOpts={{
                center: [-1.5, 53],
                zoom: 6,
                maxZoom: 13,
                minZoom: 5
            }}
            attributionControl={
                new mapboxgl.AttributionControl({
                    customAttribution: [
                        'Data from <a href="https://www.ons.gov.uk/">ONS Census 2021</a> (TS052, TS054)',
                        '<a href="https://github.com/j-a-m-e-s-g/overcrowding-map">Analysis by James G</a>',
                        '<a href="https://x.com/freddie_poser">Map by Freddie Poser</a>'
                    ]
                })
            }
            onClick={onClick}
            onLoad={addOvercrowdingLayer}
        >
            <Image src="/logo_colour_tight.png" alt="Logo" width={200} height={50} className="absolute top-2.5 right-2.5 max-w-[50%] max-h-[8vh] h-auto w-auto object-contain opacity-40 z-[1000] transition-all duration-300 ease-in-out rounded-[10px] p-[2vh] bg-white md:bottom-10 md:left-2.5 md:top-auto md:right-auto md:max-w-[30%]" />

            {/* Data badge */}
            <Popover>
                <PopoverTrigger asChild>
                    <Badge className="absolute bottom-2.5 right-2.5 md:bottom-auto md:top-2.5 md:right-2.5 z-[1000] bg-primary text-primary-foreground shadow-md text-base px-4 py-1.5 cursor-pointer hover:bg-primary/90 transition-colors">
                        <Info className="w-4 h-4 mr-1.5" />
                        Census 2021
                    </Badge>
                </PopoverTrigger>
                <PopoverContent className="w-80 z-[1001]" side="bottom" align="end">
                    <div className="space-y-3">
                        <h4 className="font-bold text-base">Data Sources & Methodology</h4>
                        <div className="space-y-2 text-sm">
                            <div>
                                <p className="font-semibold text-foreground">Overcrowding Data</p>
                                <p className="text-muted-foreground">ONS Census 2021, Table TS052: Occupancy rating for bedrooms</p>
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">Tenure Data</p>
                                <p className="text-muted-foreground">ONS Census 2021, Table TS054: Tenure of household</p>
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">Definition</p>
                                <p className="text-muted-foreground">Overcrowded = bedroom occupancy rating of -1 or below (at least one bedroom too few)</p>
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">Boundaries</p>
                                <p className="text-muted-foreground">2024 Parliamentary Constituencies (England &amp; Wales)</p>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Legend */}
            <div className="absolute bottom-12 left-2.5 md:bottom-2.5 z-[1000] bg-white/95 rounded-[5px] border border-border p-3 shadow-[0_2px_4px_rgba(0,0,0,0.1)] text-xs">
                <div className="font-bold text-foreground mb-1.5 uppercase tracking-wider text-[10px]">% Overcrowded</div>
                {BAND_ORDER.map(band => (
                    <div key={band} className="flex items-center gap-2 mb-1">
                        <span className="w-4 h-3 rounded-sm border border-black/10 inline-block" style={{ background: BAND_COLORS[band] }} />
                        <span className="text-muted-foreground">{band}</span>
                    </div>
                ))}
                {nationalAvg > 0 && (
                    <div className="mt-2 pt-2 border-t border-border text-muted-foreground">
                        National avg: <span className="font-bold text-foreground">{nationalAvg.toFixed(1)}%</span>
                    </div>
                )}
            </div>

            {/* Panel toggle for mobile */}
            <button
                onClick={() => setPanelOpen(!panelOpen)}
                className="md:hidden fixed bottom-0 left-0 right-0 z-[1003] bg-white border-t border-border py-3 px-4 text-sm font-bold text-center shadow-lg"
            >
                {panelOpen ? 'Hide panel' : `Constituencies (${stats.length})`}
            </button>

            {/* Side panel */}
            <div className={`fixed top-0 right-0 w-full md:w-[380px] h-[60vh] md:h-full bg-white z-[1002] shadow-xl flex flex-col transition-transform duration-300 ${panelOpen ? 'translate-y-[40vh] md:translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-0'} md:translate-x-0`}>
                {selectedConstituency ? (
                    /* Detail view */
                    <>
                        <div className="sticky top-0 bg-white z-10 p-4 border-b shadow-sm shrink-0">
                            <button onClick={() => setSelectedConstituency(null)} className="text-primary hover:underline text-sm font-semibold flex items-center gap-1">
                                <ArrowLeft className="w-4 h-4" /> All constituencies
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            <h2 className="text-2xl font-black text-foreground mb-1">{selectedConstituency.PCON24NM}</h2>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <span>{selectedConstituency.mp_name}</span>
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-bold text-white" style={{ background: partyColor(selectedConstituency.party) }}>
                                    {selectedConstituency.party}
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground mb-4">{selectedConstituency.region}</div>

                            {/* Big stat */}
                            <div className="bg-secondary rounded-lg border-l-4 border-primary p-4 mb-5">
                                <div className="text-3xl font-black text-foreground">{selectedConstituency.pct_overcrowded.toFixed(1)}%</div>
                                <div className="text-sm text-muted-foreground mt-1">of households are overcrowded</div>
                                <div className="text-xs text-muted-foreground mt-2">
                                    {ordinal(selectedConstituency.rank)} most overcrowded of {stats.length} constituencies
                                </div>
                                {nationalAvg > 0 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                        National average: {nationalAvg.toFixed(1)}% &mdash;{' '}
                                        <span className="font-bold text-foreground">
                                            {selectedConstituency.pct_overcrowded > nationalAvg
                                                ? `${(selectedConstituency.pct_overcrowded / nationalAvg).toFixed(1)}x above average`
                                                : `${(nationalAvg / selectedConstituency.pct_overcrowded).toFixed(1)}x below average`
                                            }
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Breakdown */}
                            <div className="space-y-2 mb-5">
                                <div className="flex justify-between p-2 bg-secondary rounded text-sm">
                                    <span className="text-muted-foreground">Total households</span>
                                    <span className="font-bold text-foreground">{selectedConstituency.total.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between p-2 bg-secondary rounded text-sm">
                                    <span className="text-muted-foreground">Overcrowded households</span>
                                    <span className="font-bold text-foreground">{selectedConstituency.overcrowded.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Tenure breakdown */}
                            <div className="mb-5">
                                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Tenure breakdown</h3>
                                <div className="space-y-2">
                                    <TenureBar label="Owned" pct={selectedConstituency.pct_owned} color="#73AB96" />
                                    <TenureBar label="Private rented" pct={selectedConstituency.pct_private_rented} color="#3D6657" />
                                    <TenureBar label="Social rented" pct={selectedConstituency.pct_social_rented} color="#353741" />
                                </div>
                            </div>

                            {/* Scatter */}
                            <div className="mb-5">
                                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                    Overcrowding vs Social Housing
                                    {regression && <span className="ml-2 normal-case font-normal">(R² = {regression.r2.toFixed(2)})</span>}
                                </h3>
                                <div className="h-52 -mx-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ScatterChart margin={{ top: 5, right: 10, bottom: 25, left: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="x" type="number" name="Overcrowded %" tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`}>
                                                <Label value="% Overcrowded" position="bottom" offset={8} style={{ fontSize: 10, fill: '#6b7280' }} />
                                            </XAxis>
                                            <YAxis dataKey="y" type="number" name="Social rented %" tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`}>
                                                <Label value="% Social rented" angle={-90} position="insideLeft" offset={10} style={{ fontSize: 10, fill: '#6b7280' }} />
                                            </YAxis>
                                            <Tooltip content={<ScatterTooltip />} />
                                            {/* Regression line */}
                                            {regression && (
                                                <ReferenceLine
                                                    segment={[
                                                        { x: 0, y: regression.intercept },
                                                        { x: 28, y: regression.slope * 28 + regression.intercept },
                                                    ]}
                                                    stroke="#9ca3af"
                                                    strokeDasharray="4 4"
                                                    strokeWidth={1.5}
                                                />
                                            )}
                                            <Scatter data={scatterData} fill="#9ca3af" fillOpacity={0.35} r={2.5} />
                                            {/* Highlight selected */}
                                            <Scatter
                                                data={[{
                                                    x: selectedConstituency.pct_overcrowded,
                                                    y: selectedConstituency.pct_social_rented,
                                                    PCON24NM: selectedConstituency.PCON24NM,
                                                    fill: partyColor(selectedConstituency.party),
                                                }]}
                                                fill={partyColor(selectedConstituency.party)}
                                                r={7}
                                                stroke="#353741"
                                                strokeWidth={2}
                                            />
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Share */}
                            <div className="flex gap-2 mb-5">
                                <button
                                    onClick={() => shareToX(selectedConstituency)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                                >
                                    <Share2 className="w-3.5 h-3.5" />
                                    Share on X
                                </button>
                                <button
                                    onClick={() => copyLink(selectedConstituency)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Link2 className="w-3.5 h-3.5" />}
                                    {copied ? 'Copied!' : 'Copy link'}
                                </button>
                            </div>

                            <div className="text-[11px] text-muted-foreground leading-relaxed">
                                Source: ONS Census 2021 (TS052, TS054).<br />
                                Overcrowded = bedroom occupancy rating of -1 or below.
                            </div>
                        </div>
                    </>
                ) : (
                    /* List view */
                    <>
                        <div className="p-3 border-b shrink-0">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">All constituencies</h2>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search constituencies, MPs, or regions..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 border border-input rounded text-sm focus:outline-none focus:border-primary bg-secondary focus:bg-white transition-colors"
                                />
                            </div>
                        </div>

                        {/* Column headers */}
                        <div className="flex items-center px-3 py-1.5 border-b bg-secondary text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                            <button className="w-10 text-right shrink-0 hover:text-foreground transition-colors" onClick={() => toggleSort('rank')}>
                                Rank<SortIcon field="rank" />
                            </button>
                            <button className="flex-1 min-w-0 ml-3 text-left hover:text-foreground transition-colors" onClick={() => toggleSort('name')}>
                                Constituency<SortIcon field="name" />
                            </button>
                            <span className="w-20 text-center shrink-0">% Overcr.</span>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto" ref={listScrollRef}>
                            {filteredStats.map((d: ConstituencyStats) => (
                                <button
                                    key={d.PCON24CD}
                                    onClick={() => selectConstituency(d)}
                                    className="w-full flex items-center px-3 py-2.5 border-b border-border/50 hover:bg-secondary transition-colors text-left"
                                >
                                    <span className="w-10 text-right shrink-0 text-xs font-bold text-muted-foreground">
                                        {d.rank}
                                    </span>
                                    <div className="flex-1 min-w-0 ml-3">
                                        <div className="text-sm font-semibold text-foreground truncate">{d.PCON24NM}</div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: partyColor(d.party) }} />
                                            <span className="text-[11px] text-muted-foreground truncate">{d.mp_name}</span>
                                        </div>
                                    </div>
                                    <div className="w-20 text-center shrink-0">
                                        <span className="text-sm font-bold" style={{ color: BAND_COLORS[d.band] || '#6b0fa3' }}>
                                            {d.pct_overcrowded.toFixed(1)}%
                                        </span>
                                    </div>
                                </button>
                            ))}
                            {filteredStats.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    No constituencies match &ldquo;{searchQuery}&rdquo;
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </MapPage>
    );
}

function TenureBar({ label, pct, color }: { label: string; pct: number; color: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
            <div className="flex-1 h-4 bg-secondary rounded overflow-hidden">
                <div className="h-full rounded transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-xs font-bold text-foreground w-12 text-right">{pct.toFixed(1)}%</span>
        </div>
    );
}

function ScatterTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { PCON24NM?: string; x?: number; y?: number; party?: string } }> }) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="bg-white border border-border rounded-md p-2.5 shadow-lg text-xs font-[Lato]">
            <div className="font-bold text-foreground mb-1">{d.PCON24NM}</div>
            <div className="text-muted-foreground">Overcrowded: <span className="font-bold text-accent">{d.x?.toFixed(1)}%</span></div>
            <div className="text-muted-foreground">Social rented: <span className="font-bold text-accent">{d.y?.toFixed(1)}%</span></div>
        </div>
    );
}

export default OvercrowdingMap;
