import apiClient from "./apiClient";
import type { ApiResponse } from "../types/api";
import type { AdminUser } from "../types/admin";

// Yalnızca Admin yetkisine sahip kullanıcıların
// tüm kullanıcıları görüntülemesini sağlar.
export async function getAdminUsers(): Promise<
    ApiResponse<AdminUser[]>
> {
    const response = await apiClient.get<
        ApiResponse<AdminUser[]>
    >("/admin/users");

    return response.data;
}