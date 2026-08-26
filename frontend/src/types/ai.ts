import type { CreateFormRequest } from "./formApi";

// Backend'deki AiDraftStatus enum karşılığı.
export type AiDraftStatus =
    | "NeedsClarification"
    | "Ready"
    | "Failed";

// Gemini konuşmasındaki tek mesaj.
export interface AiConversationMessage {
    role: "user" | "assistant";
    content: string;
}

// AI taslağı oluşturma isteği.
export interface GenerateSurveyDraftRequest {
    prompt: string;
    conversation: AiConversationMessage[];
}

// Backend'den dönen AI taslak yanıtı.
export interface GenerateSurveyDraftResponse {
    status: AiDraftStatus;
    message: string;
    clarifyingQuestions: string[];
    draft: CreateFormRequest | null;
}