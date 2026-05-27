import './StarRating.css';
import { parseRating } from '../utils/rating.js';

export default function StarRating({ rating, size = 'md', className = '' }) {
    const value = parseRating(rating);
    if (Number.isNaN(value)) {
        return <span className={`star-rating star-rating--${size} ${className}`.trim()} aria-hidden="true">☆☆☆☆☆</span>;
    }

    const stars = [];
    for (let i = 1; i <= 5; i++) {
        if (value >= i) {
            stars.push(<span key={i} className="star-rating__star star-rating__star--full">★</span>);
        } else if (value >= i - 0.5) {
            stars.push(
                <span key={i} className="star-rating__star star-rating__star--half">
                    <span className="star-rating__half-bg">☆</span>
                    <span className="star-rating__half-fg">★</span>
                </span>
            );
        } else {
            stars.push(<span key={i} className="star-rating__star star-rating__star--empty">☆</span>);
        }
    }

    return (
        <span className={`star-rating star-rating--${size} ${className}`.trim()} aria-label={`Rating: ${value} out of 5`}>
            {stars}
        </span>
    );
}
