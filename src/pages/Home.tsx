import { Link } from "react-router-dom";

function Home() {
    return (
        <div>
            <h1>YIMBY Alliance Maps</h1>
            <ul>
                <li>
                    <Link to="/psqm">2023 house prices per square metre</Link>
                </li>
                <li>
                    <Link to="/green-belt-election">Who represents the Green Belt?</Link>
                </li>
            </ul>
        </div>
    )
}

export default Home;