import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Card from './components/games/Card/Card';
import PlayerPanel from './components/games/PlayerPanel/PlayerPanel';
import Login from './components/pages/Login/Login';
import { PlayerProvider } from './context/PlayerContext';
import { getToken, parseJwt, playerFromToken } from './lib/auth';

const makeToken = (claims) => `x.${btoa(JSON.stringify(claims))}.y`;

describe('Card', () => {
    test('renders rank and suit with an accessible label', () => {
        render(<Card rank="A" suit="hearts" />);
        expect(screen.getByLabelText('A of hearts')).toHaveClass('is-red');
    });

    test('renders face down when hidden', () => {
        render(<Card hidden />);
        expect(screen.getByLabelText('Face-down card')).toBeInTheDocument();
    });
});

describe('PlayerPanel', () => {
    test('shows Call with the amount owed and disables an invalid raise', () => {
        render(<PlayerPanel chips={100} toCall={20} minRaise={200} onAction={() => {}} />);
        expect(screen.getByRole('button', { name: 'Call 20' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Raise' })).toBeDisabled();
    });

    test('shows Check when nothing is owed', () => {
        render(<PlayerPanel chips={100} toCall={0} minRaise={10} onAction={() => {}} />);
        expect(screen.getByRole('button', { name: 'Check' })).toBeInTheDocument();
    });
});

describe('auth helpers', () => {
    afterEach(() => localStorage.clear());

    test('parses a token payload and maps it to a player', () => {
        const token = makeToken({ userId: 'u1', username: 'alice', role: 'admin' });
        expect(parseJwt(token).username).toBe('alice');
        expect(playerFromToken(token)).toEqual({ id: 'u1', name: 'alice', role: 'admin' });
    });

    test('drops expired tokens', () => {
        localStorage.setItem('token', makeToken({ userId: 'u1', exp: 1 }));
        expect(getToken()).toBeNull();
        expect(localStorage.getItem('token')).toBeNull();
    });

    test('garbage tokens are ignored', () => {
        localStorage.setItem('token', 'garbage');
        expect(getToken()).toBeNull();
    });
});

test('login page renders for logged-out users (regression: used to crash)', () => {
    render(
        <PlayerProvider>
            <MemoryRouter><Login /></MemoryRouter>
        </PlayerProvider>
    );
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
});
