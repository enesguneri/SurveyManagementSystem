export interface RegisterRequest {
    name: string;
    username: string;
    email: string;
    password: string;
}

export interface LoginRequest {
    usernameOrEmail: string;
    password: string;
}

export interface UserDto {
    id: number;
    name: string;
    username: string;
    email: string;
    isActive: boolean;
    createdAt: string;
    roles: string[];
}

export interface TokenResponse {
    accessToken: string;
    expiration: string;
}