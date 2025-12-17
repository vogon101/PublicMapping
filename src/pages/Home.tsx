import { Link } from "react-router-dom";
import psqmThumbnail from "../assets/Pricemap.png";
import psqmRentThumbnail from "../assets/Rentmap.png";
// import greenBeltThumbnail from "../assets/GBMap.png";

function Home() {
    return (
        <div className="flex flex-col items-center h-screen w-screen pt-[10vh]">
            <h1 className="mb-0 font-black">YIMBY Alliance Maps</h1>
            <div className="flex flex-col items-center justify-start max-w-full p-5">
                <Link to="/psqm" className="flex flex-col items-center md:flex-row md:items-start p-5 my-5 border border-black rounded no-underline text-inherit transition-all duration-300 ease-in-out hover:bg-gray-100 hover:scale-[1.02] w-[calc(100%-40px)] max-w-[850px]">
                    <img src={psqmThumbnail} alt="House prices per square metre" className="self-center w-full md:w-[300px] md:h-[200px] max-w-[300px] h-auto object-cover mb-[5px] md:mr-[5px] md:mb-0 rounded shadow-md" />
                    <div className="flex flex-col items-center md:items-start text-center md:text-left w-full ml-5">
                        <h2 className="mb-0 font-bold">2023 house prices per square metre</h2>
                        <p>
                        It's obvious that the price of a home varies massively from place to place, but simply comparing the average cost of properties sold can hide some major differences –
                        particularly in the size of each home.
                        </p>
                        <p>
                        The average cost of a home in London is £520,000 whilst in the North East it's £160,000, but the place in London is also much more likely to be smaller.
                        What's much more important is the price per square metre – how much space you get for your money. This varies wildly across the country, as shown in this interactive map.
                        </p>
                    </div>
                </Link>
                <Link to="/psqm-rents" className="flex flex-col items-center md:flex-row md:items-start p-5 my-5 border border-black rounded no-underline text-inherit transition-all duration-300 ease-in-out hover:bg-gray-100 hover:scale-[1.02] w-[calc(100%-40px)] max-w-[850px]">
                    <img src={psqmRentThumbnail} alt="House prices per square metre" className="self-center w-full md:w-[300px] md:h-[200px] max-w-[300px] h-auto object-cover mb-[5px] md:mr-[5px] md:mb-0 rounded shadow-md" />
                    <div className="flex flex-col items-center md:items-start text-center md:text-left w-full ml-5">
                        <h2>2025 rents per square metre</h2>
                        <p>
                        If you rent, you probably don’t think in square metres. You think about how many bedrooms and space you can actually get for your monthly budget.
                        </p>
                        <p>
                        Take £1,500 a month. In parts of the North East or Wales, that might comfortably cover a three-bedroom flat. In Westminster or Kensington, it may barely stretch to a small one-bed. The cost is the same; the amount of space is not.
                        </p>
                        <p>
                        We've built a new dataset and interactive map of median rent per square metre for every local authority in England and Wales. It lets us see something that usually stays hidden behind headline rents: the local price of space.
                        </p>
                    </div>
                </Link>
                {/* Hidden until launch */}
                {/* <Link to="/green-belt-election" className="map-list-item">
                    <img src={greenBeltThumbnail} alt="Green Belt election map" className="map-thumbnail" />
                    <div className="map-description">
                        <h2>Who represents the Green Belt?</h2>
                        <p>
                            Who represents the Green Belt? This map shows which parties represent constituencies in the Green Belt in England. It covers the elections from 2015 to 2024.
                        </p>
                    </div>
                </Link> */}
            </div>
        </div>
    )
}

export default Home;