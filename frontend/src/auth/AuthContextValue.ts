import { createContext } from "react";
import type { ApiResponse } from "../types/api";
import type { LoginRequest, TokenResponse } from "../types/auth";
import type { DecodedUser } from "./jwtHelper";

export interface AuthContextValue {
    token: string | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    user: DecodedUser | null;
    login: (request: LoginRequest) => Promise<ApiResponse<TokenResponse>>;
    logout: () => void;
}

// Context yalnızca değer sözleşmesini ve paylaşım noktasını taşır.
export const AuthContext = createContext<AuthContextValue | undefined>(
    undefined,
);
