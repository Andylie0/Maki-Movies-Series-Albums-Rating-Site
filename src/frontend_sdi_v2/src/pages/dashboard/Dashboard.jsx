import MakiLogo from "../../assets/MAKI.png";
import ProfileIcon from "../../assets/profile_img.png";
import {useNavigate} from "react-router-dom";
import {useState} from "react";
import {BASE_URL, WB_URL} from "../../config.js";
import Cookie from "js-cookie";
import './Dashboard.css'
import ArrowGif from "../../assets/ffs.gif";
import funnyGhost from "../../assets/ghost1gif.gif";
import ritsu from "../../assets/ritsuFloating.gif";
import quentin from "../../assets/quentin.png";
import About from "../landing_page/About.jsx";
import Chat from "../landing_page/Chat.jsx";
import { IoIosClose } from "react-icons/io";

export function NotLoggedIn({onClose}){
    return(
        <div className="not-logged-in">
            <div className="suggestive">
                <h1>You are not logged in!</h1>
                <p>Please log in to access this page.</p>
            </div>
            <div className="x-close">
                <button className="x-button" onClick={onClose}><IoIosClose size={30} /></button>
            </div>
        </div>
    )
}


export default function Dashboard({allMovies, isLoggedIn}){
    const navigate = useNavigate();

    const [showPopup, setShowPopup] = useState(true);
    const [showArrow, setShowArrow] = useState(false);
    const [activePage, setActivePage] = useState("")
    const [searchInput, setSearchInput] = useState("");
    const [activeTab, setActiveTab] = useState("");
    const [triedToChangeTab, setTriedToChangeTab] = useState(false);

    function handleSearchNav() {
        const movie = allMovies.find(movie => movie.name.toLowerCase().includes(searchInput.toLowerCase()))
        if(movie){
            setSearchInput("");
            navigate(`/details/${movie.id}`)
        }
    }

    function handleJournal(){
        if(isLoggedIn === false) {
            setTriedToChangeTab(true);
            setShowPopup(true);
        }
        else {
            setActivePage("journal");
            Cookie.set('activeTab', "table", {expires: 7});
            navigate("/journal");
        }
    }

    function handleWatchlist(){
        if(isLoggedIn === false) {
            setTriedToChangeTab(true);
            setShowPopup(true);
        }
        else {
            setActivePage("watchlist");
            Cookie.set('activeTab', "table", {expires: 7});
            navigate("/watchlist");
        }
    }


    function handleTabChange(tab){
        if(tab === "about"){
            return(<About/>)
        }
        else if(tab === "chat"){
            return(<Chat/>)
        }
    }

    function gifArrow(){
        return(
            <img className="arrow" src={ArrowGif} alt="arrowgif"/>
        )
    }

    const suggestions = searchInput.length > 0
        ? allMovies.filter(m =>
            m.name.toLowerCase().includes(searchInput.toLowerCase())
        ).slice(0, 3)
        : []

    return (
        <div className="dashboard-container">
            <header className="app-header">
                <img src = {MakiLogo} alt= "logo_maki" className="logo-maki" />
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
                        onClick={() =>  {handleWatchlist();}}>Watchlist</button>
                {isLoggedIn && (
                    <img src ={ProfileIcon} alt= "user_icon" className="user-icon"/>
                )}
                {!isLoggedIn && (
                    <button className="get-started-button" onClick={() => navigate('/login')}>Get Started!</button>
                )}
            </header>
            {showPopup && triedToChangeTab && <NotLoggedIn onClose={() => setShowPopup(false)}/>}
            <div className="dashboard-content">
                <blockquote className="about-quote">“Knicks in four.”</blockquote>
                <div className="trivia">
                    <p>Try our daily timeline trivia game, to see your knowledge in albums, shows or movies!</p>
                    <button className="trivia-button" onMouseOver={() => setShowArrow(true)}
                            onMouseOut={() => setShowArrow(false)}
                            onClick={() => navigate('/trivia')}>Play
                    </button>
                </div>
                <div className="sma-showcase">
                    <p className="pop">Popular on Maki</p>
                    <div className="line1"></div>
                    <div className="sma-showcase-grid">
                        {allMovies.slice(2, 9).map(movie => {
                                return (
                                    <img key={movie.id} src={movie.image} alt={movie.name} className="sma-showcase-image"
                                         onClick={() => navigate(`/details/${movie.id}`)}
                                    />
                                )
                            }
                        )}
                    </div>
                </div>
                <div className="about-chat">
                    <button className={`about-act ${activeTab === "about" ? "active" : ""}`}
                            onClick={() => setActiveTab("about")}>About
                    </button>
                    <button className={`chat-act ${activeTab === "chat" ? "active" : ""}`}
                            onClick={() => {
                                setActiveTab("chat")
                            }}>Chat
                    </button>
                </div>
                {handleTabChange(activeTab)}
                {showArrow && gifArrow()}
            </div>
            <div className="utils">
                <img className="ghost1" src={funnyGhost} alt="ghost"/>
                <img className="ritsu" src={ritsu} alt="ritsu"/>
                <img className="quentin" src={quentin} alt="quentin"/>
                <span className="laser1"></span>
                <span className="laser2"></span>
            </div>

        </div>
    )
}