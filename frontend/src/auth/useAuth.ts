import { useContext } from "react";
import { AuthContext } from "./AuthContextValue";
import type { AuthContextValue } from "./AuthContextValue";

// Hook, component dosyasından ayrı tutulduğu için Fast Refresh kuralı korunur.
export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth, AuthProvider içinde kullanılmalıdır.");
    }

    return context;
}