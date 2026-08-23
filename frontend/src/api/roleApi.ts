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