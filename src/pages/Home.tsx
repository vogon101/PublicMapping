import { Link } from "react-router-dom";
import "../style/Home.css";
import psqmThumbnail from "../assets/Pricemap.png";
// import greenBeltThumbnail from "../assets/GBMap.png";

function Home() {
    return (
        <div className="home-page">
            <h1>YIMBY Alliance Maps</h1>
            <div className="map-list">
                <Link to="/psqm" className="map-list-item">
                    <img src={psqmThumbnail} alt="House prices per square metre" className="map-thumbnail" />
                    <div className="map-description">
                        <h2>2023 house prices per square metre</h2>
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
                <h3>More coming soon...</h3>
            </div>
        </div>
    )
}

export default Home;