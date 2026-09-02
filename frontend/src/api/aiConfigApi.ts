import apiClient from "./apiClient";
import type { ApiResponse } from "../types/api";
import type { UserAiConfig, SaveUserAiConfigRequest } from "../types/aiConfig";

export async function getUserAiConfig(): Promise<ApiResponse<UserAiConfig>> {
    const response = await apiClient.get<ApiResponse<UserAiConfig>>("/ai/config");
    return response.data;
}

export async function saveUserAiConfig(
    request: SaveUserAiConfigRequest
): Promise<ApiResponse<boolean>> {
    const response = await apiClient.put<ApiResponse<boolean>>("/ai/config", request);
    return response.data;
}

export async function deleteUserAiConfig(): Promise<ApiResponse<boolean>> {
    const response = await apiClient.delete<ApiResponse<boolean>>("/ai/config");
    return response.data;
}
