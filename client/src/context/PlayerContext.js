import React, { createContext, useContext, useState, useEffect } from 'react';

// Utility function to decode JWT token
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [connectedPlayer, setConnectedPlayer] = useState(null);

  useEffect(() => {
    // Rehydrate from localStorage if user is already logged in
    const storedPlayerToken = localStorage.getItem('token');
    console.log("storedPlayerToken", storedPlayerToken)
    const parsedJwt =  parseJwt(storedPlayerToken)
    console.log("parsedJwt", parsedJwt)
    setConnectedPlayer({ id: parsedJwt.userId, name: parsedJwt.username });
    if (storedPlayerToken) {
        //setConnectedPlayer(storedPlayerToken);
    }
}, []);

const logout = () => {
    setConnectedPlayer(null);
    localStorage.removeItem('connectedPlayer');
};

  return (
    <PlayerContext.Provider value={{ connectedPlayer, setConnectedPlayer, logout }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  return useContext(PlayerContext);
};
