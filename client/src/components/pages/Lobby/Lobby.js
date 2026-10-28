import React from 'react';
import Layout from '../../ui/Layout';
import GameCard from './GameCard';
import { GAMES } from '../../../config';
import { usePlayer } from '../../../context/PlayerContext';

const Lobby = () => {
    const { connectedPlayer } = usePlayer();
    return (
        <Layout>
            <div className="page-header">
                <div>
                    <span className="eyebrow">Lobby</span>
                    <h1>Welcome back, {connectedPlayer?.name}</h1>
                    <p>Choose a game to see open rooms or create your own table.</p>
                </div>
            </div>
            <div className="grid">
                {GAMES.map((g) => <GameCard key={g.slug} game={g} to={`/lobby/${g.slug}`} />)}
            </div>
        </Layout>
    );
};

export default Lobby;
