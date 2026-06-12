import MakiLogo from "../../assets/MAKI.png";
import ProfileIcon from "../../assets/profile_img.png";
import './Statistics.css'
import {useState, useEffect} from "react";
import ParticlesBackground from './Particles.jsx'
import {useNavigate} from "react-router-dom";
import {BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import Cookie from "js-cookie";
import { ResponsiveContainer } from 'recharts'
import {BASE_URL} from "../../config.js";
import {IoIosLogOut} from "react-icons/io";

const ALL_RATINGS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export default function Statistics({allReviews, allMovies, setIsLoggedIn}) {
    const nav = useNavigate();
    const [activePage, setActivePage] = useState("journal")
    const [activeTab, setActiveTab] = useState(Cookie.get("activeTab") || "stats")
    const [searchInput, setSearchInput] = useState("");


    const storedUser = JSON.parse(localStorage.getItem('user'));
    const userId = storedUser?.id;
    const imageUser = JSON.parse(localStorage.getItem('user'))?.image;

    const [open, setOpen] = useState(false);

    //State for server-calculated statistics
    const [statsData, setStatsData] = useState({
        total_reviews: 0,
        rating_distribution: [],
        type_distribution: []
    });

    useEffect(() => {

        if (!userId) return;

        const fetchStats = async () => {
            try {
                const response = await fetch(`${BASE_URL}/movies/statistics?user_id=${userId}`);
                const data = await response.json();
                setStatsData(data);
            } catch (error) {
                console.error("Failed to fetch statistics:", error);
            }
        };
        fetchStats();
    }, []);

    const paddedRatingDistribution = ALL_RATINGS.map(rating => {
       const existingData =  statsData.rating_distribution.find(d => d.rating === rating);
       return {
           rating: rating,
           count: existingData ? existingData.count : 0
       }
    });

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const { name, value } = payload[0];
            const total = statsData.total_reviews;
            const percent = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
            return (
                <div className="custom-tooltip">
                    <p>{name}: {value}, {percent}%</p>
                </div>
            );
        }
        return null
    }

    function handleSearchNav() {
        const movie = allMovies.find(movie => movie.name.toLowerCase().includes(searchInput.toLowerCase()))
        if(movie)
            nav(`/details/${movie.id}`)
    }

    const COLORS = ['#C0522A', '#C98B1F', '#FFCE27']

    function handleTable(){
        nav("/journal");
    }

    function handleDashboard(){
        nav("/");
    }

    function handleTabChange(tab){
        setActiveTab(tab);
        Cookie.set('activeTab', tab, { expires: 7 });
    }

    const suggestions = searchInput.length > 0
        ? allMovies.filter(m =>
            m.name.toLowerCase().includes(searchInput.toLowerCase())
        ).slice(0, 3)
        : []

    async function handleLogout(){
        try {
            const response = await fetch(`${BASE_URL}/auth/logout/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            if (response.ok) {
                localStorage.removeItem('user');
                setIsLoggedIn(false);
                nav('/');
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
        <div className="stats">
            <ParticlesBackground colour="#EB4144"/>
            <header className="stats-header">
                <img src = {MakiLogo} alt= "logo_maki" className="logo-maki" onClick={() => handleDashboard()} />
                <div className="search-bar">
                    <input type="text" placeholder="Search..." className="search-input"
                           onChange={(e) => setSearchInput(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleSearchNav()}
                    />
                    <button className="search-icon" onClick={handleSearchNav}>🔍︎</button>

                    {suggestions.length > 0 && (
                        <div className="search-dropdown">
                            {suggestions.map(movie => (
                                <div key={movie.id} className="search-suggestion"
                                     onClick={() => {
                                         setSearchInput("")
                                         nav(`/details/${movie.id}`)
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
                        onClick={() => setActivePage("journal")}>Journal</button>
                <button className={`watchlist-button-header ${activePage === "watchlist" ? "active" : ""}`}
                        onClick={() => {setActivePage("watchlist"); nav('/watchlist'); } }>Watchlist</button>
                <img src ={imageUser !== "null" ? imageUser : ProfileIcon} alt= "user_icon" className="user-icon" onClick={()=>setOpen(!open)}/>
            </header>

            {open && (
                <div className="dropdown">
                    <button className="dropdown-item profile-action">Change profile picture!</button>
                    <hr className="dropdown-divider" />
                    <button className="dropdown-item logout"><IoIosLogOut size={20} onClick ={()=>handleLogout()}/> Logout!</button>
                </div>
            )}
            <main>
                <div className="button-section">
                    <button className={`table-button ${activeTab === "table" ? "active" : ""}`}
                            onClick={() =>{ handleTabChange("table"); handleTable()}}>Table</button>
                    <button className={`stats-button ${activeTab === "stats" ? "active" : ""}`}
                            onClick={() => {handleTabChange("stats")}}>Statistics</button>
                </div>

                <div className="rating-distribution">
                    <p>Rating distribution</p>
                    <p>{allReviews.length}</p>
                </div>

                <div className="charts-container">
                    <div className="bar-chart-wrapper">
                        <span className="star-label">★</span>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={paddedRatingDistribution} margin={{ top: 20, right: 0, left: 0, bottom: 10 }}>
                                <XAxis dataKey="rating" axisLine={{ stroke: '#ffffff', strokeWidth : 2}} tickLine={false} tick={false}/>
                                <YAxis hide={true} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#E2AC17"  radius={[6, 6, 6, 6]}
                                     stroke="#000000"
                                     strokeWidth={2}
                                     minPointSize={15}/>
                            </BarChart>
                        </ResponsiveContainer>
                        <span className="star-label">★★★★★</span>
                    </div>

                    <PieChart width={600} height={400}>
                        <Pie
                            data={statsData.type_distribution}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={150}
                            stroke = "none"
                        >
                            {statsData.type_distribution.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={CustomTooltip} />
                    </PieChart>
                </div>
            </main>
        </div>
    )
}