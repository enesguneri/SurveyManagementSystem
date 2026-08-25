import apiClient from "./apiClient";
import type { ApiResponse } from "../types/api";
import type {
    ImportOptionsFromUrlRequest,
    ImportOptionsPreview,
} from "../types/options";

export async function previewOptionsFromUrl(
    request: ImportOptionsFromUrlRequest,
): Promise<ApiResponse<ImportOptionsPreview>> {
    const response = await apiClient.post<
        ApiResponse<ImportOptionsPreview>
    >("/options/preview-from-url", request);

    return response.data;
}