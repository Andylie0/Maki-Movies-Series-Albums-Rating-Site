import { Routes, Route } from 'react-router-dom'
import {useOffline} from "./hooks/useOffline";
import Journal from './pages/master_view/Journal.jsx'
import Login from './pages/authentification/Login.jsx'
import Register from './pages/authentification/Register.jsx'
import ForgotPassword from './pages/authentification/ForgotPassword.jsx'
import Stats from './pages/master_view/Statistics.jsx'
import Details from './pages/detail/Details.jsx'
import About from './pages/landing_page/About.jsx'
import Dashboard from './pages/dashboard/Dashboard.jsx'
import Trivia from './pages/dashboard/Trivia.jsx'
import {useState, useEffect} from "react";
import {BASE_URL} from "./config.js";
import NextStep from "./pages/authentification/NextStep.jsx";
import Watchlist from "./pages/watchlist/Watchlist.jsx";

export function App() {
    const [allReviews, setReviewState] = useState([]);
    const [allMovies, setAllMovies] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const { isOnline, addToQueue } = useOffline();

    useEffect(() => {
        const fetchAllMovies = async () => {
            const GET_ALL_MOVIES = `
            query {
                getMovies {
                    id
                    name
                    image
                    yearReleased
                    type
                }
            }
        `;
            try {
                const response = await fetch(`${BASE_URL}/graphql`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query: GET_ALL_MOVIES })
                });
                const result = await response.json();
                setAllMovies(result.data.getMovies);
            } catch (err) {
                console.error("Failed to fetch master movie list", err);
            }
        };

        if (isOnline) fetchAllMovies();
    }, [isOnline]);

    return(
        <div className="app-container">
            {!isOnline && (
                <div className="offline-banner">
                    You are offline. Changes will be saved locally and synced later.
                </div>
            )}
            <Routes>
                <Route path="/" element={<Dashboard
                    allMovies={allMovies}
                    setIsLoggedIn={setIsLoggedIn}
                    isLoggedIn={isLoggedIn}
                />}/>
                <Route path="/journal" element={<Journal
                    allReviews={allReviews}
                    setIsLoggedIn={setIsLoggedIn}
                    setReviewState={setReviewState}
                    allMovies={allMovies}
                    isOnline={isOnline}
                    addToQueue={addToQueue}
                />}/>
                <Route path="/stats" element={<Stats
                    allReviews={allReviews}
                    setIsLoggedIn={setIsLoggedIn}
                    allMovies={allMovies}
                />}/>
                <Route path="/register" element={<Register/>}/>
                <Route path="/details/:id" element={<Details
                    allReviews={allReviews}
                    setReviewState={setReviewState}
                    setIsLoggedIn={setIsLoggedIn}
                    allMovies={allMovies}
                    isOnline={isOnline}
                    addToQueue={addToQueue}
                    isLoggedIn={isLoggedIn}
                />}/>
                <Route path="/watchlist" element={<Watchlist
                    allMovies={allMovies}
                    setIsLoggedIn={setIsLoggedIn}
                />} />
                <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn}/>}/>
                <Route path="/forgot-password" element={<ForgotPassword/>}/>
                <Route path="/next-step" element={<NextStep/>}/>
                <Route path="/trivia" element={<Trivia/>}/>
            </Routes>
        </div>
    )
}

export default App
