import EmbededMap from "@/components/EmbededMap";
import { ResponsiveContainer } from "recharts";
import { BarChart, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";
import { StationConstituencyTable } from "./StationConstituencies/StationConstituencies";

function Paragraph({ children }: { children: React.ReactNode }) {
    return <p className="my-4 text-justify">{children}</p>
}

function PullQuote({ children, author }: { children: React.ReactNode, author: string }) {
    return (
        <blockquote className="my-4 p-4 bg-gray-100 border-l-4 border-gray-300 pl-4 italic hover:border-gray-400 transition-all duration-300 hover:scale-105 relative flex flex-col">
            <span className="text-6xl absolute top-0 left-0 text-gray-300">“</span>
            {children}
            <span className="text-sm text-gray-500 mt-4">– {author}</span>
        </blockquote>
    )
}

function ChartContainer({ figNum, chart, caption }: { figNum: number, chart: React.ReactNode, caption: string }) {
    return <div className="my-4">
        <p className="text-md italic text-gray-500 pb-4">Figure {figNum}: {caption}</p>
        {chart}
    </div>
}

function ImageContainer({ figNum, src, caption }: { figNum: number, src: string, caption: string }) {
    return <div className="my-4 hover:scale-105 transition-all duration-300" >
        <p className="text-md italic text-gray-500 pb-4">Figure {figNum}: {caption}</p>
        <img src={src} alt={caption} />
    </div>
}

function MapContainer({ figNum, mapboxStyle, caption }: { figNum: number, mapboxStyle: string, caption: string }) {
    return <div className="my-4 transition-all duration-300 w-full">
        <p className="text-md italic text-gray-500 pb-4">Figure {figNum}: {caption}</p>
        <div className="h-[80vh] sm:h-[50vh]">
            <EmbededMap mapboxStyle={mapboxStyle} />
        </div>
    </div>
}

function TableContainer({ children, num, caption }: { children: React.ReactNode, num: number, caption: string }) {
    return <div className="my-4 h-[80vh] sm:h-[50vh] overflow-hidden">
        <p className="text-md italic text-gray-500 pb-4">Table {num}: {caption}</p>
        {children}
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
    return <ResponsiveContainer width="100%" height={window.innerHeight * 0.3}>
        <BarChart data={data} >
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} tickFormatter={(value) => `${value.toFixed(0)}%`} ticks={[0, 25, 50, 75, 100]} label={{ value: '% of Green Belt', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => `${(value as number).toFixed(0)}%`} />
            <Legend />
            <Bar dataKey="Lab" stackId="a" fill="#dc241f" name="Labour" />
            <Bar dataKey="Con" stackId="a" fill="#0087dc" name="Conservative" />
            <Bar dataKey="LD" stackId="a" fill="#fdbb30" name="Liberal Democrat" />
            <Bar dataKey="Other" stackId="a" fill="#808080" name="Other" />
        </BarChart>
    </ResponsiveContainer>
}

export default function Essay() {

    return (
        <div className="container mx-auto px-4 max-w-4xl py-16 border-b border-gray-200 mb-16 border-x-2 sm:px-16">
            <div className="flex justify-center">
                <div className="w-full">
                    <div className="flex flex-col justify-center">
                        <h1 className="text-3xl font-bold">Building homes huh?</h1>
                        <p className="text-sm text-gray-500">By Freddie Poser</p>
                    </div>
                    <Paragraph>Lorem ipsum dolor sit amet<Footnote num={1}>This is a footnote</Footnote>, consectetur adipiscing elit. Phasellus rhoncus velit lectus, sed tincidunt lacus semper id. Donec fermentum est quis ligula facilisis laoreet. Fusce tortor risus, facilisis eget ultrices quis, porttitor id sapien. Integer malesuada ut urna sit amet laoreet. Maecenas sed porttitor leo, a lobortis turpis. Mauris iaculis euismod tortor, nec ultricies mi euismod sit amet. Donec porttitor ultrices urna. Sed et justo ac erat commodo tempus sed fermentum ante. Integer id mattis sapien. Sed a sapien vehicula eros tincidunt pharetra ac a mauris. Integer egestas ipsum purus, quis tincidunt libero luctus sit amet. Suspendisse ante quam, molestie at ligula quis, lobortis feugiat erat. Nulla bibendum lobortis sem. Proin aliquet, massa id tincidunt sollicitudin, dui nisi finibus velit, vel gravida nibh lectus sit amet justo.</Paragraph>

                    <PullQuote author="Julius Caesar">Nunc hendrerit nunc sed eleifend iaculis. Phasellus consectetur mauris dui, sit amet luctus sem tempus in. Pellentesque luctus urna et ex dapibus ultrices. Nunc semper iaculis risus nec facilisis. Sed pellentesque nec nisl in fermentum. Nunc vitae condimentum ex. Suspendisse dapibus in enim non aliquet. Morbi non vulputate massa. Proin augue massa, consequat sit amet viverra sit amet, semper hendrerit elit. Donec ac arcu aliquet, volutpat leo vitae, laoreet neque. Quisque sit amet nisi rhoncus, feugiat libero blandit, semper libero. Sed eu dapibus mi, at laoreet leo.</PullQuote>

                    <ChartContainer figNum={1} chart={<GBGraph />} caption="The percentage of Green Belt in each constituency, by election year" />

                    <MapContainer figNum={2} mapboxStyle="mapbox://styles/freddie-yimby/cm1j6efpa00ks01qp3wfrf6in/draft" caption="Embeded maps!" />

                    <ImageContainer figNum={3} src="/images/Pres.png" caption="Prediction market" />

                    <h2 className="text-2xl font-bold mt-16">Conclusion</h2>

                    <Paragraph>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus rhoncus velit lectus, sed tincidunt lacus semper id. Donec fermentum est quis ligula facilisis laoreet. Fusce tortor risus, facilisis eget ultrices quis, porttitor id sapien. Integer malesuada ut urna sit amet laoreet. Maecenas sed porttitor leo, a lobortis turpis. Mauris iaculis euismod tortor, nec ultricies mi euismod sit amet. Donec porttitor ultrices urna. Sed et justo ac erat commodo tempus sed fermentum ante. Integer id mattis sapien. Sed a sapien vehicula eros tincidunt pharetra ac a mauris. Integer egestas ipsum purus, quis tincidunt libero luctus sit amet. Suspendisse ante quam, molestie at ligula quis, lobortis feugiat erat. Nulla bibendum lobortis sem. Proin aliquet, massa id tincidunt sollicitudin, dui nisi finibus velit, vel gravida nibh lectus sit amet justo.</Paragraph>

                    <TableContainer num={1} caption="The percentage of Green Belt in each constituency, by election year">
                        <StationConstituencyTable />
                    </TableContainer>

                </div>
            </div>
        </div>
    )

}