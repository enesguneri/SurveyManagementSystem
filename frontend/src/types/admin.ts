// Admin panelinde gösterilecek güvenli kullanıcı modeli.
export interface AdminUser {
    id: number;
    name: string;
    username: string;
    email: string;
    isActive: boolean;
    createdAt: string;
    roles: string[];
}