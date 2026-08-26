import apiClient from "./apiClient";
import type { ApiResponse } from "../types/api";
import type {
    GenerateSurveyDraftRequest,
    GenerateSurveyDraftResponse,
} from "../types/ai";

// Gemini ile anket taslağı oluşturur.
// Endpoint yalnızca giriş yapmış kullanıcılar için açıktır.
export async function generateSurveyDraft(
    request: GenerateSurveyDraftRequest,
): Promise<ApiResponse<GenerateSurveyDraftResponse>> {
    const response = await apiClient.post<
        ApiResponse<GenerateSurveyDraftResponse>
    >(
        "/ai/survey-draft",
        request,
        {
            timeout: 120_000,
        },
    );

    return response.data;
}