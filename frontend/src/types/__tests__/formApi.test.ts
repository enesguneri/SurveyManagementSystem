import { describe, expect, it } from "vitest";
import { toCreateFormRequest } from "../formApi";
import type { FormDraft } from "../form";

describe("toCreateFormRequest", () => {
    it("should correctly map form draft with dynamic option source properties", () => {
        const formDraft: FormDraft = {
            title: "Test Form",
            description: "Test Açıklama",
            accessType: "Authenticated",
            showRespondentIdentity: true,
            roleIds: [1, 2],
            questions: [
                {
                    clientId: "q1",
                    title: "Dinamik API Sorusu",
                    type: "Dropdown",
                    isRequired: true,
                    options: ["Seçenek 1", "Seçenek 2"],
                    matrixRows: [],
                    matrixColumns: [],
                    optionSourceType: "Api",
                    optionSourceUrl: "https://dummyjson.com/users",
                    optionJsonPath: "users",
                    optionTextProperty: "firstName",
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
                },
                {
                    clientId: "q2",
                    title: "Dinamik TXT Sorusu",
                    type: "SingleChoice",
                    isRequired: false,
                    options: [],
                    matrixRows: [],
                    matrixColumns: [],
                    optionSourceType: "Txt",
                    optionSourceUrl: null,
                    optionJsonPath: null,
                    optionTextProperty: null,
                    optionFileContent: "Satır 1\nSatır 2\nSatır 3",
                    validation: {
                        minLength: null,
                        maxLength: null,
                        regexPattern: "",
                        minValue: null,
                        maxValue: null,
                        minDate: null,
                        maxDate: null,
                    },
                },
            ],
        };

        const result = toCreateFormRequest(formDraft);

        expect(result.title).toBe("Test Form");
        expect(result.roleIds).toEqual([1, 2]);
        expect(result.questions).toHaveLength(2);

        expect(result.questions[0].optionSourceType).toBe("Api");
        expect(result.questions[0].optionSourceUrl).toBe("https://dummyjson.com/users");
        expect(result.questions[0].optionJsonPath).toBe("users");
        expect(result.questions[0].optionTextProperty).toBe("firstName");

        expect(result.questions[1].optionSourceType).toBe("Txt");
        expect(result.questions[1].optionFileContent).toBe("Satır 1\nSatır 2\nSatır 3");
    });
});
