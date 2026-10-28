const TOKEN_KEY = 'token';

export const parseJwt = (token) => {
    try {
        const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
};

/** Returns the stored token only if it is well-formed and not expired. */
export const getToken = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const claims = token && parseJwt(token);
    if (!claims) return null;
    if (claims.exp && claims.exp * 1000 < Date.now()) {
        localStorage.removeItem(TOKEN_KEY);
        return null;
    }
    return token;
};

export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const playerFromToken = (token) => {
    const claims = token && parseJwt(token);
    return claims ? { id: claims.userId, name: claims.username, role: claims.role || 'user' } : null;
};
