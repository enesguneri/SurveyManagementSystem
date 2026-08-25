export interface ImportOptionsFromUrlRequest {
    url: string;
    jsonPath: string;
    textProperty: string;
}

export interface ImportOptionsPreview {
    options: string[];
    skippedCount: number;
    sourceUrl: string;
}