import { describe, expect, it } from "vitest";
import { aggregateQuestionAnalytics } from "../chartAnalytics";
import type { FormResponseItem } from "../../types/response";

describe("chartAnalytics utility", () => {
    it("should return empty array when no responses given", () => {
        expect(aggregateQuestionAnalytics([])).toEqual([]);
    });

    it("should aggregate SingleChoice question percentages and counts correctly", () => {
        const mockResponses: FormResponseItem[] = [
            {
                id: 1,
                respondentName: "User 1",
                respondentEmail: "u1@test.com",
                respondentIpAddress: null,
                submittedAt: "2026-08-27T10:00:00Z",
                answers: [
                    {
                        questionId: 101,
                        questionTitle: "Hangi fakültedesiniz?",
                        questionType: "SingleChoice",
                        textValue: null,
                        numericValue: null,
                        dateValue: null,
                        selectedOptions: [{ id: 1, text: "Mühendislik Fakültesi" }],
                        matrixSelections: [],
                    },
                ],
            },
            {
                id: 2,
                respondentName: "User 2",
                respondentEmail: "u2@test.com",
                respondentIpAddress: null,
                submittedAt: "2026-08-27T10:05:00Z",
                answers: [
                    {
                        questionId: 101,
                        questionTitle: "Hangi fakültedesiniz?",
                        questionType: "SingleChoice",
                        textValue: null,
                        numericValue: null,
                        dateValue: null,
                        selectedOptions: [{ id: 1, text: "Mühendislik Fakültesi" }],
                        matrixSelections: [],
                    },
                ],
            },
            {
                id: 3,
                respondentName: "User 3",
                respondentEmail: "u3@test.com",
                respondentIpAddress: null,
                submittedAt: "2026-08-27T10:10:00Z",
                answers: [
                    {
                        questionId: 101,
                        questionTitle: "Hangi fakültedesiniz?",
                        questionType: "SingleChoice",
                        textValue: null,
                        numericValue: null,
                        dateValue: null,
                        selectedOptions: [{ id: 2, text: "Tıp Fakültesi" }],
                        matrixSelections: [],
                    },
                ],
            },
        ];

        const result = aggregateQuestionAnalytics(mockResponses);

        expect(result).toHaveLength(1);
        const q1 = result[0];
        expect(q1.questionId).toBe(101);
        expect(q1.totalAnswers).toBe(3);
        expect(q1.choiceFrequencies).toHaveLength(2);

        // 2 out of 3 -> 66.7%, 1 out of 3 -> 33.3%
        const eng = q1.choiceFrequencies.find((c) => c.text === "Mühendislik Fakültesi");
        const med = q1.choiceFrequencies.find((c) => c.text === "Tıp Fakültesi");

        expect(eng?.count).toBe(2);
        expect(eng?.percentage).toBe(66.7);
        expect(med?.count).toBe(1);
        expect(med?.percentage).toBe(33.3);
    });

    it("should calculate average and frequencies for Rating questions", () => {
        const mockResponses: FormResponseItem[] = [
            {
                id: 1,
                respondentName: null,
                respondentEmail: null,
                respondentIpAddress: null,
                submittedAt: "2026-08-27T10:00:00Z",
                answers: [
                    {
                        questionId: 201,
                        questionTitle: "Memnuniyet Derecesi (1-5)",
                        questionType: "Rating",
                        textValue: null,
                        numericValue: 5,
                        dateValue: null,
                        selectedOptions: [],
                        matrixSelections: [],
                    },
                ],
            },
            {
                id: 2,
                respondentName: null,
                respondentEmail: null,
                respondentIpAddress: null,
                submittedAt: "2026-08-27T10:05:00Z",
                answers: [
                    {
                        questionId: 201,
                        questionTitle: "Memnuniyet Derecesi (1-5)",
                        questionType: "Rating",
                        textValue: null,
                        numericValue: 3,
                        dateValue: null,
                        selectedOptions: [],
                        matrixSelections: [],
                    },
                ],
            },
        ];

        const result = aggregateQuestionAnalytics(mockResponses);

        expect(result).toHaveLength(1);
        const q = result[0];
        expect(q.totalAnswers).toBe(2);
        expect(q.averageRating).toBe(4.0); // (5+3)/2
        expect(q.ratingFrequencies).toHaveLength(2);
    });
});
