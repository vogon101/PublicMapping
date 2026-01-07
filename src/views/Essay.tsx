"use client";

import EmbededMap from "@/components/EmbededMap";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";
import { BarChart, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";
import { StationConstituencyTable } from "./StationConstituencies/StationConstituencies";
import { useEffect, useState } from "react";
import React from "react";
import { parse } from "yaml";
import Markdown from "react-markdown";

function Paragraph({ children }: { children: React.ReactNode }) {
    return <p className="my-4 text-justify">{children}</p>
}

function EssayQuote({ children, author }: { children: React.ReactNode, author: string }) {
    return (
        <blockquote className="my-4 p-4 bg-gray-100 border-l-4 border-gray-300 pl-4 italic hover:border-gray-400 transition-all duration-300 hover:scale-105 relative flex flex-col">
            <span className="text-6xl absolute top-0 left-0 text-gray-300">"</span>
            {children}
            <span className="text-sm text-gray-500 mt-4">– {author}</span>
        </blockquote>
    )
}

function EssayChart({ figNum, caption, children, source }: { figNum: number, caption: string, children: React.ReactNode, source?: string }) {
    return <div className="my-4" id={`chart-${figNum}`}>
        <p className="text-md italic text-gray-500 pb-4">Figure {figNum}: {caption}</p>
        {children}
        {source && <p className="text-sm text-gray-500">{source}</p>}
    </div>
}

function EssayImage({ figNum, src, caption, source }: { figNum: number, src: string, caption: string, source?: string }) {
    return <div className="my-4 hover:scale-105 transition-all duration-300" id={`image-${figNum}`}>
        <p className="text-md italic text-gray-500 pb-4">Figure {figNum}: {caption}</p>
        <img src={src} alt={caption} />
        {source && <p className="text-sm text-gray-500">{source}</p>}
    </div>
}

function EssayMap({ figNum, mapboxStyle, caption, source }: { figNum: number, mapboxStyle: string, caption: string, source?: string }) {
    return <div className="my-4 transition-all duration-300 w-full" id={`map-${figNum}`}>
        <p className="text-md italic text-gray-500 pb-4">Figure {figNum}: {caption}</p>
        <div className="h-[80vh] sm:h-[50vh]">
            <EmbededMap mapboxStyle={mapboxStyle} />
        </div>
        {source && <p className="text-sm text-gray-500">{source}</p>}
    </div>
}

function EssayTable({ children, num, caption, source }: { children: React.ReactNode, num: number, caption: string, source?: string }) {
    return <div className="my-4 h-[80vh] sm:h-[50vh]" id={`table-${num}`}>
        <p className="text-md italic text-gray-500 pb-2">Table {num}: {caption}</p>
        <div className="overflow-y-hidden h-[calc(100%-4rem)]">
            {children}
        </div>
        {source && <p className="text-sm text-gray-500">{source}</p>}
    </div>
}

function Footnote({ children, num }: { children: React.ReactNode, num: number }) {
    return (
        <sup className="text-gray-500 relative group">
            <span className="cursor-pointer">{num}</span>
            <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 p-2 rounded shadow-lg w-64 z-10">
                <div className="text-sm text-gray-700">{children}</div>
            </div>
        </sup>
    )
}

function Heading({ children, name, level = 2 }: { children: React.ReactNode, name: string, level: number }) {

    const headingStyle = level === 1 ? 'text-3xl text-primary font-bold mt-16' :
                        level === 2 ? 'text-2xl text-primary font-bold mt-8' :
                        level === 3 ? 'text-xl text-primary font-bold mt-8' :
                        level === 4 ? 'text-lg text-gray-700 font-bold mt-4' :
                        level === 5 ? 'text-md text-gray-700 mt-4' :
                        level === 6 ? 'text-md text-gray-700 italic mt-4' : '';

    return React.createElement(`h${level}`, { className: headingStyle, id: name }, children);
}

function EssayError({ children }: { children: React.ReactNode }) {
    return <div className="my-4 p-4 bg-red-100 border-l-4 border-red-300 pl-4 italic">
        {children}
    </div>
}

// function EssayLink({ to, children, type = 'regular' }: { to: string, children: React.ReactNode, type: 'scroll' | 'regular'}) {

//     const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
//         if (type === 'scroll') {
//         e.preventDefault();
//             const target = document.querySelector(to);
//             if (target) {
//                 target.scrollIntoView({ behavior: 'smooth' });
//             }
//         }
//     };
//     return <a href={to} className="text-blue-500 hover:underline hover:text-gray-500" onClick={handleClick}>{children}</a>
// }

const data = [
    {
        name: '2024',
        Lab: 49.728440,
        Con: 33.166913,
        LD: 15.536331,
        Other: 1.568254,
    },
    {
        name: '2019',
        Lab: 15.172824,
        Con: 83.227097,
        LD: 0.988545,
        Other: 0.611535,
    },
    {
        name: '2017',
        Lab: 23.697468,
        Con: 75.338614,
        LD: 0.726880,
        Other: 0.237038,
    },
    {
        name: '2015',
        Lab: 20.760507,
        Con: 78.403618,
        LD: 0.598837,
        Other: 0.237038,
    },
].reverse();

function GBGraph() {

    const config = {
        Lab: {
            label: 'Labour',
            color: '#dc241f',
        },
        Con: {
            label: 'Conservative',
            color: '#0087dc',
        },
        LD: {
            label: 'Liberal Democrat',
            color: '#fdbb30',
        },
        Other: {
            label: 'Other',
            color: '#808080',
        },
    } satisfies ChartConfig;

    return <ChartContainer className="min-h-[75vh] sm:min-h-[40vh] w-full" config={config}>
        <BarChart data={data} >
            <XAxis dataKey="label" />
            <YAxis domain={[0, 100]} tickFormatter={(value) => `${value.toFixed(0)}%`} ticks={[0, 25, 50, 75, 100]} label={{ value: '% of Green Belt', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => `${(value as number).toFixed(0)}%`} />
            <Legend />
            <Bar dataKey="Lab" stackId="a" fill="var(--color-Lab)"/>
            <Bar dataKey="Con" stackId="a" fill="var(--color-Con)"/>
            <Bar dataKey="LD" stackId="a" fill="var(--color-LD)"/>
            <Bar dataKey="Other" stackId="a" fill="var(--color-Other)" />
        </BarChart>
    </ChartContainer>
}


export function YAMLEssay() {
    
    const [content, setContent] = useState<{ essay: any[]}>({ essay: [] })
    // const contentRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        fetch('/essay.yaml')
            .then(res => res.text())
            .then(text => setContent(parse(text)))
            .catch(err => console.error(err))
    }, [])

    // useEffect(() => {
    //     const smoothScrollToHash = () => {
    //         const hash = window.location.hash;
    //         if (hash && contentRef.current) {
    //             const targetElement = contentRef.current.querySelector(hash);
    //             if (targetElement) {
    //                 setTimeout(() => {
    //                     targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    //                 }, 100);
    //             }
    //         }
    //     };

    //     smoothScrollToHash();
    //     window.addEventListener('hashchange', smoothScrollToHash);

    //     return () => {
    //         window.removeEventListener('hashchange', smoothScrollToHash);
    //     };
    // }, []);

    const availableComponents = {
        GBGraph: GBGraph,
        StationConstituencyTable: StationConstituencyTable,
    }

    const markdownComponents = {
        p(props: any) {
            return <span {...props} />
        },
        a(props: any) {
            return <a {...props} className="text-blue-500 hover:underline"/>
        }
    }

    function parseText(text: string): React.ReactNode {
        const footnoteRegex = /\[\^F:([^\]]+)\]/g;
        return text.split(footnoteRegex).map((part, index) => {
            if (index % 2 === 0) {
                return <Markdown key={index} components={markdownComponents}>{part}</Markdown>;
            } else {
                return <span key={index}><Footnote num={index}>{part}</Footnote> </span>;
            }
        });
    }

    const items: React.ReactNode[] = []
    let figureCount = 0
    let tableCount = 0


    console.log(content.essay)
    content.essay.forEach((item, index) => {
        if (typeof item === 'string') {
            items.push(<Paragraph key={index}>{parseText(item)}</Paragraph>)
            return
        }

        const key = Object.keys(item)[0]
        const value = item[key]

        switch (key) {
            case 'quote':
                items.push(<EssayQuote key={index} author={value.author}>{parseText(value.text)}</EssayQuote>)
                break
            case 'chart':
                if (availableComponents[value.component as keyof typeof availableComponents]) {
                    figureCount++
                    items.push(<EssayChart key={index} figNum={figureCount} caption={value.caption} source={value.source}>
                        {React.createElement(availableComponents[value.component as keyof typeof availableComponents], {})}
                    </EssayChart>)
                } else{
                    items.push(<EssayError key={index}>Component {value.component} not found</EssayError>)
                }
                break
            case 'map':
                figureCount++
                items.push(<EssayMap key={index} figNum={figureCount} mapboxStyle={value.style} caption={value.caption} source={value.source} />)
                break
            case 'table':
                if (availableComponents[value.component as keyof typeof availableComponents]) {
                    tableCount++
                    items.push(<EssayTable key={index} num={tableCount} caption={value.caption} source={value.source}>
                        {React.createElement(availableComponents[value.component as keyof typeof availableComponents], {})}
                    </EssayTable>)
                } else{
                    items.push(<EssayError key={index}>Component {value.component} not found</EssayError>)
                }
                break
            case 'image':
                figureCount++
                items.push(<EssayImage key={index} figNum={figureCount} src={value.src} caption={value.caption} source={value.source} />)
                break
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6':
                items.push(<Heading key={index} name={value.name} level={key.charCodeAt(1) - 48}>{parseText(value)}</Heading>)
                break
            default:
                items.push(<EssayError key={index}>Component {key} not found</EssayError>)
        }
    })

    return (
        <div className="container mx-auto px-4 max-w-4xl py-16 border-b border-gray-200 mb-16 border-x-2 sm:px-16">
            {items}
        </div>
    );
}

