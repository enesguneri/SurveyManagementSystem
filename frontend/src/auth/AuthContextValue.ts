import { createContext } from "react";
import type { LoginRequest } from "../types/auth";

export interface AuthContextValue {
    token: string | null;
    isAuthenticated: boolean;
    login: (request: LoginRequest) => Promise<boolean>;
    logout: () => void;
}

// Context yalnızca değer sözleşmesini ve paylaşım noktasını taşır.
export const AuthContext = createContext<AuthContextValue | undefined>(
    undefined,
);
