import MakiLogo from "../../assets/MAKI.png";
import ProfileIcon from "../../assets/profile_img.png";
import {useNavigate} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import './About.css'
import '../master_view/Journal.css'
import Cookie from 'js-cookie'
import {BASE_URL, WB_URL} from "../../config.js";

export default function About({allMovies}) {

    const navigate = useNavigate();

    const isAdmin = JSON.parse(localStorage.getItem('user'))?.role === "admin";

    const [activePage, setActivePage] = useState("")
    const [searchInput, setSearchInput] = useState("");

    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const chatEndRef = useRef(null);
    const storedUser = JSON.parse(localStorage.getItem('user')) || { username: "Guest" };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        fetch(`${BASE_URL}/chat/history`)
            .then(res => res.json())
            .then(data => setMessages(data || []))
            .catch(err => console.error("NoSQL History Error:", err));

        const socket = new WebSocket(`${WB_URL}/ws`);

        socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === "CHAT_MESSAGE") {
                setMessages(prev => [...prev, msg.data]);
            }
        };

        return () => socket.close();
    }, []);

    const sendChatMessage = async (overrideText = null) => {
        const messageToSend = overrideText || chatInput;

        if(!messageToSend.trim)
            return;

        const payload = {
            username: storedUser.username,
            text: messageToSend
        };
        try {
            await fetch(`${BASE_URL}/chat/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                body: JSON.stringify(payload)
            });
            setChatInput("");
        } catch (error) {
            console.error("Chat Send Error:", error);
        }
    };

    function handleSearchNav() {
        const movie = allMovies.find(movie => movie.name.toLowerCase().includes(searchInput.toLowerCase()))
        if(movie)
            navigate(`/details/${movie.id}`)
    }

    function handleJournal(){
        setActivePage("journal");
        Cookie.set('activeTab', "table", { expires: 7 });
        navigate("/journal");
    }

    function handleWatchlist(){
        setActivePage("watchlist");
        Cookie.set('activeTab', "table", { expires: 7 });
        navigate("/watchlist");
    }

    const suggestions = searchInput.length > 0
        ? allMovies.filter(m =>
            m.name.toLowerCase().includes(searchInput.toLowerCase())
        ).slice(0, 3)
        : []

    return(
        <div className="about">
            <header className="app-header">
                <img src = {MakiLogo} alt= "logo_maki" className="logo-maki"/>
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
                        onClick={() => handleWatchlist()}>Watchlist</button>
                <img src ={ProfileIcon} alt= "user_icon" className="user-icon"/>
            </header>

            <main className="about-content">
                <h1 className="about-title">About us</h1>

                <p className="about-description">
                    <strong>Maki</strong> - Movie + Series + Albums Rating Application
                </p>

                <blockquote className="about-quote">“Listen to your soul.”</blockquote>

                <p className="about-text">
                    An easy to use app, where the user has a special place
                    to rate their favourite movies/series/albums
                    and to see their friends interests also.
                </p>

                {isAdmin && (
                    <div className="admin-controls">
                        <button className="admin-button" onClick={() => sendChatMessage("WASSUP EVERYONE!!")}>WASSUP!!</button>
                    </div>
                )}
            </main>
            <div className="chat-container">
                <div className="chat-header">Sushi talk</div>
                <div className="chat-messages">
                    {messages.map((m, i) => (
                        <div key={i} className={`chat-bubble ${m.username === storedUser.username ? 'me' : 'other'}`}>
                            <span className="chat-user">{m.username}</span>
                            <p className="chat-text">{m.text}</p>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <div className="chat-input-area">
                    <input
                        type="text"
                        placeholder="Say something..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                    />
                    <button onClick={() => sendChatMessage()}>Send</button>
                </div>
            </div>
        </div>
    )
}