export interface UserAiConfig {
    hasApiKey: boolean;
    maskedApiKey: string | null;
    model: string | null;
}

export interface SaveUserAiConfigRequest {
    apiKey: string;
    model?: string;
}
