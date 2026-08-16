import apiClient from "./apiClient";
import type { ApiResponse } from "../types/api";
import {
    toCreateFormRequest,
    type FormCreatedResponse,
} from "../types/formApi";
import type { FormDraft } from "../types/form";

export async function createForm(
    formDraft: FormDraft,
): Promise<ApiResponse<FormCreatedResponse>> {
    const request = toCreateFormRequest(formDraft);

    const response = await apiClient.post<
        ApiResponse<FormCreatedResponse>
    >("/forms", request);

    return response.data;
}