import React from 'react';
import Header from '../Header/Header';
import './Lobby.css'; // New CSS file for the Lobby component
import Carousel from '../Carousel/Carousel';
import { useNavigate } from 'react-router-dom';

const Lobby = () => {
    const gamesImageUrls = [
        '/assets/Games/fiveCardDraw.webp',
        '/assets/Games/texasHoldem.webp',
        '/assets/Games/omaha.webp',
        '/assets/Games/razz.webp',
        '/assets/Games/sevenCards.webp',
    ];

    const navigate = useNavigate();

    const handleGameImageClick = (index) => {
        let gamePath = '';

        switch (index) {
            case 0:
                gamePath = 'five-card-draw';
                break;
            case 1:
                gamePath = 'texas-holdem';
                break;
            case 2:
                gamePath = 'omaha';
                break;
            case 3:
                gamePath = 'razz';
                break;
            case 4:
                gamePath = 'seven-card-stud';
                break;
            default:
                break;
        }

        if (gamePath) {
            navigate(`/lobby/${gamePath}`);
        }
    };

    return (
        <div className='lobbyBackground'>
            <div className="lobby">
                <Header />
                <section className="hero">
                    <h2>Choose Your Game</h2>
                    <p>Select a game to see available rooms or create your own.</p>
                </section>

                <section className="games">
                    <h3 className='section-title'>Available Games</h3>
                    <Carousel imageUrls={gamesImageUrls} onImageClick={handleGameImageClick}/>
                </section>
                
                <footer className="footer">
                    <p>&copy; 2024 PokerStars. All Rights Reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default Lobby;
