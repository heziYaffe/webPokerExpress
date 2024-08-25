import React from 'react';
import Header from '../Header/Header';
import './Home.css';
import Carousel from '../Carousel/Carousel';


const HomePage = () => {
    const tourmentImageUrls = [
        '/assets/Tourments/sundayMillion.webp',
        '/assets/Tourments/dailyBigs.webp',
        '/assets/Tourments/highRollerClub.webp',
        '/assets/Tourments/microMillions.webp',
    ];
    const gamesImageUrls = [
        '/assets/Games/fiveCardDraw.webp',
        '/assets/Games/texasHoldem.webp',
        '/assets/Games/omaha.webp',
        '/assets/Games/razz.webp',
        '/assets/Games/sevenCards.webp',
    ];

    return (
        <div className='homeBackground'>
            <div className="homepage">
                <Header />
                <section className="hero">
                    <h2>Welcome to PokerStars</h2>
                    <p>Experience the best online poker games with exciting tournaments and huge prize pools.</p>
                </section>

                <section className="games">
                    <h3 className='section-title'>Available Games</h3>
                    <Carousel imageUrls={gamesImageUrls} onImageClick={() => {}}/>                   
                </section>
                
                <section className="tournaments">
                    <h3 className='section-title'>Upcoming Tournaments</h3>
                    <Carousel imageUrls={tourmentImageUrls} onImageClick={() => {}}/>                   
                </section>
                <footer className="footer">
                    <p>&copy; 2024 PokerStars. All Rights Reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default HomePage;
