import { API_URL } from '../config';
import { getToken, clearToken } from './auth';

export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

/** fetch wrapper: JSON in/out, bearer token, readable errors. */
export const api = async (path, { method = 'GET', body } = {}) => {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let response;
    try {
        response = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch {
        throw new ApiError('Cannot reach the server. Is it running?', 0);
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401 && token) clearToken();
        throw new ApiError(data.message || `Request failed (${response.status})`, response.status);
    }
    return data;
};
