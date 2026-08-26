import apiClient from "./apiClient";
import type { ApiResponse } from "../types/api";
import type {
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserDto,
} from "../types/auth";

// Yeni kullanıcı oluşturur.
export async function register(
    request: RegisterRequest,
): Promise<ApiResponse<UserDto>> {
    const response = await apiClient.post<ApiResponse<UserDto>>(
        "/Auth/register",
        request,
    );

    return response.data;
}

// Kullanıcı girişi yapar ve JWT döndürür.
export async function login(
    request: LoginRequest,
): Promise<ApiResponse<TokenResponse>> {
    const response = await apiClient.post<ApiResponse<TokenResponse>>(
        "/Auth/login",
        request,
    );

    return response.data;
}