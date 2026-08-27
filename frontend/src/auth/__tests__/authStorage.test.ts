import { beforeEach, describe, expect, it } from "vitest";
import { clearToken, getToken, saveToken } from "../authStorage";

// Node environment localStorage mock
const storage: Record<string, string> = {};

const localStorageMock: Storage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => {
        storage[key] = value;
    },
    removeItem: (key: string) => {
        delete storage[key];
    },
    clear: () => {
        for (const key of Object.keys(storage)) {
            delete storage[key];
        }
    },
    key: (index: number) => Object.keys(storage)[index] ?? null,
    length: 0,
};

Object.defineProperty(globalThis, "localStorage", {
    value: localStorageMock,
    writable: true,
});

describe("authStorage utils", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("should return null when no token is stored", () => {
        expect(getToken()).toBeNull();
    });

    it("should save and retrieve a valid token before expiration", () => {
        const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(); // 1 day in future
        saveToken({
            accessToken: "mock.jwt.token",
            expiration: futureDate,
        });

        expect(getToken()).toBe("mock.jwt.token");
    });

    it("should clear and return null if token is expired", () => {
        const pastDate = new Date(Date.now() - 1000 * 60).toISOString(); // 1 min in past
        saveToken({
            accessToken: "expired.jwt.token",
            expiration: pastDate,
        });

        expect(getToken()).toBeNull();
        expect(localStorage.getItem("survey_access_token")).toBeNull();
    });

    it("should clear token and expiration on clearToken call", () => {
        const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString();
        saveToken({
            accessToken: "valid.token",
            expiration: futureDate,
        });

        clearToken();

        expect(getToken()).toBeNull();
        expect(localStorage.getItem("survey_access_token")).toBeNull();
        expect(localStorage.getItem("survey_token_expiration")).toBeNull();
    });
});
