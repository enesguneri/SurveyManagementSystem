import type {
    FormAccessType,
    FormDraft,
    QuestionType,
} from "./form";

export interface CreateFormRequest {
    title: string;
    description: string | null;
    accessType: FormAccessType;
    showRespondentIdentity: boolean;
    questions: CreateQuestionRequest[];
}

export interface CreateQuestionRequest {
    title: string;
    type: QuestionType;
    isRequired: boolean;
    description: string | null;
    ratingMinLabel: string | null;
    ratingMaxLabel: string | null;
    validation: CreateQuestionValidationRequest | null;
    options: CreateTextRequest[];
    matrixRows: CreateTextRequest[];
    matrixColumns: CreateTextRequest[];
}

export interface CreateQuestionValidationRequest {
    minLength: number | null;
    maxLength: number | null;
    regexPattern: string | null;
    minValue: number | null;
    maxValue: number | null;
    minDate: string | null;
    maxDate: string | null;
}

export interface CreateTextRequest {
    text: string;
}

export interface FormCreatedResponse {
    id: number;
    publicId: string;
    title: string;
    showRespondentIdentity: boolean;
    status: string;
    accessType: FormAccessType;
    createdAt: string;
}

export function toCreateFormRequest(
    formDraft: FormDraft,
): CreateFormRequest {
    return {
        title: formDraft.title.trim(),
        description: formDraft.description.trim() || null,
        accessType: formDraft.accessType,
        showRespondentIdentity: formDraft.showRespondentIdentity,

        questions: formDraft.questions.map((question) => ({
            title: question.title.trim(),
            type: question.type,
            isRequired: question.isRequired,
            description: null,
            ratingMinLabel: null,
            ratingMaxLabel: null,

            validation: getValidation(question),

            options: question.options
                .filter((option) => option.trim().length > 0)
                .map((text) => ({ text: text.trim() })),

            matrixRows: question.matrixRows
                .filter((row) => row.trim().length > 0)
                .map((text) => ({ text: text.trim() })),

            matrixColumns: question.matrixColumns
                .filter((column) => column.trim().length > 0)
                .map((text) => ({ text: text.trim() })),
        })),
    };
}

function getValidation(
    question: FormDraft["questions"][number],
) {
    const validation = question.validation;

    const hasTextValidation =
        question.type === "ShortText" ||
        question.type === "LongText";

    const hasRatingValidation = question.type === "Rating";

    const hasDateValidation = question.type === "Date";

    if (hasTextValidation) {
        const hasValue =
            validation.minLength !== null ||
            validation.maxLength !== null ||
            validation.regexPattern.trim().length > 0;

        if (!hasValue) {
            return null;
        }
    }

    if (hasRatingValidation) {
        if (
            validation.minValue === null &&
            validation.maxValue === null
        ) {
            return null;
        }
    }

    if (hasDateValidation) {
        const hasValue =
            validation.minDate !== null ||
            validation.maxDate !== null;

        if (!hasValue) {
            return null;
        }
    }

    if (
        question.type !== "ShortText" &&
        question.type !== "LongText" &&
        question.type !== "Rating" &&
        question.type !== "Date"
    ) {
        return null;
    }

    return {
        minLength: validation.minLength,
        maxLength: validation.maxLength,
        regexPattern: validation.regexPattern.trim() || null,
        minValue: validation.minValue,
        maxValue: validation.maxValue,
        minDate: validation.minDate,
        maxDate: validation.maxDate,
    };
}