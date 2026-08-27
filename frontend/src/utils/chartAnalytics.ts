import type { FormResponseItem, ResponseAnswerDetails } from "../types/response";
import type { QuestionType } from "../types/form";

export const GOOGLE_CHART_COLORS = [
    "#4285F4", // Blue
    "#EA4335", // Red
    "#FBBC05", // Yellow
    "#34A853", // Green
    "#9C27B0", // Purple
    "#00BCD4", // Cyan
    "#FF9800", // Orange
    "#E91E63", // Pink
    "#3F51B5", // Indigo
    "#009688", // Teal
    "#795548", // Brown
    "#607D8B", // Blue Grey
];

export interface ChoiceFrequency {
    text: string;
    count: number;
    percentage: number; // 0 - 100
    color: string;
}

export interface RatingFrequency {
    value: number;
    count: number;
    percentage: number;
}

export interface MatrixRowSummary {
    rowText: string;
    columnCounts: { columnText: string; count: number }[];
}

export interface QuestionAnalytics {
    questionId: number;
    questionTitle: string;
    questionType: QuestionType;
    totalAnswers: number;
    choiceFrequencies: ChoiceFrequency[];
    ratingFrequencies: RatingFrequency[];
    averageRating: number | null;
    textAnswers: string[];
    matrixSummaries: MatrixRowSummary[];
}

export function aggregateQuestionAnalytics(
    responses: FormResponseItem[],
): QuestionAnalytics[] {
    if (!responses || responses.length === 0) {
        return [];
    }

    // Soruları sırasına göre toplamak için harita
    const questionsMap = new Map<number, {
        questionId: number;
        questionTitle: string;
        questionType: QuestionType;
        answers: ResponseAnswerDetails[];
    }>();

    // 1. Tüm yanıtlardaki soruları topla
    for (const response of responses) {
        for (const answer of response.answers) {
            if (!questionsMap.has(answer.questionId)) {
                questionsMap.set(answer.questionId, {
                    questionId: answer.questionId,
                    questionTitle: answer.questionTitle,
                    questionType: answer.questionType,
                    answers: [],
                });
            }
            questionsMap.get(answer.questionId)!.answers.push(answer);
        }
    }

    const analyticsList: QuestionAnalytics[] = [];

    // 2. Her soru için istatistikleri hesapla
    for (const q of questionsMap.values()) {
        const totalAnswers = q.answers.filter((a) => {
            if (a.textValue && a.textValue.trim() !== "") return true;
            if (a.numericValue !== null) return true;
            if (a.dateValue) return true;
            if (a.selectedOptions && a.selectedOptions.length > 0) return true;
            if (a.matrixSelections && a.matrixSelections.length > 0) return true;
            return false;
        }).length;

        const choiceCountMap = new Map<string, number>();
        const ratingCountMap = new Map<number, number>();
        const textAnswers: string[] = [];
        const matrixRowMap = new Map<string, Map<string, number>>();

        let totalRatingSum = 0;
        let ratingAnswerCount = 0;

        for (const answer of q.answers) {
            // Seçenekler (SingleChoice, MultipleChoice, Dropdown)
            if (answer.selectedOptions && answer.selectedOptions.length > 0) {
                for (const option of answer.selectedOptions) {
                    const count = choiceCountMap.get(option.text) ?? 0;
                    choiceCountMap.set(option.text, count + 1);
                }
            }

            // Derecelendirme (Rating)
            if (answer.numericValue !== null) {
                const val = answer.numericValue;
                const count = ratingCountMap.get(val) ?? 0;
                ratingCountMap.set(val, count + 1);
                totalRatingSum += val;
                ratingAnswerCount++;
            }

            // Metinler ve Tarihler (ShortText, LongText, Date)
            if (answer.textValue && answer.textValue.trim() !== "") {
                textAnswers.push(answer.textValue.trim());
            } else if (answer.dateValue) {
                textAnswers.push(answer.dateValue);
            }

            // Matris (MultipleChoiceGrid, CheckboxGrid)
            if (answer.matrixSelections && answer.matrixSelections.length > 0) {
                for (const selection of answer.matrixSelections) {
                    if (!matrixRowMap.has(selection.matrixRowText)) {
                        matrixRowMap.set(selection.matrixRowText, new Map());
                    }
                    const colMap = matrixRowMap.get(selection.matrixRowText)!;
                    const cCount = colMap.get(selection.matrixColumnText) ?? 0;
                    colMap.set(selection.matrixColumnText, cCount + 1);
                }
            }
        }

        // Seçenek frekanslarını ve yüzdelerini hazırla
        const choiceFrequencies: ChoiceFrequency[] = [];
        let totalSelections = 0;
        for (const count of choiceCountMap.values()) {
            totalSelections += count;
        }

        let colorIndex = 0;
        for (const [text, count] of choiceCountMap.entries()) {
            const percentage = totalSelections > 0
                ? Number(((count / totalSelections) * 100).toFixed(1))
                : 0;
            choiceFrequencies.push({
                text,
                count,
                percentage,
                color: GOOGLE_CHART_COLORS[colorIndex % GOOGLE_CHART_COLORS.length],
            });
            colorIndex++;
        }

        // Puanlama frekanslarını hazırla
        const ratingFrequencies: RatingFrequency[] = [];
        if (ratingAnswerCount > 0) {
            const sortedRatings = Array.from(ratingCountMap.keys()).sort((a, b) => a - b);
            for (const val of sortedRatings) {
                const count = ratingCountMap.get(val)!;
                const percentage = Number(((count / ratingAnswerCount) * 100).toFixed(1));
                ratingFrequencies.push({
                    value: val,
                    count,
                    percentage,
                });
            }
        }

        const averageRating = ratingAnswerCount > 0
            ? Number((totalRatingSum / ratingAnswerCount).toFixed(2))
            : null;

        // Matris özetlerini hazırla
        const matrixSummaries: MatrixRowSummary[] = [];
        for (const [rowText, colMap] of matrixRowMap.entries()) {
            const columnCounts: { columnText: string; count: number }[] = [];
            for (const [columnText, count] of colMap.entries()) {
                columnCounts.push({ columnText, count });
            }
            matrixSummaries.push({ rowText, columnCounts });
        }

        analyticsList.push({
            questionId: q.questionId,
            questionTitle: q.questionTitle,
            questionType: q.questionType,
            totalAnswers,
            choiceFrequencies,
            ratingFrequencies,
            averageRating,
            textAnswers,
            matrixSummaries,
        });
    }

    return analyticsList;
}
