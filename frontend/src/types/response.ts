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