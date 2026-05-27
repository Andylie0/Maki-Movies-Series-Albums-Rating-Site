import { useState, useEffect } from 'react'
import './Journal.css'
import '../../App.css'
import MakiLogo from '../../assets/MAKI.png'
import ProfileIcon from '../../assets/profile_img.png'
import ParticlesBackground from './Particles.jsx'
import {useNavigate} from "react-router-dom"
import Cookie from 'js-cookie'
import {BASE_URL, WB_URL} from "../../config.js";

export function Journal({allReviews, setReviewState, allMovies, isOnline, addToQueue}){
    const storedUser = JSON.parse(localStorage.getItem('user')) || null;
    const userId = storedUser.id;

    const imageUser = JSON.parse(localStorage.getItem('user'))?.image;

    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(Cookie.get("activeTab") || "table");
    const [activePage, setActivePage] = useState("journal");
    const [isEditing, setIsEditing] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [editText, setEditText] = useState("");
    const [editRating, setEditRating] = useState(0);
    const [tableSearch, setTableSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 7;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const navigate = useNavigate();

    const loadReviews = async (pageNumber, isNewSearch = false) => {
        if (isLoading || !isOnline) return;
        setIsLoading(true);
        const GET_REVIEWS_QUERY = `
            query GetJournalReviews($page: Int!, $size: Int!, $userId: Int) {
                getReviews(page: $page, size: $size, userId : $userId) {
                    total
                    items{
                        id
                        movieId
                        text
                        rating
                        likes
                        userId
                        movie {
                            id
                            name
                            rating
                            numberOfReviews
                            duration
                            yearReleased
                            image
                            description
                            type
                        }
                    }
                }
            }
        `;
        try {
            const response = await fetch(`${BASE_URL}/graphql`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    query: GET_REVIEWS_QUERY,
                    variables: {
                        page: pageNumber,
                        size: itemsPerPage,
                        userId: userId
                    }
                })
            });
            const result = await response.json();
            if (result.errors) {
                console.error("GraphQL Server Errors:", result.errors);
                return;
            }
            const { items, total } = result.data.getReviews;
            if (isNewSearch) {
                setReviewState(items);
            } else {
                setReviewState(prev => {
                    const existingIds = new Set(prev.map(r => r.id));
                    const filtered = items.filter(item => !existingIds.has(item.id));
                    return [...prev, ...filtered];
                });
            }
            setTotalCount(total);
        } catch (error) {
            console.error("GraphQL Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadReviews(currentPage, currentPage === 1);
    }, [currentPage, tableSearch, isOnline]);

    useEffect(() => {
        const socket = new WebSocket(`${WB_URL}/ws`);

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "NEW_REVIEW" || message.type === "NEW_DATA_ALERT") {
                setCurrentPage(1);
                loadReviews(1, true);
            }
        };

        return () => socket.close();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

            const nearBottom = scrollTop + clientHeight >= scrollHeight - 300;

            if (nearBottom && !isLoading && currentPage < totalPages) {
                console.log("Loading page:", currentPage + 1);
                setCurrentPage(prev => prev + 1);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isLoading, currentPage, totalPages]);

    useEffect(() => {
        const delay = !isOnline ? 0 : 2000;

        const timer = setTimeout(() => {
            loadReviews(currentPage, currentPage === 1);
        }, delay);

        return () => clearTimeout(timer);
    }, [currentPage, tableSearch, isOnline]);

    const currentReviews = allReviews;

    function handleStats(){
        navigate("/stats");
    }

    function handleAbout(){
        navigate("/about");
    }

    //function for edit button
    function handleEdit(review){
        setSelectedReview(review);
        setIsEditing(true);
        setEditText(review.text);
        setEditRating(review.rating);
    }

    //function to save edit from modal/pop-up
    async function handleSave(text, rating) {
        const mId = selectedReview.movieId ||
            selectedReview.movie_id ||
            selectedReview.movie?.id;

        if (!mId) {
            console.error("Critical Error: Could not find a movie ID in selectedReview", selectedReview);
            alert("Logic error: Movie ID is missing. Check the console.");
            return;
        }

        const payload = {
            movie_id: parseInt(mId), // Ensure it's a number
            text: text,
            rating: parseFloat(rating),
            likes: selectedReview.likes || 0,
        };

        if(payload.rating <= 0 || payload.rating > 5 && payload.rating % 0.5 !== 0){
            console.error("Invalid rating value:", payload.rating);
            return;
        }

        if (!isOnline) {
            addToQueue({
                url: `/reviews/${selectedReview.id}?user_id=${userId}`,
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            const updated = allReviews.map(r =>
                r.id === selectedReview.id ? { ...selectedReview, text, rating } : r
            );
            setReviewState(updated);
            setIsEditing(false);
            return;
        }

        const response = await fetch(`${BASE_URL}/reviews/${selectedReview.id}?user_id=${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: "include",
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            setIsEditing(false);
            setCurrentPage(1);
            loadReviews(1, true);
        } else {
            const errorData = await response.json();
            console.error("Validation Error Details:", errorData.detail);
            alert(`Error: ${errorData.detail[0].msg} for field: ${errorData.detail[0].loc[1]}`);
        }
    }

    //FUNCTION for delete button
    async function deleteReview(id) {
        if (!isOnline) {
            addToQueue({ url: `/reviews/${id}?user_id=${userId}`, method: 'DELETE', credentials: "include", });
            setReviewState(allReviews.filter(r => r.id !== id));
            return;
        }

        const response = await fetch(`${BASE_URL}/reviews/${id}?user_id=${userId}`, {
            method: 'DELETE',
            credentials: "include",
        });

        if (response.ok) {
            setCurrentPage(1);
            loadReviews(1,true);
        }
    }

    function handleSearchNav() {
        const query = searchInput.toLowerCase();
        const movie = allMovies.find(m => m.name.toLowerCase().includes(query));
        if (movie) {
            setSearchInput("");
            navigate(`/details/${movie.id}`);
        }
    }

    // for stars rating
    function stars(rating){
        let result = "";
        for (let i = 0; i < 5; i++) {
            if (i === Math.floor(rating) && rating - Math.floor(rating) >= 0.5)
                result += "⯪";
            else
                i < rating ? result += "★" : result += "☆";
        }
        return result;
    }

    function handleTabChange(tab){
        setActiveTab(tab);
        Cookie.set('activeTab', tab, { expires: 7 });
    }

    function handlePoster(movie){
        navigate(`/details/${movie.id}`)
    }

    const suggestions = searchInput.length > 0
        ? allMovies.filter(m =>
            m.name.toLowerCase().includes(searchInput.toLowerCase())
        ).slice(0, 3)
        : []

    return (
        <div className="App">
            <ParticlesBackground colour="#FFCE27"/>
            <header className="app-header">
                <img src = {MakiLogo} alt= "logo_maki" className="logo-maki" onClick={() => handleAbout()}/>
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
                        onClick={() => setActivePage("journal")}>Journal</button>
                <button className={`watchlist-button-header ${activePage === "watchlist" ? "active" : ""}`}
                        onClick={() => setActivePage("watchlist")}>Watchlist</button>
                <img src ={imageUser != "null" ? imageUser : ProfileIcon} alt= "user_icon" className="user-icon"/>
            </header>

            <main className="main-content">

                <div className="button-section">
                    <button className={`table-button ${activeTab === "table" ? "active" : ""}`}
                            onClick={() => handleTabChange("table")} >Table</button>
                    <button className={`stats-button ${activeTab === "stats" ? "active" : ""}`}
                            onClick={() => {handleTabChange("stats"); handleStats()}}>Statistics</button>
                </div>

                <table className="movie-table">
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>Released</th>
                        <th>Type</th>
                        <th>Rating</th>
                        <th className="action-th"> </th>
                        <th className="action-th"> </th>
                    </tr>
                    </thead>
                    <tbody>
                    {currentReviews.map((review) => {
                        const movie = review?.movie;
                        if (!movie) {
                            return null;
                        }
                        return(
                            <tr key={review.id} className="table-row">
                                <td className="movie-cell">
                                    <img src = {movie.image}
                                         alt = {movie.name} className="movie-poster" onClick={() => handlePoster(movie)}/>
                                    {movie.name}
                                </td>
                                <td>{movie.year_released}</td>
                                <td>{movie.type}</td>
                                <td className="stars">{stars(review.rating)}</td>
                                <td> <button className="edit-button" onClick={() => handleEdit(review)}>🖊</button></td>
                                <td> <button className="delete-button" onClick={() => deleteReview(review.id)}>✖</button></td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
                <div className="infinite-scroll-status" style={{ textAlign: 'center', padding: '20px' }}>
                    {isLoading && <p>Loading more reviews...</p>}
                    {!isLoading && currentPage >= totalPages && allReviews.length > 0 && (
                        <p>You've reached the end of the journal.</p>
                    )}
                </div>

                {isEditing && selectedReview &&(
                    <div className="overlay-modal" onClick={() => setIsEditing(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close" onClick={() => setIsEditing(false)}>✕</button>
                            <h2>Edit Review</h2>
                            <div className = "modal-movie-info">
                                {(() => {
                                    const movie = selectedReview?.movie;
                                    if (!movie) {
                                        return <p>Loading movie data...</p>;
                                    }
                                    return (
                                        <>
                                            <img src={movie.image} alt={movie.name} />
                                            <div className="movie-info">
                                                <h2>{movie.name} {movie.year_released}</h2>
                                                <textarea placeholder="Add a review..." defaultValue={selectedReview.text} id = "edit-text"
                                                          onChange={(e) => setEditText(e.target.value)}
                                                />
                                                <p>Rating:
                                                    <input type="number" id="edit-rating" min="0" max="5" step="0.5" defaultValue={selectedReview.rating}
                                                           onChange={(e) =>
                                                               setEditRating(parseFloat(e.target.value))}/>
                                                    /5 </p>
                                            </div>
                                        </>
                                    )
                                })()}
                            </div>

                            <div className="modal-footer">
                                <button id="save-button" onClick={() =>
                                    handleSave(editText,editRating)}> SAVE </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

        </div>
    )
}

export default Journal