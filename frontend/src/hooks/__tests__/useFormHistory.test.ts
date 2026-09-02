import { describe, it, expect } from "vitest";
import { historyReducer, type HistoryState } from "../useFormHistory";
import type { FormDraft } from "../../types/form";

const initialDraft: FormDraft = {
    title: "Başlangıç Başlığı",
    description: "Açıklama",
    accessType: "Authenticated",
    showRespondentIdentity: false,
    roleIds: [],
    questions: [],
};

describe("historyReducer (Undo / Redo Mantığı)", () => {
    it("başlangıçta past ve future boş olmalıdır", () => {
        const state: HistoryState<FormDraft> = {
            past: [],
            present: initialDraft,
            future: [],
        };

        expect(state.past.length).toBe(0);
        expect(state.future.length).toBe(0);
        expect(state.present.title).toBe("Başlangıç Başlığı");
    });

    it("SET aksiyonu mevcut durumu past'e eklemeli, yeni durumu present yapmalı ve future'ı temizlemelidir", () => {
        const initialState: HistoryState<FormDraft> = {
            past: [],
            present: initialDraft,
            future: [],
        };

        const updatedDraft: FormDraft = {
            ...initialDraft,
            title: "Yeni Soru Eklendi",
        };

        const nextState = historyReducer(initialState, {
            type: "SET",
            payload: updatedDraft,
        });

        expect(nextState.present.title).toBe("Yeni Soru Eklendi");
        expect(nextState.past.length).toBe(1);
        expect(nextState.past[0].title).toBe("Başlangıç Başlığı");
        expect(nextState.future.length).toBe(0);
    });

    it("UNDO aksiyonu past'teki son durumu present yapmalı ve present'ı future'a taşımalıdır", () => {
        const stateWithHistory: HistoryState<FormDraft> = {
            past: [initialDraft],
            present: { ...initialDraft, title: "Yeni Soru Eklendi" },
            future: [],
        };

        const undoneState = historyReducer(stateWithHistory, { type: "UNDO" });

        expect(undoneState.present.title).toBe("Başlangıç Başlığı");
        expect(undoneState.past.length).toBe(0);
        expect(undoneState.future.length).toBe(1);
        expect(undoneState.future[0].title).toBe("Yeni Soru Eklendi");
    });

    it("REDO aksiyonu future'daki ilk durumu present yapmalı ve present'ı past'e eklemelidir", () => {
        const undoneState: HistoryState<FormDraft> = {
            past: [],
            present: initialDraft,
            future: [{ ...initialDraft, title: "Yeni Soru Eklendi" }],
        };

        const redoneState = historyReducer(undoneState, { type: "REDO" });

        expect(redoneState.present.title).toBe("Yeni Soru Eklendi");
        expect(redoneState.past.length).toBe(1);
        expect(redoneState.past[0].title).toBe("Başlangıç Başlığı");
        expect(redoneState.future.length).toBe(0);
    });

    it("RESET aksiyonu geçmişi tamamen temizlemeli ve yeni başlangıç durumu atamalıdır", () => {
        const dirtyState: HistoryState<FormDraft> = {
            past: [initialDraft],
            present: { ...initialDraft, title: "Eski Taslak" },
            future: [{ ...initialDraft, title: "İleriki Taslak" }],
        };

        const resetDraft: FormDraft = {
            ...initialDraft,
            title: "Tertemiz Başlangıç",
        };

        const cleanState = historyReducer(dirtyState, {
            type: "RESET",
            payload: resetDraft,
        });

        expect(cleanState.present.title).toBe("Tertemiz Başlangıç");
        expect(cleanState.past.length).toBe(0);
        expect(cleanState.future.length).toBe(0);
    });
});
