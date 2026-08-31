import apiClient from "./apiClient";
import type { ApiResponse } from "../types/api";
import {
    toCreateFormRequest,
    type FormCreatedResponse,
} from "../types/formApi";
import type { FormDraft } from "../types/form";
import type { PublishedForm } from "../types/publishedForm";
import type {
    FormResponses,
    ResponseSubmitted,
    SubmitFormResponseRequest,
} from "../types/response";
import type {
    ManageableForm,
    ManageableFormDetails,
} from "../types/manageableForm";

export async function createForm(
    formDraft: FormDraft,
): Promise<ApiResponse<FormCreatedResponse>> {
    const request = toCreateFormRequest(formDraft);

    const response = await apiClient.post<
        ApiResponse<FormCreatedResponse>
    >("/forms", request);

    return response.data;
}

// PublicId üzerinden yayınlanmış formun detaylarını getirir.
export async function getPublishedForm(
    publicId: string,
): Promise<ApiResponse<PublishedForm>> {
    const response = await apiClient.get<ApiResponse<PublishedForm>>(
        `/forms/${publicId}`,
    );

    return response.data;
}

// Yayınlanmış forma verilen cevapları backend'e gönderir.
export async function submitFormResponse(
    publicId: string,
    request: SubmitFormResponseRequest,
): Promise<ApiResponse<ResponseSubmitted>> {
    const response = await apiClient.post<
        ApiResponse<ResponseSubmitted>
    >(`/forms/${publicId}/responses`, request);

    return response.data;
}

// Oluşturulmuş taslak formu yayınlar.
export async function publishForm(
    publicId: string,
): Promise<ApiResponse<FormCreatedResponse>> {
    const response = await apiClient.post<
        ApiResponse<FormCreatedResponse>
    >(`/forms/${publicId}/publish`);

    return response.data;
}

// Kapatılmış formu yeniden yayımlar.
export async function reopenForm(
    publicId: string,
): Promise<ApiResponse<FormCreatedResponse>> {
    const response = await apiClient.post<
        ApiResponse<FormCreatedResponse>
    >(`/forms/${publicId}/reopen`);

    return response.data;
}

// Formu ve tüm verilerini siler.
export async function deleteForm(
    publicId: string,
): Promise<ApiResponse<boolean>> {
    const response = await apiClient.delete<ApiResponse<boolean>>(
        `/forms/${publicId}`,
    );

    return response.data;
}

// Kullanıcının yönetebileceği formları getirir.
export async function getManageableForms(): Promise<
    ApiResponse<ManageableForm[]>
> {
    const response = await apiClient.get<
        ApiResponse<ManageableForm[]>
    >("/forms/manageable");

    return response.data;
}

// Yetkili kullanıcının taslak form detayını getirir.
export async function getManageableForm(
    publicId: string,
): Promise<ApiResponse<ManageableFormDetails>> {
    const response = await apiClient.get<
        ApiResponse<ManageableFormDetails>
    >(`/forms/${publicId}/manage`);

    return response.data;
}

// Taslak formu günceller.
export async function updateDraftForm(
    publicId: string,
    formDraft: FormDraft,
): Promise<ApiResponse<FormCreatedResponse>> {
    const request = toCreateFormRequest(formDraft);

    const response = await apiClient.put<
        ApiResponse<FormCreatedResponse>
    >(`/forms/${publicId}`, request);

    return response.data;
}

// Yetkili kullanıcı için form yanıtlarını getirir.
export async function getFormResponses(
    publicId: string,
): Promise<ApiResponse<FormResponses>> {
    const response = await apiClient.get<
        ApiResponse<FormResponses>
    >(`/forms/${publicId}/responses`);

    return response.data;
}

// Yayımlanmış formu kapatır.
export async function closeForm(
    publicId: string,
): Promise<ApiResponse<FormCreatedResponse>> {
    const response = await apiClient.post<
        ApiResponse<FormCreatedResponse>
    >(`/forms/${publicId}/close`);

    return response.data;
}

// Form yanıtlarını CSV veya Excel dosyası olarak indirir.
export async function downloadFormResponses(
    publicId: string,
    format: "csv" | "xlsx",
): Promise<Blob> {
    const response = await apiClient.get(
        `/forms/${publicId}/responses/export`,
        {
            params: { format },
            responseType: "blob",
        },
    );

    return response.data;
}

// Belirli bir anket yanıtını siler.
export async function deleteFormResponse(
    publicId: string,
    responseId: number,
): Promise<ApiResponse<boolean>> {
    const response = await apiClient.delete<ApiResponse<boolean>>(
        `/forms/${publicId}/responses/${responseId}`,
    );

    return response.data;
}