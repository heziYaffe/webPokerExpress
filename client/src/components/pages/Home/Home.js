import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../ui/Layout';
import { usePlayer } from '../../../context/PlayerContext';
import { GAMES } from '../../../config';
import GameCard from '../Lobby/GameCard';
import './Home.css';

const TOURNAMENTS = [
    { name: 'Sunday Million', image: '/assets/Tourments/sundayMillion.webp', when: 'Sundays · 20:00' },
    { name: 'Daily Bigs', image: '/assets/Tourments/dailyBigs.webp', when: 'Every day · 18:00' },
    { name: 'High Roller Club', image: '/assets/Tourments/highRollerClub.webp', when: 'Fridays · 21:00' },
    { name: 'Micro Millions', image: '/assets/Tourments/microMillions.webp', when: 'Monthly' },
];

const HomePage = () => {
    const { connectedPlayer } = usePlayer();

    return (
        <Layout>
            <section className="hero">
                <div className="hero__copy">
                    <span className="eyebrow">Real-time multiplayer poker</span>
                    <h1>Your table is <span className="text-gradient">ready.</span></h1>
                    <p>Create a private room, invite friends and play Texas Hold&apos;em in the browser — live, with no downloads.</p>
                    <div className="hero__cta">
                        {connectedPlayer ? (
                            <Link to="/lobby" className="btn btn-primary btn-lg">Go to the lobby</Link>
                        ) : (
                            <>
                                <Link to="/register" className="btn btn-primary btn-lg">Create free account</Link>
                                <Link to="/login" className="btn btn-ghost btn-lg">I have an account</Link>
                            </>
                        )}
                    </div>
                </div>
                <div className="hero__art" aria-hidden="true">
                    <img src="/assets/Home/homePageCasino.webp" alt="" />
                </div>
            </section>

            <section className="home-section">
                <div className="page-header">
                    <div>
                        <h2>Games</h2>
                        <p>Pick a variant and jump into a room.</p>
                    </div>
                    {connectedPlayer && <Link to="/lobby" className="btn btn-ghost">Open lobby →</Link>}
                </div>
                <div className="grid">
                    {GAMES.map((g) => (
                        <GameCard key={g.slug} game={g} to={connectedPlayer ? `/lobby/${g.slug}` : '/login'} />
                    ))}
                </div>
            </section>

            <section className="home-section">
                <div className="page-header">
                    <div>
                        <h2>Upcoming tournaments</h2>
                        <p>Scheduled events are coming soon.</p>
                    </div>
                </div>
                <div className="grid">
                    {TOURNAMENTS.map((t) => (
                        <article key={t.name} className="tournament-card">
                            <img src={t.image} alt="" loading="lazy" />
                            <div className="tournament-card__body">
                                <h3>{t.name}</h3>
                                <span className="muted">{t.when}</span>
                                <span className="badge badge-gold">Coming soon</span>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </Layout>
    );
};

export default HomePage;
