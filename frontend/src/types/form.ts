export type QuestionType =
    | "ShortText"
    | "LongText"
    | "Date"
    | "SingleChoice"
    | "Dropdown"
    | "MultipleChoice"
    | "Rating"
    | "MultipleChoiceGrid"
    | "CheckboxGrid";

export type FormAccessType = "Public" | "Authenticated";

export interface QuestionValidationDraft {
    minLength: number | null;
    maxLength: number | null;
    regexPattern: string;
    minValue: number | null;
    maxValue: number | null;
    minDate: string | null;
    maxDate: string | null;
}

export interface QuestionDraft {
    clientId: string;
    title: string;
    type: QuestionType;
    isRequired: boolean;
    options: string[];
    matrixRows: string[];
    matrixColumns: string[];
    validation: QuestionValidationDraft;
}

export interface FormDraft {
    title: string;
    description: string;
    accessType: FormAccessType;
    showRespondentIdentity: boolean;

    // Formun bağlı olduğu birim rollerinin Id değerleri.
    roleIds: number[];

    questions: QuestionDraft[];
}

export function createEmptyQuestion(): QuestionDraft {
    return {
        clientId: crypto.randomUUID(),
        title: "",
        type: "ShortText",
        isRequired: false,
        options: [],
        matrixRows: [],
        matrixColumns: [],
        validation: {
            minLength: null,
            maxLength: null,
            regexPattern: "",
            minValue: null,
            maxValue: null,
            minDate: null,
            maxDate: null,
        },
    };
}