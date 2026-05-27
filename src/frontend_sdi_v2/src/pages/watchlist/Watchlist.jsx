import MakiLogo from "../../assets/MAKI.png";
import ProfileIcon from "../../assets/profile_img.png";
import {useNavigate} from "react-router-dom";
import {useState} from "react";
import {BASE_URL, WB_URL} from "../../config.js";
import './Watchlist.css'
import Cookie from "js-cookie";

export default function Watchlist({allMovies}){

    const navigate = useNavigate();

    const [activePage, setActivePage] = useState("watchlist")
    const [searchInput, setSearchInput] = useState("");

    function handleSearchNav() {
        const movie = allMovies.find(movie => movie.name.toLowerCase().includes(searchInput.toLowerCase()))
        if(movie){
            setSearchInput("");
            navigate(`/details/${movie.id}`)
        }
    }

    function handleJournal(){
        setActivePage("journal");
        Cookie.set('activeTab', "table", { expires: 7 });
        navigate("/journal");
    }

    function handleAbout(){
        navigate("/about");
    }

    const suggestions = searchInput.length > 0
        ? allMovies.filter(m =>
            m.name.toLowerCase().includes(searchInput.toLowerCase())
        ).slice(0, 3)
        : []


    return(
        <div className="watchlist-container">
            <header className="app-header">
                <img src = {MakiLogo} alt= "logo_maki" className="logo-maki" onClick={() => handleAbout()} />
                <div className="search-bar">
                    <input type="text" placeholder="Search..." className="search-input"
                           onChange={(e) => setSearchInput(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleSearchNav()}
                    />
                    <button className="search-icon" onClick={() => handleSearchNav()}>🔍︎</button>

                    {suggestions.length > 0 && (
                        <div className="search-dropdown">
                            {suggestions.map(movie => (
                                <div key={movie.id} className="search-suggestion"
                                     onClick={() => {
                                         setSearchInput("")
                                         navigate(`/details/${movie.id}`)
                                     }}>
                                    <img src={movie.image} alt={movie.name} />
                                    <div>
                                        <p className="suggestion-name">{movie.name}</p>
                                        <p className="suggestion-year">{movie.year_released}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <button className={`journal-button-header ${activePage ==="journal" ? "active" : ""}`}
                        onClick={() => handleJournal()}>Journal</button>
                <button className={`watchlist-button-header ${activePage === "watchlist" ? "active" : ""}`}
                        onClick={() => setActivePage("watchlist")}>Watchlist</button>
                <img src ={ProfileIcon} alt= "user_icon" className="user-icon"/>

            </header>
            <div className="watchlist-content">
                <div className="first-square" />
                <h1 className="nothing-implementedlolol">Hippie SHIT!!!</h1>
                <div className="second-square" />
            </div>
        </div>
    );
}