import { useReducer, useCallback } from "react";
import type { FormDraft } from "../types/form";

export interface HistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

export type HistoryAction<T> =
    | { type: "SET"; payload: T; recordHistory?: boolean; maxHistory?: number }
    | { type: "UNDO" }
    | { type: "REDO" }
    | { type: "RESET"; payload: T };

export function historyReducer<T>(
    state: HistoryState<T>,
    action: HistoryAction<T>
): HistoryState<T> {
    switch (action.type) {
        case "SET": {
            if (state.present === action.payload) {
                return state;
            }
            if (action.recordHistory === false) {
                return {
                    ...state,
                    present: action.payload,
                };
            }
            const max = action.maxHistory ?? 30;
            return {
                past: [...state.past.slice(-max + 1), state.present],
                present: action.payload,
                future: [],
            };
        }
        case "UNDO": {
            if (state.past.length === 0) return state;
            const previous = state.past[state.past.length - 1];
            return {
                past: state.past.slice(0, state.past.length - 1),
                present: previous,
                future: [state.present, ...state.future],
            };
        }
        case "REDO": {
            if (state.future.length === 0) return state;
            const next = state.future[0];
            return {
                past: [...state.past, state.present],
                present: next,
                future: state.future.slice(1),
            };
        }
        case "RESET":
            return {
                past: [],
                present: action.payload,
                future: [],
            };
        default:
            return state;
    }
}

export interface FormHistoryReturn {
    formDraft: FormDraft;
    setFormDraft: (
        value: FormDraft | ((prev: FormDraft) => FormDraft),
        recordHistory?: boolean
    ) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    resetHistory: (initialState: FormDraft) => void;
}

/**
 * Google Forms tarzı Geri Al (Undo) ve İleri Al (Redo) durum geçmişini yöneten hook.
 */
export function useFormHistory(
    initialState: FormDraft | (() => FormDraft),
    maxHistory: number = 30
): FormHistoryReturn {
    const [state, dispatch] = useReducer(
        historyReducer<FormDraft>,
        undefined,
        (): HistoryState<FormDraft> => ({
            past: [],
            present: typeof initialState === "function" ? initialState() : initialState,
            future: [],
        })
    );

    const canUndo = state.past.length > 0;
    const canRedo = state.future.length > 0;

    const setFormDraft = useCallback(
        (
            value: FormDraft | ((prev: FormDraft) => FormDraft),
            recordHistory: boolean = true
        ) => {
            dispatch({
                type: "SET",
                payload: typeof value === "function" ? value(state.present) : value,
                recordHistory,
                maxHistory,
            });
        },
        [state.present, maxHistory]
    );

    const undo = useCallback(() => {
        dispatch({ type: "UNDO" });
    }, []);

    const redo = useCallback(() => {
        dispatch({ type: "REDO" });
    }, []);

    const resetHistory = useCallback((newState: FormDraft) => {
        dispatch({ type: "RESET", payload: newState });
    }, []);

    return {
        formDraft: state.present,
        setFormDraft,
        undo,
        redo,
        canUndo,
        canRedo,
        resetHistory,
    };
}
