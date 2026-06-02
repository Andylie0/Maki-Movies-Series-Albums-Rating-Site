import {useParams, useNavigate} from "react-router-dom"
import MakiLogo from "../../assets/MAKI.png";
import ProfileIcon from "../../assets/profile_img.png";
import FWEH from "../../assets/FWEH.png";
import hidoina from "../../assets/hidoina.png";
import {useState, useEffect} from "react";
import './Details.css'
import '../master_view/Journal.css'
import Cookie from 'js-cookie'
import {BASE_URL, WB_URL} from "../../config.js";
import StarRating from '../../components/StarRating.jsx';
import { parseRating } from '../../utils/rating.js';
import { FiSearch, FiX } from 'react-icons/fi';


export default function Details({ allReviews, setReviewState, allMovies, isOnline, addToQueue}) {
    const {id} = useParams();
    const [movie, setMovie] = useState(null);

    const storedUser = JSON.parse(localStorage.getItem('user')) || null;
    const userId = storedUser.id;

    const navigate = useNavigate();

    const [activePage, setActivePage] = useState("")
    const [searchInput, setSearchInput] = useState("");

    const [isEditing, setIsEditing] = useState(false)
    const [selectedReview, setSelectedReview] = useState(null)
    const [newReview, setNewReview] = useState(null)
    const [editRating, setEditRating] = useState(0)
    const [editText, setEditText] = useState("")

    const fetchMovieData = async () => {
        const MOVIE_DETAILS_QUERY = `
            query GetMovieDetails($id: Int!) {
                getMovie(id: $id) {
                    id
                    name
                    rating
                    numberOfReviews
                    duration
                    yearReleased
                    image
                    description
                    type
                    reviews {
                        id
                        text
                        rating
                        likes
                        userId
                    }
                }
            }
        `;

        try {
            const response = await fetch(`${BASE_URL}/graphql`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    query: MOVIE_DETAILS_QUERY,
                    variables: { id: parseInt(id) }
                })
            });

            const result = await response.json();
            const movieData = result.data.getMovie;

            if (movieData) {
                setMovie(movieData);
                setReviewState(movieData.reviews);
            }
        } catch (error) {
            console.error("GraphQL Details Error:", error);
        }
    };

    useEffect(() => {
        let cancelled = false;

        async function load() {
            const MOVIE_DETAILS_QUERY = `
                query GetMovieDetails($id: Int!) {
                    getMovie(id: $id) {
                        id
                        name
                        rating
                        numberOfReviews
                        duration
                        yearReleased
                        image
                        description
                        type
                        reviews {
                            id
                            movieId
                            text
                            rating
                            likes
                            userId
                        }
                    }
                }
            `;
            try {
                const response = await fetch(`${BASE_URL}/graphql`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        query: MOVIE_DETAILS_QUERY,
                        variables: { id: parseInt(id) }
                    })
                });
                if (response.ok) {
                    const result = await response.json();
                    const data = result.data.getMovie;
                    if (!cancelled) {
                        setMovie(data);
                        setReviewState(data.reviews);
                    }
                }
            } catch (error) {
                console.error("Error fetching movie details:", error);
            }
        }
        load();
        const visited = JSON.parse(Cookie.get('visitedMovies') || '[]');
        const movieIdInt = parseInt(id);
        if (!visited.includes(movieIdInt)) {
            visited.push(movieIdInt);
            Cookie.set('visitedMovies', JSON.stringify(visited), { expires: 7 });
        }

        return () => {
            cancelled = true;
        }
    }, [id]);

    useEffect(() => {
        const socket = new WebSocket(`${WB_URL}/ws`);

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "NEW_DATA_ALERT" || message.type === "NEW_REVIEW") {
                console.log("Details page refreshing due to server alert...");
                fetchMovieData();
            }
        };

        return () => socket.close();
    }, [id]);

    function revrev(m){
        if (m.numberOfReviews >= 1000) {
            return Math.floor(m.numberOfReviews / 1000) + "." + (Math.floor(m.numberOfReviews / 100) % 10) + "k";
        }
        return m.numberOfReviews;
    }

    function handleSearchNav() {
        const movie = allMovies.find(movie => movie.name.toLowerCase().includes(searchInput.toLowerCase()))
        if(movie){
            setSearchInput("");
            navigate(`/details/${movie.id}`)
        }
    }

    function handleAdd(review) {
        if (review) {
            setEditText(review.text);
            setEditRating(review.rating);
            setSelectedReview(review);
            setNewReview(false);
        } else {
            setEditText("");
            setEditRating(0);
            setNewReview(true);
            setSelectedReview(null);
        }
        setIsEditing(true);
    }

    async function handleSave(text, rating) {
        const payload = {
            movie_id: parseInt(id),
            text: text,
            rating: parseRating(rating),
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
                credentials: "include",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const updated = allReviews.map(r =>
                r.id === selectedReview.id ? { ...selectedReview, text, rating } : r
            );
            setReviewState(updated);
            setIsEditing(false);
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/reviews/${selectedReview.id}?user_id=${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setIsEditing(false);
                fetchMovieData();
            } else {
                const errorData = await response.json();
                alert(`Edit failed: ${errorData.detail[0].msg}`);
            }
        } catch (error) {
            console.error("Network error during handleSave:", error);
        }
    }

    async function handleSaveNew(text, rating) {
        const payload = {
            movie_id: parseInt(id),
            text: text,
            rating: parseRating(rating),
            likes: 0,
        };

        if(payload.rating <= 0 || payload.rating > 5 && payload.rating % 0.5 !== 0){
            console.error("Invalid rating value:", payload.rating);
            return;
        }

        if (!isOnline) {
            const tempId = Date.now();
            const newRev = { ...payload, id: tempId };

            addToQueue({
                url: `/reviews/?user_id=${userId}`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            setReviewState(prev => [newRev, ...prev]);
            setIsEditing(false);
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/reviews/?user_id=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setIsEditing(false);
                fetchMovieData();
            } else {
                const errorDetail = await response.json();
                alert(`Server error: ${errorDetail.detail?.[0]?.msg || "Validation Error"}`);
            }
        } catch (error) {
            console.error("Network error during handleSaveNew:", error);
        }
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

    function handleAbout(){
        navigate("/about");
    }

    function handleAllReviews(){
        alert("This feature is not available!!")
    }

    const suggestions = searchInput.length > 0
        ? allMovies.filter(m =>
            m.name.toLowerCase().includes(searchInput.toLowerCase())
        ).slice(0, 3)
        : []

    if (!movie) {
        return (
            <div className="details-loading">
                <p>Loading movie details...</p>
            </div>
        );
    }

    return(
        <div className="details">

            <header className="app-header">
                <img src = {MakiLogo} alt= "logo_maki" className="logo-maki" onClick={() => handleAbout()} />
                <div className="search-bar">
                    <input type="text" placeholder="Search..." className="search-input"
                           onChange={(e) => setSearchInput(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleSearchNav()}
                    />
                    <button className="search-icon" onClick={() => handleSearchNav()} aria-label="Search">
                        <FiSearch />
                    </button>

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

            <main>

                <div className="movie-details">
                    <div className = "poster">
                        <img src={movie.image} alt={movie.name}/>
                        <p className = "details-duration">Duration: {movie.duration} min</p>
                    </div>
                    <div className = "movie-info2">
                        <h1>{movie.name}</h1>
                        <p className="details-desc"> {movie.description} </p>
                    </div>
                    <div className="rate-watchlist">
                        <div className="rating-section">
                            <span className="details-hero-star" aria-hidden="true">★</span>
                            <div className="stats-rate">
                                <span className="rating-numb">
                                    {movie.rating} / 5</span>
                                <span className="reviews">{revrev(movie)} CHADS</span>
                            </div>
                        </div>
                        <button className="watchlist-button">Add to your watchlist</button>
                    </div>
                </div>

                <div className="add-edit-review">
                    <div className="add-review-button"
                         onClick={() => handleAdd(movie.reviews?.find(r => r.userId === parseInt(userId)))}>
                        <span className="add">Add a review or edit your review!</span>
                        <StarRating rating={5} size="md" className="add-review-stars" />
                    </div>
                </div>

                {isEditing && selectedReview &&(
                    <div className="overlay-modal" onClick={() => setIsEditing(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close" onClick={() => setIsEditing(false)} aria-label="Close">
                                <FiX />
                            </button>
                            <h2>Edit Review</h2>
                            <div className = "modal-movie-info">
                                {(() => {
                                    return (
                                        <>
                                            <img src={movie.image} alt={movie.name} />
                                            <div className="movie-info">
                                                <h2>{movie.name} {movie.yearReleased}</h2>
                                                <textarea placeholder="Add a review..." value={selectedReview.text} id = "edit-text"
                                                          onChange={(e) => setEditText(e.target.value)}
                                                />
                                                <p>Rating:
                                                    <input type="number" id="edit-rating" min="0" max="5" step="0.5" lang="en-US" defaultValue={selectedReview.rating}
                                                           onChange={(e) =>
                                                               setEditRating(parseRating(e.target.value))}/>
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

                {isEditing && newReview &&(
                    <div className="overlay-modal" onClick={() => setIsEditing(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close" onClick={() => setIsEditing(false)} aria-label="Close">
                                <FiX />
                            </button>
                            <h2>New Review</h2>
                            <div className = "modal-movie-info">
                                {(() => {
                                    return (
                                        <>
                                            <img src={movie.image} alt={movie.name} />
                                            <div className="movie-info">
                                                <h2>{movie.name} {movie.yearReleased}</h2>
                                                <textarea placeholder="Add a review..." id = "edit-text"
                                                          onChange={(e) => setEditText(e.target.value)}
                                                />
                                                <p>Rating:
                                                    <input type="number" id="edit-rating" min="0" max="5" step="0.5" lang="en-US" defaultValue={0}
                                                           onChange={(e) =>
                                                               setEditRating(parseRating(e.target.value))}/>
                                                    /5 </p>
                                            </div>
                                        </>
                                    )
                                })()}
                            </div>

                            <div className="modal-footer">
                                <button id="save-button" onClick={() =>
                                    handleSaveNew(editText,editRating)}> SAVE </button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="review-section">
                    <h4>Reviews</h4>
                    <hr />
                    <div className="reviewer-1">
                        <div className="poffff">
                            <img src={FWEH} alt="FWEH" className="user-icon"/>
                            <div className="actual-review">
                                <h3>Kobeni Higashiyama</h3>
                                <p>Fweh! Fujimoto is a serial pdf-file!</p>
                            </div>
                        </div>
                        <StarRating rating={3.5} size="md" className="review-item-stars" />
                    </div>
                    <hr />
                    <div className="reviewer-2">
                        <div className="poffff">
                            <img src={hidoina} alt="hidoina" className="user-icon"/>
                                <div className="actual-review">
                                    <h3>Blue Judas</h3>
                                    <p>Don't you have a human heart!</p>
                                </div>
                        </div>
                        <StarRating rating={4} size="md" className="review-item-stars" />
                    </div>
                    <hr />
                    <span className="all-reviews" onClick={()=>handleAllReviews()}>See all reviews!</span>
                </div>
            </main>
        </div>
    )
}