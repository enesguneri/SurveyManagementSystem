import {
    createContext,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { login as loginRequest } from "../api/authApi";
import { clearToken, getToken, saveToken } from "./authStorage";
import type { LoginRequest, TokenResponse } from "../types/auth";

interface AuthContextValue {
    token: string | null;
    isAuthenticated: boolean;
    login: (request: LoginRequest) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [token, setToken] = useState<string | null>(() => getToken());

    async function login(request: LoginRequest): Promise<boolean> {
        const result = await loginRequest(request);

        if (!result.isSuccess || !result.data) {
            return false;
        }

        const tokenResponse: TokenResponse = result.data;

        saveToken(tokenResponse);
        setToken(tokenResponse.accessToken);

        return true;
    }

    function logout(): void {
        clearToken();
        setToken(null);
    }

    const value = useMemo(
        () => ({
            token,
            isAuthenticated: token !== null,
            login,
            logout,
        }),
        [token],
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth, AuthProvider içinde kullanılmalıdır.");
    }

    return context;
}