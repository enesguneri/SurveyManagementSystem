export interface DecodedUser {
    userId: number | null;
    username: string;
    email: string;
    roles: string[];
    isAdmin: boolean;
}

/**
 * JWT Access Token'ı çözerek kullanıcı bilgilerini ve Admin rolünü ayıklar.
 */
export function decodeJwt(token: string | null): DecodedUser | null {
    if (!token) return null;

    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;

        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join(""),
        );

        const payload = JSON.parse(jsonPayload) as Record<string, unknown>;

        // Kullanıcı Kimliği
        const rawId =
            payload[
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
            ] ??
            payload["nameid"] ??
            payload["sub"];
        const userId = rawId ? Number(rawId) : null;

        // Kullanıcı Adı
        const username =
            (payload[
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
            ] as string) ??
            (payload["unique_name"] as string) ??
            (payload["name"] as string) ??
            "";

        // E-posta
        const email =
            (payload[
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
            ] as string) ??
            (payload["email"] as string) ??
            "";

        // Roller (tek bir string veya dizi olabilir)
        const rawRoles =
            payload[
                "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
            ] ??
            payload["role"] ??
            payload["roles"] ??
            [];

        const roles: string[] = Array.isArray(rawRoles)
            ? (rawRoles as string[])
            : typeof rawRoles === "string"
              ? [rawRoles]
              : [];

        const isAdmin = roles.includes("Admin");

        return {
            userId,
            username,
            email,
            roles,
            isAdmin,
        };
    } catch {
        return null;
    }
}
