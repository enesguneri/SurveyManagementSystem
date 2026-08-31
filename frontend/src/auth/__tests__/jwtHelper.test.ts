import { describe, expect, it } from "vitest";
import { decodeJwt } from "../jwtHelper";

function createMockJwt(payload: Record<string, unknown>): string {
    const header = btoa(JSON.stringify({ alg: "HS512", typ: "JWT" }));
    const body = btoa(JSON.stringify(payload));
    const signature = "dummy-signature";
    return `${header}.${body}.${signature}`;
}

describe("jwtHelper - decodeJwt", () => {
    it("should return null for null or empty token", () => {
        expect(decodeJwt(null)).toBeNull();
        expect(decodeJwt("")).toBeNull();
    });

    it("should return null for malformed token", () => {
        expect(decodeJwt("invalid.token")).toBeNull();
        expect(decodeJwt("not-a-jwt")).toBeNull();
    });

    it("should correctly decode user information and identify Admin role", () => {
        const token = createMockJwt({
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": "42",
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": "admin_user",
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": "admin@bakircay.edu.tr",
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": ["User", "Admin"],
        });

        const decoded = decodeJwt(token);

        expect(decoded).not.toBeNull();
        expect(decoded?.userId).toBe(42);
        expect(decoded?.username).toBe("admin_user");
        expect(decoded?.email).toBe("admin@bakircay.edu.tr");
        expect(decoded?.roles).toContain("Admin");
        expect(decoded?.isAdmin).toBe(true);
    });

    it("should correctly identify non-admin user", () => {
        const token = createMockJwt({
            sub: "10",
            name: "ogrenci",
            email: "ogrenci@bakircay.edu.tr",
            role: "User",
        });

        const decoded = decodeJwt(token);

        expect(decoded).not.toBeNull();
        expect(decoded?.userId).toBe(10);
        expect(decoded?.username).toBe("ogrenci");
        expect(decoded?.email).toBe("ogrenci@bakircay.edu.tr");
        expect(decoded?.roles).toEqual(["User"]);
        expect(decoded?.isAdmin).toBe(false);
    });
});
