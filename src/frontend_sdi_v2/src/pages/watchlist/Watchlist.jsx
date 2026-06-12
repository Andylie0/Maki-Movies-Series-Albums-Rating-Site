import MakiLogo from "../../assets/MAKI.png";
import ProfileIcon from "../../assets/profile_img.png";
import {useNavigate} from "react-router-dom";
import {useState, React, useEffect} from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import DVDLogoAnimation from "react-dvd-player-animation";
import {BASE_URL, WB_URL} from "../../config.js";
import { IoBookmark } from "react-icons/io5";
import './Watchlist.css'
import Cookie from "js-cookie";
import {IoIosLogOut} from "react-icons/io";

function MyDVD() {
    const HEIGHT = 90;
    const WIDTH = 180;

    return (
        <div
            style={{
                height: `${HEIGHT}vh`,
                width: `${WIDTH}vh`,
                border: "5px solid transparent",
                margin: "auto",
                zIndex: 1,
                position: "absolute",
                pointerEvents: "none",
                overflow: "hidden",
            }}
        >
            <DVDLogoAnimation
                height={800}
                width={1700}
                logoHeight={20}
                logoWidth={160}
                xSpeed={1.5}
                ySpeed={1.5}
            >
            </DVDLogoAnimation>
        </div>
    );
}

export default function Watchlist({allMovies, setIsLoggedIn}){
    const navigate = useNavigate();

    const [watchlist, setWatchlist] = useState([]);
    const storedUser = JSON.parse(localStorage.getItem('user')) || null;
    const userId = storedUser.id;
    const imageUser = JSON.parse(localStorage.getItem('user'))?.image;
    const [open, setOpen] = useState(false);

    const [activePage, setActivePage] = useState("watchlist")
    const [searchInput, setSearchInput] = useState("");

    async function fetchWatchlist() {
        const response = await fetch(`${BASE_URL}/watchlist/?user_id=${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', },
            credentials: 'include',
        });
        if (!response.ok) {
            throw new Error('Failed to fetch watchlist');
        }
        const data = await response.json();
        setWatchlist(data);
    }

    useEffect(() => {
        fetchWatchlist();
    }, []);

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

    function handleDashboard(){
        navigate("/");
    }

    const suggestions = searchInput.length > 0
        ? allMovies.filter(m =>
            m.name.toLowerCase().includes(searchInput.toLowerCase())
        ).slice(0, 3)
        : []

    async function handleDelete(id){
        const response = await fetch(`${BASE_URL}/watchlist/${id}?user_id=${userId}`, {
            method: 'DELETE',
            credentials: "include",
        })
        if (response.ok) {
            fetchWatchlist();
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
                navigate('/');
                setIsLoggedIn(false);
                Cookie.remove('user');
                setOpen(false);
            } else {
                console.error('Logout failed on server:', response.statusText);
                alert('Failed to log out. Please try again.');
            }
        } catch (error) {
            console.error('Network error during logout:', error);
        }
    }

    return(
        <div className="watchlist-container">
            <header className="app-header">
                <img src = {MakiLogo} alt= "logo_maki" className="logo-maki" onClick={() => handleDashboard()} />
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
                <img src ={imageUser !== "null" ? imageUser : ProfileIcon} alt= "user_icon" className="user-icon" onClick={()=>setOpen(!open)}/>
            </header>
            {open && (
                <div className="dropdown">
                    <button className="dropdown-item profile-action">Change profile picture!</button>
                    <hr className="dropdown-divider" />
                    <button className="dropdown-item logout" onClick ={()=>handleLogout()}><IoIosLogOut size={20}/> Logout!</button>
                </div>
            )}
            <MyDVD />
            <main className="watchlist-main">
                <div className="watchlist-title">
                    <h1 className="tilte"> <IoBookmark size={30} /> Your watchlist</h1>
                    <span className="line2" />
                </div>
                <div className="watchlist-content">
                    {watchlist.length === 0 ? (
                        <div className="empty-watchlist">
                            <p>Your watchlist is empty!</p>
                        </div>
                    ) : (
                        <div className="watchlist-grid">
                            {watchlist.map(w => {
                                const movie = allMovies.find(m => m.id === w.movie_id);
                                if(!movie)
                                {
                                    return null;
                                }
                                return(
                                    <div key={w.id} className="watchlist-item">
                                        <div className="image-wrapper" onClick={() => navigate(`/details/${movie.id}`)}>
                                            <img className="movie-image" src={movie.image} alt={movie.name} />
                                        </div>
                                        <div className="movie-info">
                                            <p className="movie-name" onClick={() => navigate(`/details/${movie.id}`)}>
                                                {movie.name}</p>
                                            <button className="trash-button" onClick={() => handleDelete(w.id)} aria-label="Delete item">
                                                <FaRegTrashAlt size={20} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}