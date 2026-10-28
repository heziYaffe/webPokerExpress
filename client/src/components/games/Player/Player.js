import './Player.css';

/** A seat at the table, positioned by the parent via CSS variables. */
const Player = ({ name, chips, bet, isTurn, isMe, isManager, style }) => (
    <div className={`seat ${isTurn ? 'seat--turn' : ''} ${isMe ? 'seat--me' : ''}`} style={style}>
        <div className="seat__avatar" aria-hidden="true">{name?.[0]?.toUpperCase() || '?'}</div>
        <div className="seat__info">
            <span className="seat__name">{name}{isMe && ' (you)'}{isManager && <span title="Room manager"> ★</span>}</span>
            {chips !== undefined && <span className="seat__chips">{chips} chips</span>}
        </div>
        {bet > 0 && <span className="seat__bet">{bet}</span>}
    </div>
);

export default Player;
