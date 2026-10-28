import { Link } from 'react-router-dom';
import './Lobby.css';

const GameCard = ({ game, to }) => (
    <Link to={to} className="game-card" aria-label={`${game.name} rooms`}>
        <div className="game-card__media">
            <img src={game.image} alt="" loading="lazy" />
        </div>
        <div className="game-card__body">
            <h3>{game.name}</h3>
            <p>{game.blurb}</p>
            <span className="game-card__cta">View rooms →</span>
        </div>
    </Link>
);

export default GameCard;
