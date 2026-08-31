import {
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { login as loginRequest } from "../api/authApi";
import { clearToken, getToken, saveToken } from "./authStorage";
import type { ApiResponse } from "../types/api";
import type { LoginRequest, TokenResponse } from "../types/auth";
import { AuthContext } from "./AuthContextValue";
import { decodeJwt } from "./jwtHelper";

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [token, setToken] = useState<string | null>(() => getToken());

    const user = useMemo(() => decodeJwt(token), [token]);
    const isAdmin = user?.isAdmin ?? false;

    async function login(request: LoginRequest): Promise<ApiResponse<TokenResponse>> {
        const result = await loginRequest(request);

        if (result.isSuccess && result.data) {
            saveToken(result.data);
            setToken(result.data.accessToken);
        }

        return result;
    }

    function logout(): void {
        clearToken();
        setToken(null);
    }

    const value = useMemo(
        () => ({
            token,
            isAuthenticated: token !== null,
            isAdmin,
            user,
            login,
            logout,
        }),
        [token, isAdmin, user],
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}