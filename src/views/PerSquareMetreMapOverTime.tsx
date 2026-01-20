"use client";

import mapboxgl, { FilterSpecification, Map } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import Image from "next/image";
import MapPage, { mapEffect } from "@/components/MapPage";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info } from "lucide-react";

// Feature flag to enable cross-linking between maps
const ENABLE_CROSS_LINKING = false;

interface AreaData {
    name: string;
    ladCode?: string;
    ladName?: string;
    isMSOA: boolean;
    chartData: { year: number; price: number }[];
    properties: any;
    selectedYearData: {
        priceper_median: number;
        priceper_mean: number;
        priceper_count: number;
        year: number;
    }
    mostRecentYearData: {
        priceper_median: number;
        priceper_mean: number;
        priceper_count: number;

        price_mean: number;
        price_median: number;
        tfarea_mean: number;
        tfarea_median: number;

        year: number;
    }
}

// UK CPIH data (January readings, 2024 = 100)
// Source: ONS series L522, rescaled from 2015=100 to 2024=100
const CPI_DATA: Record<number, number> = {
    2010: 68.3,
    2011: 70.6,
    2012: 72.8,
    2013: 74.6,
    2014: 75.9,
    2015: 76.3,
    2016: 76.8,
    2017: 78.3,
    2018: 80.4,
    2019: 81.8,
    2020: 83.3,
    2021: 84.1,
    2022: 88.2,
    2023: 96.0,
    2024: 100.0
};

function deflatePrice(price: number, year: number, baseYear: number = 2024): number {
    const cpiYear = CPI_DATA[year];
    const cpiBase = CPI_DATA[baseYear];
    if (!cpiYear || !cpiBase) return price;
    return (price * cpiBase) / cpiYear;
}

