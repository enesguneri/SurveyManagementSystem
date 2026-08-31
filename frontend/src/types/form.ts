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

export type DynamicOptionSourceType = "None" | "Api" | "Txt";

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

    // Dinamik dış kaynak seçenek alanları
    optionSourceType?: DynamicOptionSourceType;
    optionSourceUrl?: string | null;
    optionJsonPath?: string | null;
    optionTextProperty?: string | null;
    optionFileContent?: string | null;
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
        optionSourceType: "None",
        optionSourceUrl: null,
        optionJsonPath: null,
        optionTextProperty: null,
        optionFileContent: null,
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