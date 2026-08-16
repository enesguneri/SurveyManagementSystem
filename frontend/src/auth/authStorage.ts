import type { TokenResponse } from "../types/auth";

const ACCESS_TOKEN_KEY = "survey_access_token";
const EXPIRATION_KEY = "survey_token_expiration";

export function saveToken(tokenResponse: TokenResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokenResponse.accessToken);
    localStorage.setItem(EXPIRATION_KEY, tokenResponse.expiration);
}

export function getToken(): string | null {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const expiration = localStorage.getItem(EXPIRATION_KEY);

    if (!token || !expiration) {
        return null;
    }

    // Süresi dolmuş token tekrar kullanılmaz.
    if (new Date(expiration).getTime() <= Date.now()) {
        clearToken();
        return null;
    }

    return token;
}

export function clearToken(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(EXPIRATION_KEY);
}