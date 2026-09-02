import type { DynamicOptionSourceType, FormAccessType, QuestionType } from "./form";

// Yayınlanmış formun backend'den dönen detay modeli.
export interface PublishedForm {
    publicId: string;
    title: string;
    description: string | null;
    showRespondentIdentity: boolean;
    status: string;
    accessType: FormAccessType;
    questions: PublishedQuestion[];
    hasCurrentUserResponded: boolean;
    isClosedPreview?: boolean;
    isPreview?: boolean;
    canManage?: boolean;
}

// Form içindeki tek bir sorunun detay modeli.
export interface PublishedQuestion {
    id: number;
    title: string;
    description: string | null;
    type: QuestionType;
    isRequired: boolean;
    displayOrder: number;
    ratingMinLabel: string | null;
    ratingMaxLabel: string | null;
    optionSourceType?: DynamicOptionSourceType;
    optionSourceUrl?: string | null;
    optionJsonPath?: string | null;
    optionTextProperty?: string | null;
    optionFileContent?: string | null;
    validation: PublishedQuestionValidation | null;
    options: PublishedTextItem[];
    matrixRows: PublishedTextItem[];
    matrixColumns: PublishedTextItem[];
}

// Soruya ait doğrulama sınırları.
export interface PublishedQuestionValidation {
    minLength: number | null;
    maxLength: number | null;
    regexPattern: string | null;
    minValue: number | null;
    maxValue: number | null;
    minDate: string | null;
    maxDate: string | null;
}

// Seçenek, satır ve sütunlarda ortak kullanılan model.
export interface PublishedTextItem {
    id: number;
    text: string;
    displayOrder: number;
}