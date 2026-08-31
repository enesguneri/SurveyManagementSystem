import { describe, expect, it } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { extractErrorMessage } from "../errorHandler";

describe("errorHandler - extractErrorMessage", () => {
    it("should return network error message when network fails or response is missing", () => {
        const error = new AxiosError("Network Error", "ERR_NETWORK");
        const message = extractErrorMessage(error);
        expect(message).toContain("Sunucuya bağlanılamadı");
    });

    it("should return validation error list for 400 Bad Request", () => {
        const error = new AxiosError("Bad Request", "400", undefined, undefined, {
            status: 400,
            statusText: "Bad Request",
            headers: {},
            config: { headers: new AxiosHeaders() },
            data: {
                isSuccess: false,
                errors: ["Şifre en az 6 karakter olmalıdır.", "E-posta formatı geçersiz."],
            },
        });

        const message = extractErrorMessage(error);
        expect(message).toContain("Şifre en az 6 karakter olmalıdır.");
        expect(message).toContain("E-posta formatı geçersiz.");
    });

    it("should return user-friendly message for 401 Unauthorized", () => {
        const error = new AxiosError("Unauthorized", "401", undefined, undefined, {
            status: 401,
            statusText: "Unauthorized",
            headers: {},
            config: { headers: new AxiosHeaders() },
            data: { isSuccess: false },
        });

        const message = extractErrorMessage(error);
        expect(message).toContain("Kullanıcı adı, e-posta veya şifre hatalı");
    });

    it("should return permission message for 403 Forbidden", () => {
        const error = new AxiosError("Forbidden", "403", undefined, undefined, {
            status: 403,
            statusText: "Forbidden",
            headers: {},
            config: { headers: new AxiosHeaders() },
            data: { message: "Bu işlemi gerçekleştirmek için yetkiniz bulunmuyor." },
        });

        const message = extractErrorMessage(error);
        expect(message).toContain("yetkiniz bulunmuyor");
    });

    it("should return 409 Conflict message for already submitted survey", () => {
        const error = new AxiosError("Conflict", "409", undefined, undefined, {
            status: 409,
            statusText: "Conflict",
            headers: {},
            config: { headers: new AxiosHeaders() },
            data: { message: "Bu ankete daha önce yanıt verdiniz." },
        });

        const message = extractErrorMessage(error);
        expect(message).toBe("Bu ankete daha önce yanıt verdiniz.");
    });

    it("should return server error message for 500 status", () => {
        const error = new AxiosError("Internal Server Error", "500", undefined, undefined, {
            status: 500,
            statusText: "Internal Server Error",
            headers: {},
            config: { headers: new AxiosHeaders() },
            data: {},
        });

        const message = extractErrorMessage(error);
        expect(message).toContain("Sunucu tarafında beklenmeyen bir hata oluştu");
    });

    it("should return standard Error message for plain JavaScript Error", () => {
        const error = new Error("Özel bir istemci hatası");
        expect(extractErrorMessage(error)).toBe("Özel bir istemci hatası");
    });

    it("should return fallback message for unknown error objects", () => {
        expect(extractErrorMessage("Bilinmeyen", "Varsayılan Hata")).toBe("Varsayılan Hata");
    });
});
