import MakiLogo from "../../assets/MAKI.png";
import ProfileIcon from "../../assets/profile_img.png";
import {useNavigate} from "react-router-dom";
import {useState,useMemo} from "react";
import {BASE_URL, WB_URL} from "../../config.js";
import Cookie from "js-cookie";
import './Dashboard.css'
import ArrowGif from "../../assets/ffs.gif";
import funnyGhost from "../../assets/ghost1gif.gif";
import ritsu from "../../assets/ritsuFloating.gif";
import quentin from "../../assets/quentin.png";
import depeche from "../../assets/depeche-mode-dm_6901717188356476_dr.gif";
import About from "../landing_page/About.jsx";
import Chat from "../landing_page/Chat.jsx";
import { FiX } from "react-icons/fi";
import { IoIosLogOut } from "react-icons/io";
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


export default function Dashboard({allMovies, isLoggedIn, setIsLoggedIn}){
    const navigate = useNavigate();

    let user_id, imageUser,storedUser;

    if(Cookie.get('user')){
        storedUser = JSON.parse(Cookie.get('user')) || null;
        user_id = storedUser?.id;
        setIsLoggedIn(true);
        imageUser = JSON.parse(Cookie.get('user'))?.image;
    }

    const [open, setOpen] = useState(false);
    const [showPopup, setShowPopup] = useState(true);
    const [showArrow, setShowArrow] = useState(false);
    const [activePage, setActivePage] = useState("")
    const [searchInput, setSearchInput] = useState("");
    const [activeTab, setActiveTab] = useState("");
    const [triedToChangeTab, setTriedToChangeTab] = useState(false);

    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [imageUrlInput, setImageUrlInput] = useState("");

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

    async function handleLogout(){
        try {
            const response = await fetch(`${BASE_URL}/auth/logout/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            if (response.ok) {
                localStorage.removeItem('user');
                alert('Logged out successfully!');
                Cookie.remove('user');
                setIsLoggedIn(false);
                setOpen(false);
            } else {
                console.error('Logout failed on server:', response.statusText);
                alert('Failed to log out. Please try again.');
            }
        } catch (error) {
            console.error('Network error during logout:', error);
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

    const handleUpdateImageSubmit = async (e) => {
        e.preventDefault();
        if (!imageUrlInput.trim()) return;

        try {
            const response = await fetch(`${BASE_URL}/auth/change-picture/?user_id=${user_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ image: imageUrlInput.trim() })
            });

            if (response.ok) {
                const updatedUser = { ...storedUser, image: imageUrlInput.trim() };
                localStorage.setItem("user", JSON.stringify(updatedUser));

                alert("Profile image updated successfully!");
                setIsImageModalOpen(false);
                setOpen(false);
            } else {
                alert("Failed to update profile image.");
            }
        } catch (error) {
            console.error("Error updating profile image:", error);
        }
    };

    const suggestions = searchInput.length > 0
        ? allMovies.filter(m =>
            m.name.toLowerCase().includes(searchInput.toLowerCase())
        ).slice(0, 3)
        : []

    const randomShowcaseSMA = useMemo(() => {
        const shuffled = [...allMovies];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, 7);
    }, [allMovies]);

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
                {isLoggedIn ? (
                    <img src ={imageUser !== "null" ? imageUser : ProfileIcon} alt= "user_icon" className="user-icon" onClick={()=> setOpen(!open)}/>
                ) : (
                    <button className="get-started-button" onClick={() => navigate('/login')}>Get Started!</button>
                )}

            </header>
            {open && (
                <div className="dropdown">
                    <button className="dropdown-item profile-action" onClick={()=>setIsImageModalOpen(true)}>Change profile picture</button>
                    <hr className="dropdown-divider" />
                    <button className="dropdown-item logout" onClick={()=>handleLogout(user_id)}><IoIosLogOut size={20}/> Logout</button>
                </div>
            )}
            {showPopup && triedToChangeTab && <NotLoggedIn onClose={() => setShowPopup(false)}/>}
            {isImageModalOpen && (
                <div className="avatar-modal-overlay" onClick={() => setIsImageModalOpen(false)}>
                    <div className="avatar-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="avatar-modal-close" onClick={() => setIsImageModalOpen(false)} aria-label="Close">
                            <FiX size={20} />
                        </button>
                        <h2>Profile Image</h2>
                        <p className="avatar-modal-subtitle">Paste the direct link to your new avatar image below.</p>
                        <form onSubmit={handleUpdateImageSubmit}>
                            <input
                                type="url"
                                className="avatar-link-input"
                                placeholder="https://example.com/image.jpg"
                                value={imageUrlInput}
                                onChange={(e) => setImageUrlInput(e.target.value)}
                                required
                            />
                            <button type="submit" className="avatar-submit-button">
                                Submit
                            </button>
                        </form>
                    </div>
                </div>
            )}
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
                        {randomShowcaseSMA.map(movie => {
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
                <div className="quentin-wrapper">
                    <img className="quentin" src={quentin} alt="quentin"/>
                    <div className="laser1"></div>
                    <div className="laser2"></div>
                </div>
                <img className="depeche" src={depeche} alt="depeche"/>
            </div>

        </div>
    )
}