function PerSquareMetreMapOverTime() {

    const map = useRef<mapboxgl.Map | null>(null);
    const [minPrice, setMinPrice] = useState<number>(0);
    const [maxPrice, setMaxPrice] = useState<number>(100000);
    const [showSliders, setShowSliders] = useState<boolean>(false);
    const [year, setYear] = useState<number>(2024);
    const [selectedArea, setSelectedArea] = useState<AreaData | null>(null);
    const [showNominal, setShowNominal] = useState<boolean>(true);
    const [showRealSelect, setShowRealSelect] = useState<boolean>(true);
    const [selectBaseYear, setSelectBaseYear] = useState<number>(2024);
    const [showTableInRealTerms, setShowTableInRealTerms] = useState<boolean>(true);
    const [tableBaseYear, setTableBaseYear] = useState<number>(2024);
    const searchParams = useSearchParams();
    const { toast } = useToast();

    function setPsqmFilter(map: Map) {
        console.log(minPrice, maxPrice)
        const filter = ["all", [">=", ["get", `priceper_median_${year}`], minPrice], ["<=", ["get", `priceper_median_${year}`], maxPrice]] as FilterSpecification
        map.setFilter('psqm-sales-msoa-24-byyear', filter)
        map.setFilter('psqm-sales-lad-24-byyear', filter)
    }

    function activateYear(map: Map) {
        console.log(map)
        console.log(map.getPaintProperty('psqm-sales-lad-24-byyear', 'fill-color'))
        console.log(map.getPaintProperty('psqm-sales-msoa-24-byyear', 'fill-color'))

        map.setPaintProperty('psqm-sales-lad-24-byyear', 'fill-color', [
            "interpolate",
            ["linear"],
            ["get", `priceper_median_${year}`],
            1400, "#440154",
            4000, "#3b528b",
            7000, "#21918c",
            10000, "#5ec962",
            14000, "#fde725"
        ])

        map.setPaintProperty('psqm-sales-msoa-24-byyear', 'fill-color', [
            "interpolate",
            ["linear"],
            ["get", `priceper_median_${year}`],
            739.5833129882812, "#440154",
            5823, "#3b528b",
            10906, "#21918c",
            15989, "#5ec962",
            21071.427734375, "#fde725"
        ])
    }

    function onClick(event: mapboxgl.MapMouseEvent) {
        if (!map.current) return;
        const features = map.current.queryRenderedFeatures(event.point)
        if (features.length > 0) {
            const feature = features[0];

            const isMSOA = !!feature.properties?.MSOA21NM;

            // For MSOAs, use ladcd_first property; for LADs, use LAD25CD/LAD24CD
            let ladCode: string | undefined;
            let ladName: string | undefined;

            if (isMSOA) {
                ladCode = feature.properties?.ladcd_first;
                ladName = feature.properties?.ladnm_first;
            } else {
                ladCode = feature.properties?.LAD25CD || feature.properties?.LAD24CD;
                ladName = feature.properties?.LAD25NM || feature.properties?.LAD24NM;
            }

            // Extract time series data for all years
            const years = Array.from({ length: 15 }, (_, i) => i + 2010);
            const chartData = years.map(y => ({
                year: y,
                price: feature.properties?.[`priceper_median_${y}`] || null
            })).filter(d => d.price !== null) as { year: number; price: number }[];

            const areaName = isMSOA ? `MSOA: ${feature.properties?.MSOA21NM}` : `LAD: ${feature.properties?.LAD25NM}`;

            setSelectedArea({
                name: areaName,
                isMSOA: isMSOA,
                ladCode: ladCode,
                ladName: ladName,
                chartData: chartData,
                properties: feature.properties,
                selectedYearData: {
                    priceper_median: feature.properties?.[`priceper_median_${year}`],
                    priceper_mean: feature.properties?.[`priceper_mean_${year}`],
                    priceper_count: feature.properties?.[`priceper_count_${year}`],
                    year: year
                },
                mostRecentYearData: {
                    priceper_median: feature.properties?.[`priceper_median_2024`],
                    priceper_mean: feature.properties?.[`priceper_mean_2024`],
                    priceper_count: feature.properties?.[`priceper_count_2024`],
                    price_mean: feature.properties?.[`price_mean_2024`],
                    price_median: feature.properties?.[`price_median_2024`],
                    tfarea_mean: feature.properties?.[`tfarea_mean_2024`],
                    tfarea_median: feature.properties?.[`tfarea_median_2024`],
                    year: 2024
                }
            });
        }
    }

    useEffect(mapEffect(map, setPsqmFilter), [minPrice, maxPrice, year]);
    useEffect(mapEffect(map, activateYear), [year]);
    // useEffect(mapEffect(map, updateOpacity), [opacity]);

    return (
        <MapPage
            styleUrl='mapbox://styles/freddie-yimby/cmhasxe7s000k01qzhh70hlsv'
            map={map}
            mapOpts={
                searchParams.get('lad') ? {
                    bounds: [[-6.5, 49.8], [2.0, 59.0]],
                    fitBoundsOptions: { padding: 20 },
                    maxZoom: 13.9,
                    minZoom: 6
                } : {
                    center: [-0.1276, 51.5074],
                    zoom: 10,
                    maxZoom: 13.9,
                    minZoom: 6
                }
            }
            attributionControl={
                new mapboxgl.AttributionControl({
                    customAttribution: [
                        'Data from <a href="https://landregistry.data.gov.uk/app/ppd/">HM Land Registry</a> & <a href="https://epc.opendatacommunities.org/">EPC open data</a>',
                        '<a href="https://doi.org/10.14324/111.444/ucloe.000019">Analysis by UCL Centre for Advanced Spatial Analysis</a>',
                        '<a href="https://x.com/freddie_poser">Map by Freddie Poser</a>'
                    ]
                })
            }
            onClick={onClick}
            onLoad={() => {
                setPsqmFilter(map.current!);

                if (!ENABLE_CROSS_LINKING || !map.current) return;

                const handleStyleLoad = () => {
                    const ladCode = searchParams.get('lad');
                    if (!ladCode || !map.current) return;

                    const sourceFeatures = map.current.querySourceFeatures('composite', {
                        sourceLayer: 'psqm-sales-lad-24-byyear'
                    });

                    const ladFeature = sourceFeatures.find(f =>
                        f.properties?.LAD25CD === ladCode || f.properties?.LAD24CD === ladCode
                    );

                    if (!ladFeature || !ladFeature.properties) {
                        toast({
                            title: "Area not found",
                            description: `Could not find sales data for LAD code: ${ladCode}`,
                            variant: "destructive",
                        });
                        return;
                    }

                    const years = Array.from({ length: 15 }, (_, i) => i + 2010);
                    const chartData = years.map(y => ({
                        year: y,
                        price: ladFeature.properties?.[`priceper_median_${y}`] || null
                    })).filter(d => d.price !== null) as { year: number; price: number }[];

                    setSelectedArea({
                        name: `LAD: ${ladFeature.properties.LAD25NM || ladFeature.properties.LAD24NM}`,
                        isMSOA: false,
                        ladCode: ladFeature.properties.LAD25CD || ladFeature.properties.LAD24CD,
                        ladName: ladFeature.properties.LAD25NM || ladFeature.properties.LAD24NM,
                        chartData: chartData,
                        properties: ladFeature.properties,
                        selectedYearData: {
                            priceper_median: ladFeature.properties?.[`priceper_median_${year}`],
                            priceper_mean: ladFeature.properties?.[`priceper_mean_${year}`],
                            priceper_count: ladFeature.properties?.[`priceper_count_${year}`],
                            year: year
                        },
                        mostRecentYearData: {
                            priceper_median: ladFeature.properties?.[`priceper_median_2024`],
                            priceper_mean: ladFeature.properties?.[`priceper_mean_2024`],
                            priceper_count: ladFeature.properties?.[`priceper_count_2024`],
                            price_mean: ladFeature.properties?.[`price_mean_2024`],
                            price_median: ladFeature.properties?.[`price_median_2024`],
                            tfarea_mean: ladFeature.properties?.[`tfarea_mean_2024`],
                            tfarea_median: ladFeature.properties?.[`tfarea_median_2024`],
                            year: 2024
                        }
                    });

                    // Zoom to the feature
                    if (ladFeature.geometry) {
                        let bounds = new mapboxgl.LngLatBounds();

                        if (ladFeature.geometry.type === 'Polygon') {
                            const coordinates = ladFeature.geometry.coordinates[0];
                            coordinates.forEach((coord: number[]) => {
                                bounds.extend(coord as [number, number]);
                            });
                        } else if (ladFeature.geometry.type === 'MultiPolygon') {
                            ladFeature.geometry.coordinates.forEach((polygon: number[][][]) => {
                                polygon[0].forEach((coord: number[]) => {
                                    bounds.extend(coord as [number, number]);
                                });
                            });
                        }

                        if (!bounds.isEmpty()) {
                            map.current!.fitBounds(bounds, {
                                padding: 50,
                                maxZoom: 10
                            });
                        }
                    }
                };

                if (map.current.isStyleLoaded()) {
                    handleStyleLoad();
                } else {
                    map.current.once('idle', handleStyleLoad);
                }
            }}
        >
            <Image src="/logo_colour_tight.png" alt="Logo" width={200} height={50} className="absolute bottom-12 left-2.5 xl:bottom-2.5 max-w-[30%] h-auto opacity-40 z-[1000] transition-all duration-300 ease-in-out rounded-[10px] p-[2vh] bg-white object-contain" />
            {searchParams.get('simple') !== 'true' && (
                <div className={`absolute top-2.5 left-2.5 z-[1000] bg-white rounded-[5px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] max-w-[300px] max-[450px]:w-[calc(100vw-20px)] max-[450px]:left-2.5 max-[450px]:right-2.5 ${showSliders ? 'p-2.5 max-[450px]:p-[5px]' : 'py-1.5 px-2.5 max-[450px]:py-1 max-[450px]:px-[5px]'}`}>
                    <div className="flex justify-between items-center">
                        <h3 className={showSliders ? "m-0" : "m-0 text-base"}>Controls</h3>
                        <button className="bg-transparent border-none text-lg cursor-pointer p-[5px] text-[#333] transition-opacity duration-300 hover:opacity-70" onClick={() => setShowSliders(!showSliders)}>
                            {showSliders ? '▼' : '▶'}
                        </button>
                    </div>
                    {showSliders && (
                        <>
                            <div className="flex justify-between items-center mb-2.5">
                                <label className="max-w-[40%] flex-[1_0_100px] mr-2.5">
                                    <b>Min Price:</b><br />£{minPrice}
                                </label>
                                <input type="range" className="flex-1" min="0" max="10000" step="500" value={minPrice} onChange={(e) => {
                                    const newMinPrice = Number(e.target.value);
                                    setMinPrice(newMinPrice);
                                    if (newMinPrice > maxPrice) {
                                        setMaxPrice(newMinPrice * 1.1);
                                    }
                                }} />
                            </div>
                            <div className="flex justify-between items-center mb-2.5">
                                <label className="max-w-[40%] flex-[1_0_100px] mr-2.5">
                                    <b>Max Price:</b><br />£{maxPrice}
                                </label>
                                <input type="range" className="flex-1" min="0" max="30000" step="500" value={maxPrice} onChange={(e) => {
                                    const newMaxPrice = Number(e.target.value);
                                    setMaxPrice(newMaxPrice);
                                    if (newMaxPrice < minPrice) {
                                        setMinPrice(newMaxPrice * 0.9);
                                    }
                                }} />
                            </div>
                            <div className="flex justify-between items-center mb-2.5">
                                <label className="max-w-[40%] flex-[1_0_100px] mr-2.5"><b>Year:</b></label>
                                <select className="flex-1 px-2 py-1 border border-gray-300 rounded bg-white text-base" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                                    {[
                                        ...Array.from({ length: 15 }, (_, i) => i + 2010).reverse().map((year) => (
                                            <option value={year} key={year}>{year}</option>
                                        ))
                                    ]}
                                </select>
                            </div>
                        </>
                    )}
                </div>
            )}

            <Popover>
                <PopoverTrigger asChild>
                    <Badge className="absolute top-2.5 right-2.5 z-[1000] bg-primary text-primary-foreground shadow-md text-base px-4 py-1.5 cursor-pointer hover:bg-primary/90 transition-colors">
                        <Info className="w-4 h-4 mr-1.5" />
                        2010-2024 Data
                    </Badge>
                </PopoverTrigger>
                <PopoverContent className="w-80 z-[1001]" side="bottom" align="end">
                    <div className="space-y-3">
                        <h4 className="font-bold text-base">Data Sources & Methodology</h4>
                        <div className="space-y-2 text-sm">
                            <div>
                                <p className="font-semibold text-foreground">Sales Price Data</p>
                                <p className="text-muted-foreground">HM Land Registry Price Paid Data (2010-2024)</p>
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">Property Size Data</p>
                                <p className="text-muted-foreground">Energy Performance Certificate (EPC) data from Open Data Communities</p>
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">Inflation Adjustment</p>
                                <p className="text-muted-foreground">CPI-deflated prices using ONS CPIH series (2015=100, rebased to 2024)</p>
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">Boundaries</p>
                                <p className="text-muted-foreground">MSOA and Local Authority boundaries from ONS Geoportal</p>
                            </div>
                        </div>
                        <div className="pt-2 border-t">
                            <a
                                href="https://doi.org/10.14324/111.444/ucloe.000019"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline font-medium"
                            >
                                View UCL CASA methodology →
                            </a>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Slide-in panel for chart */}
            {selectedArea && (
                <>
                    {/* Backdrop - only on mobile */}
                    <div
                        className="fixed inset-0 bg-black/50 z-[1001] transition-opacity duration-300 md:hidden"
                        onClick={() => setSelectedArea(null)}
                    />

                    {/* Panel */}
                    <div className="fixed bottom-0 left-0 right-0 max-h-[80vh] md:bottom-auto md:top-0 md:right-0 md:left-auto md:w-[500px] md:h-full md:max-h-full bg-white z-[1002] shadow-xl animate-slide-up md:animate-slide-left overflow-y-auto">
                        <div className="sticky top-0 bg-white z-10 p-5 pb-3 border-b shadow-sm">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold m-0">{selectedArea.name}</h3>
                                <button
                                    onClick={() => setSelectedArea(null)}
                                    className="bg-transparent border-none text-2xl cursor-pointer p-0 leading-none hover:opacity-70"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        <div className="p-5 pt-3">

                            <div className="mb-3 space-y-2">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showNominal}
                                        onChange={(e) => setShowNominal(e.target.checked)}
                                        className="w-4 h-4 cursor-pointer mr-2"
                                    />
                                    <span className="text-sm"><b>Nominal prices</b></span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showRealSelect}
                                        onChange={(e) => setShowRealSelect(e.target.checked)}
                                        className="w-4 h-4 cursor-pointer mr-2"
                                    />
                                    <span className="text-sm"><b>CPI-deflated real prices:</b></span>
                                    <select
                                        value={selectBaseYear}
                                        onChange={(e) => setSelectBaseYear(Number(e.target.value))}
                                        className="ml-2 px-2 py-1 border border-gray-300 rounded bg-white text-sm"
                                        disabled={!showRealSelect}
                                    >
                                        {Array.from({ length: 15 }, (_, i) => i + 2010).map((y) => (
                                            <option value={y} key={y}>{y}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart
                                    data={selectedArea.chartData.map(d => ({
                                        year: d.year,
                                        nominal: d.price,
                                        real: deflatePrice(d.price, d.year, selectBaseYear)
                                    }))}
                                    margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="year"
                                        type="number"
                                        domain={['dataMin', 'dataMax']}
                                        tickFormatter={(value) => value.toString()}
                                    />
                                    <YAxis
                                        tickFormatter={(value) => `£${value.toFixed(0)}`}
                                        label={{ value: 'Price per sqm', angle: -90, position: 'left', style: { textAnchor: 'middle' } }}
                                    />
                                    <Tooltip
                                        formatter={(value: number, name: string) => {
                                            const labels: Record<string, string> = {
                                                nominal: 'Nominal',
                                                real: `CPI-deflated (${selectBaseYear})`
                                            };
                                            return [`£${value.toFixed(2)}`, labels[name] || name];
                                        }}
                                        labelFormatter={(label) => `Year: ${label}`}
                                    />
                                    <Legend
                                        formatter={(value) => {
                                            const labels: Record<string, string> = {
                                                nominal: 'Nominal',
                                                real: `CPI-deflated (${selectBaseYear})`
                                            };
                                            return labels[value] || value;
                                        }}
                                    />
                                    {showNominal && (
                                        <Line
                                            type="monotone"
                                            dataKey="nominal"
                                            stroke="#0031f5"
                                            strokeWidth={2}
                                            dot={{ fill: '#0031f5', r: 3 }}
                                            activeDot={{ r: 5 }}
                                            name="nominal"
                                        />
                                    )}
                                    {showRealSelect && (
                                        <Line
                                            type="monotone"
                                            dataKey="real"
                                            stroke="#f50031"
                                            strokeWidth={2}
                                            dot={{ fill: '#f50031', r: 3 }}
                                            activeDot={{ r: 5 }}
                                            name="real"
                                        />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>

                            {ENABLE_CROSS_LINKING && selectedArea.ladCode && (
                                <div className="mt-3">
                                    <a
                                        href={`/psqm-rents?lad=${selectedArea.ladCode}`}
                                        className="block w-full p-3 bg-blue-600 text-white text-center rounded font-semibold hover:bg-blue-700 transition-colors no-underline"
                                    >
                                        View rental prices for {selectedArea.isMSOA ? selectedArea.ladName : selectedArea.name.replace('LAD: ', '')} →
                                    </a>
                                </div>
                            )}

                            <div className="mt-3 border-t pt-3">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-semibold text-base">Data by Year</p>
                                    <label className="flex items-center cursor-pointer text-sm">
                                        <input
                                            type="checkbox"
                                            checked={showTableInRealTerms}
                                            onChange={(e) => setShowTableInRealTerms(e.target.checked)}
                                            className="w-4 h-4 cursor-pointer mr-2"
                                        />
                                        <span>CPI-deflated:</span>
                                        <select
                                            value={tableBaseYear}
                                            onChange={(e) => setTableBaseYear(Number(e.target.value))}
                                            className="ml-2 px-2 py-1 border border-gray-300 rounded bg-white text-sm"
                                            disabled={!showTableInRealTerms}
                                        >
                                            {Array.from({ length: 15 }, (_, i) => i + 2010).map((y) => (
                                                <option value={y} key={y}>{y}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left p-2 font-semibold">Year</th>
                                                <th className="text-right p-2 font-semibold">Median £/sqm {showTableInRealTerms ? '(real)' : '(nominal)'}</th>
                                                <th className="text-right p-2 font-semibold">Mean £/sqm {showTableInRealTerms ? '(real)' : '(nominal)'}</th>
                                                <th className="text-right p-2 font-semibold">Sales Count</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.from({ length: 15 }, (_, i) => 2024 - i).map((y) => {
                                                const props = selectedArea.properties;
                                                const median = props?.[`priceper_median_${y}`];
                                                const mean = props?.[`priceper_mean_${y}`];
                                                const displayMedian = median ? (showTableInRealTerms ? deflatePrice(median, y, tableBaseYear) : median) : null;
                                                const displayMean = mean ? (showTableInRealTerms ? deflatePrice(mean, y, tableBaseYear) : mean) : null;
                                                return (
                                                    <tr key={y} className={`border-b hover:bg-gray-50 ${y === year ? 'bg-blue-50' : ''}`}>
                                                        <td className="p-2 font-medium">{y}</td>
                                                        <td className="text-right p-2">
                                                            {displayMedian ? displayMedian.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                                        </td>
                                                        <td className="text-right p-2">
                                                            {displayMean ? displayMean.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                                        </td>
                                                        <td className="text-right p-2">
                                                            {props?.[`priceper_count_${y}`]?.toLocaleString() || '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {selectedArea.properties?.[`price_mean_2024`] && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                                        <p className="font-semibold mb-2">2024 Additional Data:</p>
                                        <div className="space-y-1">
                                            <p>Mean sales price: £{selectedArea.properties[`price_mean_2024`]?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            <p>Median sales price: £{selectedArea.properties[`price_median_2024`]?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            {selectedArea.properties[`tfarea_mean_2024`] && (
                                                <>
                                                    <p>Total Floor Area Mean: {selectedArea.properties[`tfarea_mean_2024`]?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sqm</p>
                                                    <p>Total Floor Area Median: {selectedArea.properties[`tfarea_median_2024`]?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sqm</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </MapPage>
    )
}

export default PerSquareMetreMapOverTime;