import type { QuestionType } from "./form";

// Form yanıtı gönderilirken backend'e gönderilen ana model.
export interface SubmitFormResponseRequest {
    answers: SubmitAnswerRequest[];
}

// Tek bir soruya verilen cevap.
export interface SubmitAnswerRequest {
    questionId: number;
    textValue: string | null;
    numericValue: number | null;
    dateValue: string | null;
    selectedOptionIds: number[];
    selectedOptionTexts?: string[];
    matrixSelections: SubmitMatrixCellRequest[];
}

// Matris sorularındaki satır-sütun seçimi.
export interface SubmitMatrixCellRequest {
    matrixRowId: number;
    matrixColumnId: number;
}

// Başarılı yanıt gönderiminden sonra dönen veri.
export interface ResponseSubmitted {
    formResponseId: number;
    formPublicId: string;
    submittedAt: string;
}

export interface ResponseSelectedOption {
    id: number;
    text: string;
}

export interface ResponseMatrixSelection {
    matrixRowId: number;
    matrixRowText: string;
    matrixColumnId: number;
    matrixColumnText: string;
}

export interface ResponseAnswerDetails {
    questionId: number;
    questionTitle: string;
    questionType: QuestionType;
    textValue: string | null;
    numericValue: number | null;
    dateValue: string | null;
    selectedOptions: ResponseSelectedOption[];
    matrixSelections: ResponseMatrixSelection[];
}

export interface FormResponseItem {
    id: number;
    respondentName: string | null;
    respondentEmail: string | null;
    respondentIpAddress: string | null;
    submittedAt: string;
    answers: ResponseAnswerDetails[];
}

export interface FormResponses {
    formPublicId: string;
    title: string;
    showRespondentIdentity: boolean;
    responses: FormResponseItem[];
}