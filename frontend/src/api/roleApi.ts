import apiClient from "./apiClient";
import type { ApiResponse } from "../types/api";
import type { Role } from "../types/role";

// Kullanıcının seçebileceği aktif rolleri getirir.
export async function getAvailableRoles(): Promise<
    ApiResponse<Role[]>
> {
    const response = await apiClient.get<ApiResponse<Role[]>>(
        "/roles/available",
    );

    return response.data;
}

// Admin panelinde atanabilecek tüm aktif rolleri getirir.
export async function getAllRoles(): Promise<
    ApiResponse<Role[]>
> {
    const response = await apiClient.get<ApiResponse<Role[]>>(
        "/roles/all",
    );

    return response.data;
}

// Admin tarafından kullanıcıya rol atanmasını sağlar.
export async function assignRole(
    userId: number,
    roleId: number,
): Promise<ApiResponse<string>> {
    const response = await apiClient.post<ApiResponse<string>>(
        "/roles/assignments",
        {
            userId,
            roleId,
        },
    );

    return response.data;
}