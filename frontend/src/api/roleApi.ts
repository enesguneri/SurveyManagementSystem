import apiClient from "./apiClient";
import type { ApiResponse } from "../types/api";
import type { Role, RoleWithUsers } from "../types/role";

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

// Admin panelinde rolleri ve tanımlı kullanıcılarını getirir.
export async function getRolesWithUsers(): Promise<
    ApiResponse<RoleWithUsers[]>
> {
    const response = await apiClient.get<ApiResponse<RoleWithUsers[]>>(
        "/roles/with-users",
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

// Admin tarafından kullanıcının rolünün kaldırılmasını sağlar.
export async function removeRoleFromUser(
    userId: number,
    roleId: number,
): Promise<ApiResponse<string>> {
    const response = await apiClient.delete<ApiResponse<string>>(
        "/roles/assignments",
        {
            data: {
                userId,
                roleId,
            },
        },
    );

    return response.data;
}

// Admin tarafından yeni birim rolü oluşturulmasını sağlar.
export async function createRole(
    name: string,
): Promise<ApiResponse<Role>> {
    const response = await apiClient.post<ApiResponse<Role>>(
        "/roles",
        {
            name,
        },
    );

    return response.data;
}

// Admin tarafından birim rolünün silinmesini sağlar.
export async function deleteRole(
    roleId: number,
): Promise<ApiResponse<string>> {
    const response = await apiClient.delete<ApiResponse<string>>(
        `/roles/${roleId}`,
    );

    return response.data;
}