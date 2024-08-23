import './Player.css';

const Player = ({name}) => {

    return (
        <div>
            <div className="player-avatar">
                <img src="/assets/images/playerAvatar.webp" alt="Avatar" />
            </div>
            <div className="player-info">
                <p>{name}</p>
            </div> 
        </div>
    );
};

export default Player;
