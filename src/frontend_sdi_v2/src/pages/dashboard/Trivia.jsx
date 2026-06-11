import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Trivia.css";
import {trivia} from "../../data.js";
import Maki from "../../assets/MAKI.png";

function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}

export default function TimelineTrivia() {
    const navigate = useNavigate();
    const [items, setItems] = useState(() => shuffle(trivia));
    const [dragIndex, setDragIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [locked, setLocked] = useState(false);
    const [cardStates, setCardStates] = useState({});
    const [score, setScore] = useState(null);

    const handleDragStart = (index) => setDragIndex(index);

    const handleDragOver = (e, index) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = (index) => {
        if (dragIndex === null || dragIndex === index) {
            setDragIndex(null);
            setDragOverIndex(null);
            return;
        }
        const updated = [...items];
        const [moved] = updated.splice(dragIndex, 1);
        updated.splice(index, 0, moved);
        setItems(updated);
        setDragIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDragIndex(null);
        setDragOverIndex(null);
    };

    const handleLockIn = () => {
        const sorted = [...trivia].sort((a, b) => a.year - b.year);
        const states = {};
        let correct = 0;
        items.forEach((item, i) => {
            const isCorrect = item.id === sorted[i].id;
            states[item.id] = isCorrect ? "correct" : "wrong";
            if (isCorrect) correct++;
        });
        setCardStates(states);
        setScore(`${correct}/${trivia.length}`);
        setLocked(true);
    };

    return (
        <div className="trivia-page">
            <div className="trivia-container">

                <div className="trivia-header">
                    <img src={Maki} alt="logo_maki" className="logo-maki1" onClick={() => navigate("/")}/>
                    <h1 className="trivia-title">Timeline TRIVIA</h1>
                </div>

                <p className="trivia-subtitle">Arrange the cards in chronological order, oldest first</p>

                <div className="trivia-list-wrapper">
                    <div className="trivia-axis">
                        <span className="axis-label">Oldest</span>
                        <div className="axis-line" />
                        <span className="axis-label">Newest</span>
                    </div>

                    <div className="trivia-list">
                        {items.map((item, index) => (
                            <div
                                key={item.id}
                                draggable={!locked}
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={() => handleDrop(index)}
                                onDragEnd={handleDragEnd}
                                className={[
                                    "trivia-card",
                                    dragIndex === index ? "dragging" : "",
                                    dragOverIndex === index && dragIndex !== index ? "drag-over" : "",
                                    locked && cardStates[item.id] === "correct" ? "card-correct" : "",
                                    locked && cardStates[item.id] === "wrong" ? "card-wrong" : "",
                                ].join(" ")}
                            >
                                <div className="card-image-box">
                                     <img src={item.image} alt={item.trivia_moment} className="card-image" />
                                </div>
                                <span className="card-text">{item.trivia_moment}</span>
                                {!locked && <span className="card-handle">⠿</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {locked ? (
                    <div className="trivia-result">
                        <span className="result-score">{score}</span>
                        <span className="result-label">correct</span>
                        <button className="btn-dashboard" onClick={() => navigate("/")}>
                            Go back to dashboard
                        </button>
                    </div>
                ) : (
                    <button className="btn-lockin" onClick={handleLockIn}>
                        Lock in guess
                    </button>
                )}

            </div>
        </div>
    );
}