import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { clearToken, getToken, playerFromToken, setToken } from '../lib/auth';

const PlayerContext = createContext(null);

export const PlayerProvider = ({ children }) => {
    // Rehydrate synchronously from a valid, unexpired token (no crash when logged out).
    const [connectedPlayer, setConnectedPlayer] = useState(() => playerFromToken(getToken()));

    const login = useCallback((token) => {
        setToken(token);
        setConnectedPlayer(playerFromToken(token));
    }, []);

    const logout = useCallback(() => {
        clearToken();
        setConnectedPlayer(null);
    }, []);

    const value = useMemo(() => ({ connectedPlayer, setConnectedPlayer, login, logout }), [connectedPlayer, login, logout]);

    return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export const usePlayer = () => useContext(PlayerContext);
